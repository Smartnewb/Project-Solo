import { z } from 'zod';

export const pushNotificationFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  message: z.string().min(1, '메시지를 입력해주세요.'),
});

export type PushNotificationFormData = z.infer<typeof pushNotificationFormSchema>;
