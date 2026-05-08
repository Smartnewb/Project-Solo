'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import { type ContentType } from '../constants';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (type: ContentType) => void;
}

// 실제 앱 디자인 토큰
const APP = {
  brandPrimary: '#ff385c',
  surfaceTertiary: '#f7f7f7',
  surfaceBg: '#FFFFFF',
  textPrimary: '#000000',
  textMuted: '#7C7C7C',
  textBlackPrimary: '#191F28',
  borderCard: '#E5E8EB',
  stateError: '#E8586D',
};

// ─── 카드시리즈 (CardSeriesItem 실제 구조) ───────────────────────
// stackLayerBack: translateX(6) translateY(6) rotate(3deg) opacity 0.4
// stackLayerMid:  translateX(3) translateY(3) rotate(1.5deg) opacity 0.65
// thumbnail: borderRadius 12, dark bg
// top-left: SERIES badge
// bottom-right: Nkt badge
// bottom: overlay title
// below: category uppercase + "N컷 · 조회 M"
function CardSeriesPreview() {
  const [currentCard, setCurrentCard] = useState(0);
  const cards = [
    { title: '연애의 첫 번째 법칙', bg: 'linear-gradient(135deg,#c084e0,#9b59b6)', cat: 'RELATIONSHIP', pages: 5 },
    { title: '진짜 대화란 무엇인가', bg: 'linear-gradient(135deg,#60a5fa,#3b82f6)', cat: 'PSYCHOLOGY', pages: 4 },
    { title: '첫 데이트 완벽 가이드', bg: 'linear-gradient(135deg,#f97316,#ef4444)', cat: 'DATING', pages: 6 },
  ];
  const card = cards[currentCard];

  return (
    <div>
      {/* 카드 스택 — stackWrap: width 100%, aspectRatio 1 */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '60%' /* 원본은 1:1이나 미리보기용 압축 */ }}>
        {/* stackLayerBack */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 12,
          backgroundColor: APP.textBlackPrimary,
          opacity: 0.4,
          transform: 'translateX(6px) translateY(6px) rotate(3deg)',
        }} />
        {/* stackLayerMid */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 12,
          backgroundColor: APP.textBlackPrimary,
          opacity: 0.65,
          transform: 'translateX(3px) translateY(3px) rotate(1.5deg)',
        }} />
        {/* thumbnail (front card) */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 12, overflow: 'hidden',
          background: card.bg, cursor: 'pointer',
        }}
          onClick={() => setCurrentCard((c) => (c + 1) % cards.length)}
        >
          {/* SERIES badge — top-left */}
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: 'rgba(0,0,0,0.55)', borderRadius: 4,
            padding: '3px 8px',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#fff' }}>SERIES</span>
          </div>
          {/* page count — bottom-right */}
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(0,0,0,0.55)', borderRadius: 4,
            padding: '3px 8px',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{card.pages}컷</span>
          </div>
          {/* overlay title — bottom */}
          <div style={{ position: 'absolute', left: 12, right: 12, bottom: 36 }}>
            <span style={{
              fontSize: 13, fontWeight: 800, color: '#fff',
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
              lineHeight: 1.3,
            }}>{card.title}</span>
          </div>
        </div>
      </div>
      {/* meta */}
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: APP.brandPrimary }}>{card.cat}</span>
        <span style={{ fontSize: 11, color: APP.textMuted }}>{card.pages}컷 · 조회 1,247</span>
        <span style={{ fontSize: 10, color: APP.brandPrimary }}>{currentCard < cards.length - 1 ? '→ 클릭하면 다음 카드' : '← 처음으로 돌아가기'}</span>
      </div>
    </div>
  );
}

// ─── 아티클 (ArticleListItem 실제 구조) ──────────────────────────
// container: row, gap 16, paddingVertical 18, paddingHorizontal 20, borderBottom
// textCol: flex 1, gap 6
//   topMeta: fontSize 10, fontWeight 700, letterSpacing 0.6, brandPrimary
//   title: fontSize 16, fontWeight 700, lineHeight 22
//   bottomMeta: chip style, muted
// thumbnail: 84x84, borderRadius 8, surfaceTertiary bg
function ArticlePreview() {
  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'center',
      paddingTop: 14, paddingBottom: 14, paddingLeft: 16, paddingRight: 16,
      borderBottom: `1px solid ${APP.borderCard}`,
      background: APP.surfaceBg,
      borderRadius: 8, border: `1px solid ${APP.borderCard}`,
    }}>
      {/* textCol */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: APP.brandPrimary }}>
          ARTICLE · 3분
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: APP.textPrimary, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
          진짜 연애를 원한다면 먼저 자신을 알아야 한다
        </span>
        <span style={{ fontSize: 11, color: APP.textMuted }}>방금 전 · 조회 247</span>
      </div>
      {/* thumbnail: 84×84, borderRadius 8 */}
      <div style={{
        width: 72, height: 72, borderRadius: 8, flexShrink: 0,
        background: `linear-gradient(135deg, ${APP.surfaceTertiary}, #c4a8e8)`,
      }} />
    </div>
  );
}

