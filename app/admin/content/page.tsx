'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Tabs, Tab, Typography, Button, Menu, MenuItem, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Suspense, useState } from 'react';
import { AllContentTable } from './components/AllContentTable';
import { CardSeriesTable } from './components/CardSeriesTable';
import { ArticleTable } from './components/ArticleTable';
import { NoticeTable } from './components/NoticeTable';
import type { ContentType } from './constants';

type TabValue = 'all' | ContentType;

function ContentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = ((searchParams.get('tab') as TabValue) || 'all') as TabValue;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const setTab = (tab: TabValue) => {
    router.replace(`/admin/content?tab=${tab}`);
  };

  const handleCreate = (type: ContentType) => {
    setAnchorEl(null);
    router.push(`/admin/content/${type}/create`);
  };

  const tabCreateLabel =
    currentTab === 'card-series'
      ? '카드시리즈'
      : currentTab === 'article'
      ? '아티클'
      : currentTab === 'notice'
      ? '공지'
      : '';

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
        {currentTab === 'all' ? (
          <>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              새 콘텐츠
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={!!anchorEl}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={() => handleCreate('card-series')}>카드시리즈</MenuItem>
              <MenuItem onClick={() => handleCreate('article')}>아티클</MenuItem>
              <MenuItem onClick={() => handleCreate('notice')}>공지사항</MenuItem>
            </Menu>
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

      <Tabs value={currentTab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="all" label="전체" />
        <Tab value="card-series" label="카드시리즈" />
        <Tab value="article" label="아티클" />
        <Tab value="notice" label="공지사항" />
      </Tabs>

      {currentTab === 'all' && <AllContentTable />}
      {currentTab === 'card-series' && <CardSeriesTable />}
      {currentTab === 'article' && <ArticleTable />}
      {currentTab === 'notice' && <NoticeTable />}
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
