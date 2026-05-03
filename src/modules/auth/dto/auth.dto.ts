import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EducationLevel, HousingStatus, JobStatus, MaritalStatus, MealType } from '../../user/user-profile.constants';

export class LoginDto {
  @IsNotEmpty()
  @Length(11)
  @Matches(new RegExp('^(\\+98|0)?9\\d{9}$'))
  @ApiProperty({ example: '09123456789', description: 'شماره تلفن همراه' })
  phoneNumber!: string;
}

export class VerifyOtpDto {
  @IsNotEmpty()
  @Length(11)
  @Matches(new RegExp('^(\\+98|0)?9\\d{9}$'))
  @ApiProperty({ example: '09123456789', description: 'شماره تلفن همراه' })
  phoneNumber!: string;

  @IsNotEmpty()
  @Length(6)
  @IsString()
  @ApiProperty({ example: '123456', description: 'کد تایید 6 رقمی' })
  @Matches(/^\d{6}$/)
  otp!: string;
}

export class SetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'رمز عبور باید حداقل 8 کاراکتر، شامل حروف کوچک، حروف بزرگ، عدد و کاراکتر خاص باشد',
  })
  @ApiProperty({
    example: 'MyPass123!',
    description: 'رمز عبور جدید - حداقل 8 کاراکتر، شامل حروف کوچک، حروف بزرگ، عدد و کاراکتر خاص',
  })
  password!: string;
}

export class LoginWithPasswordDto {
  @IsNotEmpty()
  @Length(11)
  @Matches(new RegExp('^(\\+98|0)?9\\d{9}$'))
  @ApiProperty({ example: '09123456789', description: 'شماره تلفن همراه' })
  phoneNumber!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @ApiProperty({
    example: 'MyPass123!',
    description: 'رمز عبور - حداقل 8 کاراکتر، شامل حروف کوچک، حروف بزرگ، عدد و کاراکتر خاص',
  })
  password!: string;
}

export class RequestPasswordResetDto {
  @IsNotEmpty()
  @Length(11)
  @Matches(new RegExp('^(\\+98|0)?9\\d{9}$'))
  @ApiProperty({ example: '09123456789', description: 'شماره تلفن همراه' })
  phoneNumber!: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @Length(11)
  @Matches(new RegExp('^(\\+98|0)?9\\d{9}$'))
  @ApiProperty({ example: '09123456789', description: 'شماره تلفن همراه' })
  phoneNumber!: string;

  @IsNotEmpty()
  @Length(6)
  @IsString()
  @ApiProperty({ example: '123456', description: 'کد تایید 6 رقمی' })
  @Matches(/^\d{6}$/)
  otp!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'رمز عبور باید حداقل 8 کاراکتر، شامل حروف کوچک، حروف بزرگ، عدد و کاراکتر خاص باشد',
  })
  @ApiProperty({
    example: 'MyPass123!',
    description: 'رمز عبور جدید - حداقل 8 کاراکتر، شامل حروف کوچک، حروف بزرگ، عدد و کاراکتر خاص',
  })
  newPassword!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @ApiProperty({
    example: 'MyPass123!',
    description: 'تکرار رمز عبور جدید',
  })
  confirmPassword!: string;
}

export class FoodPreferenceDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Rice', description: 'نوع غذا' })
  foodType!: string;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty({ example: true, description: 'مصرف می‌کنم یا مصرف نمی‌کنم' })
  consumes!: boolean;
}

export class RegisterUserDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Ali', description: 'نام' })
  firstName!: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Ahmadi', description: 'نام خانوادگی' })
  lastName!: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '1990-01-01', description: 'تاریخ تولد' })
  birthDate!: string;

  @IsNotEmpty()
  @IsEnum(MaritalStatus)
  @ApiProperty({ enum: MaritalStatus, example: MaritalStatus.married, description: 'Marital status' })
  maritalStatus!: MaritalStatus;

  @IsNotEmpty()
  @IsEnum(EducationLevel)
  @ApiProperty({ enum: EducationLevel, example: EducationLevel.bachelor, description: 'Education level' })
  educationLevel!: EducationLevel;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Teacher', description: 'شغل' })
  occupation!: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '2026-04-28', description: 'تاریخ مراجعه' })
  visitDate!: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Instagram', description: 'نحوه آشنایی' })
  referralSource!: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '1234567890', description: 'کد ملی' })
  nationalId!: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'John Doe', description: 'معرف' })
  referrer!: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Spouse', description: 'چه کسی خرید می‌کند؟' })
  groceryBuyer!: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Spouse', description: 'چه کسی غذا می‌پزد؟' })
  cookName!: string;

  @IsNotEmpty()
  @IsEnum(JobStatus)
  @ApiProperty({ enum: JobStatus, example: JobStatus.employed, description: 'Employment status' })
  jobStatus!: JobStatus;

  @IsNotEmpty()
  @IsEnum(HousingStatus)
  @ApiProperty({ enum: HousingStatus, example: HousingStatus.aprtment, description: 'Housing status' })
  housingStatus!: HousingStatus;

  @IsArray()
  @IsOptional()
  @IsEnum(MealType, { each: true })
  @ApiProperty({ enum: MealType, isArray: true, example: [MealType.breakfast, MealType.lunch], description: 'وعده‌هایی که در منزل مصرف می‌کنید' })
  mealsConsumedAtHome!: MealType[];

  @IsArray()
  @IsOptional()
  @IsEnum(MealType, { each: true })
  @ApiProperty({ enum: MealType, isArray: true, example: [MealType.dinner], description: 'وعده‌های غذایی حذف شده' })
  removedMeals!: MealType[];

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Tehran, Example St.', description: 'آدرس محل سکونت' })
  address!: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '02112345678', description: 'تلفن ثابت' })
  landlinePhone!: string;

  @IsNotEmpty()
  @Length(11)
  @Matches(new RegExp('^(\\+98|0)?9\\d{9}$'))
  @ApiProperty({ example: '09123456789', description: 'تلفن همراه' })
  mobilePhone!: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '220515-1', required: false, description: 'Manual file number (ParvandeNumDasti)' })
  manualFileNumber?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => FoodPreferenceDto)
  @ApiProperty({ type: [FoodPreferenceDto], description: 'جدول غذایی' })
  foodPreferences!: FoodPreferenceDto[];
}