// ─── 롱폼 아티클 (LongformReader 실제 구조) ──────────────────────
// hero: width 100%, aspectRatio 16/9, bg surfaceTertiary
// titleBlock: paddingHorizontal 20, paddingTop 20
//   categoryTag: fontSize 10, fontWeight 700, letterSpacing 1, brandPrimary
//   title: large bold
//   subtitle: muted
//   metaRow: views · readTime · published (muted)
// bodyBlock: markdown 본문 (일부만 표시)
function LongformPreview() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: APP.surfaceBg, borderRadius: 8, overflow: 'hidden', border: `1px solid ${APP.borderCard}` }}>
      {/* hero image — 16:9 */}
      <div style={{
        width: '100%', paddingBottom: `${(9 / 16) * 100}%`, position: 'relative',
        background: 'linear-gradient(135deg, #ff385c, #e00b41, #c084e0)',
      }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }}>HERO IMAGE</span>
        </div>
      </div>
      {/* titleBlock */}
      <div style={{ padding: '14px 16px 0' }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: APP.brandPrimary, display: 'block', marginBottom: 6 }}>
          PSYCHOLOGY
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: APP.textPrimary, lineHeight: 1.4, display: 'block', marginBottom: 4 }}>
          진짜 연애를 원한다면 먼저 자신을 알아야 한다
        </span>
        <span style={{ fontSize: 11, color: APP.textMuted, display: 'block', marginBottom: 8 }}>
          조회 1,840 · 읽기 5분 · 3일 전
        </span>
      </div>
      {/* bodyBlock */}
      <div style={{ padding: '0 16px', overflow: 'hidden', maxHeight: expanded ? 120 : 44, transition: 'max-height 0.3s ease' }}>
        <span style={{ fontSize: 12, color: APP.textPrimary, lineHeight: 1.6, display: 'block' }}>
          많은 사람들이 좋은 연애를 꿈꾸지만, 정작 자신이 어떤 사람인지 깊이 탐구하지 않습니다. 좋은 관계는 자기 이해에서 시작됩니다. 상대방에게 원하는 것을 알기 전에, 내가 무엇을 원하는지 먼저 파악해야 합니다.
        </span>
      </div>
      {/* footer CTA */}
      <div style={{ padding: '8px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: APP.brandPrimary, fontWeight: 600, padding: 0 }}
        >
          {expanded ? '접기 ▲' : '본문 더 보기 ▼'}
        </button>
        <span style={{ fontSize: 11, color: APP.textMuted }}>스크롤 끝 → 보상 지급</span>
      </div>
    </div>
  );
}

// ─── 공지사항 (NoticeCard 실제 구조) ─────────────────────────────
// card: bg surfaceCard, border 1px borderCard, borderRadius 12, padding 14
// header: row, space-between
//   left: red dot(6×6) + "공지사항" bold + "[N]" muted
//   right: chevron (rotate 180 when expanded)
// expanded: noticeRow (title + MM.DD date) × N, "전체보기" brandPrimary
function NoticePreview() {
  const [expanded, setExpanded] = useState(false);
  const notices = [
    { title: '[중요] 서비스 점검 안내', date: '02.10' },
    { title: '겨울 이벤트 당첨자 발표', date: '01.15' },
    { title: '개인정보 처리방침 개정 안내', date: '01.01' },
  ];

  return (
    <div style={{
      background: APP.surfaceBg, border: `1px solid ${APP.borderCard}`,
      borderRadius: 12, padding: 14,
    }}>
      {/* header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer', width: '100%', padding: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* red dot */}
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: APP.stateError, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: APP.textPrimary }}>공지사항</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: APP.textMuted }}>[{notices.length}]</span>
        </div>
        {/* chevron */}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M6 9l6 6 6-6" stroke={APP.textMuted} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* expanded list */}
      {expanded && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notices.map((n) => (
            <div key={n.title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ flex: 1, fontSize: 12, color: '#333', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {n.title}
              </span>
              <span style={{ fontSize: 11, color: APP.textMuted, flexShrink: 0 }}>{n.date}</span>
            </div>
          ))}
          <span style={{ fontSize: 11, fontWeight: 600, color: APP.brandPrimary, marginTop: 4, display: 'block' }}>
            전체보기
          </span>
        </div>
      )}
    </div>
  );
}

// ─── 메인 모달 ────────────────────────────────────────────────────
interface ContentTypeOption {
  type: ContentType;
  label: string;
  description: string;
  preview: React.ReactNode;
}

const OPTIONS: ContentTypeOption[] = [
  {
    type: 'card-series',
    label: '카드시리즈',
    description: '여러 장의 카드를 슬라이드로 구성. 짧은 내용을 시각적으로 전달.',
    preview: <CardSeriesPreview />,
  },
  {
    type: 'longform',
    label: '롱폼 아티클',
    description: '16:9 헤더 이미지 + 긴 본문. 스크롤 끝 도달 시 보상 지급.',
    preview: <LongformPreview />,
  },
  {
    type: 'article',
    label: '아티클',
    description: '텍스트 + 84×84 썸네일 행 레이아웃. 피드 목록에 노출.',
    preview: <ArticlePreview />,
  },
  {
    type: 'notice',
    label: '공지사항',
    description: '접기/펼치기 가능한 공지 카드. 커뮤니티 탭 상단 고정.',
    preview: <NoticePreview />,
  },
];

export function ContentTypeSelectModal({ open, onClose, onSelect }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">콘텐츠 유형 선택</Typography>
          <Typography variant="caption" color="text.secondary">
            미리보기는 실제 앱 컴포넌트 구조 기반입니다. 클릭/탭으로 인터랙션 확인 가능.
          </Typography>
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
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
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: '#ff385c',
                  bgcolor: '#f7f7f7',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 16px rgba(122,74,226,0.15)',
                },
              }}
            >
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.3 }}>
                  {opt.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {opt.description}
                </Typography>
              </Box>
              <Box
                sx={{ bgcolor: '#f8f8f8', borderRadius: 1.5, p: 1.5, border: '1px solid #f0f0f0' }}
                onClick={(e) => e.stopPropagation()}
              >
                {opt.preview}
              </Box>
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
