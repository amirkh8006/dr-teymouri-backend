import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';

@Schema({ _id: false, versionKey: false })
export class WorkingHours {
  @Prop({ required: true, min: 0, max: 23 })
  from!: number; // Start hour (0-23)

  @Prop({ required: true, min: 0, max: 23 })
  to!: number; // End hour (0-23)
}

export const WorkingHoursSchema = SchemaFactory.createForClass(WorkingHours);

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

  @Prop({ type: [Number], default: [0, 1] }) // 0=Saturday, 6=Friday in JavaScript
  offDays!: number[]; // Days of week when doctor is off

  @Prop({ type: WorkingHoursSchema, required: true })
  workingHours!: WorkingHours; // Working hours per day

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
