'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Face as FaceIcon,
  ThreeSixty as AngleIcon,
  SentimentSatisfied as ExpressionIcon,
  HighQuality as QualityIcon,
  LocalActivity as ActivityIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  Image as ImageIcon,
  Info as InfoIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { axiosMultipart } from '@/utils/axios';

interface PhotoValidationResult {
  totalScore: number;
  breakdown: {
    face: number;
    angle: number;
    expression: number;
    quality: number;
    activity: number;
    safeSearchPenalty: number;
  };
  reasons: {
    face: string;
    angle: string;
    expression: string;
    quality: string;
    activity: string;
    safeSearch: string;
  };
  decision: {
    autoDecision: 'approved' | 'manual_review' | 'rejected';
    reason: string;
    priority: 'high' | 'normal' | 'low';
  };
  isInappropriate: boolean;
  faceAnalysis: {
    faceCount: number;
    primaryFace: {
      confidence: number;
      faceRatio: number;
      panAngle: number;
      tiltAngle: number;
      joyLikelihood: string;
    } | null;
  };
  safeSearch: {
    adult: string;
    violence: string;
    racy: string;
    isInappropriate: boolean;
    requiresManualReview: boolean;
  };
  labelAnalysis: {
    hasActivityLabels: boolean;
    activityLabels: string[];
    topLabels: { description: string; score: number }[];
  };
  qualityAnalysis: {
    width: number;
    height: number;
    fileSize: number;
    blurVariance: number;
    longEdge: number;
    isValid: boolean;
  };
  processingTimeMs: number;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#22c55e';
  if (score >= 40) return '#eab308';
  return '#ef4444';
};

const getDecisionBadge = (decision: string) => {
  switch (decision) {
    case 'approved':
      return { label: '자동 승인', color: 'success' as const, icon: <CheckCircleIcon /> };
    case 'manual_review':
      return { label: '수동 검토', color: 'warning' as const, icon: <WarningIcon /> };
    case 'rejected':
      return { label: '반려', color: 'error' as const, icon: <CancelIcon /> };
    default:
      return { label: '알 수 없음', color: 'default' as const, icon: <InfoIcon /> };
  }
};

const getLikelihoodColor = (likelihood: string): string => {
  switch (likelihood) {
    case 'VERY_UNLIKELY':
    case 'UNLIKELY':
      return '#22c55e';
    case 'POSSIBLE':
      return '#eab308';
    case 'LIKELY':
    case 'VERY_LIKELY':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const ScoreGauge = ({ score, size = 160 }: { score: number; size?: number }) => {
  const color = getScoreColor(score);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <Box sx={{ position: 'relative', width: size, height: size, mx: 'auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <Typography variant="h3" fontWeight="bold" sx={{ color }}>
          {score}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          / 100점
        </Typography>
      </Box>
    </Box>
  );
};

const ScoreBreakdownCard = ({
  icon,
  label,
  score,
  maxScore,
  reason,
  isPenalty = false,
}: {
  icon: React.ReactNode;
  label: string;
  score: number;
  maxScore: number;
  reason: string;
  isPenalty?: boolean;
}) => {
  const percentage = isPenalty ? 0 : (score / maxScore) * 100;
  const displayScore = isPenalty ? -score : score;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {icon}
          <Typography variant="subtitle2" fontWeight="medium">
            {label}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            sx={{ color: isPenalty ? '#ef4444' : getScoreColor(percentage) }}
          >
            {displayScore}점 / {isPenalty ? '감점' : `${maxScore}점`}
          </Typography>
        </Box>
        {!isPenalty && (
          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#e5e7eb',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getScoreColor(percentage),
                borderRadius: 4,
              },
            }}
          />
        )}
        <Tooltip title={reason} arrow>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 1,
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'help',
            }}
          >
            {reason}
          </Typography>
        </Tooltip>
      </CardContent>
    </Card>
  );
};

