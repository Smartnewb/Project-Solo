'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import { type ContentType } from '../constants';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (type: ContentType) => void;
}

interface ContentTypeOption {
  type: ContentType;
  label: string;
  description: string;
  preview: React.ReactNode;
}

// ─── 카드시리즈 미리보기 ───────────────────────────────────────────────
function CardSeriesPreview() {
  const [activeCard, setActiveCard] = useState(0);
  const cards = [
    { title: '연애의 첫 번째 법칙', subtitle: '서로를 알아가는 시간', bg: '#F4B8C5' },
    { title: '두 번째 만남의 설렘', subtitle: '조금 더 가까워지는 법', bg: '#B8D4F4' },
    { title: '관계를 깊게 만드는 법', subtitle: '진심으로 대화하기', bg: '#B8F4C8' },
  ];

  return (
    <Box sx={{ position: 'relative', height: 120, cursor: 'pointer' }}>
      {cards.map((card, i) => (
        <Box
          key={i}
          onClick={() => setActiveCard(i)}
          sx={{
            position: 'absolute',
            left: `${i * 8}px`,
            top: `${i * 4}px`,
            width: 'calc(100% - 24px)',
            height: 100,
            borderRadius: 2,
            bgcolor: card.bg,
            p: 1.5,
            transition: 'all 0.3s ease',
            zIndex: activeCard === i ? 10 : 3 - i,
            transform: activeCard === i ? 'translateY(-8px) scale(1.02)' : 'none',
            boxShadow: activeCard === i ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.65rem' }}>
            {i + 1} / {cards.length}
          </Typography>
          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
            {card.title}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
            {card.subtitle}
          </Typography>
        </Box>
      ))}
      <Typography
        variant="caption"
        sx={{ position: 'absolute', bottom: 0, right: 0, color: 'text.secondary', fontSize: '0.6rem' }}
      >
        클릭해서 카드 탐색
      </Typography>
    </Box>
  );
}

// ─── 롱폼 아티클 미리보기 ───────────────────────────────────────────────
function LongformPreview() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box
      sx={{
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <Box sx={{ bgcolor: '#8B6FBF', height: 40, display: 'flex', alignItems: 'center', px: 1.5 }}>
        <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.65rem' }}>
          롱폼 아티클 헤더 이미지
        </Typography>
      </Box>
      <Box sx={{ p: 1.5 }}>
        <Chip label="심리" size="small" sx={{ height: 16, fontSize: '0.55rem', mb: 0.5 }} />
        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.7rem', lineHeight: 1.3 }}>
          진짜 연애를 원한다면 먼저 자신을 알아야 한다
        </Typography>
        <Box
          sx={{
            overflow: 'hidden',
            maxHeight: expanded ? 80 : 30,
            transition: 'max-height 0.3s ease',
          }}
        >
          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', display: 'block', mt: 0.5 }}>
            많은 사람들이 좋은 연애를 꿈꾸지만, 정작 자신이 어떤 사람인지 깊이 탐구하지 않습니다.
            좋은 관계는 자기 이해에서 시작됩니다. 상대방에게 원하는 것을 알기 전에, 내가 무엇을 원하는지
            먼저 파악해야 합니다...
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'primary.main', mt: 0.5, display: 'block' }}>
          {expanded ? '접기 ▲' : '더 보기 ▼ (클릭)'}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── 아티클 미리보기 ───────────────────────────────────────────────────
function ArticlePreview() {
  const [liked, setLiked] = useState(false);

  return (
    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', gap: 1.5, p: 1.5 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 1.5,
            bgcolor: '#F4D4B8',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ fontSize: '1.2rem' }}>📖</Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Chip label="데이트" size="small" sx={{ height: 14, fontSize: '0.5rem', mb: 0.5 }} />
          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.68rem', lineHeight: 1.3 }}>
            첫 데이트 장소 고르는 5가지 팁
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.58rem', color: 'text.secondary' }}>
            읽기 3분 · 연애 팁
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          px: 1.5,
          pb: 1,
          display: 'flex',
          justifyContent: 'flex-end',
          borderTop: '1px solid #f0f0f0',
          pt: 0.5,
        }}
      >
        <IconButton
          size="small"
          onClick={() => setLiked(!liked)}
          sx={{ color: liked ? '#e91e63' : 'text.secondary' }}
        >
          <Typography sx={{ fontSize: '0.9rem' }}>{liked ? '❤️' : '🤍'}</Typography>
        </IconButton>
        <Typography variant="caption" sx={{ fontSize: '0.6rem', alignSelf: 'center', color: 'text.secondary' }}>
          {liked ? '1' : '0'}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── 공지사항 미리보기 ─────────────────────────────────────────────────
