import { z } from 'zod';

export const resetPasswordSearchSchema = z.object({
  searchQuery: z.string().min(1, '검색어를 입력해주세요.'),
});

export type ResetPasswordSearchValues = z.infer<typeof resetPasswordSearchSchema>;
