import { IsNotEmpty, IsArray, IsNumber, IsOptional, IsString, IsBoolean, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkingHoursDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(23)
  from!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(23)
  to!: number;
}

export class OffExceptionDto {
  @IsNotEmpty()
  @IsString()
  date!: string; // Date in Persian calendar

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateDoctorAvailabilityDto {
  @IsNotEmpty()
  @IsString()
  doctorId!: string; // Doctor (User) ID

  @IsArray()
  @IsNumber({}, { each: true })
  offDays!: number[]; // 0=Saturday, 6=Friday

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  workingHours!: WorkingHoursDto;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(120)
  appointmentDuration?: number; // in minutes

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAppointmentsPerSlot?: number;
}

export class UpdateDoctorAvailabilityDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  offDays?: number[];

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto;

  @IsOptional()
  @IsNumber()
  appointmentDuration?: number;

  @IsOptional()
  @IsNumber()
  maxAppointmentsPerSlot?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AddOffExceptionDto {
  @IsNotEmpty()
  @IsString()
  date!: string; // Date in Persian calendar

  @IsOptional()
  @IsString()
  reason?: string;
}
