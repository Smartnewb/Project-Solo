'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import MapIcon from '@mui/icons-material/Map';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { Button } from '@/shared/ui';
import { scheduledMatchingService } from '../service';
import type { Country, ScheduledMatchingConfig, JobStatus, BatchHistory, ScheduleMatchingResponse } from '../types';
import type { MatchingPoolStatsResponse, MatchingPoolCountry, MatchTypeStats } from '@/types/admin';

type MatchingType = 'scheduled' | 'rematching';

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 6);
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
};
import { safeToLocaleString, safeToLocaleDateString } from '@/app/utils/formatters';
import { parseCronToHumanReadable, formatNextExecution, getTimeDiff } from '../utils';
import RegionMapView from './RegionMapView';

interface CountryCardProps {
  country: Country;
  config: ScheduledMatchingConfig | null;
  jobStatus: JobStatus | null;
  lastBatch: BatchHistory | null;
  onTrigger: (country: Country) => void;
  triggering: boolean;
}

function CountryCard({
  country,
  config,
  jobStatus,
  lastBatch,
  onTrigger,
  triggering,
}: CountryCardProps) {
  const countryInfo = {
    KR: { flag: '🇰🇷', name: '한국', timezone: 'KST' },
    JP: { flag: '🇯🇵', name: '일본', timezone: 'JST' },
  };

  const info = countryInfo[country];
  const isEnabled = config?.isEnabled ?? false;
  const successRate = lastBatch
    ? lastBatch.totalUsers > 0
      ? ((lastBatch.successCount / lastBatch.totalUsers) * 100).toFixed(1)
      : '0.0'
    : null;

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {info.flag} {info.name}
        </Typography>
        <Chip
          label={isEnabled ? '활성화' : '비활성화'}
          color={isEnabled ? 'success' : 'default'}
          size="small"
        />
      </Box>

      {!config ? (
        <Typography color="text.secondary">설정 없음</Typography>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              스케줄
            </Typography>
            <Typography variant="body1">
              {parseCronToHumanReadable(config.cronExpression)} ({info.timezone})
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              다음 실행
            </Typography>
            {jobStatus?.nextExecution ? (
              <Box>
                <Typography variant="body1">
                  {formatNextExecution(jobStatus.nextExecution)}
                </Typography>
                <Typography variant="caption" color="primary">
                  {getTimeDiff(jobStatus.nextExecution)}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                예정 없음
              </Typography>
            )}
          </Box>

          {lastBatch && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                최근 실행 ({safeToLocaleDateString(lastBatch.startedAt)})
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={parseFloat(successRate || '0')}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  color={parseFloat(successRate || '0') >= 90 ? 'success' : 'warning'}
                />
                <Typography variant="body2" fontWeight="medium">
                  {successRate}%
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {lastBatch.totalUsers}명 중 {lastBatch.successCount}명 성공
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTrigger(country)}
              disabled={triggering}
            >
              {triggering ? (
                <CircularProgress size={16} sx={{ mr: 1 }} />
              ) : (
                <PlayArrowIcon sx={{ fontSize: 16, mr: 0.5 }} />
              )}
              수동 실행
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
}

interface RunningBatchAlertProps {
  batch: BatchHistory;
  onCancel: (batchId: string) => void;
  cancelling: boolean;
}

function RunningBatchAlert({ batch, onCancel, cancelling }: RunningBatchAlertProps) {
  const progress = batch.totalUsers > 0
    ? Math.round((batch.processedUsers / batch.totalUsers) * 100)
    : 0;

  const countryFlag = batch.country === 'KR' ? '🇰🇷' : '🇯🇵';

  return (
    <Alert
      severity="info"
      sx={{ mb: 2 }}
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCancel(batch.id)}
          disabled={cancelling}
        >
          {cancelling ? <CircularProgress size={14} /> : <StopIcon sx={{ fontSize: 14 }} />}
          취소
        </Button>
      }
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
        <Typography>
          {countryFlag} {batch.country} 배치 실행 중
        </Typography>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
          />
          <Typography variant="body2">
            {batch.processedUsers}/{batch.totalUsers}명 ({progress}%)
          </Typography>
        </Box>
      </Box>
    </Alert>
  );
}

