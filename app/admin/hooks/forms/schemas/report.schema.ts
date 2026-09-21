import { z } from 'zod';

const reportStatusValues = ['pending', 'reviewing', 'resolved', 'rejected'] as const;
const reportActionValues = ['dismissed', 'warned', 'suspended', 'banned', 'escalated'] as const;

export const reportStatusSchema = z.object({
  status: z.enum(reportStatusValues, {
    errorMap: () => ({ message: '상태를 선택해주세요.' }),
  }),
  action: z.enum(reportActionValues, {
    errorMap: () => ({ message: '처리 액션을 선택해주세요.' }),
  }),
});

export type ReportStatusFormValues = z.infer<typeof reportStatusSchema>;
