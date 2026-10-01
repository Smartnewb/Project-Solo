'use client';
import { Button, Spinner } from '@heroui/react';
import { RefreshCw as RefreshIcon, ExternalLink as OpenInNewIcon } from 'lucide-react';
import { usePageMeta } from '@/app/admin/hooks/use-seo';
interface Props {
    path: string;
    webUrl?: string;
}
export function OgPreviewCard({ path, webUrl }: Props) {
    const { data, isLoading, isError, refetch } = usePageMeta(path);
    return (<section style={{ padding: 16 }} className="rounded-xl border bg-white p-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <p>OG 미리보기</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onPress={() => { void refetch(); }} variant="tertiary">{<RefreshIcon></RefreshIcon>}
            새로고침
          </Button>
          {webUrl && (<a className="inline-flex items-center gap-2 rounded-lg border p-2" href={`/api/admin-proxy${webUrl}`} target="_blank" rel="noopener noreferrer">{<OpenInNewIcon></OpenInNewIcon>}
              검색엔진용 페이지
            </a>)}
        </div>
      </div>

      <p style={{ display: 'block', marginBottom: 8 }}>
        {path}
      </p>

      {isLoading ? (<div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 24 }}>
          <Spinner size="sm"></Spinner>
        </div>) : isError ? (<p role="alert" className="rounded-lg border p-3">
          미리보기를 불러올 수 없습니다.
        </p>) : data ? (<div style={{ border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden', maxWidth: 524 }}>
          {data.ogImage && (<img src={data.ogImage} alt="" style={{ width: '100%', objectFit: 'cover', display: 'block' }}></img>)}
          <div style={{ padding: 12, backgroundColor: '#f5f5f5' }}>
            <p>
              {data.canonicalUrl ?? path}
            </p>
            <p>
              {data.title}
            </p>
            <p style={{ display: '-webkit-box', overflow: 'hidden' }}>
              {data.description}
            </p>
          </div>
        </div>) : (<p>
          데이터 없음
        </p>)}
    </section>);
}
