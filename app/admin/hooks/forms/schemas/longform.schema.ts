import { z } from 'zod';

export const LONGFORM_BODY_SOFT_LIMIT_BYTES = 50 * 1024;

export const longformFormSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요.')
    .max(50, '제목은 최대 50자까지 입력 가능합니다.'),
  subtitle: z
    .string()
    .max(100, '부제목은 최대 100자까지 입력 가능합니다.')
    .optional(),
  description: z
    .string()
    .min(1, '설명을 입력해주세요.')
    .max(100, '설명은 최대 100자까지 입력 가능합니다.'),
  categoryCode: z.string().min(1, '카테고리를 선택해주세요.'),
  hasReward: z.boolean(),
  body: z.string().min(1, '본문을 입력해주세요.'),
  pushTitle: z
    .string()
    .max(50, '푸시 알림 제목은 최대 50자까지 입력 가능합니다.')
    .optional(),
  pushMessage: z
    .string()
    .max(100, '푸시 알림 메시지는 최대 100자까지 입력 가능합니다.')
    .optional(),
});

export type LongformFormData = z.infer<typeof longformFormSchema>;

export function estimateReadTimeMinutes(body: string): number {
  if (!body) return 1;
  return Math.max(1, Math.round(body.length / 500));
}
