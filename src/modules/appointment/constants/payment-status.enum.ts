export enum PaymentStatus {
  PENDING = 'pending', // در انتظار پرداخت
  PAID = 'paid', // پرداخت شده
}

export const PaymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'در انتظار پرداخت',
  [PaymentStatus.PAID]: 'پرداخت شده',
};
