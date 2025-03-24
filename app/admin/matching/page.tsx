'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Typography,
  Box,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  AlertTitle
} from '@mui/material';

// 매칭된 유저 타입 정의
interface MatchedUser {
  id: string;
  name: string;
  classification: string;
  gender: string;
  age: number;
  department: string;
  instagram_id: string;
  mbti: string;
}

// 매칭 타입 정의
interface MatchData {
  id: string;
  status: string;
  created_at: string;
  match_date: string;
  user1: MatchedUser; // 남성
  user2: MatchedUser; // 여성
}

export default function AdminMatching() {
  const [matchingDate, setMatchingDate] = useState('');
  const [isSignupEnabled, setIsSignupEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);
  const [isMatchListLoading, setIsMatchListLoading] = useState(false);
  const [matchedUsers, setMatchedUsers] = useState<MatchData[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; content: string }>({
    type: 'info',
    content: ''
  });

  useEffect(() => {
    fetchMatchingTime();
    fetchSignupStatus();
    fetchMatchedUsers();
  }, []);

  const fetchMatchingTime = async () => {
    try {
      setIsLoading(true);
      console.log('매칭 시간 조회 시작');
      
      const response = await fetch('/api/admin/matching-time');
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('매칭 시간 데이터:', data);
      
      if (data.matchingTime) {
        // ISO 날짜 문자열을 로컬 시간으로 변환하여 datetime-local 입력창에 표시
        const date = new Date(data.matchingTime);
        // YYYY-MM-DDThh:mm 형식으로 변환 (datetime-local 입력창 형식)
        const localDateTimeString = date.toISOString().slice(0, 16);
        setMatchingDate(localDateTimeString);
        setMessage({
          type: 'info',
          content: `현재 설정된 매칭 시간을 불러왔습니다. (${date.toLocaleString('ko-KR')})`
        });
      } else {
        setMatchingDate('');
        setMessage({
          type: 'info',
          content: '설정된 매칭 시간이 없습니다.'
        });
      }
    } catch (error) {
      console.error('매칭 시간 조회 실패:', error);
      setMessage({ 
        type: 'error', 
        content: '매칭 시간 조회에 실패했습니다. 다시 시도해 주세요.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSignupStatus = async () => {
    try {
      console.log('회원가입 상태 정보 가져오기 시작');
      const response = await fetch('/api/admin/signup-control');
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('회원가입 상태 정보:', data);
      
      if (data.isSignupEnabled !== undefined) {
        setIsSignupEnabled(data.isSignupEnabled);
        setMessage({
          type: 'info',
          content: `현재 회원가입이 ${data.isSignupEnabled ? '활성화' : '비활성화'} 상태입니다.`
        });
      } else {
        setMessage({
          type: 'error',
          content: '회원가입 상태 정보를 불러올 수 없습니다.'
        });
      }
    } catch (error) {
      console.error('회원가입 상태 조회 실패:', error);
      setMessage({ 
        type: 'error', 
        content: '회원가입 상태 조회에 실패했습니다.' 
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      console.log('매칭 시간 설정 요청:', matchingDate);
      
      const response = await fetch('/api/admin/matching-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchingTime: matchingDate }),
      });

      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('매칭 시간 설정 응답:', data);

      setMessage({
        type: 'success',
        content: '매칭 시간이 성공적으로 설정되었습니다.'
      });
    } catch (error) {
      console.error('매칭 시간 설정 실패:', error);
      setMessage({
        type: 'error',
        content: '매칭 시간 설정에 실패했습니다. 다시 시도해 주세요.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSignup = async () => {
    try {
      setIsLoading(true);
      console.log(`회원가입 상태 변경 요청: ${isSignupEnabled ? '비활성화' : '활성화'}`);
      
      const response = await fetch('/api/admin/signup-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isSignupEnabled: !isSignupEnabled }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('회원가입 상태 변경 응답:', data);

      if (data.success) {
        setIsSignupEnabled(!isSignupEnabled);
        setMessage({
          type: 'success',
          content: `회원가입이 ${!isSignupEnabled ? '활성화' : '비활성화'}되었습니다.`
        });
      } else {
        throw new Error('회원가입 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 상태 변경 중 오류 발생:', error);
      setMessage({
        type: 'error',
        content: error instanceof Error ? error.message : '회원가입 상태 변경에 실패했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startMatching = async () => {
    try {
      setIsMatchingLoading(true);
      console.log('매칭 프로세스 시작');
      
      const response = await fetch('/api/admin/matching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('매칭 결과:', data);

      setMessage({
        type: 'success',
        content: `매칭이 성공적으로 완료되었습니다. ${data.matchedCount || 0}쌍의 매칭이 생성되었습니다.`
      });
      
      // 매칭 후 목록 새로고침
      fetchMatchedUsers();
    } catch (error) {
      console.error('매칭 중 오류 발생:', error);
      setMessage({
        type: 'error',
        content: error instanceof Error ? error.message : '매칭에 실패했습니다.'
      });
    } finally {
      setIsMatchingLoading(false);
    }
  };

  const fetchMatchedUsers = async () => {
    try {
      setIsMatchListLoading(true);
      console.log('매칭된 유저 목록 조회 시작');
      
      const response = await fetch('/api/admin/matched-users');
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('매칭된 유저 데이터:', data);
      
      setMatchedUsers(data.matches || []);
    } catch (error) {
      console.error('매칭된 유저 목록 조회 실패:', error);
      setMessage({
        type: 'error',
        content: '매칭된 유저 목록을 불러오는데 실패했습니다.'
      });
    } finally {
      setIsMatchListLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Grid container spacing={3}>
          {/* 매칭 시간 설정 */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <h2 className="text-xl font-bold mb-4">매칭 시간 설정</h2>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        매칭 시간
                      </label>
                      <input
                        type="datetime-local"
                        value={matchingDate}
                        onChange={(e) => setMatchingDate(e.target.value)}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-primary-DEFAULT text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                      {isLoading ? '처리 중...' : '매칭 시간 설정'}
                    </button>
                  </form>
                  
                  {/* 현재 설정된 시간 표시 */}
                  {matchingDate && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg shadow max-w-md">
                      <h3 className="text-sm font-medium text-blue-800 mb-2">현재 설정된 매칭 시간</h3>
                      <div className="text-gray-700">
                        <p className="text-lg font-medium text-blue-700 mb-1">
                          {new Date(matchingDate).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(matchingDate).toLocaleString('ko-KR', { weekday: 'long' })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Grid>
          
          {/* 회원 매칭 */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <h2 className="text-xl font-bold mb-4">회원 매칭</h2>
                <div className="max-w-md space-y-4">
                  <div className="p-4 bg-white rounded-lg shadow">
                    <p className="text-sm text-gray-700 mb-4">
                      회원가입된 전체 사용자(남/여)를 불러와 알고리즘에 따라 1:1 매칭을 수행합니다. 매칭 결과는 지정된 시간에 사용자에게 공개됩니다.
                    </p>
                    <button
                      onClick={startMatching}
                      disabled={isMatchingLoading}
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {isMatchingLoading ? '매칭 진행 중...' : '매칭 시작'}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Grid>

          {/* 회원가입 제어 */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <h2 className="text-xl font-bold mb-4">회원가입 제어</h2>
                <div className="max-w-md space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
                    <div>
                      <p className="font-medium">회원가입 상태</p>
                      <p className={`text-sm ${isSignupEnabled ? 'text-green-600' : 'text-red-600'}`}>
                        {isSignupEnabled ? '활성화' : '비활성화'}
                      </p>
                    </div>
                    <button
                      onClick={toggleSignup}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${
                        isSignupEnabled
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      } disabled:opacity-50`}
                    >
                      {isLoading ? '처리 중...' : isSignupEnabled ? '비활성화하기' : '활성화하기'}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">매칭된 유저 리스트</h2>
          <div className="mb-4">
            <Button 
              variant="contained" 
              color="primary" 
              onClick={fetchMatchedUsers}
              disabled={isMatchListLoading}
              className="mb-4"
            >
              {isMatchListLoading ? <CircularProgress size={24} /> : '목록 새로고침'}
            </Button>
          </div>
          
          {isMatchListLoading ? (
            <div className="flex justify-center my-4">
              <CircularProgress />
            </div>
          ) : matchedUsers.length > 0 ? (
            <TableContainer component={Paper} className="mb-8">
              <Table sx={{ minWidth: 650 }} aria-label="매칭된 유저 테이블">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>순서</TableCell>
                    <TableCell>등급</TableCell>
                    <TableCell>여성 유저</TableCell>
                    <TableCell>남성 유저</TableCell>
                    <TableCell>상세정보</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {matchedUsers.map((match, index) => (
                    <TableRow
                      key={match.id}
                      sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Chip 
                            label={`여성: ${match.user2.classification || 'N/A'}`}
                            color={
                              match.user2.classification === 'S' ? 'primary' :
                              match.user2.classification === 'A' ? 'success' :
                              match.user2.classification === 'B' ? 'warning' : 'error'
                            }
                            size="small"
                          />
                          <Chip 
                            label={`남성: ${match.user1.classification || 'N/A'}`}
                            color={
                              match.user1.classification === 'S' ? 'primary' :
                              match.user1.classification === 'A' ? 'success' :
                              match.user1.classification === 'B' ? 'warning' : 'error'
                            }
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" component="div">
                          <strong>이름:</strong> {match.user2.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>인스타:</strong> {match.user2.instagram_id || '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>나이:</strong> {match.user2.age}세
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" component="div">
                          <strong>이름:</strong> {match.user1.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>인스타:</strong> {match.user1.instagram_id || '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>나이:</strong> {match.user1.age}세
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Link href={`/admin/users/${match.user2.id}`} passHref>
                            <Button variant="outlined" size="small" color="primary">
                              여성 상세정보
                            </Button>
                          </Link>
                          <Link href={`/admin/users/${match.user1.id}`} passHref>
                            <Button variant="outlined" size="small" color="primary">
                              남성 상세정보
                            </Button>
                          </Link>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" className="my-4">
              매칭된 유저가 없습니다.
            </Typography>
          )}
        </div>
      </div>

      {/* 메시지 표시 */}
      {message.content && (
        <div className={`max-w-md p-4 rounded-lg ${
          message.type === 'error' ? 'bg-red-100 text-red-700' :
          message.type === 'success' ? 'bg-green-100 text-green-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {message.content}
        </div>
      )}
    </div>
  );
} 