'use client';

import { Box, Paper, Typography, CircularProgress, Button, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { usePageMeta } from '@/app/admin/hooks/use-seo';

interface Props {
  path: string;
  webUrl?: string;
}

export function OgPreviewCard({ path, webUrl }: Props) {
  const { data, isLoading, isError, refetch } = usePageMeta(path);

  return (
    <Paper sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="subtitle2">OG 미리보기</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" startIcon={<RefreshIcon />} onClick={() => refetch()}>
            새로고침
          </Button>
          {webUrl && (
            <Button
              size="small"
              startIcon={<OpenInNewIcon />}
              component="a"
              href={`/api/admin-proxy${webUrl}`}
              target="_blank"
              rel="noopener"
            >
              검색엔진용 페이지
            </Button>
          )}
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {path}
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={20} />
        </Box>
      ) : isError ? (
        <Alert severity="warning" variant="outlined">
          미리보기를 불러올 수 없습니다.
        </Alert>
      ) : data ? (
        <Box
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            overflow: 'hidden',
            maxWidth: 524,
          }}
        >
          {data.ogImage && (
            <Box
              component="img"
              src={data.ogImage}
              alt=""
              sx={{
                width: '100%',
                aspectRatio: '1.91/1',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          )}
          <Box sx={{ p: 1.5, bgcolor: '#f5f5f5' }}>
            <Typography variant="caption" color="text.secondary" noWrap component="div">
              {data.canonicalUrl ?? path}
            </Typography>
            <Typography variant="body2" fontWeight="bold" noWrap>
              {data.title}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {data.description}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          데이터 없음
        </Typography>
      )}
    </Paper>
  );
}
