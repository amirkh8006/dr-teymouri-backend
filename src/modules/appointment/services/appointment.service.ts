import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment, AppointmentDocument } from '../schemas/appointment.schema';
import {
  DoctorAvailability,
  DoctorAvailabilityDocument,
  WorkingHoursRange,
} from '../schemas/doctor-availability.schema';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from '../dto/appointment.dto';
import { CreateDoctorAvailabilityDto, UpdateDoctorAvailabilityDto, AddOffExceptionDto } from '../dto/doctor-availability.dto';
import { PersianCalendarService } from '../utils/persian-calendar.service';
import { AppointmentStatus } from '../constants/appointment-status.enum';

interface AvailableSlot {
  dateTime: Date;
  time: string;
  availableSpots: number;
  choosable: boolean;
}

interface DaySlots {
  date: string;
  persianDate: string;
  dayName: string;
  dayOfWeek: number;
  remainingAppointments: number;
  times: AvailableSlot[];
}

interface WorkingRange {
  from: number;
  to: number;
}

interface NormalizedDailySchedule {
  dayOfWeek: number;
  isOff: boolean;
  workingHours: WorkingRange[];
}

interface WeeklyScheduleInput {
  dayOfWeek: number;
  isOff?: boolean;
  workingHours?: Array<WorkingRange>;
}

