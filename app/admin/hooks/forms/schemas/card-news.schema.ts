import { z } from 'zod';

export const cardSectionSchema = z.object({
  order: z.number(),
  title: z.string().min(1, '카드 제목을 입력해주세요.').max(50, '카드 제목은 최대 50자까지 입력 가능합니다.'),
  content: z.string().min(1, '카드 본문을 입력해주세요.').max(500, '카드 본문은 최대 500자까지 입력 가능합니다.'),
  imageUrl: z.string().optional(),
});

export const cardNewsFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(50, '제목은 최대 50자까지 입력 가능합니다.'),
  description: z.string().min(1, '설명을 입력해주세요.').max(100, '설명은 최대 100자까지 입력 가능합니다.'),
  categoryCode: z.string().min(1, '카테고리를 선택해주세요.'),
  hasReward: z.boolean(),
  pushTitle: z.string().max(50, '푸시 알림 제목은 최대 50자까지 입력 가능합니다.').optional(),
  pushMessage: z.string().max(100, '푸시 알림 메시지는 최대 100자까지 입력 가능합니다.').optional(),
  sections: z.array(cardSectionSchema).min(1, '최소 1개의 카드가 필요합니다.'),
});

export type CardNewsFormData = z.infer<typeof cardNewsFormSchema>;
export type CardSectionData = z.infer<typeof cardSectionSchema>;
