'use client';
import { Chip } from '@heroui/react';
import { ChevronDown as ExpandMoreIcon } from 'lucide-react';
import type { ExcludedUser, ExclusionReason } from '@/app/services/sms';
const REASON_LABELS: Record<ExclusionReason, string> = {
    NO_CONSENT: '마케팅 수신 미동의',
    NO_PHONE: '휴대폰 미등록',
    BOTH: '동의/휴대폰 모두 누락',
};
export function ExcludedUsersCard({ excluded }: {
    excluded: ExcludedUser[];
}) {
    if (!excluded.length)
        return null;
    const counts = excluded.reduce<Record<ExclusionReason, number>>((acc, u) => {
        acc[u.reason] = (acc[u.reason] ?? 0) + 1;
        return acc;
    }, {} as Record<ExclusionReason, number>);
    return (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
      <p>발송 제외 {excluded.length}명</p>
      <div style={{ display: 'flex', gap: 8, marginBlock: 8, flexWrap: 'wrap' }}>
        {Object.entries(counts).map(([reason, count]) => (<Chip key={reason} size="sm">{`${REASON_LABELS[reason as ExclusionReason]} ${count}`}</Chip>))}
      </div>
      <details>
        <summary>제외 유저 상세</summary>
        <div>
          {excluded.map((u) => (<p key={u.userId} style={{ paddingBlock: 4 }}>
              {u.name ?? '(이름 없음)'} · {u.phoneNumber ?? '(번호 없음)'} — {REASON_LABELS[u.reason]}
            </p>))}
        </div>
      </details>
    </aside>);
}
