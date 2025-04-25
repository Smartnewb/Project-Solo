'use client';

import { useState } from 'react';
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
  Tabs,
  Tab
} from '@mui/material';
import { Pie } from 'react-chartjs-2';
import '@/app/utils/chartConfig';

interface DemographicsAnalyticsProps {
  startDate: Date | null;
  endDate: Date | null;
  demographics: {
    countries: Array<{
      country: string;
      users: number;
    }>;
    languages: Array<{
      language: string;
      users: number;
    }>;
    cities: Array<{
      city: string;
      users: number;
    }>;
    period: {
      startDate: string;
      endDate: string;
    };
  } | null;
}

export default function DemographicsAnalytics({ startDate, endDate, demographics }: DemographicsAnalyticsProps) {
  const [activeTab, setActiveTab] = useState(0);

  // 데이터가 없거나 형식이 잘못된 경우
  if (!demographics) {
    return (
      <div className="flex justify-center items-center p-8 bg-white rounded-lg shadow">
        <Typography variant="h6" color="error">
          사용자 인구통계 데이터를 불러올 수 없습니다. 다시 시도해주세요.
        </Typography>
      </div>
    );
  }

  // 총 사용자 수 계산
  const totalCountryUsers = demographics.countries.reduce((sum, item) => sum + item.users, 0);
  const totalLanguageUsers = demographics.languages.reduce((sum, item) => sum + item.users, 0);
  const totalCityUsers = demographics.cities.reduce((sum, item) => sum + item.users, 0);

  // 탭 변경 핸들러
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // 국가별 차트 데이터
  const countryChartData = {
    labels: demographics.countries.map(item => item.country),
    datasets: [
      {
        label: '사용자 수',
        data: demographics.countries.map(item => item.users),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)',
          'rgb(255, 159, 64)'
        ],
        borderWidth: 1
      }
    ]
  };

  // 언어별 차트 데이터
  const languageChartData = {
    labels: demographics.languages.map(item => item.language),
    datasets: [
      {
        label: '사용자 수',
        data: demographics.languages.map(item => item.users),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderColor: [
          'rgb(54, 162, 235)',
          'rgb(255, 99, 132)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)',
          'rgb(255, 159, 64)'
        ],
        borderWidth: 1
      }
    ]
  };

  // 도시별 차트 데이터 (상위 5개만)
  const cityChartData = {
    labels: demographics.cities.slice(0, 5).map(item => item.city),
    datasets: [
      {
        label: '사용자 수',
        data: demographics.cities.slice(0, 5).map(item => item.users),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ],
        borderColor: [
          'rgb(75, 192, 192)',
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)',
          'rgb(153, 102, 255)'
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <Typography variant="body1" className="font-bold">
          분석 기간: {demographics.period.startDate} ~ {demographics.period.endDate}
        </Typography>
      </div>

      <Tabs value={activeTab} onChange={handleTabChange} aria-label="인구통계 탭" className="mb-4">
        <Tab label="국가" />
        <Tab label="언어" />
        <Tab label="도시" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  국가별 사용자 분포
                </Typography>
                <div className="h-80 flex items-center justify-center">
                  <div className="w-4/5 h-full">
                    <Pie
                      data={countryChartData}
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
                  국가별 사용자 통계
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>국가</TableCell>
                        <TableCell align="right">사용자 수</TableCell>
                        <TableCell align="right">비율</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {demographics.countries.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.country}</TableCell>
                          <TableCell align="right">{item.users.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            {((item.users / totalCountryUsers) * 100).toFixed(1)}%
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
      )}

      {activeTab === 1 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  언어별 사용자 분포
                </Typography>
                <div className="h-80 flex items-center justify-center">
                  <div className="w-4/5 h-full">
                    <Pie
                      data={languageChartData}
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
                  언어별 사용자 통계
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>언어</TableCell>
                        <TableCell align="right">사용자 수</TableCell>
                        <TableCell align="right">비율</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {demographics.languages.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.language}</TableCell>
                          <TableCell align="right">{item.users.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            {((item.users / totalLanguageUsers) * 100).toFixed(1)}%
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
      )}

      {activeTab === 2 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  도시별 사용자 분포 (상위 5개)
                </Typography>
                <div className="h-80 flex items-center justify-center">
                  <div className="w-4/5 h-full">
                    <Pie
                      data={cityChartData}
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
                  도시별 사용자 통계
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>도시</TableCell>
                        <TableCell align="right">사용자 수</TableCell>
                        <TableCell align="right">비율</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {demographics.cities.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.city}</TableCell>
                          <TableCell align="right">{item.users.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            {((item.users / totalCityUsers) * 100).toFixed(1)}%
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
      )}
    </div>
  );
}
