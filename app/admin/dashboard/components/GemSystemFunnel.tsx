'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  TrendingDown as TrendingDownIcon,
  ArrowForward as ArrowForwardIcon,
  BugReport as BugReportIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { dashboardService } from '@/app/services/dashboard';
import {
  GemSystemFunnelResponse,
  MatchingTypeFunnel,
} from '../types';

const FUNNEL_COLORS = [
  '#4CAF50',
  '#2196F3',
  '#FF9800',
  '#E91E63',
];

interface FunnelBarProps {
  step: {
    name: string;
    count: number;
    conversionRate: number;
    overallConversionRate: number;
  };
  index: number;
  maxCount: number;
  isLast: boolean;
}

const FunnelBar = ({ step, index, maxCount, isLast }: FunnelBarProps) => {
  const widthPercent = maxCount > 0 ? (step.count / maxCount) * 100 : 0;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
      <Box sx={{ width: 100, flexShrink: 0 }}>
        <Typography variant="body2" fontWeight="medium">
          {step.name}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, mx: 2 }}>
        <Tooltip
          title={`전체 대비: ${step.overallConversionRate}%`}
          placement="top"
        >
          <Box
            sx={{
              height: 32,
              bgcolor: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
              borderRadius: 1,
              width: `${Math.max(widthPercent, 5)}%`,
              transition: 'width 0.5s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              pr: 1,
              minWidth: 60,
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: 'white', fontWeight: 'bold' }}
            >
              {step.count.toLocaleString()}
            </Typography>
          </Box>
        </Tooltip>
      </Box>
      <Box sx={{ width: 80, textAlign: 'right', flexShrink: 0 }}>
        {!isLast && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <TrendingDownIcon
              sx={{
                fontSize: 16,
                color: step.conversionRate >= 50 ? 'success.main' : 'warning.main',
                mr: 0.5,
              }}
            />
            <Typography
              variant="body2"
              color={step.conversionRate >= 50 ? 'success.main' : 'warning.main'}
              fontWeight="medium"
            >
              {step.conversionRate}%
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

interface FunnelSectionProps {
  funnel: MatchingTypeFunnel;
}

const FunnelSection = ({ funnel }: FunnelSectionProps) => {
  const maxCount = Math.max(...funnel.steps.map(s => s.count));
  const firstStep = funnel.steps[0];
  const lastStep = funnel.steps[funnel.steps.length - 1];
  const overallRate = firstStep.count > 0
    ? ((lastStep.count / firstStep.count) * 100).toFixed(1)
    : '0';

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {funnel.typeName}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            전체 전환율:
          </Typography>
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            color={Number(overallRate) >= 10 ? 'success.main' : 'warning.main'}
          >
            {overallRate}%
          </Typography>
        </Box>
      </Box>

      {funnel.steps.map((step, index) => (
        <Box key={step.name}>
          <FunnelBar
            step={step}
            index={index}
            maxCount={maxCount}
            isLast={index === funnel.steps.length - 1}
          />
          {index < funnel.steps.length - 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
              <ArrowForwardIcon
                sx={{ fontSize: 16, color: 'text.disabled', transform: 'rotate(90deg)' }}
              />
            </Box>
          )}
        </Box>
      ))}
    </Paper>
  );
};

export default function GemSystemFunnel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GemSystemFunnelResponse | null>(null);
  const [viewType, setViewType] = useState<'total' | 'byType'>('total');
  const [debugMode, setDebugMode] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchData = useCallback(async (debug: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getGemSystemFunnel(undefined, undefined, debug);
      setData(response);
    } catch (err) {
      setError('매칭 퍼널 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(debugMode);
  }, [debugMode, fetchData]);

  const handleViewTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: 'total' | 'byType' | null,
  ) => {
    if (newValue !== null) {
      setViewType(newValue);
    }
  };

  const handleCopyQuery = async (queryName: string, query: string) => {
    try {
      await navigator.clipboard.writeText(query);
      setCopied(queryName);
      setTimeout(() => setCopied(null), 2000);
    } catch { }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2 }}>
            매칭 퍼널 데이터 로딩 중...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            매칭 전환 퍼널
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {data.period.startDate} ~ {data.period.endDate} (구슬 시스템 도입 이후)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="디버그 모드 (SQL 쿼리 확인)">
            <IconButton
              size="small"
              onClick={() => setDebugMode(!debugMode)}
              color={debugMode ? 'primary' : 'default'}
            >
              <BugReportIcon />
            </IconButton>
          </Tooltip>
          <ToggleButtonGroup
            value={viewType}
            exclusive
            onChange={handleViewTypeChange}
            size="small"
          >
            <ToggleButton value="total">
              전체
            </ToggleButton>
            <ToggleButton value="byType">
              타입별
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {viewType === 'total' ? (
        <FunnelSection funnel={data.totalFunnel} />
      ) : (
        data.funnelByType.map((funnel) => (
          <FunnelSection key={funnel.type} funnel={funnel} />
        ))
      )}

      <Collapse in={debugMode && !!data.debug}>
        <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.100' }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
            🔍 디버그 정보 (SQL 쿼리)
          </Typography>

          {data.debug && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { name: 'matchesQuery', label: '매칭 수 쿼리' },
                { name: 'likesQuery', label: '좋아요 수 쿼리' },
                { name: 'mutualLikesQuery', label: '상호 좋아요 수 쿼리' },
                { name: 'chatRoomsQuery', label: '채팅방 수 쿼리' },
              ].map(({ name, label }) => (
                <Box key={name}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="caption" fontWeight="bold">
                      {label}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleCopyQuery(name, data.debug![name as keyof typeof data.debug] as string)}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    {copied === name && (
                      <Typography variant="caption" color="success.main">
                        복사됨!
                      </Typography>
                    )}
                  </Box>
                  <Box
                    component="pre"
                    sx={{
                      p: 1,
                      bgcolor: 'grey.900',
                      color: 'grey.100',
                      borderRadius: 1,
                      overflow: 'auto',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      m: 0,
                    }}
                  >
                    {data.debug![name as keyof typeof data.debug] as string}
                  </Box>
                </Box>
              ))}

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="caption" fontWeight="bold">
                    Raw 결과
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleCopyQuery('rawResults', JSON.stringify(data.debug!.rawResults, null, 2))}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                  {copied === 'rawResults' && (
                    <Typography variant="caption" color="success.main">
                      복사됨!
                    </Typography>
                  )}
                </Box>
                <Box
                  component="pre"
                  sx={{
                    p: 1,
                    bgcolor: 'grey.900',
                    color: 'grey.100',
                    borderRadius: 1,
                    overflow: 'auto',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    m: 0,
                  }}
                >
                  {JSON.stringify(data.debug.rawResults, null, 2)}
                </Box>
              </Box>
            </Box>
          )}
        </Paper>
      </Collapse>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        * 전환율은 이전 단계 대비 비율입니다. 막대 위에 마우스를 올리면 전체 대비 비율을 확인할 수 있습니다.
      </Typography>
    </Paper>
  );
}
