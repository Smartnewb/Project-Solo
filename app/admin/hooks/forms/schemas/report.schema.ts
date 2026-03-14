import { z } from 'zod';

const reportStatusValues = ['pending', 'reviewing', 'resolved', 'rejected'] as const;

export const reportStatusSchema = z.object({
  status: z.enum(reportStatusValues, {
    errorMap: () => ({ message: '상태를 선택해주세요.' }),
  }),
});

export type ReportStatusFormValues = z.infer<typeof reportStatusSchema>;
