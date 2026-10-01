'use client';
import { Button, Spinner, Tabs } from '@heroui/react';
import { Plus as AddIcon, Sparkles as AutoAwesomeIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AllContentTable } from './components/AllContentTable';
import { CardSeriesTable } from './components/CardSeriesTable';
import { LongformTable } from './components/LongformTable';
import { ArticleTable } from './components/ArticleTable';
import { NoticeTable } from './components/NoticeTable';
import { VideoTable } from './components/VideoTable';
import { ContentTypeSelectModal } from './components/ContentTypeSelectModal';
import { CONTENT_TYPE_LABELS, type ContentType } from './constants';
type TabValue = 'all' | ContentType;
function ContentPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = ((searchParams.get('tab') as TabValue) || 'all') as TabValue;
    const [modalOpen, setModalOpen] = useState(false);
    const setTab = (tab: TabValue) => {
        router.replace(`/admin/content?tab=${tab}`);
    };
    const handleCreate = (type: ContentType) => {
        setModalOpen(false);
        router.push(`/admin/content/${type}/create`);
    };
    const tabCreateLabel = currentTab === 'all' ? '' : CONTENT_TYPE_LABELS[currentTab];
    return (<div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 className="text-2xl font-bold">
          운영 콘텐츠 관리
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
        <Button onPress={() => router.push('/admin/content/longform/create?format=html')} variant="secondary">
          HTML 공지 작성
        </Button>
        <Button onPress={() => router.push('/admin/content/auto-generate')} variant="secondary">{<AutoAwesomeIcon></AutoAwesomeIcon>}
          자동 생성
        </Button>
        {currentTab === 'all' ? (<>
            <Button onPress={() => setModalOpen(true)} variant="primary">{<AddIcon></AddIcon>}
              새 콘텐츠
            </Button>
            <ContentTypeSelectModal open={modalOpen} onClose={() => setModalOpen(false)} onSelect={handleCreate}></ContentTypeSelectModal>
          </>) : (<Button onPress={() => handleCreate(currentTab as ContentType)} variant="primary">{<AddIcon></AddIcon>}
            {tabCreateLabel} 작성
          </Button>)}
        </div>
      </div>

      <Tabs selectedKey={currentTab} onSelectionChange={key => setTab(String(key) as TabValue)} className="mb-4"><Tabs.List aria-label="콘텐츠 유형">
        {([['all', '전체'], ['card-series', '카드시리즈'], ['longform', '롱폼 아티클'], ['article', '아티클'], ['notice', '공지사항'], ['video', '영상 링크']] as const).map(([key, label]) => <Tabs.Tab key={key} id={key}>{label}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>)}
      </Tabs.List></Tabs>

      {currentTab === 'all' && <AllContentTable></AllContentTable>}
      {currentTab === 'card-series' && <CardSeriesTable></CardSeriesTable>}
      {currentTab === 'longform' && <LongformTable></LongformTable>}
      {currentTab === 'article' && <ArticleTable></ArticleTable>}
      {currentTab === 'notice' && (<>
          <h2 style={{ marginBottom: 16 }} className="text-lg font-semibold">HTML·롱폼 공지</h2>
          <LongformTable categoryCode="announcement"></LongformTable>
          <h2 style={{ marginTop: 32, marginBottom: 16 }} className="text-lg font-semibold">일반 공지</h2>
          <NoticeTable></NoticeTable>
        </>)}
      {currentTab === 'video' && <VideoTable></VideoTable>}
    </div>);
}
export default function ContentPage() {
    return (<Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spinner size="sm"></Spinner>
        </div>}>
      <ContentPageInner></ContentPageInner>
    </Suspense>);
}
