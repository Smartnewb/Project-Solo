'use client';

import { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Container, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';

interface MatchedUser {
  name: string;
  gender: string;
  age: number;
  department: string;
  mbti: string;
}

interface MatchDetail {
  match_id: string;
  score: number;
  user1: MatchedUser;
  user2: MatchedUser;
}

interface TestResult {
  scenario: string;
  userCount: number;
  options: {
    ageGap?: number;
    includeInterests?: boolean;
    departmentMatch?: boolean;
    onlyGradeMatching?: boolean;
  };
  message: string;
  matches: any[];
  matchDetails: MatchDetail[];
  stats: {
    totalUsers: number;
    matchedUsers: number;
    waitingUsers: number;
    matchingRate: string;
  };
}

interface TestResponse {
  timestamp: string;
  testResults: TestResult[];
}

export default function TestMatchingPage() {
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState('all');
  const [userCount, setUserCount] = useState(20);
  const [results, setResults] = useState<TestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runMatchingTest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/test-matching?scenario=${scenario}&size=${userCount}`);
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('매칭 테스트 실행 오류:', err);
      setError('매칭 테스트 실행 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          매칭 알고리즘 테스트
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          가상의 유저를 로컬 DB에서 생성하여 매칭 알고리즘을 테스트합니다. Supabase 원격 DB는 수정하지 않습니다.
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>테스트 설정</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel id="scenario-label">테스트 시나리오</InputLabel>
              <Select
                labelId="scenario-label"
                value={scenario}
                label="테스트 시나리오"
                onChange={(e) => setScenario(e.target.value)}
              >
                <MenuItem value="all">모든 시나리오</MenuItem>
                <MenuItem value="pure_algorithm">순수 등급 기반 매칭</MenuItem>
                <MenuItem value="basic">기본 매칭 (나이 기반)</MenuItem>
                <MenuItem value="mbti">MBTI 호환성 고려</MenuItem>
                <MenuItem value="department">학과 다양성 고려</MenuItem>
                <MenuItem value="combined">종합 알고리즘 (모든 조건)</MenuItem>
                <MenuItem value="large">대규모 테스트 (100명)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel id="user-count-label">가상 유저 수</InputLabel>
              <Select
                labelId="user-count-label"
                value={userCount}
                label="가상 유저 수"
                onChange={(e) => setUserCount(Number(e.target.value))}
              >
                <MenuItem value={10}>10명</MenuItem>
                <MenuItem value={20}>20명</MenuItem>
                <MenuItem value={50}>50명</MenuItem>
                <MenuItem value={100}>100명</MenuItem>
                <MenuItem value={200}>200명</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={runMatchingTest}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : '테스트 실행'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {results?.testResults && results.testResults.length > 0 ? (
        <Box>
          <Typography variant="h5" gutterBottom>
            테스트 결과 ({new Date(results.timestamp).toLocaleString('ko-KR')})
          </Typography>
          
          {results.testResults.map((result, index) => (
            <Paper key={index} elevation={2} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>{result.scenario}</Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        전체 사용자
                      </Typography>
                      <Typography variant="h5">
                        {result.stats.totalUsers}명
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        매칭된 사용자
                      </Typography>
                      <Typography variant="h5">
                        {result.stats.matchedUsers}명
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        대기 중 사용자
                      </Typography>
                      <Typography variant="h5">
                        {result.stats.waitingUsers}명
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        매칭 성공률
                      </Typography>
                      <Typography variant="h5">
                        {result.stats.matchingRate}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Typography variant="subtitle1" gutterBottom>
                적용된 옵션: 
                <Chip 
                  label={`나이 차이 ≤ ${result.options.ageGap}살`} 
                  size="small" 
                  variant="outlined"
                  sx={{ mx: 0.5 }}
                />
                {result.options.includeInterests && (
                  <Chip 
                    label="MBTI 호환성" 
                    size="small" 
                    variant="outlined"
                    sx={{ mx: 0.5 }}
                  />
                )}
                {result.options.departmentMatch && (
                  <Chip 
                    label="학과 다양성" 
                    size="small" 
                    variant="outlined"
                    sx={{ mx: 0.5 }}
                  />
                )}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                매칭 결과: {result.message}
              </Typography>
              
              {result.matchDetails.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="5%">No.</TableCell>
                        <TableCell width="40%">남성</TableCell>
                        <TableCell width="40%">여성</TableCell>
                        <TableCell width="15%">매칭 점수</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.matchDetails.map((match, idx) => (
                        <TableRow key={match.match_id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" component="div">
                              {match.user1.name} ({match.user1.age}세)
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {match.user1.department}, {match.user1.mbti}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" component="div">
                              {match.user2.name} ({match.user2.age}세)
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {match.user2.department}, {match.user2.mbti}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={match.score} 
                              size="small" 
                              color={
                                match.score >= 90 ? "success" : 
                                match.score >= 70 ? "primary" : 
                                "default"
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  매칭된 사용자가 없습니다.
                </Alert>
              )}
            </Paper>
          ))}
        </Box>
      ) : results ? (
        <Alert severity="info">테스트 결과가 없습니다.</Alert>
      ) : null}
    </Container>
  );
}
