import { IsNotEmpty, IsString, IsEnum, IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { VisitType } from '../constants/visit-type.enum';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsString()
  doctorId!: string; // Doctor ID

  @IsNotEmpty()
  @IsDateString()
  appointmentDateTime!: string; // ISO datetime string

  @IsNotEmpty()
  @IsEnum(VisitType)
  visitType!: VisitType;

  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @IsNotEmpty()
  @IsString()
  nationalId!: string;

  @IsNotEmpty()
  @IsBoolean()
  payNow!: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentStatusDto {
  @IsNotEmpty()
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class GetAvailableSlotsDto {
  @IsNotEmpty()
  @IsString()
  doctorId!: string;

  @IsOptional()
  @IsString()
  days?: string; // number of days to retrieve (default: 10)
}
