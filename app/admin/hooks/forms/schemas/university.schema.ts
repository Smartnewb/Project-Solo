import { z } from 'zod';

export const universitySchema = z.object({
  name: z.string().min(1, '대학명을 입력해주세요.'),
  region: z.string().min(1, '지역을 선택해주세요.'),
  code: z.string().optional(),
  en: z.string().optional(),
  type: z.string().min(1, '대학 유형을 선택해주세요.'),
  foundation: z.string().optional(),
  isActive: z.boolean(),
});

export type UniversityFormValues = z.infer<typeof universitySchema>;
