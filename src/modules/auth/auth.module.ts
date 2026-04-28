import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SmsService } from '../../common/utils/sms.service';
import { OtpService } from '../../common/utils/otp.service';
import { UserModule } from '../user/user.module';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleModule } from '../role/role.module';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Role, RoleSchema } from '../role/schemas/role.schema';
import { RedisModule } from '../../infrastructure/redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    RedisModule,
    UserModule,
    forwardRef(() => RoleModule),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'default-secret-key',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SmsService, OtpService, AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
