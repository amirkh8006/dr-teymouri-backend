import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';

@Schema({ _id: false, versionKey: false })
export class WorkingHoursRange {
  @Prop({ required: true, min: 0, max: 23 })
  from!: number; // Start hour (0-23)

  @Prop({ required: true, min: 0, max: 23 })
  to!: number; // End hour (0-23)
}

export const WorkingHoursRangeSchema = SchemaFactory.createForClass(WorkingHoursRange);

@Schema({ _id: false, versionKey: false })
export class WeeklyAvailabilityDay {
  @Prop({ required: true, min: 0, max: 6 })
  dayOfWeek!: number;

  @Prop({ default: false })
  isOff!: boolean;

  @Prop({ type: [WorkingHoursRangeSchema], default: [] })
  workingHours!: WorkingHoursRange[];
}

export const WeeklyAvailabilityDaySchema = SchemaFactory.createForClass(WeeklyAvailabilityDay);

@Schema({ _id: false, versionKey: false })
export class OffException {
  @Prop({ required: true })
  date!: Date; // Specific date off (in Persian calendar)

  @Prop({ default: '' })
  reason?: string;
}

export const OffExceptionSchema = SchemaFactory.createForClass(OffException);

export type DoctorAvailabilityDocument = HydratedDocument<DoctorAvailability>;

@Schema({ timestamps: true, versionKey: false })
export class DoctorAvailability {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
  doctor!: Types.ObjectId; // Reference to User with role=doctor

  @Prop({ type: [Number], default: [] }) // Legacy/off-day summary, kept for compatibility
  offDays!: number[]; // Days of week when doctor is off

  @Prop({ type: WorkingHoursRangeSchema, required: false })
  workingHours?: WorkingHoursRange; // Legacy summary working hours

  @Prop({ type: [WeeklyAvailabilityDaySchema], default: [] })
  weeklySchedule!: WeeklyAvailabilityDay[]; // Weekly availability by day

  @Prop({ required: true, default: 30, min: 15, max: 120 })
  appointmentDuration!: number; // Duration in minutes

  @Prop({ required: true, default: 1, min: 1 })
  maxAppointmentsPerSlot!: number; // Max patients per time slot

  @Prop({ type: [OffExceptionSchema], default: [] })
  offExceptions!: OffException[]; // Specific dates when doctor is off

  @Prop({ default: true })
  isActive!: boolean;
}

export const DoctorAvailabilitySchema = SchemaFactory.createForClass(DoctorAvailability);
