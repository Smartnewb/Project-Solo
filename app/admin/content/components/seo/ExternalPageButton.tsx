'use client';
import { ExternalLink as OpenInNewIcon } from 'lucide-react';
import AdminService from '@/app/services/admin';
interface Props {
    kind: 'blog' | 'card-news' | 'university';
    slugOrId: string;
    country?: 'kr' | 'jp';
}
export function ExternalPageButton({ kind, slugOrId, country = 'kr' }: Props) {
    const url = `/api/admin-proxy${AdminService.seo.getWebPageUrl(kind, slugOrId, country)}`;
    return (<a href={url} target="_blank" rel="noopener" aria-label={"검색엔진용 페이지"} className="inline-flex items-center gap-2 rounded-lg border p-2">
      <OpenInNewIcon></OpenInNewIcon>
    </a>);
}
