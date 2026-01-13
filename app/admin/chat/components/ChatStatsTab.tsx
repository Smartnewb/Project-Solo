'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Button,
  ButtonGroup,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import {
  Refresh as RefreshIcon,
  Chat as ChatIcon,
  Message as MessageIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
} from '@mui/icons-material';
import chatService, {
  ChatStatsResponse,
  DatePreset,
} from '@/app/services/chat';

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: '7일', value: '7days' },
  { label: '14일', value: '14days' },
  { label: '30일', value: '30days' },
  { label: '전체', value: 'all' },
];

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
}

const StatCard = ({ title, value, subtitle, icon, color = '#1976d2' }: StatCardProps) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{ color }}>{icon}</Box>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export default function ChatStatsTab() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<ChatStatsResponse | null>(null);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('30days');

  const fetchStats = async (preset?: DatePreset) => {
    setLoading(true);
    setError('');

    try {
      const params: any = {};

      if (preset) {
        params.preset = preset;
      } else if (startDate && endDate) {
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = endDate.toISOString().split('T')[0];
      } else {
        params.preset = selectedPreset;
      }

      const response = await chatService.getChatStats(params);
      setStats(response);
    } catch (error: any) {
      console.error('채팅 통계 조회 실패:', error);
      setError(error.message || '채팅 통계를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (preset: DatePreset) => {
    setSelectedPreset(preset);
    setStartDate(null);
    setEndDate(null);
    fetchStats(preset);
  };

  const handleCustomDateSearch = () => {
    if (!startDate || !endDate) return;
    fetchStats();
  };

  useEffect(() => {
    fetchStats(selectedPreset);
  }, []);

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes.toFixed(1)}분`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}시간 ${mins}분`;
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="시작 날짜"
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
              }}
              slotProps={{
                textField: { size: 'small' }
              }}
            />
            <DatePicker
              label="종료 날짜"
              value={endDate}
              onChange={(date) => {
                setEndDate(date);
              }}
              slotProps={{
                textField: { size: 'small' }
              }}
            />
          </LocalizationProvider>

          <Button
            variant="contained"
            onClick={handleCustomDateSearch}
            disabled={loading || !startDate || !endDate}
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          >
            조회
          </Button>

          <ButtonGroup variant="outlined" size="small">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.value}
                onClick={() => handlePresetClick(preset.value)}
                variant={selectedPreset === preset.value && !startDate && !endDate ? 'contained' : 'outlined'}
                disabled={loading}
              >
                {preset.label}
              </Button>
            ))}
          </ButtonGroup>
        </Box>

        {stats && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            조회 기간: {stats.startDate} ~ {stats.endDate}
          </Typography>
        )}
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : stats ? (
        <>
          <Typography variant="h6" gutterBottom>
            요약 통계
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="전체 채팅방"
                value={stats.summary.totalRooms.toLocaleString()}
                subtitle={`활성: ${stats.summary.activeRooms.toLocaleString()}개`}
                icon={<ChatIcon />}
                color="#1976d2"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="전체 메시지"
                value={stats.summary.totalMessages.toLocaleString()}
                subtitle={`평균 ${stats.summary.avgMessagesPerRoom}개/방`}
                icon={<MessageIcon />}
                color="#2e7d32"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="응답률"
                value={`${stats.summary.responseRate}%`}
                subtitle="양방향 대화 비율"
                icon={<TrendingUpIcon />}
                color="#ed6c02"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="평균 첫 응답 시간"
                value={formatMinutes(stats.summary.avgFirstResponseTimeMinutes)}
                subtitle="첫 메시지 후 응답까지"
                icon={<TimerIcon />}
                color="#9c27b0"
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>
            성별 분석
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="남성 첫 메시지 비율"
                value={`${stats.summary.maleFirstMessageRate}%`}
                icon={<MaleIcon />}
                color="#1976d2"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="여성 첫 메��지 비율"
                value={`${stats.summary.femaleFirstMessageRate}%`}
                icon={<FemaleIcon />}
                color="#d32f2f"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="24시간 내 대화 비율"
                value={`${stats.summary.conversationWithin24hRate}%`}
                subtitle="채팅방 생성 후 24시간 내"
                icon={<TimerIcon />}
                color="#0288d1"
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>
            시간대별 메시지 분포
          </Typography>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 150, overflowX: 'auto' }}>
              {stats.hourlyDistribution.map((item) => {
                const maxCount = Math.max(...stats.hourlyDistribution.map(h => h.count));
                const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                  <Box
                    key={item.hour}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: 30,
                    }}
                  >
                    <Typography variant="caption" sx={{ mb: 0.5 }}>
                      {item.count > 0 ? item.count : ''}
                    </Typography>
                    <Box
                      sx={{
                        width: 20,
                        height: `${Math.max(height, 2)}%`,
                        bgcolor: item.hour >= 9 && item.hour <= 23 ? '#1976d2' : '#90caf9',
                        borderRadius: '2px 2px 0 0',
                        transition: 'height 0.3s',
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {item.hour}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
              시간 (0~23시)
            </Typography>
          </Paper>

          <Typography variant="h6" gutterBottom>
            메시지 길이 분포
          </Typography>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={1}>
              {stats.messageLengthDistribution.map((item) => (
                <Grid item xs={6} sm={4} md={2} key={item.range}>
                  <Box sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="subtitle2">{item.range}자</Typography>
                    <Typography variant="h6" color="primary">
                      {item.percentage}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.count.toLocaleString()}개
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Typography variant="h6" gutterBottom>
            일별 트렌드
          </Typography>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>날짜</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>메시지 수</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>새 채팅방</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.dailyTrend.slice().reverse().map((item) => (
                    <tr key={item.date} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '8px' }}>{item.date}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {item.messageCount.toLocaleString()}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {item.newRoomCount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Paper>
        </>
      ) : null}
    </Box>
  );
}
