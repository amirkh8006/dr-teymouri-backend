import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, IsNumber, IsOptional, IsString, IsBoolean, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkingHoursDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(23)
  @ApiProperty({ example: 9, description: 'ساعت شروع (0-23)' })
  from!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(23)
  @ApiProperty({ example: 17, description: 'ساعت پایان (0-23)' })
  to!: number;
}

export class OffExceptionDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '1405-02-12', description: 'تاریخ در تقویم فارسی' })
  date!: string; // Date in Persian calendar

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'کنفرانس پزشکی', description: 'دلیل تعطیلی' })
  reason?: string;
}

export class CreateDoctorAvailabilityDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه کاربر پزشک' })
  doctorId!: string; // Doctor (User) ID

  @IsArray()
  @IsNumber({}, { each: true })
  @ApiProperty({ example: [5], description: 'روزهای تعطیل، 0=شنبه ... 6=جمعه', isArray: true, type: 'number' })
  offDays!: number[]; // 0=Saturday, 6=Friday

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  @ApiProperty({ type: WorkingHoursDto, description: 'ساعات کاری' })
  workingHours!: WorkingHoursDto;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(120)
  @ApiPropertyOptional({ example: 30, description: 'مدت زمان نوبت به دقیقه' })
  appointmentDuration?: number; // in minutes

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ example: 1, description: 'حداکثر نوبت در هر آزمایش' })
  maxAppointmentsPerSlot?: number;
}

export class UpdateDoctorAvailabilityDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ApiPropertyOptional({ example: [6], description: 'روزهای تعطیل به روز رسانی شده', isArray: true, type: 'number' })
  offDays?: number[];

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  @ApiPropertyOptional({ type: WorkingHoursDto, description: 'ساعات کاری به روز رسانی شده' })
  workingHours?: WorkingHoursDto;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ example: 20, description: 'مدت زمان نوبت به روز رسانی شده (به دقیقه)' })
  appointmentDuration?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ example: 2, description: 'حداکثر نوبت به روز رسانی شده' })
  maxAppointmentsPerSlot?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ example: true, description: 'فعال یا غیرفعال کردن دسترس' })
  isActive?: boolean;
}

export class AddOffExceptionDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '1405-03-01', description: 'تاریخ در تقویم فارسی' })
  date!: string; // Date in Persian calendar

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'مرخصی', description: 'دلیل تعطیلی' })
  reason?: string;
}
