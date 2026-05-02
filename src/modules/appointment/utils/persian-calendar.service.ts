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
  private readonly WEEKDAY_INDEX_BY_ABBR: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  /**
   * Convert Gregorian date to Persian date
   */
  gregorianToPersian(date: Date): { year: number; month: number; day: number } {
    const { year, month, day } = this.getTehranGregorianParts(date);
    const result = jalaali.toJalaali(year, month, day);
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
    const persianWeekdayIndex = this.getPersianWeekdayIndex(date);
    return this.DAYS_OF_WEEK[persianWeekdayIndex];
  }

  getPersianWeekdayIndex(date: Date): number {
    const { weekdayIndex } = this.getTehranGregorianParts(date);
    return this.toPersianWeekdayIndex(weekdayIndex);
  }

  getTehranDateIso(date: Date): string {
    const { year, month, day } = this.getTehranGregorianParts(date);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
    const todayParts = this.getTehranGregorianParts(now);
    const todayUtc = new Date(Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day, 0, 0, 0, 0));

    for (let i = 0; i < days; i++) {
      const utcDay = new Date(todayUtc);
      utcDay.setUTCDate(utcDay.getUTCDate() + i);

      const year = utcDay.getUTCFullYear();
      const month = utcDay.getUTCMonth() + 1;
      const day = utcDay.getUTCDate();
      const date = this.getTehranMidnightUtc(year, month, day);

      const gregorianParts = this.getTehranGregorianParts(date);
      const persianWeekdayIndex = this.toPersianWeekdayIndex(gregorianParts.weekdayIndex);

      result.push({
        date,
        persianDate: this.getPersianDateString(date),
        dayName: this.getPersianDayName(date),
        dayOfWeek: persianWeekdayIndex,
        gregorianDay: gregorianParts.day,
        gregorianMonth: gregorianParts.month,
        gregorianYear: gregorianParts.year,
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

  private toPersianWeekdayIndex(gregorianWeekdayIndex: number): number {
    return (gregorianWeekdayIndex + 1) % 7;
  }

  private getTehranMidnightUtc(year: number, month: number, day: number): Date {
    const utcNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
    const offsetMinutes = this.getTimeZoneOffsetMinutes('Asia/Tehran', utcNoon);
    const utcMidnight = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
    return new Date(utcMidnight - offsetMinutes * 60 * 1000);
  }

  private getTimeZoneOffsetMinutes(timeZone: string, date: Date): number {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const parts = formatter.formatToParts(date);
    let year = 0;
    let month = 0;
    let day = 0;
    let hour = 0;
    let minute = 0;
    let second = 0;

    for (const part of parts) {
      if (part.type === 'year') year = Number.parseInt(part.value, 10);
      if (part.type === 'month') month = Number.parseInt(part.value, 10);
      if (part.type === 'day') day = Number.parseInt(part.value, 10);
      if (part.type === 'hour') hour = Number.parseInt(part.value, 10);
      if (part.type === 'minute') minute = Number.parseInt(part.value, 10);
      if (part.type === 'second') second = Number.parseInt(part.value, 10);
    }

    const asUTC = Date.UTC(year, month - 1, day, hour, minute, second);
    return (asUTC - date.getTime()) / 60000;
  }

  private getTehranGregorianParts(date: Date): { year: number; month: number; day: number; weekdayIndex: number } {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tehran',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    }).formatToParts(date);

    let year = 0;
    let month = 0;
    let day = 0;
    let weekdayIndex = 0;

    for (const part of parts) {
      if (part.type === 'year') year = Number.parseInt(part.value, 10);
      if (part.type === 'month') month = Number.parseInt(part.value, 10);
      if (part.type === 'day') day = Number.parseInt(part.value, 10);
      if (part.type === 'weekday') {
        weekdayIndex = this.WEEKDAY_INDEX_BY_ABBR[part.value] ?? 0;
      }
    }

    return { year, month, day, weekdayIndex };
  }
}
