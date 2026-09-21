import { z } from 'zod';

export const smsMessageSchema = z.object({
  message: z.string().min(1, '메세지를 입력해주세요.').max(2400, 'SMS 메세지는 최대 2400자까지 입력 가능합니다.'),
});

export const smsTemplateSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(50, '템플릿 제목은 최대 50자까지 입력 가능합니다.'),
  content: z.string().min(1, '내용을 입력해주세요.').max(2400, 'SMS 메세지는 최대 2400자까지 입력 가능합니다.'),
});

export type SmsMessageFormData = z.infer<typeof smsMessageSchema>;
export type SmsTemplateFormData = z.infer<typeof smsTemplateSchema>;
