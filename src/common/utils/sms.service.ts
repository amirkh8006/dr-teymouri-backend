import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SendSmsResponse {
  success: boolean;
  message?: string;
  error?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.kavenegar.com/v1';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('KAVENEGAR_API_KEY');
    if (!apiKey) {
      throw new Error('Kavenegar API key is not configured');
    }
    this.apiKey = apiKey;
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<SendSmsResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('Kavenegar API key is not configured');
      }

      const url = `${this.baseUrl}/${this.apiKey}/verify/lookup.json`;

      const response = await axios.get(url, {
        params: {
          receptor: phoneNumber,
          token: otp,
          template: 'VerifyTokens',
        },
      });

      if (response.data.return.status === 200) {
        return {
          success: true,
          message: 'SMS sent successfully',
        };
      } else {
        return {
          success: false,
          error: response.data.return.message || 'Failed to send SMS',
        };
      }
    } catch (error) {
      this.logger.error('Error sending SMS:', error.response || error.message);
      return {
        success: false,
        error: error.response?.data?.return?.message || error.message || 'Unknown error occurred',
      };
    }
  }

  async sendCustomMessage(phoneNumber: string, message: string): Promise<SendSmsResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('Kavenegar API key is not configured');
      }

      const url = `${this.baseUrl}/${this.apiKey}/sms/send.json`;

      const response = await axios.get(url, {
        params: {
          receptor: phoneNumber,
          message: message,
        },
      });

      if (response.data.return.status === 200) {
        return {
          success: true,
          message: 'SMS sent successfully',
        };
      } else {
        return {
          success: false,
          error: response.data.return.message || 'Failed to send SMS',
        };
      }
    } catch (error) {
      this.logger.error('Error sending SMS:', error);
      return {
        success: false,
        error: error.response?.data?.return?.message || error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Send alert notification via SMS
   * @param phoneNumber - Recipient phone number
   * @param alertData - Alert data containing message and metadata
   * @returns SendSmsResponse
   */
  async sendAlertSMS(phoneNumber: string, alertData: any): Promise<SendSmsResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('Kavenegar API key is not configured');
      }

      // Extract message from alert data
      const alertMessage = alertData.data?.message || 'هشدار جدید دریافت شد';

      // Format the message based on alert type and severity
      let formattedMessage = `🚨 هشدار: ${alertMessage}`;

      // Add additional context if available
      if (alertData.severity === 'CRITICAL') {
        formattedMessage = `🔴 ${formattedMessage}`;
      } else if (alertData.severity === 'WARNING') {
        formattedMessage = `⚠️ ${formattedMessage}`;
      }

      const url = `${this.baseUrl}/${this.apiKey}/sms/send.json`;

      const response = await axios.get(url, {
        params: {
          receptor: phoneNumber,
          message: formattedMessage,
        },
      });

      if (response.data.return.status === 200) {
        this.logger.log(`Alert SMS sent successfully to ${phoneNumber}`);
        return {
          success: true,
          message: 'Alert SMS sent successfully',
        };
      } else {
        this.logger.warn(`Failed to send alert SMS to ${phoneNumber}: ${response.data.return.message}`);
        return {
          success: false,
          error: response.data.return.message || 'Failed to send alert SMS',
        };
      }
    } catch (error) {
      this.logger.error(`Error sending alert SMS to ${phoneNumber}:`, error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.return?.message || error.message || 'Unknown error occurred',
      };
    }
  }
}
