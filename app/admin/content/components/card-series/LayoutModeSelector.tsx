'use client';

import { Box, Typography } from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import ImageIcon from '@mui/icons-material/Image';
import type { CardNewsLayoutMode } from '@/app/admin/hooks/forms/schemas/card-news.schema';

interface LayoutModeSelectorProps {
  value: CardNewsLayoutMode;
  onChange: (value: CardNewsLayoutMode) => void;
  disabled?: boolean;
}

interface ModeOption {
  value: CardNewsLayoutMode;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'article',
    title: '본문형',
    description: '제목·본문·이미지 조합으로 구성된 기본 카드뉴스',
    icon: <ArticleIcon sx={{ fontSize: 32 }} />,
  },
  {
    value: 'image_only',
    title: '이미지 전용',
    description: '풀블리드 이미지 카드 (이벤트·공지·비주얼 중심)',
    icon: <ImageIcon sx={{ fontSize: 32 }} />,
  },
];

export default function LayoutModeSelector({ value, onChange, disabled = false }: LayoutModeSelectorProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {MODE_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <Box
            key={option.value}
            onClick={() => onChange(option.value)}
            sx={{
              flex: 1,
              p: 2,
              cursor: 'pointer',
              borderRadius: 2,
              border: selected ? '2px solid' : '1px solid',
              borderColor: selected ? 'primary.main' : 'grey.300',
              backgroundColor: selected ? 'rgba(122, 74, 226, 0.04)' : 'transparent',
              transition: 'all 0.15s',
              '&:hover': {
                borderColor: selected ? 'primary.main' : 'grey.500',
                backgroundColor: selected ? 'rgba(122, 74, 226, 0.08)' : 'grey.50',
              },
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start',
            }}
          >
            <Box sx={{ color: selected ? 'primary.main' : 'grey.500', mt: 0.5 }}>
              {option.icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                sx={{ color: selected ? 'primary.main' : 'text.primary', mb: 0.5 }}
              >
                {option.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                {option.description}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
