'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import type {
  PixelCampusChoice,
  PixelCampusCut,
} from '@/types/admin';

interface Props {
  sceneImageUrl?: string | null;
  cuts: PixelCampusCut[];
  choices: PixelCampusChoice[];
}

const speakerLabels: Record<PixelCampusCut['speaker'], string> = {
  miho: '미호',
  me: '나',
};

export function EpisodePreview({ sceneImageUrl, cuts, choices }: Props) {
  const visibleCuts = useMemo(
    () => cuts.filter((cut) => cut.text.trim()),
    [cuts],
  );
  const previewCuts = visibleCuts.length ? visibleCuts : [{ speaker: 'miho' as const, text: '컷 대사가 여기에 표시됩니다.' }];
  const finalStep = previewCuts.length;
  const [step, setStep] = useState(0);
  const isChoicesStep = step >= finalStep;
  const currentCut = previewCuts[Math.min(step, previewCuts.length - 1)];

  useEffect(() => {
    setStep((prev) => Math.min(prev, finalStep));
  }, [finalStep]);

  return (
    <Box
      sx={{
        width: 375,
        maxWidth: '100%',
        aspectRatio: '375 / 720',
        mx: 'auto',
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        bgcolor: '#111322',
        color: 'white',
        boxShadow: '0 16px 40px rgba(13,14,36,0.24)',
      }}
    >
      {sceneImageUrl ? (
        <Box
          component="img"
          src={sceneImageUrl}
          alt="픽셀 캠퍼스 장면"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#25283A',
          }}
        >
          <Typography variant="body2" color="rgba(255,255,255,0.62)">
            장면 이미지 없음
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(8,9,23,0.42) 0%, rgba(8,9,23,0.08) 34%, rgba(8,9,23,0.88) 100%)',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
        <Box sx={{ display: 'flex', gap: 0.75, mb: 'auto' }}>
          {previewCuts.map((_, index) => (
            <Box
              key={index}
              sx={{
                flex: 1,
                height: 4,
                borderRadius: 999,
                bgcolor: index <= Math.min(step, finalStep - 1) ? '#A855F7' : 'rgba(255,255,255,0.34)',
              }}
            />
          ))}
        </Box>

        <Box>
          {!isChoicesStep && (
            <>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 1.5,
                  py: 0.75,
                  mb: 1,
                  borderRadius: 999,
                  bgcolor: '#7C3AED',
                  boxShadow: '0 8px 18px rgba(76,29,149,0.28)',
                }}
              >
                <Typography variant="caption" fontWeight={800}>
                  {speakerLabels[currentCut.speaker]}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 2,
                  border: '1px solid rgba(255,255,255,0.22)',
                  borderRadius: 2,
                  bgcolor: 'rgba(7,9,24,0.88)',
                  minHeight: 112,
                  boxShadow: '0 12px 28px rgba(0,0,0,0.28)',
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {currentCut.text}
                </Typography>
              </Box>
            </>
          )}

          {isChoicesStep && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {choices.slice(0, 2).map((choice, index) => (
                <Button
                  key={choice.id ?? index}
                  variant="contained"
                  sx={{
                    minHeight: 52,
                    borderRadius: 999,
                    bgcolor: 'rgba(255,255,255,0.94)',
                    color: '#151626',
                    justifyContent: 'center',
                    textTransform: 'none',
                    fontWeight: 800,
                    boxShadow: '0 10px 24px rgba(0,0,0,0.2)',
                    '&:hover': {
                      bgcolor: '#fff',
                    },
                  }}
                >
                  {choice.label || `선택지 ${index + 1}`}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1.5 }}>
            <Button
              variant="outlined"
              onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
              disabled={step === 0}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.42)',
                bgcolor: 'rgba(0,0,0,0.22)',
                '&.Mui-disabled': {
                  color: 'rgba(255,255,255,0.32)',
                  borderColor: 'rgba(255,255,255,0.18)',
                },
              }}
            >
              이전
            </Button>
            <Button
              variant="contained"
              onClick={() => setStep((prev) => Math.min(prev + 1, finalStep))}
              disabled={isChoicesStep}
              sx={{
                bgcolor: '#8B5CF6',
                '&:hover': { bgcolor: '#7C3AED' },
                '&.Mui-disabled': {
                  color: 'rgba(255,255,255,0.52)',
                  bgcolor: 'rgba(139,92,246,0.42)',
                },
              }}
            >
              다음
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
