import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const toBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }
  return undefined;
};

export class CreateArticleDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'نکات بهداشت غذایی', description: 'عنوان مقاله' })
  title!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '/uploads/article-1.jpg', description: 'آدرس تصویر بند' })
  thumbnail?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '<p>محتوا</p>', description: 'محتوای مقاله (HTML یا متن)' })
  content!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'healthy-eating-tips', description: 'اسلاگ برای URL عمومی' })
  slug?: string;

  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({ example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه کاربر نویسنده' })
  authorId?: string;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  @ApiPropertyOptional({ example: true, description: 'وضعیت انتشار' })
  isPublished?: boolean;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ example: '2026-05-02T10:00:00.000Z', description: 'تاریخ/ساعت انتشار' })
  publishedAt?: string;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  @ApiPropertyOptional({ example: false, description: 'نشانه مقاله پڑیشنهادی' })
  isSuggested?: boolean;
}

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'نکات بهداشت غذایی (به روز رسانی)', description: 'عنوان مقاله' })
  title?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '/uploads/article-2.jpg', description: 'آدرس تصویر بند' })
  thumbnail?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '<p>محتوای به روز رسانی شده</p>', description: 'محتوای مقاله (HTML یا متن)' })
  content?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'healthy-eating-tips', description: 'اسلاگ برای URL عمومی' })
  slug?: string;

  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({ example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه کاربر نویسنده' })
  authorId?: string;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  @ApiPropertyOptional({ example: true, description: 'وضعیت انتشار' })
  isPublished?: boolean;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ example: '2026-05-02T10:00:00.000Z', description: 'تاریخ/ساعت انتشار' })
  publishedAt?: string;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  @ApiPropertyOptional({ example: false, description: 'نشانه مقاله پڑیشنهادی' })
  isSuggested?: boolean;
}
