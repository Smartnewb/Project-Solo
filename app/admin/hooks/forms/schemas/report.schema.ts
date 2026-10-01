import { z } from 'zod';

const reportStatusValues = ['pending', 'reviewing', 'resolved', 'rejected'] as const;
const reportActionValues = ['dismissed', 'warned', 'suspended', 'banned', 'escalated'] as const;

export const reportStatusSchema = z
  .object({
    status: z.enum(reportStatusValues, {
      errorMap: () => ({ message: '상태를 선택해주세요.' }),
    }),
    action: z.enum(reportActionValues, {
      errorMap: () => ({ message: '처리 액션을 선택해주세요.' }),
    }),
    // suspended: 기간 정지가 기본. 영구 정지는 명시 선택에만.
    suspendDays: z.coerce.number().optional(),
    suspendPermanent: z.boolean().optional(),
    // banned: 영구 차단은 2인 승인 필수 — 집행자와 다른 관리자의 user id.
    approverId: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === 'banned' && !value.approverId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['approverId'],
        message: '영구 차단은 2인 승인이 필요합니다. 다른 관리자의 ID를 입력하세요.',
      });
    }
  });

export type ReportStatusFormValues = z.infer<typeof reportStatusSchema>;
