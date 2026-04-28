export enum AppointmentStatus {
  PENDING = 'pending', // در انتظار تایید
  CONFIRMED = 'confirmed', // تایید شده
  COMPLETED = 'completed', // انجام شده
  CANCELLED = 'cancelled', // لغو شده
  NO_SHOW = 'no_show', // حاضر نشد
}

export const AppointmentStatusLabels: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'در انتظار تایید',
  [AppointmentStatus.CONFIRMED]: 'تایید شده',
  [AppointmentStatus.COMPLETED]: 'انجام شده',
  [AppointmentStatus.CANCELLED]: 'لغو شده',
  [AppointmentStatus.NO_SHOW]: 'حاضر نشد',
};
