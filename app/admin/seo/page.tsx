'use client';

import { Link, Spinner } from '@heroui/react';
import { ExternalLink } from 'lucide-react';
import { useSitemapLocCount } from '@/app/admin/hooks/use-seo';
import AdminService from '@/app/services/admin';
import type { SitemapKind } from '@/app/services/admin/seo';

interface SitemapRowConfig {
  kind: SitemapKind;
  label: string;
  country?: 'kr' | 'jp';
}

const ROWS: SitemapRowConfig[] = [
  { kind: 'index', label: 'Sitemap Index' },
  { kind: 'static', label: 'Static' },
  { kind: 'articles', label: 'Articles (KR)', country: 'kr' },
  { kind: 'articles', label: 'Articles (JP)', country: 'jp' },
  { kind: 'cardnews', label: 'CardNews (KR)', country: 'kr' },
  { kind: 'cardnews', label: 'CardNews (JP)', country: 'jp' },
  { kind: 'universities', label: 'Universities (KR)', country: 'kr' },
  { kind: 'universities', label: 'Universities (JP)', country: 'jp' },
];

function SitemapRow({ kind, country, label }: SitemapRowConfig) {
  const url = AdminService.seo.getSitemapUrl(kind, country);
  const { data, isLoading, isError } = useSitemapLocCount(url);
  return <tr className="border-b last:border-0"><th scope="row" className="p-3 text-left font-normal">{label}</th><td className="p-3"><code className="break-all text-xs">{url}</code></td><td className="p-3 text-center">{isLoading ? <Spinner size="sm" aria-label={`${label} URL 수 조회 중`}/> : isError ? <span className="text-xs text-danger">오류</span> : (data ?? '-')}</td><td className="p-3 text-center"><Link className="button button--secondary button--sm whitespace-nowrap" href={`/api/admin-proxy${url}`} target="_blank" rel="noopener noreferrer" aria-label={`${label} XML 보기`}><ExternalLink size={16}/>XML 보기</Link></td></tr>;
}

export default function SeoPage(){
  return <main className="space-y-4 p-6"><h1 className="text-2xl font-bold">SEO 상태</h1><div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm"><caption className="sr-only">국가별 사이트맵 상태</caption><thead className="bg-gray-50"><tr>{['구분','경로','loc 수','작업'].map((title,index)=><th key={title} scope="col" className={`border-b p-3 ${index>1?'text-center':'text-left'}`}>{title}</th>)}</tr></thead><tbody>{ROWS.map(row=><SitemapRow key={`${row.kind}-${row.country ?? 'global'}`} {...row}/>)}</tbody></table></div><p className="text-xs text-gray-600">sitemap 캐시는 서버에서 1h(static 24h) 주기로 갱신됩니다.</p></main>;
}
