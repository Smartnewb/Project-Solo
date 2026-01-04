'use client';

import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import {
  Assignment as ApprovalIcon,
  ReportProblem as ReportIcon,
  Forum as CommunityIcon,
  ErrorOutline as MatchingFailIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { ActionItems, MatchingStatus } from '../types';

interface ActionCardsProps {
  actionItems: ActionItems | null;
  matching: MatchingStatus | null;
  loading?: boolean;
}

interface ActionCardItemProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  link: string;
  color: string;
  loading?: boolean;
}

function ActionCardItem({ title, count, icon, link, color, loading }: ActionCardItemProps) {
  return (
    <Link href={link} className="block">
      <Card
        sx={{
          height: '100%',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 3,
          }
        }}
      >
        <CardContent>
          <Box className="flex items-center justify-between">
            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color }}>
                {loading ? '-' : count.toLocaleString()}
                <Typography component="span" variant="body2" color="textSecondary" sx={{ ml: 0.5 }}>
                  건
                </Typography>
              </Typography>
            </Box>
            <Box sx={{ color, opacity: 0.8 }}>
              {icon}
            </Box>
          </Box>
          <Typography variant="caption" color="primary" className="mt-2 block">
            바로가기 →
          </Typography>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function ActionCards({ actionItems, matching, loading }: ActionCardsProps) {
  const pendingApprovals = actionItems?.pendingApprovals ?? 0;
  const pendingProfileReports = actionItems?.pendingProfileReports ?? 0;
  const pendingCommunityReports = actionItems?.pendingCommunityReports ?? 0;
  const matchingFailures = matching?.todayFailures ?? 0;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} lg={3}>
        <ActionCardItem
          title="승인 대기"
          count={pendingApprovals}
          icon={<ApprovalIcon sx={{ fontSize: 40 }} />}
          link="/admin/profile-review"
          color="#3B82F6"
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <ActionCardItem
          title="프로필 신고"
          count={pendingProfileReports}
          icon={<ReportIcon sx={{ fontSize: 40 }} />}
          link="/admin/reports"
          color="#EF4444"
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <ActionCardItem
          title="커뮤니티 신고"
          count={pendingCommunityReports}
          icon={<CommunityIcon sx={{ fontSize: 40 }} />}
          link="/admin/community"
          color="#F59E0B"
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <ActionCardItem
          title="매칭 실패"
          count={matchingFailures}
          icon={<MatchingFailIcon sx={{ fontSize: 40 }} />}
          link="/admin/matching-management"
          color="#8B5CF6"
          loading={loading}
        />
      </Grid>
    </Grid>
  );
}
