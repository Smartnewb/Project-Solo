import { z } from 'zod';

export const rejectReasonSchema = z.object({
  category: z.string().min(1, '거절 카테고리를 선택해주세요.'),
  reason: z.string().min(1, '거절 사유를 선택하거나 입력해주세요.'),
});

export type RejectReasonFormValues = z.infer<typeof rejectReasonSchema>;
