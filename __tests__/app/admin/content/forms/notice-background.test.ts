import { noticeBackground } from '@/app/admin/content/components/forms/notice-background';

it('sends a complete preset or custom banner', () => {
  expect(noticeBackground('PRESET', 'p1', '')).toEqual({ type: 'PRESET', presetId: 'p1' });
  expect(noticeBackground('CUSTOM', '', 'https://img.example.com/b.png')).toEqual({
    type: 'CUSTOM',
    customUrl: 'https://img.example.com/b.png',
  });
});

it('omits an incomplete banner so the server keeps the saved one', () => {
  expect(noticeBackground('PRESET', '', 'https://img.example.com/b.png')).toBeUndefined();
  expect(noticeBackground('CUSTOM', 'p1', '')).toBeUndefined();
});
