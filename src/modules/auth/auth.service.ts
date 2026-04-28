import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  LoginDto,
  VerifyOtpDto,
  RegisterUserDto,
} from './dto/auth.dto';
import { SmsService } from '../../common/utils/sms.service';
import { OtpService } from '../../common/utils/otp.service';
import { UserService } from '../user/user.service';
import { RoleService } from '../role/role.service';
import { AuthSession, AuthSessionDocument } from './schemas/auth-session.schema';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly smsService: SmsService,
    private readonly otpService: OtpService,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly jwtService: JwtService,
    @InjectModel(AuthSession.name) private readonly authSessionModel: Model<AuthSessionDocument>,
  ) {}

  private getSessionExpiryDate(days = 7): Date {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private getDeviceDisplayName(userAgent?: string): string {
    if (!userAgent) {
      return 'Unknown Device';
    }

    if (userAgent.includes('Android')) {
      return 'Android Device';
    }
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      return 'iOS Device';
    }
    if (userAgent.includes('Windows')) {
      return 'Windows Device';
    }
    if (userAgent.includes('Macintosh')) {
      return 'Mac Device';
    }

    return 'Unknown Device';
  }

  private async storeSession(token: string, userId: string, userAgent?: string): Promise<void> {
    const uid = new Types.ObjectId(userId);

    await this.authSessionModel.create({
      token,
      userId: uid,
      userAgent: userAgent || 'Unknown',
      deviceDisplayName: this.getDeviceDisplayName(userAgent),
      expiresAt: this.getSessionExpiryDate(7),
    });

    const sessions = await this.authSessionModel.find({ userId: uid }).sort({ createdAt: -1 }).exec();
    if (sessions.length > 3) {
      const staleIds = sessions.slice(3).map((s) => s._id);
      await this.authSessionModel.deleteMany({ _id: { $in: staleIds } }).exec();
    }
  }

  async isTokenValid(token: string): Promise<boolean> {
    const session = await this.authSessionModel.findOne({ token }).exec();
    return !!session;
  }

  async invalidateToken(token: string): Promise<void> {
    await this.authSessionModel.deleteOne({ token }).exec();
  }

  async logout(token: string): Promise<{ success: boolean; message: string; statusCode: number }> {
    await this.invalidateToken(token);

    return {
      success: true,
      message: 'خروج با موفقیت انجام شد',
      statusCode: 200,
    };
  }

  async logoutFromAllDevices(userId: string): Promise<{ success: boolean; message: string; statusCode: number }> {
    if (!Types.ObjectId.isValid(userId)) {
      return {
        success: false,
        message: 'کاربر نامعتبر است',
        statusCode: 400,
      };
    }

    await this.authSessionModel.deleteMany({ userId: new Types.ObjectId(userId) }).exec();

    return {
      success: true,
      message: 'خروج از همه دستگاه‌ها با موفقیت انجام شد',
      statusCode: 200,
    };
  }

  async terminateSession(userId: string, tokenId: string): Promise<{ success: boolean; message: string; statusCode: number }> {
    if (!Types.ObjectId.isValid(userId)) {
      return {
        success: false,
        message: 'کاربر نامعتبر است',
        statusCode: 400,
      };
    }

    const sessions = await this.authSessionModel.find({ userId: new Types.ObjectId(userId) }).exec();
    const target = sessions.find((s) => s.token.substring(0, 8) === tokenId.substring(0, 8));

    if (!target) {
      return {
        success: false,
        message: 'نشست یافت نشد',
        statusCode: 404,
      };
    }

    await this.authSessionModel.deleteOne({ _id: target._id }).exec();

    return {
      success: true,
      message: 'نشست با موفقیت حذف شد',
      statusCode: 200,
    };
  }

  async getUserActiveSessions(
    userId: string,
    currentToken?: string,
  ): Promise<{
    success: boolean;
    data: Array<{
      issuedAt: string;
      tokenId: string;
      userAgent: string;
      deviceDisplayName: string;
      browser: string;
      os: string;
      device: string;
      isCurrent?: boolean;
    }>;
    statusCode: number;
    totalSessions: number;
  }> {
    if (!Types.ObjectId.isValid(userId)) {
      return {
        success: true,
        data: [],
        statusCode: 200,
        totalSessions: 0,
      };
    }

    const sessions = await this.authSessionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();

    const data = sessions.map((session) => ({
      issuedAt: session.createdAt?.toISOString() || new Date().toISOString(),
      tokenId: session.token.substring(0, 8) + '...',
      userAgent: session.userAgent,
      deviceDisplayName: session.deviceDisplayName,
      browser: 'Unknown',
      os: 'Unknown',
      device: 'Unknown',
      isCurrent: session.token === currentToken,
    }));

    return {
      success: true,
      data,
      statusCode: 200,
      totalSessions: data.length,
    };
  }

  async login(loginDto: LoginDto) {
    const { phoneNumber } = loginDto;

    const otp = this.otpService.generateOtp();
    await this.otpService.storeOtp(phoneNumber, otp);

    try {
      const smsResult = await this.smsService.sendOtp(phoneNumber, otp);
      if (!smsResult.success) {
        throw new BadRequestException('خطا در ارسال کد تایید');
      }
    } catch {
      throw new BadRequestException('خطا در ارسال کد تایید');
    }

    return {
      success: true,
      message: 'کد تایید با موفقیت ارسال شد.',
      statusCode: 200,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto, userAgent?: string) {
    const { phoneNumber, otp } = verifyOtpDto;

    const verificationResult = await this.otpService.verifyOtp(phoneNumber, otp);
    if (!verificationResult.success) {
      throw new BadRequestException(verificationResult.message);
    }

    let user = await this.userService.findByPhoneNumber(phoneNumber);
    if (!user) {
      const defaultRole = await this.roleService.findByName('user');
      user = await this.userService.createUser(phoneNumber, defaultRole?.id);
    }

    const payload = { userId: user.id, phoneNumber: user.phoneNumber };
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'default-secret-key',
      expiresIn: '7d',
    });

    await this.storeSession(token, user.id, userAgent);

    return {
      success: true,
      message: verificationResult.message,
      statusCode: 200,
      data: {
        token,
        registered: !!user.isCompleted,
        nextStep: user.isCompleted ? 'home' : 'registration',
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          isCompleted: !!user.isCompleted,
        },
      },
    };
  }

  async register(userId: string, registerUserDto: RegisterUserDto) {
    const user = await this.userService.completeRegistration(userId, registerUserDto);

    return {
      success: true,
      message: 'ثبت نام با موفقیت انجام شد',
      statusCode: 200,
      data: {
        registered: true,
        nextStep: 'home',
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          isCompleted: user.isCompleted,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
    };
  }
}
