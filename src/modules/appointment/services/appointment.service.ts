import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment, AppointmentDocument } from '../schemas/appointment.schema';
import { DoctorAvailability, DoctorAvailabilityDocument } from '../schemas/doctor-availability.schema';
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
      appointmentDateTime: this.roundTimeToSlot(appointmentDate, doctorAvailability.appointmentDuration),
      status: { $ne: AppointmentStatus.CANCELLED },
    });

    if (conflictingAppointments >= doctorAvailability.maxAppointmentsPerSlot) {
      throw new ConflictException('این ساعت پر شده است، لطفاً ساعت دیگری را انتخاب کنید');
    }

    // Create appointment
    const appointment = new this.appointmentModel({
      patient: new Types.ObjectId(patientId),
      doctor: new Types.ObjectId(doctorId),
      appointmentDateTime: appointmentDate,
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
      const { from, to } = doctorAvailability.workingHours;
      for (let hour = from; hour < to; hour++) {
        const slotTime = new Date(dayInfo.date);
        slotTime.setHours(hour, 0, 0, 0);

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
          time: `${String(hour).padStart(2, '0')}:00`,
          availableSpots,
          choosable,
        });

        daySlots.remainingAppointments += availableSpots;
      }

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
  async getAllAppointments(page: number = 1, limit: number = 20, status?: AppointmentStatus): Promise<any> {
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

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
        page,
        limit,
        pages: Math.ceil(total / limit),
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

    return this.doctorAvailabilityModel.create({
      doctor: new Types.ObjectId(createDto.doctorId),
      offDays: createDto.offDays,
      workingHours: createDto.workingHours,
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

    if (updateDto.offDays) availability.offDays = updateDto.offDays;
    if (updateDto.workingHours) availability.workingHours = updateDto.workingHours;
    if (updateDto.appointmentDuration) availability.appointmentDuration = updateDto.appointmentDuration;
    if (updateDto.maxAppointmentsPerSlot) availability.maxAppointmentsPerSlot = updateDto.maxAppointmentsPerSlot;
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
    const dayOfWeek = this.persianCalendarService.getPersianWeekdayIndex(date);

    // Check if day is off
    if (availability.offDays.includes(dayOfWeek)) {
      return false;
    }

    // Check if there's an off exception for this date
    const dateString = this.persianCalendarService.getTehranDateIso(date);
    for (const exception of availability.offExceptions) {
      const exceptionDateString = this.persianCalendarService.getTehranDateIso(exception.date);
      if (exceptionDateString === dateString) {
        return false;
      }
    }

    return true;
  }

  private isTimeWithinWorkingHours(dateTime: Date, availability: DoctorAvailabilityDocument): boolean {
    const hour = dateTime.getHours();
    const { from, to } = availability.workingHours;

    return hour >= from && hour < to;
  }

  private roundTimeToSlot(date: Date, durationMinutes: number): Date {
    const rounded = new Date(date);
    const ms = durationMinutes * 60 * 1000;
    rounded.setTime(Math.floor(rounded.getTime() / ms) * ms);
    return rounded;
  }
}
