import {
  longformFormSchema,
  estimateReadTimeMinutes,
} from '@/app/admin/hooks/forms/schemas/longform.schema';

describe('longformFormSchema', () => {
  const validPayload = {
    title: '롱폼 제목',
    description: '설명',
    categoryCode: 'essay',
    hasReward: false,
    body: '본문 내용',
  };

  it('accepts a minimal valid payload', () => {
    const result = longformFormSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects an empty title', () => {
    const result = longformFormSchema.safeParse({ ...validPayload, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a title over 50 characters', () => {
    const result = longformFormSchema.safeParse({
      ...validPayload,
      title: 'a'.repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty description', () => {
    const result = longformFormSchema.safeParse({ ...validPayload, description: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty body', () => {
    const result = longformFormSchema.safeParse({ ...validPayload, body: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty categoryCode', () => {
    const result = longformFormSchema.safeParse({ ...validPayload, categoryCode: '' });
    expect(result.success).toBe(false);
  });

  it('accepts optional subtitle and push fields', () => {
    const result = longformFormSchema.safeParse({
      ...validPayload,
      subtitle: '부제목',
      pushTitle: '푸시 제목',
      pushMessage: '푸시 메시지',
    });
    expect(result.success).toBe(true);
  });
});

describe('estimateReadTimeMinutes', () => {
  it('returns 1 for an empty string', () => {
    expect(estimateReadTimeMinutes('')).toBe(1);
  });

  it('returns 1 for ~500 characters', () => {
    expect(estimateReadTimeMinutes('a'.repeat(500))).toBe(1);
  });

  it('returns 4 for ~2000 characters', () => {
    expect(estimateReadTimeMinutes('a'.repeat(2000))).toBe(4);
  });

  it('returns 10 for ~5000 characters', () => {
    expect(estimateReadTimeMinutes('a'.repeat(5000))).toBe(10);
  });
});
