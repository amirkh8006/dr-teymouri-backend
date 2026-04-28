import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';
import { VisitType } from '../constants/visit-type.enum';
import { AppointmentStatus } from '../constants/appointment-status.enum';
import { PaymentStatus } from '../constants/payment-status.enum';

export type AppointmentDocument = HydratedDocument<Appointment>;

@Schema({ timestamps: true, versionKey: false })
export class Appointment {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  patient!: Types.ObjectId; // Reference to patient (User)

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  doctor!: Types.ObjectId; // Reference to doctor (User with role=doctor)

  @Prop({ required: true })
  appointmentDateTime!: Date; // Date and time in Persian calendar

  @Prop({ type: String, enum: Object.values(VisitType), required: true })
  visitType!: VisitType;

  @Prop({ required: true, trim: true })
  fullName!: string; // Patient full name

  @Prop({ required: true, trim: true })
  nationalId!: string; // National ID

  @Prop({ type: String, enum: Object.values(AppointmentStatus), default: AppointmentStatus.PENDING })
  status!: AppointmentStatus;

  @Prop({ type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING })
  paymentStatus!: PaymentStatus;

  @Prop({ required: true, default: false })
  payNow!: boolean; // true = pay now, false = pay later

  @Prop({ default: '' })
  notes?: string; // Additional notes

  @Prop({ default: '' })
  cancellationReason?: string; // Reason if cancelled

  @Prop({ default: null })
  cancelledAt?: Date; // When was it cancelled

  @Prop({ default: null })
  confirmedAt?: Date; // When was it confirmed by admin

  @Prop({ default: null })
  completedAt?: Date; // When was it completed

  @Prop({ default: '' })
  reminderSent!: string; // SMS/Email sent status
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