export default function CountryOverview() {
  const [configs, setConfigs] = useState<ScheduledMatchingConfig[]>([]);
  const [jobStatuses, setJobStatuses] = useState<JobStatus[]>([]);
  const [runningBatches, setRunningBatches] = useState<BatchHistory[]>([]);
  const [lastBatches, setLastBatches] = useState<Record<Country, BatchHistory | null>>({
    KR: null,
    JP: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState<Country | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const [mapCountry, setMapCountry] = useState<MatchingPoolCountry>('KR');
  const [mapStats, setMapStats] = useState<MatchingPoolStatsResponse | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [matchingType, setMatchingType] = useState<MatchingType>('scheduled');
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  // Schedule matching state
  const [scheduleCountry, setScheduleCountry] = useState<Country>('KR');
  const [scheduleExecuting, setScheduleExecuting] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<ScheduleMatchingResponse | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [configsRes, jobStatusRes, runningRes] = await Promise.all([
        scheduledMatchingService.getAllConfigs(),
        scheduledMatchingService.getAllJobStatus(),
        scheduledMatchingService.getRunningBatches(),
      ]);

      setConfigs(configsRes);
      setJobStatuses(jobStatusRes);
      setRunningBatches(runningRes);

      const batchPromises = (['KR', 'JP'] as Country[]).map(async (country) => {
        try {
          const batches = await scheduledMatchingService.getBatchesByCountry(country, 1, 0);
          return { country, batch: batches[0] || null };
        } catch {
          return { country, batch: null };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const newLastBatches: Record<Country, BatchHistory | null> = { KR: null, JP: null };
      batchResults.forEach(({ country, batch }) => {
        newLastBatches[country] = batch;
      });
      setLastBatches(newLastBatches);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const fetchMapStats = useCallback(async (
    country: MatchingPoolCountry,
    startDate: string,
    endDate: string
  ) => {
    try {
      setMapLoading(true);
      setMapError(null);
      const stats = await scheduledMatchingService.getMatchingPoolStats(country, startDate, endDate);
      setMapStats(stats);
    } catch (err) {
      setMapError('지도 데이터를 불러오는데 실패했습니다.');
      setMapStats(null);
    } finally {
      setMapLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapStats(mapCountry, dateRange.startDate, dateRange.endDate);
  }, [mapCountry, dateRange, fetchMapStats]);

  const handleMapCountryChange = (_: React.MouseEvent<HTMLElement>, newCountry: MatchingPoolCountry | null) => {
    if (newCountry) {
      setMapCountry(newCountry);
    }
  };

  const handleMatchingTypeChange = (_: React.MouseEvent<HTMLElement>, newType: MatchingType | null) => {
    if (newType) {
      setMatchingType(newType);
    }
  };

  const handleDateChange = (field: 'startDate' | 'endDate') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, [field]: e.target.value }));
  };

  const currentStats: MatchTypeStats | null = mapStats ? mapStats[matchingType] : null;

  const handleTrigger = async (country: Country) => {
    try {
      setTriggering(country);
      await scheduledMatchingService.triggerManualExecution(country);
      fetchData();
    } catch (err) {
      setError('수동 실행에 실패했습니다.');
    } finally {
      setTriggering(null);
    }
  };

  const handleCancelBatch = async (batchId: string) => {
    try {
      setCancelling(batchId);
      await scheduledMatchingService.cancelBatch(batchId);
      fetchData();
    } catch (err) {
      setError('배치 취소에 실패했습니다.');
    } finally {
      setCancelling(null);
    }
  };

  const handleScheduleMatching = async () => {
    if (!confirm(`${scheduleCountry === 'KR' ? '한국' : '일본'} 오늘자 스케줄 매칭을 실행하시겠습니까?`)) {
      return;
    }

    try {
      setScheduleExecuting(true);
      setScheduleError(null);
      setScheduleResult(null);

      const today = formatDate(new Date());
      const result = await scheduledMatchingService.executeScheduleMatching({
        targetDate: today,
      });

      setScheduleResult(result);
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '스케줄 매칭 실행에 실패했습니다.';
      setScheduleError(errorMessage);
    } finally {
      setScheduleExecuting(false);
    }
  };

  const getConfigForCountry = (country: Country) =>
    configs.find((c) => c.country === country) || null;

  const getJobStatusForCountry = (country: Country) =>
    jobStatuses.find((s) => s.country === country) || null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">국가별 현황</Typography>
        <Tooltip title="새로고침">
          <IconButton onClick={fetchData} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {runningBatches.map((batch) => (
        <RunningBatchAlert
          key={batch.id}
          batch={batch}
          onCancel={handleCancelBatch}
          cancelling={cancelling === batch.id}
        />
      ))}

      <Grid container spacing={3}>
        {(['KR', 'JP'] as Country[]).map((country) => (
          <Grid item xs={12} md={6} key={country}>
            <CountryCard
              country={country}
              config={getConfigForCountry(country)}
              jobStatus={getJobStatusForCountry(country)}
              lastBatch={lastBatches[country]}
              onTrigger={handleTrigger}
              triggering={triggering === country}
            />
          </Grid>
        ))}
      </Grid>

      {/* 수동 스케줄 매칭 실행 */}
      <Paper sx={{ mt: 4, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <RocketLaunchIcon color="primary" />
          <Typography variant="h6">수동 스케줄 매칭 실행</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          오늘 날짜 기준으로 적격 유저들의 스케줄 매칭을 수동으로 실행합니다.
          매칭은 Queue를 통해 순차 처리됩니다.
        </Typography>

        {scheduleError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setScheduleError(null)}>
            {scheduleError}
          </Alert>
        )}

        {scheduleResult && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setScheduleResult(null)}>
            {scheduleResult.message}
            <br />
            <Typography variant="caption">
              대상 유저: {scheduleResult.eligibleUsersCount}명 | 배치 ID: {scheduleResult.batchId}
            </Typography>
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
          <ToggleButtonGroup
            value={scheduleCountry}
            exclusive
            onChange={(_, value) => value && setScheduleCountry(value)}
            size="small"
          >
            <ToggleButton value="KR">🇰🇷 한국</ToggleButton>
            <ToggleButton value="JP">🇯🇵 일본</ToggleButton>
          </ToggleButtonGroup>

          <Typography variant="body2" color="text.secondary">
            대상일: {formatDate(new Date())}
          </Typography>

          <Button
            onClick={handleScheduleMatching}
            disabled={scheduleExecuting}
          >
            {scheduleExecuting ? (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ) : (
              <PlayArrowIcon sx={{ fontSize: 18, mr: 0.5 }} />
            )}
            스케줄 매칭 실행
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 현재 매칭 필터 설정 표시 */}
        {(() => {
          const currentConfig = getConfigForCountry(scheduleCountry);
          if (!currentConfig) {
            return (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {scheduleCountry === 'KR' ? '한국' : '일본'} 설정이 없습니다. 스케줄 설정 탭에서 먼저 설정을 생성해주세요.
              </Alert>
            );
          }
          return (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                현재 매칭 필터 설정 ({scheduleCountry === 'KR' ? '한국' : '일본'})
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      로그인 기준일
                    </Typography>
                    <Typography variant="h6">
                      {currentConfig.loginWindowDays ?? 60}일
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      최근 {currentConfig.loginWindowDays ?? 60}일 이내 로그인한 유저만 대상
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      UNKNOWN 랭크 포함
                    </Typography>
                    <Typography variant="h6">
                      <Chip
                        label={currentConfig.includeUnknownRank ? 'ON' : 'OFF'}
                        color={currentConfig.includeUnknownRank ? 'success' : 'default'}
                        size="small"
                      />
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {currentConfig.includeUnknownRank
                        ? '랭크 미산정 유저 포함'
                        : '랭크 미산정 유저 제외'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      스케줄 상태
                    </Typography>
                    <Typography variant="h6">
                      <Chip
                        label={currentConfig.isEnabled ? '활성화' : '비활성화'}
                        color={currentConfig.isEnabled ? 'success' : 'default'}
                        size="small"
                      />
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {currentConfig.cronExpression}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              <Alert severity="info" sx={{ mt: 2 }}>
                매칭 필터 설정을 변경하려면 <strong>스케줄 설정</strong> 탭에서 수정해주세요.
              </Alert>
            </Box>
          );
        })()}
      </Paper>

      <Paper sx={{ mt: 4, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapIcon color="primary" />
            <Typography variant="h6">매칭풀 지역별 현황</Typography>
          </Box>
          <Tooltip title="지도 새로고침">
            <IconButton
              onClick={() => fetchMapStats(mapCountry, dateRange.startDate, dateRange.endDate)}
              size="small"
              disabled={mapLoading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
          <TextField
            type="date"
            label="시작일"
            value={dateRange.startDate}
            onChange={handleDateChange('startDate')}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          <TextField
            type="date"
            label="종료일"
            value={dateRange.endDate}
            onChange={handleDateChange('endDate')}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          <ToggleButtonGroup
            value={mapCountry}
            exclusive
            onChange={handleMapCountryChange}
            size="small"
          >
            <ToggleButton value="KR">🇰🇷 한국</ToggleButton>
            <ToggleButton value="JP">🇯🇵 일본</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={matchingType}
            exclusive
            onChange={handleMatchingTypeChange}
            size="small"
          >
            <ToggleButton value="scheduled">스케줄 매칭</ToggleButton>
            <ToggleButton value="rematching">재매칭</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {mapError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setMapError(null)}>
            {mapError}
          </Alert>
        )}

        {mapLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 1000 }}>
            <CircularProgress />
          </Box>
        ) : currentStats ? (
          <>
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="h5" fontWeight="bold">
                      {currentStats.summary.totalUsers.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      총 유저
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {currentStats.summary.genderRatio !== null
                        ? `${currentStats.summary.genderRatio.toFixed(2)}:1`
                        : 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      성비 (남/여)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="h5" fontWeight="bold">
                      {currentStats.summary.avgAge.toFixed(1)}세
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      평균 나이
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="h5" fontWeight="bold" color="warning.main">
                      {(currentStats.summary.overallMutualLikeRate * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      상호 좋아요율
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="h5" fontWeight="bold" color="info.main">
                      {(currentStats.summary.overallLikeConversionRate * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      좋아요 전환율
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      {(currentStats.summary.overallMatchToChatRate * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      채팅 전환율
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <RegionMapView data={{ country: mapCountry, regions: currentStats.regions }} />

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#3B82F6' }} />
                  <Typography variant="caption">남초</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#8B5CF6' }} />
                  <Typography variant="caption">균형</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#EC4899' }} />
                  <Typography variant="caption">여초</Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                업데이트: {mapStats && safeToLocaleString(mapStats.cachedAt)}
              </Typography>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 1000 }}>
            <Typography color="text.secondary">데이터가 없습니다.</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
