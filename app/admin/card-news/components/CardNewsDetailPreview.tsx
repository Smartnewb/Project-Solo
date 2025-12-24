'use client';

import { Box, Typography } from '@mui/material';
import { useRef, useState, useEffect } from 'react';

interface CardSection {
  order: number;
  title: string;
  content: string;
  imageUrl?: string;
}

interface CardNewsDetailPreviewProps {
  sections: CardSection[];
}

export default function CardNewsDetailPreview({ sections }: CardNewsDetailPreviewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 스크롤 이벤트로 현재 인덱스 업데이트
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

  // 카드로 이동
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
          📄 카드뉴스 상세 미리보기
        </Typography>
        <Typography variant="body2" color="text.secondary">
          카드를 추가하면 여기에 미리보기가 표시됩니다.
        </Typography>
      </Box>
    );
  }

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
          📄 카드뉴스 상세 미리보기 (좌우로 스크롤)
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
        <Box sx={{ fontSize: 24, cursor: 'pointer', userSelect: 'none' }}>←</Box>
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
                  <Typography sx={{ fontSize: 60 }}>📰</Typography>
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
                    __html: section.content && section.content !== '<p><br></p>'
                      ? section.content
                      : '<p>카드 본문을 입력하세요</p>'
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
            top: 156, // header height + some space
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
