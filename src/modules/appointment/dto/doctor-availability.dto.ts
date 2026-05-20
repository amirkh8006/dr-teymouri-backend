import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, IsNumber, IsOptional, IsString, IsBoolean, ValidateNested, Min, Max, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkingHoursRangeDto {
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

export class WeeklyAvailabilityDayDto {
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(6)
  @ApiProperty({ example: 0, description: 'روز هفته، 0=شنبه ... 6=جمعه' })
  dayOfWeek!: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ example: false, description: 'آیا این روز تعطیل است' })
  isOff?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursRangeDto)
  @ApiPropertyOptional({ type: [WorkingHoursRangeDto], description: 'بازه های کاری این روز' })
  workingHours?: WorkingHoursRangeDto[];
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

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @ApiPropertyOptional({ example: [5, 6], description: 'روزهای تعطیل، 0=شنبه ... 6=جمعه', isArray: true, type: 'number' })
  offDays?: number[]; // Legacy compatibility

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursRangeDto)
  @ApiPropertyOptional({ type: WorkingHoursRangeDto, description: 'ساعات کاری پیش فرض (سازگاری با نسخه قدیمی)' })
  workingHours?: WorkingHoursRangeDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyAvailabilityDayDto)
  @ApiPropertyOptional({ type: [WeeklyAvailabilityDayDto], description: 'برنامه هفتگی پزشک' })
  weeklySchedule?: WeeklyAvailabilityDayDto[];

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
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @ApiPropertyOptional({ example: [6], description: 'روزهای تعطیل به روز رسانی شده', isArray: true, type: 'number' })
  offDays?: number[];

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursRangeDto)
  @ApiPropertyOptional({ type: WorkingHoursRangeDto, description: 'ساعات کاری به روز رسانی شده' })
  workingHours?: WorkingHoursRangeDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyAvailabilityDayDto)
  @ApiPropertyOptional({ type: [WeeklyAvailabilityDayDto], description: 'برنامه هفتگی به روز رسانی شده' })
  weeklySchedule?: WeeklyAvailabilityDayDto[];

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
