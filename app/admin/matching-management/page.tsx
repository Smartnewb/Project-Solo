'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_EMAIL } from '@/utils/config';
import AdminService from '@/app/services/admin';
import axiosServer from '@/utils/axios';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

// 사용자 검색 결과 타입 (외모 등급 API 응답 구조에 맞춤)
interface UserSearchResult {
  id: string;
  name: string;
  email?: string;
  profileImageUrl?: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  appearanceGrade?: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN';
  university?: string | {
    id: string;
    name: string;
    emailDomain: string;
    isVerified: boolean;
  };
  universityDetails?: {
    name: string;
    department?: string;
  };
}

// 매칭 결과 타입
interface MatchingResult {
  success: boolean;
  partner: UserProfile;
  requester: UserProfile;
  similarity: number;
}

// 사용자 프로필 타입
interface UserProfile {
  id: string;
  mbti?: string;
  name: string;
  age: number;
  gender: string;
  rank?: string;
  profileImages?: {
    id: string;
    order: number;
    isMain: boolean;
    url: string;
  }[];
  instagramId?: string;
  universityDetails?: {
    name: string;
    authentication: boolean;
    department: string;
    grade: string;
    studentNumber: string;
  };
  preferences?: {
    typeName: string;
    selectedOptions: {
      id: string;
      displayName: string;
    }[];
  }[];
}

