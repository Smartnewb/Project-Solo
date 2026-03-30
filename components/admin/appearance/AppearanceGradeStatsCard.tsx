'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  alpha,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import FiberNewOutlinedIcon from '@mui/icons-material/FiberNewOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  UserAppearanceGradeStatsResponse,
  AppearanceGrade,
} from '@/app/admin/users/appearance/types';

const GRADE_COLORS: Record<string, string> = {
  S: '#7C3AED',
  A: '#2563EB',
  B: '#059669',
  C: '#D97706',
  UNKNOWN: '#94A3B8',
};

const GRADE_LABELS: Record<string, string> = {
  S: 'S',
  A: 'A',
  B: 'B',
  C: 'C',
  UNKNOWN: '미분류',
};

const UNKNOWN_BREAKDOWN_COLORS = {
  neverClassified: '#64748B',
  inactiveReset: '#CBD5E1',
};

interface AppearanceGradeStatsCardProps {
  stats: UserAppearanceGradeStatsResponse;
}

function GradeStatMiniCard({
  grade,
  count,
  percentage,
  total,
}: {
  grade: string;
  count: number;
  percentage: number;
  total: number;
}) {
  const color = GRADE_COLORS[grade] || '#94A3B8';
  const label = GRADE_LABELS[grade] || grade;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: alpha(color, 0.2),
        bgcolor: alpha(color, 0.04),
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: alpha(color, 0.4),
          bgcolor: alpha(color, 0.08),
          transform: 'translateY(-1px)',
          boxShadow: `0 4px 12px ${alpha(color, 0.15)}`,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: color,
            }}
          />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color }}>
            {label}등급
          </Typography>
        </Box>
        <Chip
          label={`${percentage.toFixed(1)}%`}
          size="small"
          sx={{
            height: 22,
            fontSize: '0.75rem',
            fontWeight: 600,
            bgcolor: alpha(color, 0.12),
            color,
            border: 'none',
          }}
        />
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
        {count.toLocaleString()}
        <Typography component="span" variant="body2" sx={{ ml: 0.5, color: 'text.secondary', fontWeight: 400 }}>
          명
        </Typography>
      </Typography>
      <LinearProgress
        variant="determinate"
        value={Math.min(percentage, 100)}
        sx={{
          height: 4,
          borderRadius: 2,
          bgcolor: alpha(color, 0.12),
          '& .MuiLinearProgress-bar': {
            borderRadius: 2,
            bgcolor: color,
          },
        }}
      />
    </Box>
  );
}

