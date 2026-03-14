import { z } from 'zod';

export const gemsFormSchema = z.object({
  gemAmount: z.number().int().min(1, '구슬 개수는 1개 이상이어야 합니다.'),
  message: z.string().min(1, '지급 사유 메시지를 입력해주세요.').max(200, '메시지는 200자 이하로 입력해주세요.'),
});

export type GemsFormData = z.infer<typeof gemsFormSchema>;
