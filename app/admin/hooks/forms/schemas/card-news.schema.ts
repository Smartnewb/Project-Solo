import { z } from 'zod';

export const layoutModeSchema = z.enum(['article', 'image_only']);
export type CardNewsLayoutMode = z.infer<typeof layoutModeSchema>;

export function isQuillEmpty(value: string | undefined | null): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  return /^<p>\s*(<br\s*\/?>)?\s*<\/p>$/.test(trimmed);
}

export const cardSectionSchema = z.object({
  order: z.number(),
  title: z.string().max(50, '카드 제목은 최대 50자까지 입력 가능합니다.'),
  content: z.string().max(500, '카드 본문은 최대 500자까지 입력 가능합니다.'),
  imageUrl: z.string().optional(),
});

export const cardNewsFormSchema = z
  .object({
    title: z.string().min(1, '제목을 입력해주세요.').max(50, '제목은 최대 50자까지 입력 가능합니다.'),
    description: z.string().min(1, '설명을 입력해주세요.').max(100, '설명은 최대 100자까지 입력 가능합니다.'),
    categoryCode: z.string().min(1, '카테고리를 선택해주세요.'),
    layoutMode: layoutModeSchema,
    hasReward: z.boolean(),
    pushTitle: z.string().max(50, '푸시 알림 제목은 최대 50자까지 입력 가능합니다.').optional(),
    pushMessage: z.string().max(100, '푸시 알림 메시지는 최대 100자까지 입력 가능합니다.').optional(),
    sections: z.array(cardSectionSchema).min(1, '최소 1개의 카드가 필요합니다.'),
  })
  .superRefine((data, ctx) => {
    if (data.layoutMode === 'article') {
      data.sections.forEach((section, idx) => {
        if (!section.title || section.title.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['sections', idx, 'title'],
            message: '카드 제목을 입력해주세요.',
          });
        }
        if (isQuillEmpty(section.content)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['sections', idx, 'content'],
            message: '카드 본문을 입력해주세요.',
          });
        }
      });
    } else if (data.layoutMode === 'image_only') {
      data.sections.forEach((section, idx) => {
        if (!section.imageUrl) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['sections', idx, 'imageUrl'],
            message: '이미지 전용 모드에서는 섹션 이미지가 필수입니다.',
          });
        }
      });
    }
  });

export type CardNewsFormData = z.infer<typeof cardNewsFormSchema>;
export type CardSectionData = z.infer<typeof cardSectionSchema>;
