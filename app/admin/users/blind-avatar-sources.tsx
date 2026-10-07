"use client";

import { useEffect, useState } from "react";
import { adminGet, getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import { formatDateTimeWithoutTimezoneConversion } from "@/app/utils/formatters";

type BlindAvatarSource = {
  jobId: string;
  slotIndex: number;
  status: string;
  sourceType: "TRANSIENT_UPLOAD" | "PROFILE_IMAGE";
  sourceImageUrl: string | null;
  sourceDeletedAt: string | null;
  generatedImageUrl: string | null;
  failureReason: string | null;
  createdAt: string;
};

function sourcePlaceholder(item: BlindAvatarSource): string {
  if (item.sourceType === "PROFILE_IMAGE") return "기존 프로필 사진으로 생성";
  if (item.sourceDeletedAt) return "원본 삭제됨 (보관 정책 이전)";
  return "원본 없음";
}

// 유저 화면에 절대 노출되지 않는 운영 전용 원본. 서버가 열람할 때마다 admin_action_logs 에 남긴다.
export function BlindAvatarSources({ userId }: { readonly userId: string }) {
  const [items, setItems] = useState<BlindAvatarSource[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (!opened) return;
    let cancelled = false;
    adminGet<{ data: BlindAvatarSource[] }>(`/admin/v2/users/${userId}/blind-avatar-sources`)
      .then((res) => !cancelled && setItems(res.data))
      .catch((e) => !cancelled && setError(getAdminErrorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [opened, userId]);

  return (
    <div className="bg-purple-50 p-4 rounded-lg" data-testid="blind-avatar-sources">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">블라인드 생성 원본</h3>
        {!opened && (
          <button type="button" className="rounded-lg bg-gray-900 px-3 py-1 text-sm text-white" onClick={() => setOpened(true)}>
            원본 보기
          </button>
        )}
      </div>
      <p className="mb-3 text-xs text-gray-500">운영 전용입니다. 열람 기록이 남으며 유저에게는 공개되지 않습니다.</p>
      {opened && error && <p className="text-sm text-red-600">{error}</p>}
      {opened && !error && items === null && <p className="text-sm text-gray-500">불러오는 중…</p>}
      {items?.length === 0 && <p className="text-sm text-gray-500">블라인드 생성 이력이 없습니다.</p>}
      <div className="space-y-4">
        {items?.map((item) => (
          <div key={item.jobId}>
            <p className="mb-1 text-xs text-gray-600">
              슬롯 {item.slotIndex} · {item.status} · {formatDateTimeWithoutTimezoneConversion(item.createdAt)}
              {item.failureReason ? ` · ${item.failureReason}` : ""}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <figure>
                <figcaption className="mb-1 text-xs font-semibold text-gray-700">원본 사진</figcaption>
                <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                  {item.sourceImageUrl
                    ? <a href={item.sourceImageUrl} target="_blank" rel="noreferrer" className="h-full w-full"><img src={item.sourceImageUrl} alt="블라인드 생성 원본" className="h-full w-full object-contain" /></a>
                    : <span className="px-2 text-center text-xs text-gray-500">{sourcePlaceholder(item)}</span>}
                </div>
              </figure>
              <figure>
                <figcaption className="mb-1 text-xs font-semibold text-gray-700">생성 캐릭터</figcaption>
                <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-white">
                  {item.generatedImageUrl
                    ? <img src={item.generatedImageUrl} alt="블라인드 캐릭터" className="h-full w-full object-contain" />
                    : <span className="px-2 text-center text-xs text-gray-500">생성 결과 없음</span>}
                </div>
              </figure>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
