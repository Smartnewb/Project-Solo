'use client';

import { Box, Typography } from '@mui/material';
import { useRef, useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import type { CardNewsLayoutMode } from '@/app/admin/hooks/forms/schemas/card-news.schema';

interface CardSection {
  order: number;
  title: string;
  content: string;
  imageUrl?: string;
}

interface CardNewsDetailPreviewProps {
  sections: CardSection[];
  layoutMode?: CardNewsLayoutMode;
}

const STORY_DURATION_MS = 3000;

/* ─── Image-Only Stories Preview ─── */
function ImageOnlyPreview({ sections }: { sections: CardSection[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, sections.length - 1));
      setCurrentIndex(clamped);
      setProgress(0);
      startTimeRef.current = 0;
    },
    [sections.length]
  );

  const goNext = useCallback(() => {
    if (currentIndex < sections.length - 1) {
      goTo(currentIndex + 1);
    } else {
      goTo(0); // loop
    }
  }, [currentIndex, sections.length, goTo]);

  const goPrev = useCallback(() => {
    if (progress > 0.15) {
      // restart current
      setProgress(0);
      startTimeRef.current = 0;
    } else if (currentIndex > 0) {
      goTo(currentIndex - 1);
    }
  }, [currentIndex, progress, goTo]);

  // auto-advance timer with requestAnimationFrame
  useEffect(() => {
    if (isPaused || sections.length === 0) return;

    const tick = (timestamp: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const pct = Math.min(elapsed / STORY_DURATION_MS, 1);
      setProgress(pct);

      if (pct >= 1) {
        goNext();
        return;
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [currentIndex, isPaused, sections.length, goNext]);

  // pause on mousedown, resume on mouseup
  const handlePauseStart = () => {
    setIsPaused(true);
    pausedAtRef.current = progress;
    cancelAnimationFrame(animFrameRef.current);
  };

  const handlePauseEnd = () => {
    // adjust startTime so progress resumes from where it paused
    startTimeRef.current = performance.now() - pausedAtRef.current * STORY_DURATION_MS;
    setIsPaused(false);
  };

  const currentSection = sections[currentIndex];

  return (
    <Box
      sx={{
        maxWidth: 428,
        mx: 'auto',
        mt: 4,
        mb: 4,
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid #333'
      }}
    >
      {/* 안내 라벨 */}
      <Box sx={{ p: 1.5, backgroundColor: '#1a1a1a', textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: '#888' }}>
          이미지 전용 미리보기 (Instagram Stories)
        </Typography>
      </Box>

      {/* Stories Container */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '9 / 16',
          backgroundColor: '#000000',
          overflow: 'hidden',
          userSelect: 'none'
        }}
        onMouseDown={handlePauseStart}
        onMouseUp={handlePauseEnd}
        onMouseLeave={() => {
          if (isPaused) handlePauseEnd();
        }}
      >
        {/* Story Progress Bar */}
        <Box
          sx={{
            position: 'absolute',
            top: '12px',
            left: '16px',
            right: '16px',
            display: 'flex',
            gap: '4px',
            zIndex: 11
          }}
        >
          {sections.map((_, idx) => (
            <Box
              key={idx}
              sx={{
                flex: 1,
                height: '3px',
                borderRadius: '2px',
                backgroundColor: 'rgba(255,255,255,0.35)',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '2px',
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                        ? `${progress * 100}%`
                        : '0%',
                  transition: idx === currentIndex ? 'none' : 'width 0.2s ease'
                }}
              />
            </Box>
          ))}
        </Box>

        {/* Header */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            pt: '28px',
            pb: 2,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)',
            zIndex: 12
          }}
        >
          <Typography sx={{ fontSize: 20, color: '#FFFFFF', cursor: 'pointer', lineHeight: 1 }}>
            {'<'}
          </Typography>
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF' }}>
            카드뉴스
          </Typography>
          <Box sx={{ width: 20 }} />
        </Box>

        {/* Image Card */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000000'
          }}
        >
          {currentSection?.imageUrl ? (
            <Box
              component="img"
              src={currentSection.imageUrl}
              alt={`카드 ${currentIndex + 1}`}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          ) : (
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              이미지 없음
            </Typography>
          )}
        </Box>

        {/* Touch zones: left/right tap */}
        <Box
          onClick={goPrev}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '35%',
            zIndex: 10,
            cursor: 'pointer'
          }}
        />
        <Box
          onClick={goNext}
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '65%',
            zIndex: 10,
            cursor: 'pointer'
          }}
        />

        {/* Bottom Navigation */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
            px: 3,
            py: 2,
            background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
            zIndex: 12
          }}
        >
          <Typography
            onClick={goPrev}
            sx={{
              color: currentIndex > 0 ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              fontSize: 22,
              cursor: currentIndex > 0 ? 'pointer' : 'default',
              lineHeight: 1
            }}
          >
            {'<'}
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 14,
              fontWeight: 500,
              minWidth: 48,
              textAlign: 'center'
            }}
          >
            {currentIndex + 1} / {sections.length}
          </Typography>
          <Typography
            onClick={goNext}
            sx={{
              color: '#FFFFFF',
              fontSize: 22,
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            {'>'}
          </Typography>
        </Box>
      </Box>

      {/* 하단 안내 */}
      <Box sx={{ p: 1.5, backgroundColor: '#1a1a1a', textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: '#666' }}>
          클릭: 이전/다음 | 길게 누르기: 일시정지 | 3초마다 자동 전환
        </Typography>
      </Box>
    </Box>
  );
}

