'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ProfileImageAuditItem } from '@/app/services/admin';

export function BlindPhotoComparison({ item }: { readonly item: ProfileImageAuditItem }) {
  return <ComparisonImages key={`${item.originalImageUrl}:${item.blindImageUrl}`} item={item} />;
}

function ComparisonImages({ item }: { readonly item: ProfileImageAuditItem }) {
  const [originalFailed, setOriginalFailed] = useState(false);
  const [blindFailed, setBlindFailed] = useState(false);
  const original = item.originalImageUrl;
  const blind = item.blindImageUrl;
  const originalStatus = item.originalImageStatus ?? 'UNAVAILABLE';
  const originalPlaceholder = originalStatus === 'STATIC_PRESET'
    ? '기본 캐릭터 · 원본 사진 없음'
    : originalStatus === 'TRANSIENT_DELETED'
      ? '생성용 원본 삭제됨'
      : '원본 연결 없음';

  return (
    <div data-testid="blind-photo-comparison" className="grid min-w-0 grid-cols-2 gap-2">
      <figure className="min-w-0">
        <figcaption className="mb-1 text-xs font-semibold text-gray-700">원본 사진</figcaption>
        <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-gray-100">
          {original && !originalFailed
            ? <Image src={original} alt={`${item.profileImageId} 원본 사진`} width={480} height={640} unoptimized onError={() => setOriginalFailed(true)} className="h-full w-full object-contain" />
            : <span className="px-2 text-center text-xs text-gray-500" data-original-image-status={originalFailed ? 'LOAD_FAILED' : originalStatus}>{originalFailed ? '원본 로드 실패' : originalPlaceholder}</span>}
        </div>
      </figure>
      <figure className="min-w-0">
        <figcaption className="mb-1 text-xs font-semibold text-gray-700">블라인드 캐릭터</figcaption>
        <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-purple-50">
          {blind && !blindFailed
            ? <Image src={blind} alt={`${item.profileImageId} 블라인드 캐릭터`} width={480} height={640} unoptimized onError={() => setBlindFailed(true)} className="h-full w-full object-contain" />
            : <span className="px-2 text-center text-xs text-gray-500">{blindFailed ? '캐릭터 로드 실패' : '연결된 캐릭터 없음'}</span>}
        </div>
      </figure>
    </div>
  );
}
