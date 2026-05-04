import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class ContentPageTopicDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'درباره تغذیه', description: 'عنوان بحث' })
  title!: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '<p>محتوای بحث</p>', description: 'محتوای HTML بحث' })
  contentHtml!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ example: 1, description: 'ترتیب نمایش' })
  order?: number;
}

export class CreateContentPageDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'درباره ما', description: 'عنوان صفحه' })
  title!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'about-us', description: 'اسلاگ برای URL عمومی' })
  slug?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentPageTopicDto)
  @ApiPropertyOptional({ type: [ContentPageTopicDto], description: 'لیست بحثهای صفحه' })
  topics?: ContentPageTopicDto[];
}

export class UpdateContentPageDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'درباره ما (به روز رسانی)', description: 'عنوان صفحه' })
  title?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'about-us', description: 'اسلاگ برای URL عمومی' })
  slug?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentPageTopicDto)
  @ApiPropertyOptional({ type: [ContentPageTopicDto], description: 'لیست بحثهای صفحه' })
  topics?: ContentPageTopicDto[];
}
