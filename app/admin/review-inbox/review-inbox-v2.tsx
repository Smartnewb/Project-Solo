'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AutoAwesome as AutoAwesomeIcon,
  CheckCircle as CheckCircleIcon,
  DescriptionOutlined as DescriptionOutlinedIcon,
  DoneAll as DoneAllIcon,
  Gavel as GavelIcon,
  HistoryOutlined as HistoryOutlinedIcon,
  ImageOutlined as ImageOutlinedIcon,
  PersonOutline as PersonOutlineIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { getReviewInbox } from '@/app/services/review-inbox';
import type {
  PendingReviewInboxBucket,
  ReviewInboxAction,
  ReviewInboxBucket,
  ReviewInboxEvidenceType,
  ReviewInboxResponse,
} from './types';

const reviewInboxBucketLabels: Record<ReviewInboxBucket, string> = {
  approval: '사람 승인 필요',
  judgment: '직접 판단 필요',
  done: 'AI 처리 완료',
};

const reviewInboxBucketDescriptions: Record<ReviewInboxBucket, string> = {
  approval: '명확한 건 → 원본 화면에서 처리',
  judgment: '맥락 확인 필요 → 직접 판단',
  done: '오늘 자동 처리 건수',
};

const bucketTone = {
  approval: {
    color: '#ef4444',
    light: '#fef2f2',
    border: '#fecaca',
    icon: <PersonOutlineIcon fontSize="small" />,
  },
  judgment: {
    color: '#f59e0b',
    light: '#fffbeb',
    border: '#fde68a',
    icon: <GavelIcon fontSize="small" />,
  },
  done: {
    color: '#10b981',
    light: '#ecfdf5',
    border: '#a7f3d0',
    icon: <DoneAllIcon fontSize="small" />,
  },
} satisfies Record<ReviewInboxBucket, { color: string; light: string; border: string; icon: JSX.Element }>;

const evidenceTone = {
  image: {
    icon: <ImageOutlinedIcon sx={{ fontSize: 16 }} />,
    color: '#7c3aed',
    bg: '#f3e8ff',
  },
  text: {
    icon: <DescriptionOutlinedIcon sx={{ fontSize: 16 }} />,
    color: '#c2410c',
    bg: '#fff7ed',
  },
  history: {
    icon: <HistoryOutlinedIcon sx={{ fontSize: 16 }} />,
    color: '#475569',
    bg: '#f1f5f9',
  },
} satisfies Record<ReviewInboxEvidenceType, { icon: JSX.Element; color: string; bg: string }>;

function getActionButtonProps(action: ReviewInboxAction) {
  if (action.tone === 'danger') {
    return {
      variant: 'outlined' as const,
      color: 'error' as const,
    };
  }

  if (action.tone === 'neutral') {
    return {
      variant: 'outlined' as const,
      color: 'inherit' as const,
    };
  }

  return {
    variant: 'contained' as const,
    color: 'primary' as const,
  };
}

function getInitialSelectedIds(data: ReviewInboxResponse | null) {
  return {
    approval: data?.buckets.approval.items[0]?.id ?? null,
    judgment: data?.buckets.judgment.items[0]?.id ?? null,
  } satisfies Record<PendingReviewInboxBucket, string | null>;
}

