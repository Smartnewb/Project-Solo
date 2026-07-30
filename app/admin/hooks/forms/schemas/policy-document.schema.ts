import { z } from 'zod';

export const policyDocumentTypeSchema = z.enum([
  'TERMS_OF_SERVICE',
  'PRIVACY_POLICY',
  'DATA_COLLECTION_CONSENT',
  'SENSITIVE_INFO_CONSENT',
  'THIRD_PARTY_PROVISION',
  'MARKETING_CONSENT',
  'REFUND_POLICY',
  'LBS_TERMS',
  'LOCATION_INFO_CONSENT',
  'CHILD_SAFETY_POLICY',
]);

export const policyDocumentSchema = z
  .object({
    documentType: policyDocumentTypeSchema,
    version: z.string().min(1, '버전을 입력해주세요.'),
    diffSummary: z.string().min(1, '신구대조 내용을 입력해주세요.'),
    changeReason: z.string().min(1, '변경사유를 입력해주세요.'),
    contentUrl: z
      .string()
      .optional()
      .refine((v) => !v || /^https?:\/\/.+/.test(v), {
        message: '올바른 URL 형식을 입력해주세요.',
      }),
    noticeStartedAt: z.string().min(1, '공지 시작일을 입력해주세요.'),
    effectiveAt: z.string().min(1, '시행일을 입력해주세요.'),
    noticeVisibleUntil: z.string().optional(),
    isMandatory: z.boolean(),

    // 5축 (개인정보처리방침 / 수집이용동의 / 민감정보동의 / 제3자제공동의)
    axisCollectionItems: z.boolean().optional(),
    axisPurpose: z.boolean().optional(),
    axisRetentionPeriod: z.boolean().optional(),
    axisThirdParty: z.boolean().optional(),
    axisSensitiveInfo: z.boolean().optional(),

    // 불리·중대 변경 (이용약관 / 환불정책)
    adverseOrMaterial: z.boolean().optional(),

    // 마케팅 수신동의 확대 항목
    marketingMediaExpanded: z.boolean().optional(),
    marketingAdTypeExpanded: z.boolean().optional(),
    marketingNightExpanded: z.boolean().optional(),

    // 위치기반서비스 범위 확대
    locationScopeExpanded: z.boolean().optional(),

    // 재동의 예외 처리
    reconsentOverride: z.boolean(),
    reconsentOverrideReason: z.string().optional(),

    // 민감정보 동의 - 개인정보처리방침 §23③ 반영 확인
    privacyPolicyDisclosureConfirmed: z.boolean().optional(),

    // 필수 항목 - 최소수집 원칙 확인
    minimalCollectionConfirmed: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.reconsentOverride && !data.reconsentOverrideReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reconsentOverrideReason'],
        message: '재동의 예외 처리 시 사유를 입력해주세요.',
      });
    }

    if (data.noticeStartedAt && data.effectiveAt) {
      const start = new Date(data.noticeStartedAt);
      const effective = new Date(data.effectiveAt);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(effective.getTime()) && effective < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['effectiveAt'],
          message: '시행일은 공지 시작일 이후여야 합니다.',
        });
      }
    }
  });

export type PolicyDocumentFormValues = z.infer<typeof policyDocumentSchema>;
