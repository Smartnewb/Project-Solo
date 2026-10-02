import { formatDateTimeWithoutTimezoneConversion } from '@/app/utils/formatters';

describe('formatDateTimeWithoutTimezoneConversion', () => {
  it('ISO(T 구분)와 Postgres(공백 구분) 문자열을 같은 형태로 보여준다', () => {
    expect(formatDateTimeWithoutTimezoneConversion('2026-09-21T19:20:47.199Z')).toBe('2026-09-21 19:20');
    expect(formatDateTimeWithoutTimezoneConversion('2026-09-21 19:20:47.199786+09')).toBe('2026-09-21 19:20');
  });
});