function NoticePreview() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <Box>
      {!dismissed ? (
        <Box
          sx={{
            bgcolor: '#FFF8E1',
            border: '1px solid #FFD54F',
            borderLeft: '4px solid #FF9800',
            borderRadius: 1,
            p: 1.5,
            position: 'relative',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Typography sx={{ fontSize: '0.9rem' }}>📢</Typography>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.65rem', color: '#E65100' }}>
                [중요] 서비스 점검 안내
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', display: 'block', mt: 0.3 }}>
                2025.02.10(월) 02:00 ~ 04:00 서버 점검이 예정되어 있습니다.
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setDismissed(true)}
              sx={{ mt: -0.5, mr: -0.5 }}
            >
              <CloseIcon sx={{ fontSize: 12 }} />
            </IconButton>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            border: '1px dashed #ccc',
            borderRadius: 1,
            p: 1.5,
            textAlign: 'center',
            cursor: 'pointer',
          }}
          onClick={() => setDismissed(false)}
        >
          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
            ↩ 공지가 닫혔습니다. 클릭해서 복원
          </Typography>
        </Box>
      )}
      <Box sx={{ mt: 1, border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
          2025.01.15
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.65rem', fontWeight: 500 }}>
          겨울 이벤트 당첨자 발표
        </Typography>
      </Box>
    </Box>
  );
}

// ─── 메인 모달 ─────────────────────────────────────────────────────────
const OPTIONS: ContentTypeOption[] = [
  {
    type: 'card-series',
    label: '카드시리즈',
    description: '여러 장의 카드를 슬라이드 형식으로 구성. 짧은 내용을 시각적으로 전달할 때 사용.',
    preview: <CardSeriesPreview />,
  },
  {
    type: 'longform',
    label: '롱폼 아티클',
    description: '헤더 이미지 + 긴 본문 구성. 깊이 있는 글과 스토리텔링에 적합.',
    preview: <LongformPreview />,
  },
  {
    type: 'article',
    label: '아티클',
    description: '썸네일 + 제목 + 짧은 소개 형식. 피드에 카드로 노출되는 일반 콘텐츠.',
    preview: <ArticlePreview />,
  },
  {
    type: 'notice',
    label: '공지사항',
    description: '앱 상단 배너 또는 목록으로 노출. 점검·이벤트·업데이트 안내에 사용.',
    preview: <NoticePreview />,
  },
];

export function ContentTypeSelectModal({ open, onClose, onSelect }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            콘텐츠 유형 선택
          </Typography>
          <Typography variant="caption" color="text.secondary">
            생성할 콘텐츠 유형을 선택하세요. 우측 미리보기로 실제 표시 방식을 확인할 수 있습니다.
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {OPTIONS.map((opt) => (
            <Box
              key={opt.type}
              onClick={() => onSelect(opt.type)}
              sx={{
                border: '2px solid #e0e0e0',
                borderRadius: 2,
                p: 2,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.50',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {opt.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                  {opt.description}
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: 1.5,
                  p: 1.5,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.6rem' }}>
                  미리보기 (인터랙션 가능)
                </Typography>
                {opt.preview}
              </Box>
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
