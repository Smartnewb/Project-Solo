'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  TrendingDown as TrendingDownIcon,
  ArrowForward as ArrowForwardIcon,
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dashboardService.getGemSystemFunnel();
        setData(response);
      } catch (err) {
        console.error('구슬 시스템 퍼널 조회 실패:', err);
        setError('매칭 퍼널 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleViewTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: 'total' | 'byType' | null,
  ) => {
    if (newValue !== null) {
      setViewType(newValue);
    }
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

      {viewType === 'total' ? (
        <FunnelSection funnel={data.totalFunnel} />
      ) : (
        data.funnelByType.map((funnel) => (
          <FunnelSection key={funnel.type} funnel={funnel} />
        ))
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        * 전환율은 이전 단계 대비 비율입니다. 막대 위에 마우스를 올리면 전체 대비 비율을 확인할 수 있습니다.
      </Typography>
    </Paper>
  );
}