@Injectable()
export class AppointmentService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(DoctorAvailability.name) private doctorAvailabilityModel: Model<DoctorAvailabilityDocument>,
    private persianCalendarService: PersianCalendarService,
  ) {}

  /**
   * Create a new appointment
   */
  async createAppointment(createAppointmentDto: CreateAppointmentDto, patientId: string): Promise<AppointmentDocument> {
    const { doctorId, appointmentDateTime, visitType, fullName, nationalId, payNow, notes } = createAppointmentDto;

    // Validate appointment date is in the future
    const appointmentDate = new Date(appointmentDateTime);
    if (this.persianCalendarService.isPast(appointmentDate)) {
      throw new BadRequestException('تاریخ انتخاب شده گذشته است');
    }

    // Check doctor availability
    const doctorAvailability = await this.doctorAvailabilityModel.findOne({ doctor: new Types.ObjectId(doctorId) });
    if (!doctorAvailability) {
      throw new NotFoundException('اطلاعات دسترسی پزشک یافت نشد');
    }

    const slotDateTime = this.roundTimeToSlot(appointmentDate, doctorAvailability.appointmentDuration);
    if (slotDateTime.getTime() !== appointmentDate.getTime()) {
      throw new ConflictException('این ساعت در بازه نوبت‌دهی پزشک نیست');
    }

    // Check if doctor is available on this day
    if (!this.isDoctorAvailableOnDay(appointmentDate, doctorAvailability)) {
      throw new ConflictException('پزشک در این روز دسترس نیست');
    }

    // Check if time is within working hours
    if (!this.isTimeWithinWorkingHours(appointmentDate, doctorAvailability)) {
      throw new ConflictException('این ساعت در ساعات کاری پزشک نیست');
    }

    // Check if slot is already full
    const conflictingAppointments = await this.appointmentModel.countDocuments({
      doctor: new Types.ObjectId(doctorId),
      appointmentDateTime: slotDateTime,
      status: { $ne: AppointmentStatus.CANCELLED },
    });

    if (conflictingAppointments >= doctorAvailability.maxAppointmentsPerSlot) {
      throw new ConflictException('این ساعت پر شده است، لطفاً ساعت دیگری را انتخاب کنید');
    }

    // Create appointment
    const appointment = new this.appointmentModel({
      patient: new Types.ObjectId(patientId),
      doctor: new Types.ObjectId(doctorId),
      appointmentDateTime: slotDateTime,
      visitType,
      fullName,
      nationalId,
      payNow,
      notes,
      status: AppointmentStatus.PENDING,
      paymentStatus: payNow ? 'paid' : 'pending',
    });

    return appointment.save();
  }

  /**
   * Get available time slots for a doctor for next N days
   */
  async getAvailableSlots(doctorId: string, days: number = 10): Promise<DaySlots[]> {
    const doctorAvailability = await this.doctorAvailabilityModel.findOne({ doctor: new Types.ObjectId(doctorId) });
    if (!doctorAvailability || !doctorAvailability.isActive) {
      throw new NotFoundException('اطلاعات دسترسی پزشک یافت نشد');
    }

    const result: DaySlots[] = [];
    const daysWithPersianCalendar = this.persianCalendarService.getNextDaysWithPersianCalendar(days);

    for (const dayInfo of daysWithPersianCalendar) {
      // Skip if doctor is off on this day
      if (!this.isDoctorAvailableOnDay(dayInfo.date, doctorAvailability)) {
        continue;
      }

      const daySlots: DaySlots = {
        date: this.persianCalendarService.getTehranDateIso(dayInfo.date),
        persianDate: dayInfo.persianDate,
        dayName: dayInfo.dayName,
        dayOfWeek: dayInfo.dayOfWeek,
        remainingAppointments: 0,
        times: [],
      };

      // Generate time slots
      const dayWorkingRanges = this.getWorkingRangesForDate(dayInfo.date, doctorAvailability);
      if (dayWorkingRanges.length === 0) {
        continue;
      }

      for (const range of dayWorkingRanges) {
        for (let minuteOffset = range.from * 60; minuteOffset < range.to * 60; minuteOffset += doctorAvailability.appointmentDuration) {
          const hour = Math.floor(minuteOffset / 60);
          const minute = minuteOffset % 60;
          const slotTime = this.buildTehranDateTime(dayInfo.date, hour, minute);

          const isPast = this.persianCalendarService.isPast(slotTime);

          // Count existing appointments at this time
          const existingAppointments = await this.appointmentModel.countDocuments({
            doctor: new Types.ObjectId(doctorId),
            appointmentDateTime: slotTime,
            status: { $ne: AppointmentStatus.CANCELLED },
          });

          const availableSpots = isPast ? 0 : doctorAvailability.maxAppointmentsPerSlot - existingAppointments;
          const choosable = !isPast && availableSpots > 0;

          daySlots.times.push({
            dateTime: slotTime,
            time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
            availableSpots,
            choosable,
          });

          daySlots.remainingAppointments += availableSpots;
        }
      }

      daySlots.times.sort((left, right) => left.dateTime.getTime() - right.dateTime.getTime());
      result.push(daySlots);
    }

    return result;
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(appointmentId: string, updateStatusDto: UpdateAppointmentStatusDto): Promise<AppointmentDocument> {
    const appointment = await this.appointmentModel.findById(new Types.ObjectId(appointmentId));
    if (!appointment) {
      throw new NotFoundException('نوبت یافت نشد');
    }

    const newStatus = updateStatusDto.status as AppointmentStatus;

    if (newStatus === AppointmentStatus.CANCELLED) {
      appointment.status = AppointmentStatus.CANCELLED;
      appointment.cancelledAt = new Date();
      appointment.cancellationReason = updateStatusDto.cancellationReason || '';
    } else if (newStatus === AppointmentStatus.CONFIRMED) {
      appointment.status = AppointmentStatus.CONFIRMED;
      appointment.confirmedAt = new Date();
    } else if (newStatus === AppointmentStatus.COMPLETED) {
      appointment.status = AppointmentStatus.COMPLETED;
      appointment.completedAt = new Date();
    } else {
      appointment.status = newStatus;
    }

    return appointment.save();
  }

  /**
   * Get all appointments for a patient
   */
  async getPatientAppointments(patientId: string): Promise<AppointmentDocument[]> {
    return this.appointmentModel
      .find({ patient: new Types.ObjectId(patientId) })
      .populate('doctor', 'firstName lastName')
      .sort({ appointmentDateTime: -1 })
      .exec();
  }

  /**
   * Get all appointments for a doctor
   */
  async getDoctorAppointments(doctorId: string, status?: AppointmentStatus): Promise<AppointmentDocument[]> {
    const query: any = { doctor: new Types.ObjectId(doctorId) };
    if (status) {
      query.status = status;
    }

    return this.appointmentModel
      .find(query)
      .populate('patient', 'firstName lastName phoneNumber nationalId')
      .sort({ appointmentDateTime: 1 })
      .exec();
  }

  /**
   * Get all appointments (admin)
   */
  async getAllAppointments(skip: number = 0, limit: number = 20, status?: AppointmentStatus): Promise<any> {
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const [appointments, total] = await Promise.all([
      this.appointmentModel
        .find(query)
        .populate('patient', 'firstName lastName phoneNumber')
        .populate('doctor', 'firstName lastName')
        .sort({ appointmentDateTime: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.appointmentModel.countDocuments(query),
    ]);

    return {
      data: appointments,
      pagination: {
        total,
        skip,
        limit,
      },
    };
  }

  // ============= DOCTOR AVAILABILITY METHODS =============

  /**
   * Create doctor availability
   */
  async createDoctorAvailability(createDto: CreateDoctorAvailabilityDto): Promise<DoctorAvailabilityDocument> {
    const existing = await this.doctorAvailabilityModel.findOne({ doctor: new Types.ObjectId(createDto.doctorId) });
    if (existing) {
      throw new ConflictException('اطلاعات دسترسی برای این پزشک قبلاً وجود دارد');
    }

    const weeklySchedule = this.normalizeWeeklySchedule(createDto.weeklySchedule, createDto.offDays, createDto.workingHours);

    return this.doctorAvailabilityModel.create({
      doctor: new Types.ObjectId(createDto.doctorId),
      offDays: this.getOffDaysFromWeeklySchedule(weeklySchedule, createDto.offDays),
      workingHours: this.getLegacyWorkingHoursSummary(weeklySchedule, createDto.workingHours),
      weeklySchedule,
      appointmentDuration: createDto.appointmentDuration || 30,
      maxAppointmentsPerSlot: createDto.maxAppointmentsPerSlot || 1,
    });
  }

  /**
   * Get doctor availability
   */
  async getDoctorAvailability(doctorId: string): Promise<DoctorAvailabilityDocument> {
    const availability = await this.doctorAvailabilityModel.findOne({ doctor: new Types.ObjectId(doctorId) }).populate('doctor', 'firstName lastName');

    if (!availability) {
      throw new NotFoundException('اطلاعات دسترسی پزشک یافت نشد');
    }

    return availability;
  }

  /**
   * Update doctor availability
   */
  async updateDoctorAvailability(doctorId: string, updateDto: UpdateDoctorAvailabilityDto): Promise<DoctorAvailabilityDocument> {
    const availability = await this.doctorAvailabilityModel.findOne({ doctor: new Types.ObjectId(doctorId) });
    if (!availability) {
      throw new NotFoundException('اطلاعات دسترسی پزشک یافت نشد');
    }

    const weeklySchedule = this.normalizeWeeklySchedule(updateDto.weeklySchedule, updateDto.offDays, updateDto.workingHours);

    if (weeklySchedule.length > 0) {
      availability.weeklySchedule = weeklySchedule;
      availability.offDays = this.getOffDaysFromWeeklySchedule(weeklySchedule, updateDto.offDays);
      availability.workingHours = this.getLegacyWorkingHoursSummary(weeklySchedule, updateDto.workingHours);
    } else {
      if (updateDto.offDays) availability.offDays = updateDto.offDays;
      if (updateDto.workingHours) availability.workingHours = updateDto.workingHours;
    }

    if (updateDto.appointmentDuration !== undefined) availability.appointmentDuration = updateDto.appointmentDuration;
    if (updateDto.maxAppointmentsPerSlot !== undefined) availability.maxAppointmentsPerSlot = updateDto.maxAppointmentsPerSlot;
    if (updateDto.isActive !== undefined) availability.isActive = updateDto.isActive;

    return availability.save();
  }

  /**
   * Add off exception (specific date when doctor is off)
   */
  async addOffException(doctorId: string, addOffExceptionDto: AddOffExceptionDto): Promise<DoctorAvailabilityDocument> {
    const availability = await this.doctorAvailabilityModel.findOne({ doctor: new Types.ObjectId(doctorId) });
    if (!availability) {
      throw new NotFoundException('اطلاعات دسترسی پزشک یافت نشد');
    }

    // Convert Persian date string to Gregorian if needed and add to exceptions
    const dateObj = new Date(addOffExceptionDto.date);
    availability.offExceptions.push({
      date: dateObj,
      reason: addOffExceptionDto.reason || '',
    });

    return availability.save();
  }

  // ============= PRIVATE HELPER METHODS =============

  private isDoctorAvailableOnDay(date: Date, availability: DoctorAvailabilityDocument): boolean {
    return this.getWorkingRangesForDate(date, availability).length > 0;
  }

  private isTimeWithinWorkingHours(dateTime: Date, availability: DoctorAvailabilityDocument): boolean {
    return this.getMatchingWorkingRange(dateTime, availability) !== null;
  }

  private roundTimeToSlot(date: Date, durationMinutes: number): Date {
    const rounded = new Date(date);
    const ms = durationMinutes * 60 * 1000;
    rounded.setTime(Math.floor(rounded.getTime() / ms) * ms);
    return rounded;
  }

  private buildTehranDateTime(baseDate: Date, hour: number, minute: number = 0): Date {
    return new Date(baseDate.getTime() + (hour * 60 + minute) * 60 * 1000);
  }

  private getTehranMinute(date: Date): number {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tehran',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);

    for (const part of parts) {
      if (part.type === 'minute') {
        return Number.parseInt(part.value, 10);
      }
    }

    return date.getMinutes();
  }

  private getTehranHour(date: Date): number {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tehran',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(date);

    for (const part of parts) {
      if (part.type === 'hour') {
        return Number.parseInt(part.value, 10);
      }
    }

    return date.getHours();
  }

  private normalizeWeeklySchedule(
    weeklySchedule?: WeeklyScheduleInput[],
    offDays?: number[],
    workingHours?: WorkingHoursRange,
  ): NormalizedDailySchedule[] {
    if (weeklySchedule?.length) {
      return weeklySchedule
        .map((daySchedule) => ({
          dayOfWeek: daySchedule.dayOfWeek,
          isOff: Boolean(daySchedule.isOff),
          workingHours: this.normalizeWorkingRanges(daySchedule.workingHours),
        }))
        .filter((daySchedule) => daySchedule.dayOfWeek >= 0 && daySchedule.dayOfWeek <= 6)
        .sort((left, right) => left.dayOfWeek - right.dayOfWeek);
    }

    if (offDays?.length || workingHours) {
      const normalizedOffDays = new Set(offDays ?? []);
      const schedule: NormalizedDailySchedule[] = [];

      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const isOff = normalizedOffDays.has(dayOfWeek);
        schedule.push({
          dayOfWeek,
          isOff,
          workingHours: isOff || !workingHours ? [] : [{ from: workingHours.from, to: workingHours.to }],
        });
      }

      return schedule;
    }

    return [];
  }

  private normalizeWorkingRanges(workingHours?: Array<Pick<WorkingHoursRange, 'from' | 'to'>>): WorkingRange[] {
    if (!workingHours?.length) {
      return [];
    }

    return workingHours
      .map((range) => ({ from: range.from, to: range.to }))
      .filter((range) => range.from < range.to)
      .sort((left, right) => left.from - right.from || left.to - right.to);
  }

  private getWorkingRangesForDate(date: Date, availability: DoctorAvailabilityDocument): WorkingRange[] {
    const dayOfWeek = this.persianCalendarService.getPersianWeekdayIndex(date);
    const dateString = this.persianCalendarService.getTehranDateIso(date);

    for (const exception of availability.offExceptions ?? []) {
      const exceptionDateString = this.persianCalendarService.getTehranDateIso(exception.date);
      if (exceptionDateString === dateString) {
        return [];
      }
    }

    const weeklySchedule = availability.weeklySchedule ?? [];
    const configuredDay = weeklySchedule.find((daySchedule) => daySchedule.dayOfWeek === dayOfWeek);
    if (configuredDay) {
      if (configuredDay.isOff) {
        return [];
      }

      return this.normalizeWorkingRanges(configuredDay.workingHours);
    }

    if (availability.offDays?.includes(dayOfWeek)) {
      return [];
    }

    if (availability.workingHours) {
      return this.normalizeWorkingRanges([availability.workingHours]);
    }

    return [];
  }

  private getMatchingWorkingRange(dateTime: Date, availability: DoctorAvailabilityDocument): WorkingRange | null {
    const hour = this.getTehranHour(dateTime);
    const minute = this.getTehranMinute(dateTime);
    const totalMinutes = hour * 60 + minute;
    const slotDuration = availability.appointmentDuration;

    for (const range of this.getWorkingRangesForDate(dateTime, availability)) {
      const rangeStart = range.from * 60;
      const rangeEnd = range.to * 60;

      if (totalMinutes < rangeStart || totalMinutes >= rangeEnd) {
        continue;
      }

      if ((totalMinutes - rangeStart) % slotDuration !== 0) {
        continue;
      }

      return range;
    }

    return null;
  }

  private getOffDaysFromWeeklySchedule(weeklySchedule: NormalizedDailySchedule[], fallbackOffDays?: number[]): number[] {
    if (weeklySchedule.length > 0) {
      return weeklySchedule.filter((daySchedule) => daySchedule.isOff || daySchedule.workingHours.length === 0).map((daySchedule) => daySchedule.dayOfWeek);
    }

    return fallbackOffDays ?? [];
  }

  private getLegacyWorkingHoursSummary(
    weeklySchedule: NormalizedDailySchedule[],
    fallbackWorkingHours?: WorkingHoursRange,
  ): WorkingHoursRange | undefined {
    if (fallbackWorkingHours) {
      return fallbackWorkingHours;
    }

    for (const daySchedule of weeklySchedule) {
      if (daySchedule.isOff) {
        continue;
      }

      const firstRange = daySchedule.workingHours[0];
      if (firstRange) {
        return { from: firstRange.from, to: firstRange.to };
      }
    }

    return undefined;
  }
}
