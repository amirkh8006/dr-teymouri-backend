import { Injectable } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class OtpService {
  private readonly OTP_EXPIRY = 90;

  constructor(private readonly redisService: RedisService) {}

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async storeOtp(phoneNumber: string, otp: string, ttl?: number): Promise<void> {
    const expiryTime = ttl || this.OTP_EXPIRY;
    await this.redisService.setOtp(phoneNumber, otp, expiryTime);
  }

  async verifyOtp(phoneNumber: string, inputOtp: string): Promise<{ success: boolean; message: string }> {
    const otpRecord = await this.redisService.getOtp(phoneNumber);

    if (!otpRecord) {
      return {
        success: false,
        message: 'کد تایید منقضی شده است یا وجود ندارد',
      };
    }

    if (otpRecord !== inputOtp) {
      return {
        success: false,
        message: 'کد تایید نادرست است.',
      };
    }

    await this.deleteOtp(phoneNumber);

    return {
      success: true,
      message: 'کد تایید با موفقیت تأیید شد.',
    };
  }

  async otpExists(phoneNumber: string): Promise<boolean> {
    return this.redisService.otpExists(phoneNumber);
  }

  async deleteOtp(phoneNumber: string): Promise<void> {
    await this.redisService.deleteOtp(phoneNumber);
  }

  async getOtpTtl(phoneNumber: string): Promise<number> {
    return this.redisService.getOtpTtl(phoneNumber);
  }
}
