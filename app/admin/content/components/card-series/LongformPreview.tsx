'use client';

import { Box, Typography, Chip } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import IosShareIcon from '@mui/icons-material/IosShare';

interface LongformPreviewProps {
  title: string;
  subtitle?: string;
  description?: string;
  categoryLabel: string;
  heroImageUrl?: string;
  body: string;
  readTimeMinutes: number;
}

export default function LongformPreview({
  title,
  subtitle,
  description,
  categoryLabel,
  heroImageUrl,
  body,
  readTimeMinutes,
}: LongformPreviewProps) {
  return (
    <Box
      sx={{
        width: 390,
        height: 844,
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fff',
        position: 'relative',
      }}
    >
      <Box sx={{ flex: 1, overflowY: 'auto', pb: 7 }}>
        {heroImageUrl ? (
          <Box
            sx={{
              width: '100%',
              height: 220,
              backgroundImage: `url(${heroImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#f0f0f0',
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: 220,
              bgcolor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Hero 이미지 미리보기
            </Typography>
          </Box>
        )}

        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Chip label={categoryLabel || '카테고리'} size="small" color="primary" variant="outlined" />
            <Typography variant="caption" color="text.secondary">
              {readTimeMinutes}분
            </Typography>
          </Box>

          <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
            {title || '제목'}
          </Typography>
          {subtitle && (
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
              {subtitle}
            </Typography>
          )}
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {description}
            </Typography>
          )}

          <Box
            sx={{
              mt: 2,
              '& h1': { fontSize: '1.6rem', fontWeight: 700, mt: 3, mb: 1 },
              '& h2': { fontSize: '1.3rem', fontWeight: 700, mt: 3, mb: 1 },
              '& h3': { fontSize: '1.1rem', fontWeight: 700, mt: 2, mb: 1 },
              '& p': { fontSize: '0.95rem', lineHeight: 1.7, mb: 1.5 },
              '& ul, & ol': { pl: 3, mb: 1.5 },
              '& li': { fontSize: '0.95rem', lineHeight: 1.7 },
              '& blockquote': {
                borderLeft: '4px solid #ddd',
                pl: 2,
                color: 'text.secondary',
                my: 2,
              },
              '& code': {
                bgcolor: '#f4f4f4',
                px: 0.75,
                py: 0.25,
                borderRadius: 0.5,
                fontSize: '0.85rem',
              },
              '& img': { maxWidth: '100%', borderRadius: 1, my: 2 },
              '& a': { color: 'primary.main' },
            }}
          >
            {body ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            ) : (
              <Typography variant="body2" color="text.secondary">
                본문을 입력하면 여기에 미리보기가 표시됩니다.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          borderTop: '1px solid #e0e0e0',
          bgcolor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          px: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
          <FavoriteBorderIcon fontSize="small" />
          <Typography variant="caption">좋아요</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
          <IosShareIcon fontSize="small" />
          <Typography variant="caption">공유</Typography>
        </Box>
      </Box>
    </Box>
  );
}
