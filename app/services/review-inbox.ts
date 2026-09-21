import type { ReviewInboxResponse } from '@/app/admin/review-inbox/types';

async function parseJsonBody<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function getReviewInbox(): Promise<ReviewInboxResponse> {
  const response = await fetch('/api/admin/review-inbox', {
    method: 'GET',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const body = await parseJsonBody<{ error?: string }>(response).catch(() => null);
    throw new Error(body?.error || 'AI 검토 인박스를 불러오지 못했습니다.');
  }

  return parseJsonBody<ReviewInboxResponse>(response);
}
