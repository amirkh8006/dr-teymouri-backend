import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @Length(11)
  @Matches(new RegExp('^(\\+98|0)?9\\d{9}$'))
  @ApiProperty({ example: '09123456789', description: 'شماره تلفن همراه' })
  phoneNumber: string;
}

export class VerifyOtpDto {
  @IsNotEmpty()
  @Length(11)
  @Matches(new RegExp('^(\\+98|0)?9\\d{9}$'))
  @ApiProperty({ example: '09123456789', description: 'شماره تلفن همراه' })
  phoneNumber: string;

  @IsNotEmpty()
  @Length(6)
  @IsString()
  @ApiProperty({ example: '123456', description: 'کد تایید 6 رقمی' })
  @Matches(/^\d{6}$/)
  otp: string;
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
  password: string;
}

export class LoginWithPasswordDto {
  @IsNotEmpty()
  @Length(11)
  @Matches(new RegExp('^(\\+98|0)?9\\d{9}$'))
  @ApiProperty({ example: '09123456789', description: 'شماره تلفن همراه' })
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @ApiProperty({
    example: 'MyPass123!',
    description: 'رمز عبور - حداقل 8 کاراکتر، شامل حروف کوچک، حروف بزرگ، عدد و کاراکتر خاص',
  })
  password: string;
}

export class TerminateSessionDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '12345678...', description: 'توکن برای حذف' })
  tokenId: string;
}

export class RequestPasswordResetDto {
  @IsNotEmpty()
  @Length(11)
  @Matches(new RegExp('^(\\+98|0)?9\\d{9}$'))
  @ApiProperty({ example: '09123456789', description: 'شماره تلفن همراه' })
  phoneNumber: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @Length(11)
  @Matches(new RegExp('^(\\+98|0)?9\\d{9}$'))
  @ApiProperty({ example: '09123456789', description: 'شماره تلفن همراه' })
  phoneNumber: string;

  @IsNotEmpty()
  @Length(6)
  @IsString()
  @ApiProperty({ example: '123456', description: 'کد تایید 6 رقمی' })
  @Matches(/^\d{6}$/)
  otp: string;

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
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @ApiProperty({
    example: 'MyPass123!',
    description: 'تکرار رمز عبور جدید',
  })
  confirmPassword: string;
}
