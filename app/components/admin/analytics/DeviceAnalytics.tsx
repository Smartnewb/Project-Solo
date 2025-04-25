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
import { Pie, Doughnut } from 'react-chartjs-2';
import '@/app/utils/chartConfig';
import { AnalyticsService } from '@/app/services';
import { format } from 'date-fns';

interface DeviceAnalyticsProps {
  startDate: Date | null;
  endDate: Date | null;
  deviceCategories: Array<{
    category: string;
    users: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
  deviceDetail?: {
    deviceCategories: Array<{
      category: string;
      users: number;
    }>;
    browsers: Array<{
      browser: string;
      users: number;
    }>;
    operatingSystems: Array<{
      os: string;
      users: number;
    }>;
    period: {
      startDate: string;
      endDate: string;
    };
  } | null;
}

export default function DeviceAnalytics({ startDate, endDate, deviceCategories, period, deviceDetail }: DeviceAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(false);

  // 데이터가 없거나 형식이 잘못된 경우
  if (!deviceCategories || !Array.isArray(deviceCategories) || deviceCategories.length === 0) {
    return (
      <div className="flex justify-center items-center p-8 bg-white rounded-lg shadow">
        <Typography variant="h6" color="error">
          디바이스 데이터를 불러올 수 없습니다. 다시 시도해주세요.
        </Typography>
      </div>
    );
  }

  // 상세 디바이스 정보가 있으면 해당 데이터 사용, 없으면 대시보드 API의 deviceCategories 사용
  const categories = deviceDetail?.deviceCategories || deviceCategories;
  const browsers = deviceDetail?.browsers || [];
  const operatingSystems = deviceDetail?.operatingSystems || [];

  // 총 사용자 수 계산
  const totalUsers = categories.reduce((sum, item) => sum + item.users, 0);
  const totalBrowserUsers = browsers.reduce((sum, item) => sum + item.users, 0);
  const totalOSUsers = operatingSystems.reduce((sum, item) => sum + item.users, 0);

  // 디바이스 카테고리 차트 데이터
  const deviceCategoryChartData = {
    labels: categories.map(item => item.category),
    datasets: [
      {
        label: '사용자 수',
        data: categories.map(item => item.users),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)'
        ],
        borderWidth: 1
      }
    ]
  };

  // 브라우저 차트 데이터 (상위 5개만)
  const browserChartData = {
    labels: browsers.slice(0, 5).map(item => item.browser),
    datasets: [
      {
        label: '사용자 수',
        data: browsers.slice(0, 5).map(item => item.users),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ],
        borderColor: [
          'rgb(54, 162, 235)',
          'rgb(255, 99, 132)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)'
        ],
        borderWidth: 1
      }
    ]
  };

  // 운영체제 차트 데이터
  const osChartData = {
    labels: operatingSystems.map(item => item.os),
    datasets: [
      {
        label: '사용자 수',
        data: operatingSystems.map(item => item.users),
        backgroundColor: [
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(54, 162, 235, 0.6)'
        ],
        borderColor: [
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)',
          'rgb(255, 159, 64)',
          'rgb(54, 162, 235)'
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <Typography variant="body1" className="font-bold">
          분석 기간: {deviceDetail?.period?.startDate || period.startDate} ~ {deviceDetail?.period?.endDate || period.endDate}
        </Typography>
        <Typography variant="body1" className="font-bold mt-2">
          총 사용자 수: {totalUsers.toLocaleString()}
        </Typography>
      </div>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                디바이스 카테고리
              </Typography>
              <div className="h-80 flex items-center justify-center">
                <div className="w-4/5 h-full">
                  <Pie
                    data={deviceCategoryChartData}
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

        {browsers.length > 0 && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  브라우저 (상위 5개)
                </Typography>
                <div className="h-80 flex items-center justify-center">
                  <div className="w-4/5 h-full">
                    <Doughnut
                      data={browserChartData}
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
        )}

        {operatingSystems.length > 0 && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  운영체제
                </Typography>
                <div className="h-80 flex items-center justify-center">
                  <div className="w-4/5 h-full">
                    <Doughnut
                      data={osChartData}
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
        )}

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                디바이스 카테고리 상세
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>카테고리</TableCell>
                      <TableCell align="right">사용자</TableCell>
                      <TableCell align="right">비율</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((device, index) => (
                      <TableRow key={index}>
                        <TableCell>{device.category}</TableCell>
                        <TableCell align="right">{device.users.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          {((device.users / totalUsers) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {browsers.length > 0 && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  브라우저 상세
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>브라우저</TableCell>
                        <TableCell align="right">사용자</TableCell>
                        <TableCell align="right">비율</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {browsers.map((browser, index) => (
                        <TableRow key={index}>
                          <TableCell>{browser.browser}</TableCell>
                          <TableCell align="right">{browser.users.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            {((browser.users / totalBrowserUsers) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {operatingSystems.length > 0 && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  운영체제 상세
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>운영체제</TableCell>
                        <TableCell align="right">사용자</TableCell>
                        <TableCell align="right">비율</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {operatingSystems.map((os, index) => (
                        <TableRow key={index}>
                          <TableCell>{os.os}</TableCell>
                          <TableCell align="right">{os.users.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            {((os.users / totalOSUsers) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </div>
  );
}
