/** SMS 단문 EUC-KR 최대 바이트 한도 (초과 시 LMS 전환 대상). */
export const SMS_BYTE_LIMIT = 90;

/** 통신사가 본문 앞에 강제로 붙이는 `[Web발신]\n` 길이(바이트). */
export const WEB_SENDER_PREFIX_BYTES = 10;

/** `[Web발신]\n` 10바이트를 합산해도 90바이트를 넘지 않는 순수 본문 안전 한도. */
export const SMS_SAFE_BODY_BYTE_LIMIT = SMS_BYTE_LIMIT - WEB_SENDER_PREFIX_BYTES;

/** 알리고(Aligo) 공급가 기준 건당 단가 (원, VAT 별도). */
export const ALIGO_UNIT_COST_KRW = {
  SMS: 8.4,
  LMS: 25.9,
} as const;

export type SmsBillingType = keyof typeof ALIGO_UNIT_COST_KRW;

/** 한글 등 비ASCII 2바이트, ASCII 1바이트 기준으로 EUC-KR 근사 길이를 계산한다. */
export function euckrByteLength(text: string): number {
  let bytes = 0;
  for (const ch of text) {
    bytes += (ch.codePointAt(0) ?? 0) > 127 ? 2 : 1;
  }
  return bytes;
}

/** 본문이 81~90바이트 구간이라 `[Web발신]` 10바이트 포함 시 SMS 잘림 위험이 있는지 판별한다. */
export function isSmsTruncationRisk(byteLength: number): boolean {
  return byteLength > SMS_SAFE_BODY_BYTE_LIMIT && byteLength <= SMS_BYTE_LIMIT;
}

/** 선택된 발송 유형과 바이트 길이를 바탕으로 알리고 실제 과금 유형을 판정한다. */
export function resolveEffectiveSmsBillingType(
  selectedType: SmsBillingType,
  byteLength: number,
): SmsBillingType {
  if (selectedType === 'LMS' || byteLength > SMS_BYTE_LIMIT) {
    return 'LMS';
  }
  return 'SMS';
}

/** 수신 가능 인원 수와 과금 유형으로 알리고 예상 비용(원, VAT 별도)을 계산한다. */
export function estimateAligoCostKrw(
  recipientCount: number,
  billingType: SmsBillingType,
): number {
  if (recipientCount <= 0) return 0;
  return Math.round(recipientCount * ALIGO_UNIT_COST_KRW[billingType]);
}
