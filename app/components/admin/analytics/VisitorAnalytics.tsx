'use client';

import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import '@/app/utils/chartConfig';
import { AnalyticsService } from '@/app/services';
import { format, subDays } from 'date-fns';

interface VisitorAnalyticsProps {
  startDate: Date | null;
  endDate: Date | null;
  dailyUsers: Array<{
    date: string;
    users: number;
  }>;
  overview: {
    activeUsers: number;
    sessions: number;
    pageViews: number;
    bounceRate: number;
    averageSessionDuration: number;
  };
  userEngagement: {
    engagementDuration: number;
    engagedSessions: number;
    engagementRate: number;
    averageSessionDuration: number;
    period: {
      startDate: string;
      endDate: string;
    };
  } | null;
  dailyTraffic?: {
    dailyData: Array<{
      date: string;
      activeUsers: number;
      sessions: number;
      pageViews: number;
    }>;
    period: {
      startDate: string;
      endDate: string;
    };
  } | null;
}

export default function VisitorAnalytics({ startDate, endDate, dailyUsers, overview, userEngagement, dailyTraffic }: VisitorAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(false);

  // 데이터가 없거나 형식이 잘못된 경우
  if (!dailyUsers || !Array.isArray(dailyUsers) || dailyUsers.length === 0) {
    return (
      <div className="flex justify-center items-center p-8 bg-white rounded-lg shadow">
        <Typography variant="h6" color="error">
          방문자 분석 데이터를 불러올 수 없습니다. 다시 시도해주세요.
        </Typography>
      </div>
    );
  }

  // 일별 트래픽 데이터가 있는 경우 해당 데이터 사용, 없으면 대시보드 API의 dailyUsers 사용
  const dailyData = dailyTraffic?.dailyData || dailyUsers.map(item => ({
    date: item.date,
    activeUsers: item.users,
    sessions: 0,
    pageViews: 0
  }));

  // 차트 데이터 준비
  const dailyUsersChartData = {
    labels: dailyData.map(item => item.date.substring(5)), // "MM-DD" 형식
    datasets: [
      {
        label: '활성 사용자',
        data: dailyData.map(item => item.activeUsers),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.3
      }
    ]
  };

  // 세션 및 페이지뷰 차트 데이터
  const trafficChartData = {
    labels: dailyData.map(item => item.date.substring(5)), // "MM-DD" 형식
    datasets: [
      {
        label: '세션 수',
        data: dailyData.map(item => item.sessions),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.3,
        yAxisID: 'y'
      },
      {
        label: '페이지뷰',
        data: dailyData.map(item => item.pageViews),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3,
        yAxisID: 'y1'
      }
    ]
  };

  return (
    <div className="space-y-6">
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                일별 활성 사용자 추이
              </Typography>
              <div className="h-80">
                <Line
                  data={dailyUsersChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                일별 세션 및 페이지뷰 추이
              </Typography>
              <div className="h-80">
                <Line
                  data={trafficChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: '세션 수'
                        }
                      },
                      y1: {
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        grid: {
                          drawOnChartArea: false
                        },
                        title: {
                          display: true,
                          text: '페이지뷰'
                        }
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                사용자 통계 요약
              </Typography>
              <div className="p-4 bg-blue-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <Typography variant="h5" className="font-bold text-blue-700">
                    {overview.activeUsers.toLocaleString()}
                  </Typography>
                  <Typography color="textSecondary">활성 사용자</Typography>
                </div>
                <div className="text-center">
                  <Typography variant="h5" className="font-bold text-green-700">
                    {overview.sessions.toLocaleString()}
                  </Typography>
                  <Typography color="textSecondary">총 세션 수</Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                사용자 참여도 지표
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>지표</TableCell>
                      <TableCell align="right">값</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>평균 세션 시간</TableCell>
                      <TableCell align="right">
                        {Math.floor(overview.averageSessionDuration / 60)}분 {Math.floor(overview.averageSessionDuration % 60)}초
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>이탈률</TableCell>
                      <TableCell align="right">{(overview.bounceRate * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    {userEngagement && (
                      <TableRow>
                        <TableCell>참여율</TableCell>
                        <TableCell align="right">{(userEngagement.engagementRate * 100).toFixed(1)}%</TableCell>
                      </TableRow>
                    )}
                    {userEngagement && (
                      <TableRow>
                        <TableCell>참여 세션 수</TableCell>
                        <TableCell align="right">{userEngagement.engagedSessions.toLocaleString()}</TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell>세션당 페이지뷰</TableCell>
                      <TableCell align="right">{(overview.pageViews / overview.sessions).toFixed(1)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>총 페이지뷰</TableCell>
                      <TableCell align="right">{overview.pageViews.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}
