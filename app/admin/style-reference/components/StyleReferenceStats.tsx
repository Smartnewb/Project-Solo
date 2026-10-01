'use client';
import { Spinner } from '@heroui/react';
import { useStyleReferenceStats } from '@/app/admin/hooks';
import { CATEGORY_LABELS, GENDER_LABELS } from '../constants';
export function StyleReferenceStats() {
    const { data, isLoading } = useStyleReferenceStats();
    const total = data?.stats?.reduce((acc, s) => acc + s.count, 0) ?? 0;
    const active = data?.stats?.reduce((acc, s) => acc + s.activeCount, 0) ?? 0;
    const inactive = total - active;
    const summaryCards = [
        { label: '전체', value: total, color: '#111827' },
        { label: '활성', value: active, color: '#059669' },
        { label: '비활성', value: inactive, color: '#dc2626' },
    ];
    if (isLoading) {
        return (<div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 16 }}>
        <Spinner size="sm"></Spinner>
      </div>);
    }
    return (<div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
      {summaryCards.map(({ label, value, color }) => (<div key={label} style={{ minWidth: 100 }} className="rounded-xl border p-4">
          <div style={{ paddingBlock: 12, paddingInline: 16 }} className="p-4">
            <h1 className="text-2xl font-bold">
              {value}
            </h1>
            <p>
              {label}
            </p>
          </div>
        </div>))}
      {data?.stats?.map((s) => (<div key={`${s.gender}-${s.category}`} style={{ minWidth: 120 }} className="rounded-xl border p-4">
          <div style={{ paddingBlock: 12, paddingInline: 16 }} className="p-4">
            <h2 className="text-lg font-semibold">
              {s.activeCount}
              <p>
                /{s.count}
              </p>
            </h2>
            <p>
              {GENDER_LABELS[s.gender]} · {CATEGORY_LABELS[s.category]}
            </p>
          </div>
        </div>))}
    </div>);
}