/* ─── Article Preview (기존) ─── */
function ArticlePreview({ sections }: { sections: CardSection[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const containerWidth = scrollContainerRef.current.offsetWidth;
    const newIndex = Math.round(scrollLeft / containerWidth);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentIndex]);

  const goToCard = (index: number) => {
    if (!scrollContainerRef.current) return;
    if (index >= 0 && index < sections.length) {
      const containerWidth = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollTo({
        left: containerWidth * index,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 428,
        mx: 'auto',
        mt: 4,
        mb: 4,
        backgroundColor: '#f9f9f9',
        borderRadius: 2,
        border: '1px solid #e0e0e0',
        overflow: 'hidden'
      }}
    >
      {/* 헤더 */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fff'
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#666', textAlign: 'center' }}>
          카드뉴스 상세 미리보기 (좌우로 스크롤)
        </Typography>
      </Box>

      {/* Header */}
      <Box
        sx={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E4E2E2'
        }}
      >
        <Box sx={{ fontSize: 24, cursor: 'pointer', userSelect: 'none' }}>{'<-'}</Box>
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: '#000000' }}>
          새로운 소식
        </Typography>
        <Box sx={{ width: 24 }} />
      </Box>

      {/* Scroll Container */}
      <Box
        ref={scrollContainerRef}
        sx={{
          position: 'relative',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          backgroundColor: '#FFFFFF'
        }}
      >
        {/* Progress Dots */}
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '6px',
            zIndex: 10,
            pointerEvents: 'none'
          }}
        >
          {sections.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: currentIndex === index ? 18 : 6,
                height: 6,
                borderRadius: currentIndex === index ? '10px' : '3px',
                background: currentIndex === index ? '#7A4AE2' : '#E2D5FF',
                transition: 'all 0.3s'
              }}
            />
          ))}
        </Box>

        {/* Cards Wrapper */}
        <Box sx={{ display: 'flex', height: '100%' }}>
          {sections.map((section, index) => (
            <Box
              key={index}
              sx={{
                width: '100%',
                minWidth: '100%',
                scrollSnapAlign: 'start',
                p: '30px 20px 40px 20px',
                flexShrink: 0
              }}
            >
              {/* Image Area */}
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '4 / 5',
                  background: '#F7F3FF',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {section.imageUrl ? (
                  <Box
                    component="img"
                    src={section.imageUrl}
                    alt="카드 이미지"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <Typography sx={{ color: '#999', fontSize: 14 }}>이미지 없음</Typography>
                )}
              </Box>

              {/* Text Area */}
              <Box sx={{ mt: 3 }}>
                <Typography
                  sx={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#000000',
                    lineHeight: '32px',
                    mb: 2,
                    opacity: section.title ? 1 : 0.6
                  }}
                >
                  {section.title || `카드 ${index + 1} 제목을 입력하세요`}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    '& p': {
                      margin: 0,
                      fontSize: 16,
                      lineHeight: '24px',
                      color: '#333333'
                    },
                    '& strong': {
                      fontWeight: 700,
                      color: '#000000'
                    },
                    '& b': {
                      fontWeight: 700,
                      color: '#000000'
                    },
                    opacity: section.content && section.content !== '<p><br></p>' ? 1 : 0.6
                  }}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      section.content && section.content !== '<p><br></p>'
                        ? section.content
                        : '<p>카드 본문을 입력하세요</p>'
                    )
                  }}
                />
              </Box>
            </Box>
          ))}
        </Box>

        {/* Touch Zones - Left */}
        <Box
          onClick={() => goToCard(currentIndex - 1)}
          sx={{
            position: 'fixed',
            top: 156,
            bottom: 0,
            left: 'calc(50% - 214px)',
            width: '50%',
            maxWidth: 214,
            zIndex: 5,
            cursor: 'pointer',
            display: currentIndex > 0 ? 'block' : 'none'
          }}
        />

        {/* Touch Zones - Right */}
        <Box
          onClick={() => goToCard(currentIndex + 1)}
          sx={{
            position: 'fixed',
            top: 156,
            bottom: 0,
            right: 'calc(50% - 214px)',
            width: '50%',
            maxWidth: 214,
            zIndex: 5,
            cursor: 'pointer',
            display: currentIndex < sections.length - 1 ? 'block' : 'none'
          }}
        />
      </Box>

      {/* 안내 텍스트 */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#fff',
          textAlign: 'center'
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: '#999',
            fontStyle: 'italic'
          }}
        >
          * 좌우로 스크롤하여 카드를 확인할 수 있습니다 ({currentIndex + 1}/{sections.length})
        </Typography>
      </Box>
    </Box>
  );
}

/* ─── Main Component ─── */
export default function CardNewsDetailPreview({ sections, layoutMode = 'article' }: CardNewsDetailPreviewProps) {
  if (sections.length === 0) {
    return (
      <Box
        sx={{
          maxWidth: 428,
          mx: 'auto',
          mt: 4,
          mb: 4,
          p: 3,
          backgroundColor: '#f9f9f9',
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          textAlign: 'center'
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: '#666' }}>
          카드뉴스 상세 미리보기
        </Typography>
        <Typography variant="body2" color="text.secondary">
          카드를 추가하면 여기에 미리보기가 표시됩니다.
        </Typography>
      </Box>
    );
  }

  if (layoutMode === 'image_only') {
    return <ImageOnlyPreview sections={sections} />;
  }

  return <ArticlePreview sections={sections} />;
}
