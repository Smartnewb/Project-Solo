'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Collapse,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import AdminService from '@/app/services/admin';
import type { UtmDashboardSummary, UtmFunnelStep, UtmChannelRow, UtmCampaignRow } from '@/app/services/admin';

type DatePreset = '오늘' | '7일' | '30일' | '이번달';

function getDateRange(preset: DatePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];

  switch (preset) {
    case '오늘':
      return { startDate: endDate, endDate };
    case '7일': {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { startDate: start.toISOString().split('T')[0], endDate };
    }
    case '30일': {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { startDate: start.toISOString().split('T')[0], endDate };
    }
    case '이번달': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start.toISOString().split('T')[0], endDate };
    }
  }
}

const DATE_PRESETS: DatePreset[] = ['오늘', '7일', '30일', '이번달'];
const FUNNEL_COLORS = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'];

type SortKey = 'clicks' | 'signups' | 'signupRate' | 'approved' | 'purchases' | 'purchaseRate';

export default function UtmDashboard() {
  const [datePreset, setDatePreset] = useState<DatePreset>('7일');
  const [channelFilter, setChannelFilter] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');

  const [summary, setSummary] = useState<UtmDashboardSummary | null>(null);
  const [funnel, setFunnel] = useState<UtmFunnelStep[]>([]);
  const [channels, setChannels] = useState<UtmChannelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<SortKey>('clicks');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [campaignRows, setCampaignRows] = useState<UtmCampaignRow[]>([]);
  const [campaignLoading, setCampaignLoading] = useState(false);

  const { startDate, endDate } = getDateRange(datePreset);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, funnelData, channelsData] = await Promise.all([
        AdminService.utm.getSummary(startDate, endDate, channelFilter || undefined, campaignFilter || undefined),
        AdminService.utm.getFunnel(startDate, endDate, channelFilter || undefined, campaignFilter || undefined),
        AdminService.utm.getChannels(startDate, endDate),
      ]);
      setSummary(summaryData);
      setFunnel(funnelData);
      setChannels(channelsData);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, channelFilter, campaignFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  const sortedChannels = [...channels].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1;
    return (a[sortBy] - b[sortBy]) * mul;
  });

  const handleExpandRow = async (source: string) => {
    if (expandedSource === source) {
      setExpandedSource(null);
      return;
    }
    setExpandedSource(source);
    setCampaignLoading(true);
    try {
      const data = await AdminService.utm.getCampaigns(source, startDate, endDate);
      setCampaignRows(data);
    } catch {
      setCampaignRows([]);
    } finally {
      setCampaignLoading(false);
    }
  };

  const renderChangeChip = (change: number | null) => {
    if (change == null) return <Typography variant="caption" color="textSecondary">--</Typography>;
    const isPositive = change > 0;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {isPositive ? (
          <TrendingUpIcon sx={{ fontSize: 16, color: '#22c55e' }} />
        ) : (
          <TrendingDownIcon sx={{ fontSize: 16, color: '#ef4444' }} />
        )}
        <Typography
          variant="caption"
          sx={{ color: isPositive ? '#22c55e' : '#ef4444', fontWeight: 600 }}
        >
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </Typography>
      </Box>
    );
  };

  const uniqueSources = [...new Set(channels.map((c) => c.source))];

  if (loading && !summary) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter bar */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            select
            label="기간"
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as DatePreset)}
            size="small"
            sx={{ minWidth: 120 }}
          >
            {DATE_PRESETS.map((p) => (
              <MenuItem key={p} value={p}>{p}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="채널"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">전체</MenuItem>
            {uniqueSources.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="캠페인"
            placeholder="캠페인 필터"
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
          />
        </Box>
      </Paper>

      {/* Summary cards */}
      {summary && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          {([
            { label: '페이지 방문', data: summary.pageVisit },
            { label: '가입', data: summary.signup },
            { label: '프로필 승인', data: summary.profileApproved },
            { label: '첫 구매', data: summary.firstPurchase },
          ] as const).map((card) => (
            <Paper key={card.label} variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="caption" color="textSecondary">{card.label}</Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
                {card.data.count.toLocaleString()}
              </Typography>
              <Box sx={{ mt: 0.5 }}>{renderChangeChip(card.data.change)}</Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Funnel chart */}
      {funnel.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            전환 퍼널
          </Typography>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={funnel} layout="vertical" margin={{ left: 80, right: 40 }}>
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="step"
                width={70}
                tick={{ fontSize: 13 }}
              />
              <RechartsTooltip
                formatter={(value: number, _name: string, props: { payload?: UtmFunnelStep }) => [
                  `${value.toLocaleString()} (${props.payload?.rate.toFixed(1) ?? '—'}%)`,
                  '수',
                ]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {funnel.map((_, index) => (
                  <Cell key={index} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Channel comparison table */}
      {channels.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            채널별 성과
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell sx={{ width: 40 }} />
                  <TableCell sx={{ fontWeight: 600 }}>채널</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    <TableSortLabel
                      active={sortBy === 'clicks'}
                      direction={sortBy === 'clicks' ? sortDir : 'desc'}
                      onClick={() => handleSort('clicks')}
                    >
                      클릭
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    <TableSortLabel
                      active={sortBy === 'signups'}
                      direction={sortBy === 'signups' ? sortDir : 'desc'}
                      onClick={() => handleSort('signups')}
                    >
                      가입
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    <TableSortLabel
                      active={sortBy === 'signupRate'}
                      direction={sortBy === 'signupRate' ? sortDir : 'desc'}
                      onClick={() => handleSort('signupRate')}
                    >
                      가입률
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    <TableSortLabel
                      active={sortBy === 'approved'}
                      direction={sortBy === 'approved' ? sortDir : 'desc'}
                      onClick={() => handleSort('approved')}
                    >
                      승인
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    <TableSortLabel
                      active={sortBy === 'purchases'}
                      direction={sortBy === 'purchases' ? sortDir : 'desc'}
                      onClick={() => handleSort('purchases')}
                    >
                      구매
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    <TableSortLabel
                      active={sortBy === 'purchaseRate'}
                      direction={sortBy === 'purchaseRate' ? sortDir : 'desc'}
                      onClick={() => handleSort('purchaseRate')}
                    >
                      구매율
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedChannels.map((row) => (
                  <ChannelRow
                    key={row.source}
                    row={row}
                    isExpanded={expandedSource === row.source}
                    onToggle={() => handleExpandRow(row.source)}
                    campaignRows={expandedSource === row.source ? campaignRows : []}
                    campaignLoading={expandedSource === row.source && campaignLoading}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}

interface ChannelRowProps {
  row: UtmChannelRow;
  isExpanded: boolean;
  onToggle: () => void;
  campaignRows: UtmCampaignRow[];
  campaignLoading: boolean;
}

function ChannelRow({ row, isExpanded, onToggle, campaignRows, campaignLoading }: ChannelRowProps) {
  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={onToggle}>
            {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={500}>{row.source}</Typography>
        </TableCell>
        <TableCell align="right">{row.clicks.toLocaleString()}</TableCell>
        <TableCell align="right">{row.signups.toLocaleString()}</TableCell>
        <TableCell align="right">{row.signupRate.toFixed(1)}%</TableCell>
        <TableCell align="right">{row.approved.toLocaleString()}</TableCell>
        <TableCell align="right">{row.purchases.toLocaleString()}</TableCell>
        <TableCell align="right">{row.purchaseRate.toFixed(1)}%</TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ py: 0, borderBottom: isExpanded ? undefined : 'none' }} colSpan={8}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ py: 1.5, pl: 4 }}>
              {campaignLoading ? (
                <CircularProgress size={20} />
              ) : campaignRows.length === 0 ? (
                <Typography variant="body2" color="textSecondary">캠페인 데이터 없음</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>캠페인</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="right">클릭</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="right">가입</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="right">구매</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {campaignRows.map((cr) => (
                      <TableRow key={cr.campaign}>
                        <TableCell>
                          <Typography variant="body2">{cr.campaign}</Typography>
                        </TableCell>
                        <TableCell align="right">{cr.clicks.toLocaleString()}</TableCell>
                        <TableCell align="right">{cr.signups.toLocaleString()}</TableCell>
                        <TableCell align="right">{cr.purchases.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}