export default function MatchingManagement() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 사용자 검색 함수
  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setError('검색어를 입력해주세요.');
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);

      // 사용자 검색 API 호출 - 올바른 엔드포인트와 파라미터 사용
      const response = await axiosServer.get('/admin/users/appearance', {
        params: {
          page: 1,
          limit: 10,
          searchTerm: searchTerm.trim()
        }
      });

      console.log('사용자 검색 응답:', response.data);

      // 응답 데이터 구조에 맞게 처리
      const users = response.data.items || [];
      setSearchResults(users);

      if (users.length === 0) {
        setError('검색 결과가 없습니다.');
      }
    } catch (err: any) {
      console.error('사용자 검색 중 오류:', err);
      setError(err.message || '사용자 검색 중 오류가 발생했습니다.');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // 단일 매칭 처리 함수
  const processSingleMatching = async () => {
    if (!selectedUser) {
      setError('매칭할 사용자를 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMatchingResult(null);

      // 단일 매칭 API 호출
      const result = await AdminService.matching.processSingleMatching(selectedUser.id);
      setMatchingResult(result);
    } catch (err: any) {
      console.error('매칭 처리 중 오류:', err);
      setError(err.message || '매칭 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 사용자 선택 함수
  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user);
    setMatchingResult(null); // 새 사용자 선택 시 이전 매칭 결과 초기화
  };

  // 인증 확인
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || (user.email !== process.env.NEXT_PUBLIC_DEFAULT_ADMIN_EMAIL && user.email !== ADMIN_EMAIL)) {
    router.push('/');
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        매칭 관리
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          단일 매칭 처리
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            label="사용자 이름 검색"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mr: 2, flexGrow: 1 }}
          />
          <Button
            variant="contained"
            onClick={searchUsers}
            disabled={searchLoading}
          >
            {searchLoading ? <CircularProgress size={24} /> : '검색'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 검색 결과 목록 */}
        {searchResults.length > 0 && (
          <Paper variant="outlined" sx={{ mb: 3, maxHeight: 300, overflow: 'auto' }}>
            <List>
              {searchResults.map((user) => (
                <ListItem
                  key={user.id}
                  button
                  selected={selectedUser?.id === user.id}
                  onClick={() => handleUserSelect(user)}
                >
                  <ListItemAvatar>
                    <Avatar src={user.profileImageUrl}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography component="span">
                          {user.name} ({user.age}세, {user.gender === 'MALE' ? '남성' : '여성'})
                        </Typography>
                        {user.appearanceGrade && (
                          <Chip
                            size="small"
                            label={user.appearanceGrade}
                            color={
                              user.appearanceGrade === 'S' ? 'secondary' :
                              user.appearanceGrade === 'A' ? 'primary' :
                              user.appearanceGrade === 'B' ? 'success' :
                              user.appearanceGrade === 'C' ? 'warning' : 'default'
                            }
                            sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      // 대학교 정보 표시 (여러 필드 구조 지원)
                      user.university ? (
                        typeof user.university === 'string' ? user.university : user.university.name
                      ) : user.universityDetails?.name ?
                        `${user.universityDetails.name} ${user.universityDetails.department || ''}` :
                        '대학 정보 없음'
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {/* 선택된 사용자 정보 */}
        {selectedUser && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              선택된 사용자:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar src={selectedUser.profileImageUrl} sx={{ mr: 2 }}>
                  <PersonIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1">
                      {selectedUser.name} ({selectedUser.age}세, {selectedUser.gender === 'MALE' ? '남성' : '여성'})
                    </Typography>
                    {selectedUser.appearanceGrade && (
                      <Chip
                        size="small"
                        label={selectedUser.appearanceGrade}
                        color={
                          selectedUser.appearanceGrade === 'S' ? 'secondary' :
                          selectedUser.appearanceGrade === 'A' ? 'primary' :
                          selectedUser.appearanceGrade === 'B' ? 'success' :
                          selectedUser.appearanceGrade === 'C' ? 'warning' : 'default'
                        }
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {selectedUser.university ? (
                      typeof selectedUser.university === 'string' ?
                        selectedUser.university :
                        selectedUser.university.name
                    ) : selectedUser.universityDetails?.name ?
                      `${selectedUser.universityDetails.name} ${selectedUser.universityDetails.department || ''}` :
                      '대학 정보 없음'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
            <Button
              variant="contained"
              color="primary"
              onClick={processSingleMatching}
              disabled={loading}
              sx={{ mt: 2 }}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : '매칭 실행'}
            </Button>
          </Box>
        )}

        {/* 매칭 결과 */}
        {matchingResult && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              매칭 결과
            </Typography>
            {matchingResult.success ? (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
                  매칭 성공! 유사도: {(matchingResult.similarity * 100).toFixed(1)}%
                </Alert>
                <Grid container spacing={3}>
                  {/* 요청자 정보 */}
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          요청자 정보
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar
                            src={matchingResult.requester.profileImages?.find(img => img.isMain)?.url}
                            sx={{ width: 64, height: 64, mr: 2 }}
                          >
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body1">
                              {matchingResult.requester.name} ({matchingResult.requester.age}세)
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {matchingResult.requester.gender === 'MALE' ? '남성' : '여성'}
                              {matchingResult.requester.rank && ` • ${matchingResult.requester.rank}등급`}
                              {matchingResult.requester.mbti && ` • ${matchingResult.requester.mbti}`}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body2">
                          {matchingResult.requester.universityDetails?.name} {matchingResult.requester.universityDetails?.department}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {matchingResult.requester.universityDetails?.grade} {matchingResult.requester.universityDetails?.studentNumber}
                        </Typography>

                        {/* 선호 조건 */}
                        {matchingResult.requester.preferences && matchingResult.requester.preferences.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              선호 조건:
                            </Typography>
                            {matchingResult.requester.preferences.map((pref, index) => (
                              <Box key={index} sx={{ mb: 1 }}>
                                <Typography variant="body2" color="textSecondary">
                                  {pref.typeName}:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {pref.selectedOptions.map(option => (
                                    <Chip
                                      key={option.id}
                                      label={option.displayName}
                                      size="small"
                                      sx={{ mb: 0.5 }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 매칭 상대 정보 */}
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          매칭 상대 정보
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar
                            src={matchingResult.partner.profileImages?.find(img => img.isMain)?.url}
                            sx={{ width: 64, height: 64, mr: 2 }}
                          >
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body1">
                              {matchingResult.partner.name} ({matchingResult.partner.age}세)
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {matchingResult.partner.gender === 'MALE' ? '남성' : '여성'}
                              {matchingResult.partner.rank && ` • ${matchingResult.partner.rank}등급`}
                              {matchingResult.partner.mbti && ` • ${matchingResult.partner.mbti}`}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body2">
                          {matchingResult.partner.universityDetails?.name} {matchingResult.partner.universityDetails?.department}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {matchingResult.partner.universityDetails?.grade} {matchingResult.partner.universityDetails?.studentNumber}
                        </Typography>

                        {/* 선호 조건 */}
                        {matchingResult.partner.preferences && matchingResult.partner.preferences.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              선호 조건:
                            </Typography>
                            {matchingResult.partner.preferences.map((pref, index) => (
                              <Box key={index} sx={{ mb: 1 }}>
                                <Typography variant="body2" color="textSecondary">
                                  {pref.typeName}:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {pref.selectedOptions.map(option => (
                                    <Chip
                                      key={option.id}
                                      label={option.displayName}
                                      size="small"
                                      sx={{ mb: 0.5 }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Alert severity="error">
                매칭 실패: {matchingResult.success === false ? '적합한 매칭 상대를 찾을 수 없습니다.' : '알 수 없는 오류가 발생했습니다.'}
              </Alert>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
