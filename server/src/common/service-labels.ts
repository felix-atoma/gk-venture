import { ServiceType } from '@prisma/client';

export const SERVICE_LABELS: Record<ServiceType, string> = {
  LEGAL_DOCUMENTS: 'All Kinds of Legal Documents',
  TRANSLATION_INTERPRETATION: 'Legal Translation / Interpretation',
  MATRIMONIAL_CIVIL: 'Matrimonial and Civil Issues',
  CONSULTATION: 'Consultation',
  OTHER: 'Other',
};
