import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthenticatedRequest } from '../interfaces/auth.interface';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { User, UserDocument } from '../../modules/user/schemas/user.schema';
import { Role } from '../../modules/role/schemas/role.schema';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('توکن احراز هویت یافت نشد');
    }

    const storedUserId = await this.redisService.getUserIdByToken(token);
    if (!storedUserId) {
      throw new UnauthorizedException('توکن نامعتبر یا منقضی شده است');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ userId: string }>(token, {
        secret: process.env.JWT_SECRET || 'default-secret-key',
      });

      if (payload.userId !== storedUserId) {
        await this.redisService.deleteToken(token);
        throw new UnauthorizedException('توکن نامعتبر است');
      }

      request.userId = payload.userId;
      request.token = token;
    } catch {
      await this.redisService.deleteToken(token);
      throw new UnauthorizedException('توکن نامعتبر است');
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = await this.checkUserPermissions(request.userId, requiredPermissions);
      if (!hasPermission) {
        throw new ForbiddenException('شما دسترسی لازم برای انجام این عملیات را ندارید');
      }
    }

    return true;
  }

  private extractTokenFromHeader(request: AuthenticatedRequest): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  private async checkUserPermissions(userId: string | undefined, requiredPermissions: string[]): Promise<boolean> {
    if (!userId) {
      return false;
    }

    const user = await this.userModel.findById(userId).populate<{ role: Role }>('role').exec();
    if (!user || !user.role || !Array.isArray(user.role.permissions)) {
      return false;
    }

    return requiredPermissions.every((permission) => user.role.permissions.includes(permission));
  }
}