export default function ReviewInboxV2() {
  const [activeBucket, setActiveBucket] = useState<ReviewInboxBucket>('approval');
  const [data, setData] = useState<ReviewInboxResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<Record<PendingReviewInboxBucket, string | null>>({
    approval: null,
    judgment: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getReviewInbox();

        if (cancelled) return;

        setData(response);
        setSelectedIds(getInitialSelectedIds(response));
      } catch (loadError) {
        if (cancelled) return;
      setError(loadError instanceof Error ? loadError.message : '검토 인박스를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!data) return;

    if (activeBucket === 'approval' && data.summary.approval === 0 && data.summary.judgment > 0) {
      setActiveBucket('judgment');
    }
  }, [activeBucket, data]);

  const counts = useMemo(
    () =>
      data?.summary ?? {
        approval: 0,
        judgment: 0,
        done: 0,
      },
    [data],
  );

  const activeItems = activeBucket === 'done' ? [] : data?.buckets[activeBucket].items ?? [];
  const selectedItem =
    activeBucket === 'done'
      ? null
      : activeItems.find((item) => item.id === selectedIds[activeBucket]) ?? activeItems[0] ?? null;

  const handleSelectItem = (bucket: PendingReviewInboxBucket, id: string) => {
    setSelectedIds((current) => ({
      ...current,
      [bucket]: id,
    }));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
          검토 인박스
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          AI가 끝내지 못한 예외만 확인하면 됩니다.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" variant="outlined">
          {error}
        </Alert>
      )}

      {data?.warnings?.length ? (
        <Alert severity="warning" variant="outlined">
          {data.warnings[0]}
        </Alert>
      ) : null}

      {loading && !data ? (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              검토 인박스를 불러오는 중입니다.
            </Typography>
          </CardContent>
        </Card>
      ) : null}

      {data ? (
        <>
          <Card
            sx={{
              border: '1px solid #ddd6fe',
              backgroundColor: '#f5f3ff',
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  backgroundColor: '#7c3aed',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AutoAwesomeIcon fontSize="small" />
              </Box>
              <Typography variant="body2" sx={{ color: '#1f2937' }}>
                <Box component="span" sx={{ fontWeight: 700, color: '#6d28d9' }}>
                  오늘 AI가 {counts.done}건 자동 처리
                </Box>{' '}
                했고, 사람 확인이 남은 건은 {counts.approval + counts.judgment}건뿐입니다.
              </Typography>
            </CardContent>
          </Card>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            {(['approval', 'judgment', 'done'] as ReviewInboxBucket[]).map((bucket) => {
              const tone = bucketTone[bucket];
              const isActive = activeBucket === bucket;

              return (
                <Box
                  key={bucket}
                  component="button"
                  type="button"
                  onClick={() => setActiveBucket(bucket)}
                  aria-pressed={isActive}
                  aria-label={`${reviewInboxBucketLabels[bucket]} ${counts[bucket]}건 보기`}
                  sx={{
                    border: `1px solid ${isActive ? tone.color : '#e5e7eb'}`,
                    borderRadius: 3,
                    backgroundColor: isActive ? tone.light : '#fff',
                    boxShadow: isActive ? `0 0 0 3px ${tone.light}` : 'none',
                    px: 2.25,
                    py: 2,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: tone.color,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ color: tone.color }}>
                    {tone.icon}
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {reviewInboxBucketLabels[bucket]}
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1, mt: 1, color: tone.color }}>
                    {counts[bucket]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {reviewInboxBucketDescriptions[bucket]}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                lg: selectedItem ? 'minmax(0, 1.15fr) minmax(340px, 0.85fr)' : '1fr',
              },
              gap: 2,
            }}
          >
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
                    {reviewInboxBucketLabels[activeBucket]}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${counts[activeBucket]}건`}
                    sx={{
                      fontWeight: 600,
                      backgroundColor: bucketTone[activeBucket].light,
                      color: bucketTone[activeBucket].color,
                    }}
                  />
                </Box>
                <Divider />

                {activeBucket === 'done' ? (
                  <Box sx={{ px: 3, py: 5, textAlign: 'center', color: 'text.secondary' }}>
                    <DoneAllIcon sx={{ fontSize: 44, color: '#10b981', mb: 1.5 }} />
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      오늘 AI가 자동 처리한 {counts.done}건은 모두 큐 밖에서 정리됐습니다.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      완료 건은 다음 단계에서 별도 이력 보기와 연결합니다.
                    </Typography>
                  </Box>
                ) : activeItems.length === 0 ? (
                  <Box sx={{ px: 3, py: 5, textAlign: 'center', color: 'text.secondary' }}>
                    <CheckCircleIcon sx={{ fontSize: 44, color: bucketTone[activeBucket].color, mb: 1.5 }} />
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      현재 남아 있는 예외가 없습니다.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      새로운 예외가 생기면 이 리스트에만 다시 쌓입니다.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {activeItems.map((item) => {
                      const isSelected = selectedItem?.id === item.id;
                      const tone = bucketTone[item.bucket];

                      return (
                        <Box
                          key={item.id}
                          component="button"
                          type="button"
                          onClick={() => handleSelectItem(item.bucket, item.id)}
                          aria-pressed={isSelected}
                          aria-label={`${item.title} 상세 보기`}
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1.5,
                            width: '100%',
                            border: `1px solid ${isSelected ? tone.color : '#e5e7eb'}`,
                            backgroundColor: isSelected ? tone.light : '#fff',
                            borderRadius: 2.5,
                            p: 2,
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              borderColor: tone.color,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              alignSelf: 'stretch',
                              borderRadius: 999,
                              backgroundColor: tone.color,
                              flexShrink: 0,
                            }}
                          />

                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                              {item.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {item.source}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                mt: 1,
                                color: isSelected ? tone.color : 'text.secondary',
                              }}
                            >
                              왜 지금 검토가 필요한가: {item.why}
                            </Typography>
                          </Box>

                          <Chip
                            size="small"
                            label={item.recommendation}
                            sx={{
                              maxWidth: 148,
                              '& .MuiChip-label': {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              },
                              backgroundColor: '#fff',
                              border: `1px solid ${tone.border}`,
                              color: tone.color,
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>

            {selectedItem && (
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Stack spacing={2}>
                    <Box>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                        <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
                          {selectedItem.title}
                        </Typography>
                        <Chip
                          size="small"
                          label={selectedItem.recommendation}
                          sx={{
                            backgroundColor: bucketTone[selectedItem.bucket].light,
                            color: bucketTone[selectedItem.bucket].color,
                            fontWeight: 600,
                          }}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                        {selectedItem.source}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        border: '1px solid #ddd6fe',
                        backgroundColor: '#faf5ff',
                        borderRadius: 2.5,
                        p: 2,
                      }}
                    >
                      <Typography variant="overline" sx={{ color: '#7c3aed', fontWeight: 700, lineHeight: 1.2 }}>
                        왜 지금 검토가 필요한가
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.75, fontWeight: 700, color: 'text.primary' }}>
                        {selectedItem.why}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, lineHeight: 1.6 }}>
                        {selectedItem.summary}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.25 }}>
                        근거 자료
                      </Typography>
                      <Stack component="ul" spacing={1} sx={{ listStyle: 'none', p: 0, m: 0 }}>
                        {selectedItem.evidence.map((entry) => {
                          const tone = evidenceTone[entry.type];

                          return (
                            <Box
                              key={entry.id}
                              component="li"
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1,
                                border: '1px solid #e5e7eb',
                                borderRadius: 2,
                                px: 1.25,
                                py: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 1.5,
                                  backgroundColor: tone.bg,
                                  color: tone.color,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {tone.icon}
                              </Box>
                              <Typography variant="body2" color="text.primary">
                                {entry.label}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      {selectedItem.actions.map((action) => (
                        <Button key={action.id} size="small" component={Link} href={action.href} {...getActionButtonProps(action)}>
                          {action.label}
                        </Button>
                      ))}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Box>
        </>
      ) : null}
    </Box>
  );
}
