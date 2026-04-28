export enum VisitType {
  CONSULTATION = 'مشاوره',
  EXAMINATION = 'معاینه',
  FOLLOW_UP = 'پیگیری',
  SURGERY = 'عمل جراحی',
}

export const VisitTypeLabels: Record<VisitType, string> = {
  [VisitType.CONSULTATION]: 'مشاوره',
  [VisitType.EXAMINATION]: 'معاینه',
  [VisitType.FOLLOW_UP]: 'پیگیری',
  [VisitType.SURGERY]: 'عمل جراحی',
};
