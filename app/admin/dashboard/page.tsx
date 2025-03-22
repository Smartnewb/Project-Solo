'use client';

import { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { createClientSupabaseClient } from '@/utils/supabase';

// Mock data - Replace with real data from your API
const mockData = {
  weeklyVisitors: Array.from({ length: 7 }, (_, i) => ({
    day: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
    visitors: Math.floor(Math.random() * 1000)
  })),
  userStats: {
    total: 5000,
    online: 120,
    newToday: 50,
    matches: 230
  },
  genderDistribution: [
    { grade: 'S', male: 100, female: 80 },
    { grade: 'A', male: 200, female: 180 },
    { grade: 'B', male: 300, female: 280 },
    { grade: 'C', male: 400, female: 380 },
  ]
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(mockData);
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    // TODO: Replace with real data fetching
    const fetchData = async () => {
      try {
        // Fetch real-time stats from Supabase
        // const { data: userStats } = await supabase.from('user_stats').select('*');
        // setStats(userStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        관리자 대시보드
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                총 회원 수
              </Typography>
              <Typography variant="h4">
                {stats.userStats.total.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                현재 접속 인원
              </Typography>
              <Typography variant="h4">
                {stats.userStats.online.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                오늘의 신규 가입
              </Typography>
              <Typography variant="h4">
                {stats.userStats.newToday.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                총 매칭 수
              </Typography>
              <Typography variant="h4">
                {stats.userStats.matches.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Visitor Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                최근 7일 방문자 추이
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.weeklyVisitors}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="visitors" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* User Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                등급별 회원 분포
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.genderDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="male" name="남성" fill="#8884d8" />
                  <Bar dataKey="female" name="여성" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
