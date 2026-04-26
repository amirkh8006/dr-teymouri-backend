import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoleDto {
  @IsString()
  @ApiProperty({
    example: 'مدیر سیستم',
    description: 'نام نقش',
  })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'دسترسی کامل به تمامی بخش‌های سیستم',
    description: 'توضیحات نقش',
    required: false,
  })
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    example: ['user:create', 'user:read', 'user:update', 'user:delete', 'role:create'],
    description: 'لیست مجوزهای نقش',
    required: false,
    isArray: true,
    type: 'string',
  })
  permissions?: string[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'مدیر سیستم به‌روز شده',
    description: 'نام جدید نقش',
    required: false,
  })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'دسترسی محدود به بخش‌های خاص سیستم',
    description: 'توضیحات جدید نقش',
    required: false,
  })
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    example: ['user:read', 'user:update', 'role:read'],
    description: 'لیست جدید مجوزهای نقش',
    required: false,
    isArray: true,
    type: 'string',
  })
  permissions?: string[];
}

export class GetRolesQueryDto {
  @ApiProperty({
    example: 0,
    description: 'تعداد رکوردهای قابل نادیده گرفتن',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number = 0;

  @ApiProperty({
    example: 10,
    description: 'حداکثر تعداد رکوردهای بازگردانده شده (پیش فرض: 10)',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    example: 'مدیر',
    description: 'جستجو در نام نقش',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
