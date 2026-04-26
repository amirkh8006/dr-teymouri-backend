import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp, OtpDocument } from '../../modules/auth/schemas/otp.schema';

@Injectable()
export class OtpService {
  private readonly OTP_EXPIRY = 90;

  constructor(@InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>) {}

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async storeOtp(phoneNumber: string, otp: string, ttl?: number): Promise<void> {
    const expiryTime = ttl || this.OTP_EXPIRY;
    const expiresAt = new Date(Date.now() + expiryTime * 1000);

    await this.otpModel
      .findOneAndUpdate(
        { phoneNumber },
        {
          phoneNumber,
          otp,
          expiresAt,
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  async verifyOtp(phoneNumber: string, inputOtp: string): Promise<{ success: boolean; message: string }> {
    const otpRecord = await this.otpModel.findOne({ phoneNumber }).exec();

    if (!otpRecord || otpRecord.expiresAt.getTime() < Date.now()) {
      return {
        success: false,
        message: 'کد تایید منقضی شده است یا وجود ندارد',
      };
    }

    if (otpRecord.otp !== inputOtp) {
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
    const otpRecord = await this.otpModel.findOne({ phoneNumber }).exec();
    return !!otpRecord && otpRecord.expiresAt.getTime() > Date.now();
  }

  async deleteOtp(phoneNumber: string): Promise<void> {
    await this.otpModel.deleteOne({ phoneNumber }).exec();
  }

  async getOtpTtl(phoneNumber: string): Promise<number> {
    const otpRecord = await this.otpModel.findOne({ phoneNumber }).exec();
    if (!otpRecord) {
      return -1;
    }

    const ttl = Math.floor((otpRecord.expiresAt.getTime() - Date.now()) / 1000);
    return ttl > 0 ? ttl : -1;
  }
}
