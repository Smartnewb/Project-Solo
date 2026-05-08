import { Box, Typography } from '@mui/material';

interface CardNewsPreviewProps {
  title: string;
  description: string;
  backgroundImageUrl?: string;
  hasReward: boolean;
}

export default function CardNewsPreview({
  title,
  description,
  backgroundImageUrl,
  hasReward
}: CardNewsPreviewProps) {
  const displayTitle = title || '카드뉴스 제목을 입력하세요';
  const displayDescription = description || '카드뉴스 설명을 입력하세요';
  const displayBackground = backgroundImageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80';

  return (
    <Box
      sx={{
        maxWidth: 428,
        mx: 'auto',
        mb: 4,
        p: 3,
        backgroundColor: '#f9f9f9',
        borderRadius: 2,
        border: '1px solid #e0e0e0'
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: '#666' }}>
        📱 사용자 화면 미리보기
      </Typography>

      {/* Section Title */}
      <Typography
        sx={{
          fontSize: 20,
          fontWeight: 700,
          color: '#000000',
          mb: 2,
          px: 1
        }}
      >
        지금 주목할 소식
      </Typography>

      {/* Highlight Card */}
      <Box
        sx={{
          position: 'relative',
          height: 280,
          borderRadius: '20px',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          '&:active': {
            transform: 'scale(0.98)'
          }
        }}
      >
        {/* Background Image */}
        <Box
          component="img"
          src={displayBackground}
          alt="카드뉴스 배경"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />

        {/* Gradient Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.9) 100%)'
          }}
        />

        {/* Reward Badge */}
        {hasReward && (
          <Box
            sx={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: 'rgba(255,255,255,0.25)',
              backdropFilter: 'blur(10px)',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            🎁 보상
          </Box>
        )}

        {/* Card Content */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '24px'
          }}
        >
          <Typography
            sx={{
              fontSize: 24,
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: '32px',
              mb: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              opacity: title ? 1 : 0.6
            }}
          >
            {displayTitle}
          </Typography>

          <Typography
            sx={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.95)',
              lineHeight: '20px',
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              opacity: description ? 1 : 0.6
            }}
          >
            {displayDescription}
          </Typography>

          <Box
            component="span"
            sx={{
              display: 'inline-block',
              background: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '20px',
              color: '#ff385c',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }
            }}
          >
            지금 확인하기 →
          </Box>
        </Box>
      </Box>

      {/* Pagination Dots */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mt: 1.5,
          gap: '6px'
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 8,
            borderRadius: '10px',
            background: '#ff385c'
          }}
        />
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '4px',
            background: '#D9D9D9'
          }}
        />
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '4px',
            background: '#D9D9D9'
          }}
        />
      </Box>

      <Typography
        variant="caption"
        sx={{
          display: 'block',
          textAlign: 'center',
          mt: 2,
          color: '#999',
          fontStyle: 'italic'
        }}
      >
        * 실제 앱 화면에서 보이는 모습입니다
      </Typography>
    </Box>
  );
}
