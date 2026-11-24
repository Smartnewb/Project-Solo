import {
  ALIGO_UNIT_COST_KRW,
  euckrByteLength,
  estimateAligoCostKrw,
  isSmsTruncationRisk,
  resolveEffectiveSmsBillingType,
  SMS_BYTE_LIMIT,
  SMS_SAFE_BODY_BYTE_LIMIT,
  WEB_SENDER_PREFIX_BYTES,
} from './euckr-byte-length';

describe('euckr-byte-length', () => {
  it('counts ASCII as 1 byte and Korean/non-ASCII as 2 bytes', () => {
    expect(euckrByteLength('')).toBe(0);
    expect(euckrByteLength('hello123!')).toBe(9);
    expect(euckrByteLength('썸타임')).toBe(6);
    expect(euckrByteLength('[썸타임] 안내 abc')).toBe(17);
  });

  it('detects 81~90B [Web발신] truncation risk and 90B LMS limit', () => {
    const exact80 = 'a'.repeat(SMS_SAFE_BODY_BYTE_LIMIT);
    const risk81 = 'a'.repeat(SMS_SAFE_BODY_BYTE_LIMIT + 1);
    const exact90 = 'a'.repeat(SMS_BYTE_LIMIT);
    const over90 = 'a'.repeat(SMS_BYTE_LIMIT + 1);
    const korean45 = '가'.repeat(45);
    const korean46 = '가'.repeat(46);

    expect(WEB_SENDER_PREFIX_BYTES).toBe(10);
    expect(SMS_SAFE_BODY_BYTE_LIMIT).toBe(80);
    expect(isSmsTruncationRisk(euckrByteLength(exact80))).toBe(false);
    expect(isSmsTruncationRisk(euckrByteLength(risk81))).toBe(true);
    expect(isSmsTruncationRisk(euckrByteLength(exact90))).toBe(true);
    expect(isSmsTruncationRisk(euckrByteLength(over90))).toBe(false);

    expect(euckrByteLength(exact90)).toBe(90);
    expect(euckrByteLength(over90)).toBe(91);
    expect(euckrByteLength(korean45)).toBe(90);
    expect(euckrByteLength(korean46)).toBe(92);

    expect(resolveEffectiveSmsBillingType('SMS', euckrByteLength(exact90))).toBe('SMS');
    expect(resolveEffectiveSmsBillingType('SMS', euckrByteLength(over90))).toBe('LMS');
    expect(resolveEffectiveSmsBillingType('SMS', euckrByteLength(korean45))).toBe('SMS');
    expect(resolveEffectiveSmsBillingType('SMS', euckrByteLength(korean46))).toBe('LMS');
    expect(resolveEffectiveSmsBillingType('LMS', 10)).toBe('LMS');
  });

  it('estimates Aligo cost in KRW using 8.4/25.9 unit prices', () => {
    expect(ALIGO_UNIT_COST_KRW).toEqual({ SMS: 8.4, LMS: 25.9 });
    expect(estimateAligoCostKrw(0, 'SMS')).toBe(0);
    expect(estimateAligoCostKrw(-5, 'LMS')).toBe(0);
    expect(estimateAligoCostKrw(100, 'SMS')).toBe(840);
    expect(estimateAligoCostKrw(100, 'LMS')).toBe(2590);
    expect(estimateAligoCostKrw(925, 'LMS')).toBe(23958);
  });
});
