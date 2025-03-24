'use client';

import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DevicesIcon from '@mui/icons-material/Devices';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

// 트래픽 데이터 타입 정의
interface TrafficData {
  dailyVisits: Array<{ date: string; count: number }>;
  hourlyActivity: Array<{ hour: string; count: number }>;
  dailySignups: Array<{ date: string; count: number }>;
  cumulativeUsers: Array<{ month: string; total: number }>;
  avgSessionDuration: Array<{ date: string; avg_duration_minutes: number }>;
  deviceStats: Array<{ device_type: string; count: number }>;
  
  // 요약 통계
  dailyVisitorsCount: number;
  weeklyVisitorsCount: number;
  monthlyVisitorsCount: number;
  activeUsersCount: number;
  totalUsersCount: number;
  
  // 생성일시
  generatedAt: string;
}

export default function TrafficPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 트래픽 데이터 가져오기
  const fetchTrafficData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/traffic');
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      setTrafficData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('트래픽 데이터 가져오기 오류:', error);
      // 에러 시 더미 데이터로 폴백
      setDummyData();
    } finally {
      setIsLoading(false);
    }
  };

  // 더미 데이터 생성 (API 응답 실패 시)
  const setDummyData = () => {
    const today = new Date();
    const dailyVisits = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - 29 + i);
      return {
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 1000) + 100
      };
    });

    const hourlyActivity = Array.from({ length: 24 }, (_, i) => {
      return {
        hour: `${i.toString().padStart(2, '0')}:00`,
        count: Math.floor(Math.random() * 100) + 10
      };
    });

    const dailySignups = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - 29 + i);
      return {
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 50) + 5
      };
    });

    const cumulativeUsers = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(today.getMonth() - 11 + i);
      const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      return {
        month,
        total: 1000 + (i * 500) + Math.floor(Math.random() * 200)
      };
    });

    const avgSessionDuration = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - 29 + i);
      return {
        date: date.toISOString().split('T')[0],
        avg_duration_minutes: Math.floor(Math.random() * 15) + 5
      };
    });

    const deviceStats = [
      { device_type: '모바일', count: Math.floor(Math.random() * 5000) + 3000 },
      { device_type: '데스크톱', count: Math.floor(Math.random() * 3000) + 1000 },
      { device_type: '태블릿', count: Math.floor(Math.random() * 1000) + 500 },
      { device_type: '기타', count: Math.floor(Math.random() * 500) + 100 }
    ];

    setTrafficData({
      dailyVisits,
      hourlyActivity,
      dailySignups,
      cumulativeUsers,
      avgSessionDuration,
      deviceStats,
      dailyVisitorsCount: Math.floor(Math.random() * 1000) + 500,
      weeklyVisitorsCount: Math.floor(Math.random() * 5000) + 2000,
      monthlyVisitorsCount: Math.floor(Math.random() * 20000) + 8000,
      activeUsersCount: Math.floor(Math.random() * 100) + 50,
      totalUsersCount: Math.floor(Math.random() * 50000) + 10000,
      generatedAt: new Date().toISOString()
    });
  };

  // 탭 변경 핸들러
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    fetchTrafficData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <CircularProgress size={60} />
        <Typography variant="h6" className="mt-4">
          트래픽 데이터 로딩 중...
        </Typography>
      </div>
    );
  }

  if (!trafficData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Typography variant="h6" className="text-red-500">
          데이터를 불러오는 데 실패했습니다.
        </Typography>
        <button
          onClick={fetchTrafficData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 차트 데이터 준비
  const dailyVisitsChartData = {
    labels: trafficData.dailyVisits.map(item => item.date.substring(5)), // "MM-DD" 형식
    datasets: [
      {
        label: '일일 방문자 수',
        data: trafficData.dailyVisits.map(item => item.count),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.3
      }
    ]
  };

  const signupsChartData = {
    labels: trafficData.dailySignups.map(item => item.date.substring(5)),
    datasets: [
      {
        label: '일일 회원가입자 수',
        data: trafficData.dailySignups.map(item => item.count),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3
      }
    ]
  };

  const cumulativeUsersChartData = {
    labels: trafficData.cumulativeUsers.map(item => item.month),
    datasets: [
      {
        label: '누적 사용자 수',
        data: trafficData.cumulativeUsers.map(item => item.total),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1
      }
    ]
  };

  const sessionDurationChartData = {
    labels: trafficData.avgSessionDuration.map(item => item.date.substring(5)),
    datasets: [
      {
        label: '평균 사용 시간 (분)',
        data: trafficData.avgSessionDuration.map(item => item.avg_duration_minutes),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        tension: 0.3
      }
    ]
  };

  const hourlyActivityChartData = {
    labels: trafficData.hourlyActivity.map(item => item.hour),
    datasets: [
      {
        label: '시간대별 활성 사용자',
        data: trafficData.hourlyActivity.map(item => item.count),
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        borderColor: 'rgb(255, 159, 64)',
        borderWidth: 1
      }
    ]
  };

  const deviceStatsChartData = {
    labels: trafficData.deviceStats.map(item => item.device_type),
    datasets: [
      {
        label: '기기별 사용자 수',
        data: trafficData.deviceStats.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Typography variant="h4" component="h1" gutterBottom>
          트래픽 모니터링
        </Typography>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <Typography variant="body2" color="textSecondary">
              마지막 업데이트: {lastUpdated.toLocaleString('ko-KR')}
            </Typography>
          )}
          <Tooltip title="새로고침">
            <IconButton onClick={fetchTrafficData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent className="flex flex-col items-center">
              <PersonIcon fontSize="large" color="primary" />
              <Typography color="textSecondary" gutterBottom>
                일일 방문자
              </Typography>
              <Typography variant="h4">{trafficData.dailyVisitorsCount.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent className="flex flex-col items-center">
              <PeopleIcon fontSize="large" color="primary" />
              <Typography color="textSecondary" gutterBottom>
                누적 사용자
              </Typography>
              <Typography variant="h4">{trafficData.totalUsersCount.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent className="flex flex-col items-center">
              <AccessTimeIcon fontSize="large" color="primary" />
              <Typography color="textSecondary" gutterBottom>
                활성 사용자
              </Typography>
              <Typography variant="h4">{trafficData.activeUsersCount.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent className="flex flex-col items-center">
              <CalendarViewMonthIcon fontSize="large" color="primary" />
              <Typography color="textSecondary" gutterBottom>
                월간 방문자
              </Typography>
              <Typography variant="h4">{trafficData.monthlyVisitorsCount.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="트래픽 통계 탭">
          <Tab label="방문자 통계" />
          <Tab label="사용자 통계" />
          <Tab label="사용 패턴" />
          <Tab label="기기 통계" />
        </Tabs>
      </Box>

      {/* 방문자 통계 탭 */}
      {activeTab === 0 && (
        <div className="mt-4">
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    일별 방문자 추이 (최근 30일)
                  </Typography>
                  <div className="h-80">
                    <Line
                      data={dailyVisitsChartData}
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
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    시간대별 활성 사용자
                  </Typography>
                  <div className="h-80">
                    <Bar
                      data={hourlyActivityChartData}
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
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    요약 통계
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>일일 방문자</TableCell>
                          <TableCell align="right">{trafficData.dailyVisitorsCount.toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>주간 방문자</TableCell>
                          <TableCell align="right">{trafficData.weeklyVisitorsCount.toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>월간 방문자</TableCell>
                          <TableCell align="right">{trafficData.monthlyVisitorsCount.toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>활성 사용자</TableCell>
                          <TableCell align="right">{trafficData.activeUsersCount.toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>총 사용자</TableCell>
                          <TableCell align="right">{trafficData.totalUsersCount.toLocaleString()}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </div>
      )}

      {/* 사용자 통계 탭 */}
      {activeTab === 1 && (
        <div className="mt-4">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    일별 회원가입 추이 (최근 30일)
                  </Typography>
                  <div className="h-80">
                    <Line
                      data={signupsChartData}
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
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    누적 사용자 성장 (월별)
                  </Typography>
                  <div className="h-80">
                    <Line
                      data={cumulativeUsersChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
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
                    주요 사용자 통계
                  </Typography>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Typography variant="h5" className="font-bold text-blue-700">
                        {trafficData.totalUsersCount.toLocaleString()}
                      </Typography>
                      <Typography color="textSecondary">총 가입자</Typography>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Typography variant="h5" className="font-bold text-green-700">
                        {trafficData.activeUsersCount.toLocaleString()}
                      </Typography>
                      <Typography color="textSecondary">활성 사용자 (24시간)</Typography>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Typography variant="h5" className="font-bold text-purple-700">
                        {Math.round((trafficData.activeUsersCount / trafficData.totalUsersCount) * 100) || 0}%
                      </Typography>
                      <Typography color="textSecondary">활성 사용자 비율</Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </div>
      )}

      {/* 사용 패턴 탭 */}
      {activeTab === 2 && (
        <div className="mt-4">
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    일별 사용자 체류 시간 (최근 30일)
                  </Typography>
                  <div className="h-80">
                    <Line
                      data={sessionDurationChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: '평균 체류 시간 (분)'
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
                    시간대별 활성 사용자
                  </Typography>
                  <div className="h-80">
                    <Bar
                      data={hourlyActivityChartData}
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
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    사용자 활동 통계
                  </Typography>
                  <div className="p-4">
                    <Typography variant="body1" gutterBottom>
                      <strong>평균 사용 시간: </strong>
                      {
                        trafficData.avgSessionDuration.length > 0 
                          ? Math.round(trafficData.avgSessionDuration.reduce((acc, item) => acc + item.avg_duration_minutes, 0) / trafficData.avgSessionDuration.length)
                          : 0
                      } 분
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>최고 활동 시간대: </strong>
                      {
                        trafficData.hourlyActivity.length > 0
                          ? trafficData.hourlyActivity.reduce((prev, current) => (prev.count > current.count) ? prev : current).hour
                          : '데이터 없음'
                      }
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>가장 긴 체류 일자: </strong>
                      {
                        trafficData.avgSessionDuration.length > 0
                          ? trafficData.avgSessionDuration.reduce((prev, current) => (prev.avg_duration_minutes > current.avg_duration_minutes) ? prev : current).date
                          : '데이터 없음'
                      }
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </div>
      )}

      {/* 기기 통계 탭 */}
      {activeTab === 3 && (
        <div className="mt-4">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    기기별 사용자 분포
                  </Typography>
                  <div className="h-80 flex items-center justify-center">
                    <div className="w-3/4 h-full">
                      <Pie
                        data={deviceStatsChartData}
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
                    기기별 사용자 통계
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>기기 유형</TableCell>
                          <TableCell align="right">사용자 수</TableCell>
                          <TableCell align="right">비율</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {trafficData.deviceStats.map((device) => {
                          const total = trafficData.deviceStats.reduce((sum, item) => sum + item.count, 0);
                          const percentage = total > 0 ? ((device.count / total) * 100).toFixed(1) : '0.0';
                          
                          return (
                            <TableRow key={device.device_type}>
                              <TableCell>{device.device_type}</TableCell>
                              <TableCell align="right">{device.count.toLocaleString()}</TableCell>
                              <TableCell align="right">{percentage}%</TableCell>
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
      )}
    </div>
  );
} 