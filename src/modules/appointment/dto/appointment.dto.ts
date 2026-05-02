import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { VisitType } from '../constants/visit-type.enum';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه کاربر پزشک' })
  doctorId!: string; // Doctor ID

  @IsNotEmpty()
  @IsDateString()
  @ApiProperty({ example: '2026-05-02T09:30:00.000Z', description: 'تاریخ/ساعت نوبت در فرمت ISO' })
  appointmentDateTime!: string; // ISO datetime string

  @IsNotEmpty()
  @IsEnum(VisitType)
  @ApiProperty({ enum: VisitType, example: VisitType.CONSULTATION, description: 'نوع ویزیت' })
  visitType!: VisitType;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'علی احمدی', description: 'نام کامل مراجع' })
  fullName!: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '1234567890', description: 'کد ملی' })
  nationalId!: string;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty({ example: true, description: 'آیا در حال حاضر پرداخت کنید' })
  payNow!: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'ترجیح داده‌ام نوبت صبح باشد', description: 'یادداشت های اضافی' })
  notes?: string;
}

export class UpdateAppointmentStatusDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'confirmed', description: 'وضعیت جدید' })
  status!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'تقاضای مراجع برای تغییر', description: 'دلیل لغو' })
  cancellationReason?: string;
}

export class GetAvailableSlotsDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه کاربر پزشک' })
  doctorId!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '10', description: 'تعداد روزهای قابل دریافت (پیش فرض: 10)' })
  days?: string; // number of days to retrieve (default: 10)
}