function PieChartSection({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle?: string;
  data: { name: string; value: number; percentage: number; grade: string }[];
}) {
  const hasData = data.length > 0;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            px: 2,
            py: 1.5,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {d.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {d.value.toLocaleString()}명 ({d.percentage.toFixed(1)}%)
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {subtitle}
        </Typography>
      )}
      <Box sx={{ height: 220 }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={GRADE_COLORS[entry.grade] || '#CCC'}
                    strokeWidth={0}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value: string) => (
                  <span style={{ color: '#64748B', fontSize: '12px' }}>{value}</span>
                )}
              />
              <text
                x="50%"
                y="45%"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: '20px', fontWeight: 700, fill: '#1E293B' }}
              >
                {total.toLocaleString()}
              </text>
              <text
                x="50%"
                y="56%"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: '11px', fill: '#94A3B8' }}
              >
                총원
              </text>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              데이터 없음
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function UnknownBreakdownSection({
  neverClassified,
  inactiveReset,
  totalUnknown,
}: {
  neverClassified: number;
  inactiveReset: number;
  totalUnknown: number;
}) {
  const neverPct = totalUnknown > 0 ? (neverClassified / totalUnknown) * 100 : 0;
  const inactivePct = totalUnknown > 0 ? (inactiveReset / totalUnknown) * 100 : 0;

  const items = [
    {
      label: '등급 미부여',
      desc: '신규 가입 후 어드민 분류 대기',
      count: neverClassified,
      pct: neverPct,
      color: UNKNOWN_BREAKDOWN_COLORS.neverClassified,
      icon: <FiberNewOutlinedIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: '미접속 초기화',
      desc: '7일 이상 미접속, 재접속 시 복원',
      count: inactiveReset,
      pct: inactivePct,
      color: UNKNOWN_BREAKDOWN_COLORS.inactiveReset,
      icon: <PersonOffOutlinedIcon sx={{ fontSize: 18 }} />,
    },
  ];

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: alpha('#94A3B8', 0.2),
        bgcolor: alpha('#F8FAFC', 0.8),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <InfoOutlinedIcon sx={{ fontSize: 18, color: '#64748B' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#334155' }}>
          미분류 상세 ({totalUnknown.toLocaleString()}명)
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
          <BlockOutlinedIcon sx={{ fontSize: 14, color: '#EF4444' }} />
          <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 500 }}>
            매칭 제외
          </Typography>
        </Box>
      </Box>

      {/* Stacked bar */}
      <Box sx={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', mb: 2 }}>
        <Box sx={{ width: `${neverPct}%`, bgcolor: UNKNOWN_BREAKDOWN_COLORS.neverClassified, transition: 'width 0.3s' }} />
        <Box sx={{ width: `${inactivePct}%`, bgcolor: UNKNOWN_BREAKDOWN_COLORS.inactiveReset, transition: 'width 0.3s' }} />
      </Box>

      <Stack spacing={1.5}>
        {items.map((item) => (
          <Box
            key={item.label}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                bgcolor: alpha(item.color, 0.15),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.color === UNKNOWN_BREAKDOWN_COLORS.inactiveReset ? '#64748B' : item.color,
                flexShrink: 0,
              }}
            >
              {item.icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                  {item.label}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  {item.desc}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                {item.count.toLocaleString()}명
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                {item.pct.toFixed(1)}%
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export default function AppearanceGradeStatsCard({ stats }: AppearanceGradeStatsCardProps) {
  if (!stats) {
    return (
      <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            외모 등급 통계
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography variant="body1" color="text.secondary">
              통계 데이터를 불러올 수 없습니다.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const safeStats = {
    total: stats.total || 0,
    stats: Array.isArray(stats.stats) ? stats.stats : [],
    genderStats: Array.isArray(stats.genderStats) ? stats.genderStats : [],
    unknownBreakdown: stats.unknownBreakdown,
  };

  if (safeStats.stats.length === 0 && safeStats.genderStats.length === 0) {
    return (
      <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            외모 등급 통계
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography variant="body1" color="text.secondary">
              아직 통계 데이터가 없습니다.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const toChartData = (items: { grade: string; count: number; percentage: number }[]) =>
    items
      .filter((item) => item && item.grade && (item.count || 0) > 0)
      .map((item) => ({
        name: `${GRADE_LABELS[item.grade as AppearanceGrade] || item.grade}등급`,
        value: item.count || 0,
        percentage: typeof item.percentage === 'number' ? item.percentage : 0,
        grade: item.grade,
      }));

  const chartData = toChartData(safeStats.stats);
  const maleChartData = toChartData(
    safeStats.genderStats.find((g) => g.gender === 'MALE')?.stats || [],
  );
  const femaleChartData = toChartData(
    safeStats.genderStats.find((g) => g.gender === 'FEMALE')?.stats || [],
  );

  const unknownStat = safeStats.stats.find((s) => s.grade === 'UNKNOWN');
  const totalUnknown = unknownStat?.count || 0;
  const hasBreakdown = safeStats.unknownBreakdown && totalUnknown > 0;

  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'visible' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
              외모 등급 통계
            </Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.25 }}>
              승인된 사용자 총 {safeStats.total.toLocaleString()}명
            </Typography>
          </Box>
        </Box>

        {/* 등급 카드 그리드 */}
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {safeStats.stats
            .filter((item) => item && item.grade)
            .sort((a, b) => {
              const order: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, UNKNOWN: 4 };
              return (order[a.grade] ?? 99) - (order[b.grade] ?? 99);
            })
            .map((item) => (
              <Grid item xs={6} sm={4} md key={item.grade}>
                <GradeStatMiniCard
                  grade={item.grade}
                  count={item.count || 0}
                  percentage={typeof item.percentage === 'number' ? item.percentage : 0}
                  total={safeStats.total}
                />
              </Grid>
            ))}
        </Grid>

        {/* 미분류 상세 breakdown */}
        {hasBreakdown && (
          <Box sx={{ mb: 3 }}>
            <UnknownBreakdownSection
              neverClassified={safeStats.unknownBreakdown!.neverClassified}
              inactiveReset={safeStats.unknownBreakdown!.inactiveReset}
              totalUnknown={totalUnknown}
            />
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* 파이 차트 - 전체 / 남성 / 여성 */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <PieChartSection
              title="전체"
              subtitle={`${safeStats.total.toLocaleString()}명`}
              data={chartData}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <PieChartSection
              title="남성"
              data={maleChartData}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <PieChartSection
              title="여성"
              data={femaleChartData}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