const AngleIndicator = ({ panAngle, tiltAngle }: { panAngle: number; tiltAngle: number }) => {
  const maxAngle = 45;
  const panNormalized = Math.max(-maxAngle, Math.min(maxAngle, panAngle));
  const tiltNormalized = Math.max(-maxAngle, Math.min(maxAngle, tiltAngle));

  return (
    <Box sx={{ position: 'relative', width: 100, height: 100, mx: 'auto', my: 2 }}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 80,
          height: 80,
          borderRadius: '50%',
          border: '2px solid #e5e7eb',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          transform: `translate(calc(-50% + ${(panNormalized / maxAngle) * 30}px), calc(-50% + ${(tiltNormalized / maxAngle) * 30}px))`,
          transition: 'transform 0.3s ease',
        }}
      />
      <Typography
        variant="caption"
        sx={{ position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)' }}
      >
        상
      </Typography>
      <Typography
        variant="caption"
        sx={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)' }}
      >
        하
      </Typography>
      <Typography
        variant="caption"
        sx={{ position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)' }}
      >
        좌
      </Typography>
      <Typography
        variant="caption"
        sx={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)' }}
      >
        우
      </Typography>
    </Box>
  );
};

export default function VisionPhotoTestTab() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PhotoValidationResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(heic|heif)$/i)) {
      setError('지원하지 않는 파일 형식입니다. JPEG, PNG, WebP, HEIC 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('파일 크기가 20MB를 초과했습니다.');
      return;
    }

    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axiosMultipart.post('/admin/photo-validation/test', formData);
      setResult(response.data);
    } catch (err: any) {
      console.error('Photo validation error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          '사진 검증 중 오류가 발생했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const decisionBadge = result ? getDecisionBadge(result.decision.autoDecision) : null;

  return (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        프로필 사진을 업로드하여 AI 검증 결과를 테스트합니다. 실제 DB에 저장되지 않습니다.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              p: 4,
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              backgroundColor: isDragging ? 'primary.50' : 'grey.50',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50',
              },
            }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
            {isLoading ? (
              <Box>
                <CircularProgress size={48} sx={{ mb: 2 }} />
                <Typography>검증 중...</Typography>
              </Box>
            ) : (
              <>
                <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  이미지를 드래그하거나 클릭하여 업로드
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  JPEG, PNG, WebP, HEIC (최대 20MB)
                </Typography>
              </>
            )}
          </Paper>

          {previewUrl && (
            <Paper sx={{ mt: 2, p: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ImageIcon fontSize="small" />
                업로드된 이미지
              </Typography>
              <Box
                component="img"
                src={previewUrl}
                alt="Preview"
                sx={{
                  width: '100%',
                  maxHeight: 300,
                  objectFit: 'contain',
                  borderRadius: 1,
                }}
              />
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={8}>
          {result && (
            <Box>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <ScoreGauge score={result.totalScore} />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Chip
                        icon={decisionBadge?.icon}
                        label={decisionBadge?.label}
                        color={decisionBadge?.color}
                        size="medium"
                        sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2.5 }}
                      />
                      <Chip
                        label={`우선순위: ${result.decision.priority === 'high' ? '높음' : result.decision.priority === 'normal' ? '보통' : '낮음'}`}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimerIcon fontSize="small" />
                      처리 시간: {result.processingTimeMs}ms
                    </Typography>
                    {result.isInappropriate && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        부적절한 콘텐츠가 감지되었습니다.
                      </Alert>
                    )}
                  </Grid>
                </Grid>
              </Paper>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                점수 상세 내역
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <ScoreBreakdownCard
                    icon={<FaceIcon color="primary" />}
                    label="얼굴 감지"
                    score={result.breakdown.face}
                    maxScore={40}
                    reason={result.reasons.face}
                  />
                  <ScoreBreakdownCard
                    icon={<AngleIcon color="primary" />}
                    label="얼굴 각도"
                    score={result.breakdown.angle}
                    maxScore={15}
                    reason={result.reasons.angle}
                  />
                  <ScoreBreakdownCard
                    icon={<ExpressionIcon color="primary" />}
                    label="표정"
                    score={result.breakdown.expression}
                    maxScore={10}
                    reason={result.reasons.expression}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ScoreBreakdownCard
                    icon={<QualityIcon color="primary" />}
                    label="이미지 품질"
                    score={result.breakdown.quality}
                    maxScore={25}
                    reason={result.reasons.quality}
                  />
                  <ScoreBreakdownCard
                    icon={<ActivityIcon color="primary" />}
                    label="활동 라벨"
                    score={result.breakdown.activity}
                    maxScore={10}
                    reason={result.reasons.activity}
                  />
                  {result.breakdown.safeSearchPenalty > 0 && (
                    <ScoreBreakdownCard
                      icon={<SecurityIcon color="error" />}
                      label="SafeSearch 감점"
                      score={result.breakdown.safeSearchPenalty}
                      maxScore={100}
                      reason={result.reasons.safeSearch}
                      isPenalty
                    />
                  )}
                </Grid>
              </Grid>

              <Accordion sx={{ mt: 3 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FaceIcon /> 얼굴 분석 상세
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        감지된 얼굴 수
                      </Typography>
                      <Typography variant="h6">{result.faceAnalysis.faceCount}개</Typography>
                    </Grid>
                    {result.faceAnalysis.primaryFace && (
                      <>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" color="text.secondary">
                            신뢰도
                          </Typography>
                          <Typography variant="h6">
                            {(result.faceAnalysis.primaryFace.confidence * 100).toFixed(1)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" color="text.secondary">
                            얼굴 비율
                          </Typography>
                          <Typography variant="h6">
                            {(result.faceAnalysis.primaryFace.faceRatio * 100).toFixed(1)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                            얼굴 각도 (Pan: {result.faceAnalysis.primaryFace.panAngle.toFixed(1)}°, Tilt: {result.faceAnalysis.primaryFace.tiltAngle.toFixed(1)}°)
                          </Typography>
                          <AngleIndicator
                            panAngle={result.faceAnalysis.primaryFace.panAngle}
                            tiltAngle={result.faceAnalysis.primaryFace.tiltAngle}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            밝은 표정 가능성
                          </Typography>
                          <Chip
                            label={result.faceAnalysis.primaryFace.joyLikelihood}
                            size="small"
                            sx={{
                              backgroundColor: getLikelihoodColor(result.faceAnalysis.primaryFace.joyLikelihood),
                              color: 'white',
                            }}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon /> SafeSearch 분석
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        성인 콘텐츠
                      </Typography>
                      <Chip
                        label={result.safeSearch.adult}
                        size="small"
                        sx={{
                          backgroundColor: getLikelihoodColor(result.safeSearch.adult),
                          color: 'white',
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        폭력성
                      </Typography>
                      <Chip
                        label={result.safeSearch.violence}
                        size="small"
                        sx={{
                          backgroundColor: getLikelihoodColor(result.safeSearch.violence),
                          color: 'white',
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        선정성
                      </Typography>
                      <Chip
                        label={result.safeSearch.racy}
                        size="small"
                        sx={{
                          backgroundColor: getLikelihoodColor(result.safeSearch.racy),
                          color: 'white',
                        }}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ActivityIcon /> 라벨 분석
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {result.labelAnalysis.activityLabels.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        활동 라벨
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {result.labelAnalysis.activityLabels.map((label) => (
                          <Chip
                            key={label}
                            label={label}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    상위 라벨
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {result.labelAnalysis.topLabels.map((label) => (
                      <Tooltip key={label.description} title={`신뢰도: ${(label.score * 100).toFixed(1)}%`}>
                        <Chip
                          label={`${label.description} (${(label.score * 100).toFixed(0)}%)`}
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <QualityIcon /> 이미지 품질
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        해상도
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {result.qualityAnalysis.width} x {result.qualityAnalysis.height}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        긴 변
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {result.qualityAnalysis.longEdge}px
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        파일 크기
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatFileSize(result.qualityAnalysis.fileSize)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        선명도 (Blur Variance)
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {result.qualityAnalysis.blurVariance.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}

          {!result && !isLoading && (
            <Paper sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <ImageIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                이미지를 업로드하면 분석 결과가 여기에 표시됩니다
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
