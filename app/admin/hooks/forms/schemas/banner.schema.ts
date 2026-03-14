import { z } from 'zod';

export const bannerSchema = z
  .object({
    position: z.enum(['home', 'moment']),
    actionUrl: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true;
          return val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://');
        },
        { message: '/ 로 시작하거나 http(s)://로 시작하는 URL을 입력해주세요.' }
      ),
    isUnlimited: z.boolean(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isUnlimited) return true;
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.startDate) <= new Date(data.endDate);
    },
    { message: '시작일은 종료일보다 이전이어야 합니다.', path: ['endDate'] }
  );

export type BannerFormValues = z.infer<typeof bannerSchema>;
