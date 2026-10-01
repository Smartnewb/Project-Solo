"use client";
import { Skeleton } from '@heroui/react';
interface CareStatsProps { pending: number; cared: number; dismissed: number; loading: boolean }
export default function CareStats({pending, cared, dismissed, loading}: CareStatsProps) {
  return <section aria-label="현재 페이지 케어 상태" className="grid grid-cols-3 gap-3"><p className="col-span-3 text-xs text-gray-600">현재 페이지의 케어 상태</p>{[{label:'대기 중',value:pending}, {label:'케어 완료',value:cared}, {label:'무시',value:dismissed}].map(stat => <div key={stat.label} className="rounded-xl border border-border bg-white p-3 text-center">{loading ? <Skeleton className="mx-auto h-8 w-10" /> : <div className="text-2xl font-bold">{stat.value}</div>}<p className="text-xs text-gray-600">{stat.label}</p></div>)}</section>;
}
