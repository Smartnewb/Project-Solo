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
  Paper,
  TextField,
  MenuItem
} from '@mui/material';
import { Line, Bar } from 'react-chartjs-2';
import '@/app/utils/chartConfig';
import { AnalyticsService } from '@/app/services';
import { format } from 'date-fns';

interface PageAnalyticsProps {
  startDate: Date | null;
  endDate: Date | null;
  topPages: Array<{
    path: string;
    pageViews: number;
  }>;
  overview: {
    activeUsers: number;
    sessions: number;
    pageViews: number;
    bounceRate: number;
    averageSessionDuration: number;
  };
  topPagesDetailed: {
    pages: Array<{
      path: string;
      pageViews: number;
      averageSessionDuration: number;
    }>;
    period: {
      startDate: string;
      endDate: string;
    };
  } | null;
}

export default function PageAnalytics({ startDate, endDate, topPages, overview, topPagesDetailed }: PageAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [pageLimit, setPageLimit] = useState<number>(10);

  // 일별 페이지뷰 데이터를 위한 가상 데이터 생성 (실제 API에서 제공되지 않음)
  const [dailyPageViews, setDailyPageViews] = useState<{date: string; views: number}[]>([]);

  useEffect(() => {
    // 일별 데이터가 없으므로, 시작일부터 종료일까지의 가상 데이터 생성
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // 총 페이지뷰를 일수로 나누어 평균을 구하고, 약간의 변동성 추가
      const avgDailyViews = overview.pageViews / dayCount;

      const dailyData = [];
      for (let i = 0; i < dayCount; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);

        // 평균의 80%~120% 범위 내에서 랜덤값 생성
        const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 ~ 1.2
        const views = Math.round(avgDailyViews * randomFactor);

        dailyData.push({
          date: format(currentDate, 'yyyy-MM-dd'),
          views: views
        });
      }

      setDailyPageViews(dailyData);
    } else {
      setDailyPageViews([]);
    }
  }, [startDate, endDate, overview.pageViews]);

  // 데이터가 없거나 형식이 잘못된 경우
  if (!topPages || !Array.isArray(topPages) || topPages.length === 0) {
    return (
      <div className="flex justify-center items-center p-8 bg-white rounded-lg shadow">
        <Typography variant="h6" color="error">
          페이지 분석 데이터를 불러올 수 없습니다. 다시 시도해주세요.
        </Typography>
      </div>
    );
  }

  // 차트 데이터 준비
  const pageViewsChartData = {
    labels: dailyPageViews.map(item => item.date.substring(5)), // "MM-DD" 형식
    datasets: [
      {
        label: '페이지뷰',
        data: dailyPageViews.map(item => item.views),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.3
      }
    ]
  };

  // 상위 페이지 차트 데이터
  const topPagesChartData = {
    labels: topPages.map(item => item.path),
    datasets: [
      {
        label: '페이지뷰',
        data: topPages.map(item => item.pageViews),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgb(53, 162, 235)',
        borderWidth: 1
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
                페이지뷰 정보
              </Typography>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <Typography variant="h5" className="font-bold text-blue-700">
                    {overview.pageViews.toLocaleString()}
                  </Typography>
                  <Typography color="textSecondary">총 페이지뷰</Typography>
                </div>
                <div className="text-center">
                  <Typography variant="h5" className="font-bold text-green-700">
                    {overview.sessions.toLocaleString()}
                  </Typography>
                  <Typography color="textSecondary">총 세션 수</Typography>
                </div>
                <div className="text-center">
                  <Typography variant="h5" className="font-bold text-purple-700">
                    {(overview.pageViews / overview.sessions).toFixed(2)}
                  </Typography>
                  <Typography color="textSecondary">세션당 페이지뷰</Typography>
                </div>
              </div>
              <Typography variant="h6" gutterBottom className="mt-4">
                일별 페이지뷰 추이 (추정)
              </Typography>
              <div className="h-80">
                <Line
                  data={pageViewsChartData}
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
              <div className="flex justify-between items-center mb-4">
                <Typography variant="h6">
                  인기 페이지
                </Typography>
                <TextField
                  select
                  label="표시 개수"
                  value={pageLimit}
                  onChange={(e) => setPageLimit(Number(e.target.value))}
                  variant="outlined"
                  size="small"
                  style={{ width: 120 }}
                >
                  <MenuItem value={5}>5개</MenuItem>
                  <MenuItem value={10}>10개</MenuItem>
                  <MenuItem value={20}>20개</MenuItem>
                </TextField>
              </div>
              <div className="h-80 mb-4">
                <Bar
                  data={topPagesChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y' as const,
                    scales: {
                      x: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>페이지 경로</TableCell>
                      <TableCell align="right">페이지뷰</TableCell>
                      <TableCell align="right">비율</TableCell>
                      {topPagesDetailed && (
                        <TableCell align="right">평균 체류 시간</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(topPagesDetailed ? topPagesDetailed.pages : topPages).map((page, index) => {
                      // 대시보드 API의 topPages와 인기 페이지 API의 pages 데이터 통합
                      const pageViewsPercent = ((page.pageViews / overview.pageViews) * 100).toFixed(1);

                      return (
                        <TableRow key={index}>
                          <TableCell>{page.path}</TableCell>
                          <TableCell align="right">{page.pageViews.toLocaleString()}</TableCell>
                          <TableCell align="right">{pageViewsPercent}%</TableCell>
                          {topPagesDetailed && 'averageSessionDuration' in page && (
                            <TableCell align="right">
                              {Math.floor(page.averageSessionDuration / 60)}분 {Math.floor(page.averageSessionDuration % 60)}초
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
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
