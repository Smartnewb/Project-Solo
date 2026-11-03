import type { CreateCardNewsRequest } from '@/types/admin';

type Background = NonNullable<CreateCardNewsRequest['backgroundImage']>;

/** HTML 공지 배너: 선택된 값이 완전할 때만 보낸다. 비어 있으면 생략해 서버의 기존 배너를 유지한다. */
export function noticeBackground(
    type: 'PRESET' | 'CUSTOM',
    presetId: string,
    customUrl: string,
): Background | undefined {
    if (type === 'PRESET') return presetId ? { type, presetId } : undefined;
    return customUrl ? { type, customUrl } : undefined;
}
