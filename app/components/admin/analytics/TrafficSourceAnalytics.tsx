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
import { Pie, Bar } from 'react-chartjs-2';
import '@/app/utils/chartConfig';
import { AnalyticsService } from '@/app/services';
import { format } from 'date-fns';

interface TrafficSourceAnalyticsProps {
  startDate: Date | null;
  endDate: Date | null;
  trafficSources: Array<{
    source: string;
    sessions: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
}

export default function TrafficSourceAnalytics({ startDate, endDate, trafficSources, period }: TrafficSourceAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(false);

  // 데이터가 없거나 형식이 잘못된 경우
  if (!trafficSources || !Array.isArray(trafficSources) || trafficSources.length === 0) {
    return (
      <div className="flex justify-center items-center p-8 bg-white rounded-lg shadow">
        <Typography variant="h6" color="error">
          트래픽 소스 데이터를 불러올 수 없습니다. 다시 시도해주세요.
        </Typography>
      </div>
    );
  }

  // 상위 10개 소스만 사용하고 나머지는 '기타'로 통합
  const topSources = [...trafficSources]
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);

  // 총 세션 수 계산
  const totalSessions = trafficSources.reduce((sum, item) => sum + item.sessions, 0);

  // 차트 데이터 준비
  const pieChartData = {
    labels: topSources.map(item => item.source),
    datasets: [
      {
        label: '세션 수',
        data: topSources.map(item => item.sessions),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
          'rgba(83, 102, 255, 0.6)',
          'rgba(128, 0, 128, 0.6)',
          'rgba(0, 128, 0, 0.6)'
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)',
          'rgb(255, 159, 64)',
          'rgb(199, 199, 199)',
          'rgb(83, 102, 255)',
          'rgb(128, 0, 128)',
          'rgb(0, 128, 0)'
        ],
        borderWidth: 1
      }
    ]
  };

  const barChartData = {
    labels: topSources.map(item => item.source),
    datasets: [
      {
        label: '세션 수',
        data: topSources.map(item => item.sessions),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="space-y-6">
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                트래픽 소스별 세션 분포
              </Typography>
              <div className="h-80 flex items-center justify-center">
                <div className="w-4/5 h-full">
                  <Pie
                    data={pieChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                트래픽 소스별 신규/기존 사용자
              </Typography>
              <div className="h-80">
                <Bar
                  data={barChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        stacked: true
                      },
                      y: {
                        stacked: true,
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
                트래픽 소스 상세 분석
              </Typography>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <Typography variant="body1" className="font-bold">
                  분석 기간: {period.startDate} ~ {period.endDate}
                </Typography>
                <Typography variant="body1" className="font-bold mt-2">
                  총 세션 수: {totalSessions.toLocaleString()}
                </Typography>
              </div>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>소스</TableCell>
                      <TableCell align="right">세션</TableCell>
                      <TableCell align="right">비율</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trafficSources.map((source, index) => (
                      <TableRow key={index}>
                        <TableCell>{source.source}</TableCell>
                        <TableCell align="right">{source.sessions.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          {((source.sessions / totalSessions) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
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
