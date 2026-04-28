import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.client = new Redis(redisUrl);
    } else {
      const port = Number.parseInt(process.env.REDIS_PORT || '6379', 10);
      const db = Number.parseInt(process.env.REDIS_DB || '0', 10);

      this.client = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port,
        db,
        password: process.env.REDIS_PASSWORD || undefined,
      });
    }
  }

  async onModuleInit(): Promise<void> {
    this.client.on('error', (error) => {
      this.logger.error('Redis connection error', error instanceof Error ? error.stack : String(error));
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async setToken(token: string, userId: string, ttlSeconds: number): Promise<void> {
    await this.client.set(this.getTokenKey(token), userId, 'EX', ttlSeconds);
  }

  async getUserIdByToken(token: string): Promise<string | null> {
    return this.client.get(this.getTokenKey(token));
  }

  async deleteToken(token: string): Promise<void> {
    await this.client.del(this.getTokenKey(token));
  }

  async setOtp(phoneNumber: string, otp: string, ttlSeconds: number): Promise<void> {
    await this.client.set(this.getOtpKey(phoneNumber), otp, 'EX', ttlSeconds);
  }

  async getOtp(phoneNumber: string): Promise<string | null> {
    return this.client.get(this.getOtpKey(phoneNumber));
  }

  async deleteOtp(phoneNumber: string): Promise<void> {
    await this.client.del(this.getOtpKey(phoneNumber));
  }

  async otpExists(phoneNumber: string): Promise<boolean> {
    const exists = await this.client.exists(this.getOtpKey(phoneNumber));
    return exists === 1;
  }

  async getOtpTtl(phoneNumber: string): Promise<number> {
    const ttl = await this.client.ttl(this.getOtpKey(phoneNumber));
    return ttl > 0 ? ttl : -1;
  }

  private getTokenKey(token: string): string {
    return `auth:token:${token}`;
  }

  private getOtpKey(phoneNumber: string): string {
    return `auth:otp:${phoneNumber}`;
  }
}
