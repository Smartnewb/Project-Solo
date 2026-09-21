import { z } from 'zod';

export const versionFormSchema = z.object({
  version: z.string().min(1, '버전을 입력해주세요.'),
  description: z.array(z.object({ value: z.string() })).min(1, '설명을 1개 이상 입력해주세요.'),
  shouldUpdate: z.boolean(),
});

export type VersionFormData = z.infer<typeof versionFormSchema>;
