import { Injectable } from '@nestjs/common';
import * as jalaali from 'jalaali-js';

/**
 * Persian (Jalali) Calendar Utilities
 * Converts between Gregorian and Persian calendar dates using jalaali-js library
 */
@Injectable()
export class PersianCalendarService {
  private readonly PERSIAN_MONTH_NAMES = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند',
  ];

  private readonly DAYS_OF_WEEK = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

  /**
   * Convert Gregorian date to Persian date
   */
  gregorianToPersian(date: Date): { year: number; month: number; day: number } {
    const result = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return { year: result.jy, month: result.jm, day: result.jd };
  }

  /**
   * Convert Persian date to Gregorian date
   */
  persianToGregorian(jy: number, jm: number, jd: number): Date {
    const result = jalaali.toGregorian(jy, jm, jd);
    return new Date(result.gy, result.gm - 1, result.gd);
  }

  /**
   * Get Persian date string (formatted)
   */
  getPersianDateString(date: Date): string {
    const pd = this.gregorianToPersian(date);
    const monthName = this.PERSIAN_MONTH_NAMES[pd.month - 1];
    return `${pd.day} ${monthName} ${pd.year}`;
  }

  /**
   * Get day of week name in Persian
   */
  getPersianDayName(date: Date): string {
    return this.DAYS_OF_WEEK[date.getDay()];
  }

  /**
   * Get next N days with Persian calendar info
   */
  getNextDaysWithPersianCalendar(days: number = 10): Array<{
    date: Date;
    persianDate: string;
    dayName: string;
    dayOfWeek: number;
    gregorianDay: number;
    gregorianMonth: number;
    gregorianYear: number;
  }> {
    const result: any[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);

      result.push({
        date,
        persianDate: this.getPersianDateString(date),
        dayName: this.getPersianDayName(date),
        dayOfWeek: date.getDay(),
        gregorianDay: date.getDate(),
        gregorianMonth: date.getMonth() + 1,
        gregorianYear: date.getFullYear(),
      });
    }

    return result;
  }

  /**
   * Check if date is today
   */
  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Check if date is in the past
   */
  isPast(date: Date): boolean {
    return date < new Date();
  }
}
