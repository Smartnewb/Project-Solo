'use client';
import { Button, Spinner, Input } from '@heroui/react';
import type { StyleReferenceItem } from '@/app/services/admin';
import { StyleReferenceCard } from './StyleReferenceCard';
interface StyleReferenceGridProps {
    items: StyleReferenceItem[];
    total: number;
    page: number;
    pageSize: number;
    isLoading: boolean;
    loadingId?: string;
    onPageChange: (page: number) => void;
    onDeactivate: (id: string) => void;
    onReactivate: (id: string) => void;
}
export function StyleReferenceGrid({ items, total, page, pageSize, isLoading, loadingId, onPageChange, onDeactivate, onReactivate, }: StyleReferenceGridProps) {
    const totalPages = Math.ceil(total / pageSize);
    if (isLoading) {
        return (<div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 48 }}>
        <Spinner size="sm"></Spinner>
      </div>);
    }
    if (!items?.length) {
        return (<div style={{ textAlign: 'center', paddingBlock: 48 }}>
        <p>등록된 이미지가 없습니다.</p>
      </div>);
    }
    return (<div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (<div key={item.id} className="min-w-0">
            <StyleReferenceCard item={item} onDeactivate={onDeactivate} onReactivate={onReactivate} isLoading={loadingId === item.id}></StyleReferenceCard>
          </div>))}
      </div>

      {totalPages > 1 && (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 16 }}>
          <nav aria-label="페이지 이동" className="flex items-center justify-center gap-3"><Button variant="secondary" isDisabled={page <= 1} onPress={() => ((_, p) => onPageChange(p))({} as never, page - 1)}>이전</Button><Input type="number" aria-label="페이지 번호" min={1} max={totalPages} value={page} onChange={event => onPageChange(Number(event.target.value))} className="w-16 rounded border p-2"></Input><span>/ {totalPages}</span><Button variant="secondary" isDisabled={page >= totalPages} onPress={() => ((_, p) => onPageChange(p))({} as never, page + 1)}>다음</Button></nav>
          <p>
            총 {total}개 · 페이지 {page}/{totalPages}
          </p>
        </div>)}
    </div>);
}
