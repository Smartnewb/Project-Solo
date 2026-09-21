'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Tabs, Tab, Typography, Button, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
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

  const tabCreateLabel =
    currentTab === 'all' ? '' : CONTENT_TYPE_LABELS[currentTab];

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          운영 콘텐츠 관리
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<AutoAwesomeIcon />}
          onClick={() => router.push('/admin/content/auto-generate')}
        >
          자동 생성
        </Button>
        {currentTab === 'all' ? (
          <>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setModalOpen(true)}
            >
              새 콘텐츠
            </Button>
            <ContentTypeSelectModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              onSelect={handleCreate}
            />
          </>
        ) : (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleCreate(currentTab as ContentType)}
          >
            {tabCreateLabel} 작성
          </Button>
        )}
        </Box>
      </Box>

      <Tabs value={currentTab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="all" label="전체" />
        <Tab value="card-series" label="카드시리즈" />
        <Tab value="longform" label="롱폼 아티클" />
        <Tab value="article" label="아티클" />
        <Tab value="notice" label="공지사항" />
        <Tab value="video" label="영상 링크" />
      </Tabs>

      {currentTab === 'all' && <AllContentTable />}
      {currentTab === 'card-series' && <CardSeriesTable />}
      {currentTab === 'longform' && <LongformTable />}
      {currentTab === 'article' && <ArticleTable />}
      {currentTab === 'notice' && <NoticeTable />}
      {currentTab === 'video' && <VideoTable />}
    </Box>
  );
}

export default function ContentPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      }
    >
      <ContentPageInner />
    </Suspense>
  );
}
