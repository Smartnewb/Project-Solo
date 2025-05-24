'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TableRow,
  Switch,
  Paper,
  CircularProgress,
  Alert,
  TextareaAutosize
} from '@mui/material';
import axiosServer from '@/utils/axios';
import { useBatchStatus } from './useBatchStatus';

// 컴포넌트 임포트
import UserSearch from './components/UserSearch';
import SingleMatching from './components/SingleMatching';
import MatchingSimulation from './components/MatchingSimulation';
import UnmatchedUsers from './components/UnmatchedUsers';
import MatcherHistory from './components/MatcherHistory';
import UserDetailModal from '@/components/admin/appearance/UserDetailModal';

// 타입 임포트
import { UserSearchResult, MatchingResult, MatchingSimulationResult, UnmatchedUser } from './types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserDetail } from '@/components/admin/appearance/UserDetailModal';
import AdminService from '@/app/services/admin';
import { Button } from '@/shared/ui';

// 탭 인터페이스
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
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

// 탭 패널 컴포넌트
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`matching-tabpanel-${index}`}
      aria-labelledby={`matching-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const matchRestMembers = () =>
  axiosServer.post('/matching/rest-members', null, {
    timeout: 1000 * 60 * 60
  });

export default function MatchingManagement() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<number>(0);
  const {
    status: batchStatus,
    loading: batchStatusLoading,
    error: batchStatusError,
    toggleStatus
  } = useBatchStatus();

  // 공통 상태
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 단일 매칭 상태
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null);

  // 매칭 시뮬레이션 상태
  const [matchLimit, setMatchLimit] = useState(5);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<MatchingSimulationResult | null>(null);
  const [selectedPartnerIndex, setSelectedPartnerIndex] = useState<number | null>(null);
  const isBatchMatching = activeTab === 2;

  // 매칭 대기 사용자 상태
  const [unmatchedUsers, setUnmatchedUsers] = useState<UnmatchedUser[]>([]);
  const [unmatchedUsersLoading, setUnmatchedUsersLoading] = useState(false);
  const [unmatchedUsersError, setUnmatchedUsersError] = useState<string | null>(null);
  const [unmatchedUsersTotalCount, setUnmatchedUsersTotalCount] = useState(0);
  const [unmatchedUsersPage, setUnmatchedUsersPage] = useState(1);
  const [unmatchedUsersLimit, setUnmatchedUsersLimit] = useState(10);
  const [unmatchedUsersSearchTerm, setUnmatchedUsersSearchTerm] = useState('');
  const [unmatchedUsersGenderFilter, setUnmatchedUsersGenderFilter] = useState('all');
  const [selectedUnmatchedUser, setSelectedUnmatchedUser] = useState<UnmatchedUser | null>(null);
  const [restMembers, setRestMembers] = useState<any>('');

  const doMatchRestMembers = async () => {
    try {
      const response = await matchRestMembers();
      setRestMembers(response);
    } catch (error) {
      console.error('매칭 대기 사용자 조회 오류:', error);
    }
  }


  // 사용자 상세 정보 모달 상태
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  // 페이지 초기화
  useEffect(() => {
    // 필요한 초기화 작업 수행
  }, []);

  // 탭 변경 핸들러
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);

    // 매칭 대기 사용자 탭으로 이동할 때 데이터 로드
    if (newValue === 2 && unmatchedUsers.length === 0) {
      fetchUnmatchedUsers();
    }
  };

  // 사용자 검색 함수
  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setError('검색어를 입력해주세요.');
      return;
    }

    setSearchLoading(true);
    setError(null);

    try {
      // API 요청 시 axiosServer 사용
      const response = await axiosServer.get('/admin/users/appearance', {
        params: {
          page: 1,
          limit: 10,
          searchTerm: searchTerm
        }
      });

      console.log('사용자 검색 응답:', response.data);

      let results = [];

      if (response.data && response.data.items && Array.isArray(response.data.items)) {
        // API가 { items: [...] } 형태로 응답할 경우
        results = response.data.items;
      } else if (response.data && Array.isArray(response.data)) {
        results = response.data;
      }

      setSearchResults(results);

      // 검색 결과가 없는 경우 명확한 메시지 표시
      if (results.length === 0) {
        setError(`"${searchTerm}" 검색 결과가 없습니다. 다른 이름으로 검색해보세요.`);
      } else {
        setError(null); // 검색 결과가 있으면 에러 메시지 초기화
      }
    } catch (err: any) {
      console.error('사용자 검색 오류:', err);

      // 서버에서 받은 에러 메시지 표시
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          '사용자 검색 중 오류가 발생했습니다.';

      setError(errorMessage);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // 사용자 선택 핸들러
  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user);
    setMatchingResult(null);
    setSimulationResult(null);
  };

  // 단일 매칭 처리 함수
  const processSingleMatching = async () => {
    if (!selectedUser) {
      setError('매칭할 사용자를 선택해주세요.');
      return;
    }

    setMatchingLoading(true);
    setError(null);

    try {
      const response = await axiosServer.post('/admin/matching/user', {
        userId: selectedUser.id
      });

      console.log('매칭 처리 응답:', response.data);
      setMatchingResult(response.data);
    } catch (err: any) {
      console.error('매칭 처리 오류:', err);

      // 서버에서 받은 에러 메시지 표시
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          '매칭 처리 중 오류가 발생했습니다.';

      setError(errorMessage);
    } finally {
      setMatchingLoading(false);
    }
  };

  // 매칭 시뮬레이션 실행 함수
  const runMatchingSimulation = async () => {
    if (!selectedUser) {
      setError('매칭 시뮬레이션을 실행할 사용자를 선택해주세요.');
      return;
    }

    setSimulationLoading(true);
    setError(null);
    setSelectedPartnerIndex(null);

    try {
      // POST 메서드로 변경하고 요청 본문에 파라미터 포함
      const response = await axiosServer.post('/admin/matching/user/read', {
        userId: selectedUser.id,
        limit: matchLimit
      });

      console.log('매칭 시뮬레이션 응답:', response.data);
      setSimulationResult(response.data);
    } catch (err: any) {
      console.error('매칭 시뮬레이션 오류:', err);

      // 서버에서 받은 에러 메시지 표시
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          '매칭 시뮬레이션 중 오류가 발생했습니다.';

      setError(errorMessage);
    } finally {
      setSimulationLoading(false);
    }
  };

  // 매칭 파트너 선택 핸들러
  const handlePartnerSelect = (index: number) => {
    setSelectedPartnerIndex(index === -1 ? null : index);
  };

  // 매칭 대기 사용자 조회 함수
  const fetchUnmatchedUsers = async () => {
    setUnmatchedUsersLoading(true);
    setUnmatchedUsersError(null);

    try {
      const response = await axiosServer.get('/admin/matching/unmatched-users', {
        params: {
          page: unmatchedUsersPage,
          limit: unmatchedUsersLimit,
          name: unmatchedUsersSearchTerm || undefined,
          gender: unmatchedUsersGenderFilter !== 'all' ? unmatchedUsersGenderFilter : undefined
        }
      });

      console.log('매칭 대기 사용자 조회 응답:', response.data);

      // 새로운 응답 형식에 맞게 처리
      if (response.data.items && Array.isArray(response.data.items)) {
        setUnmatchedUsers(response.data.items);
      } else if (response.data.users && Array.isArray(response.data.users)) {
        // 이전 형식 지원
        setUnmatchedUsers(response.data.users);
      } else {
        setUnmatchedUsers([]);
      }

      // 메타 정보 처리
      if (response.data.meta) {
        setUnmatchedUsersTotalCount(response.data.meta.totalItems || 0);
      } else {
        setUnmatchedUsersTotalCount(response.data.totalCount || 0);
      }
    } catch (err: any) {
      console.error('매칭 대기 사용자 조회 오류:', err);

      // 서버에서 받은 에러 메시지 표시
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          '매칭 대기 사용자 조회 중 오류가 발생했습니다.';

      setUnmatchedUsersError(errorMessage);
      setUnmatchedUsers([]);
    } finally {
      setUnmatchedUsersLoading(false);
    }
  };

  // 매칭 대기 사용자 검색 핸들러
  const handleUnmatchedUsersSearch = () => {
    setUnmatchedUsersPage(1); // 페이지 번호를 1로 설정
    fetchUnmatchedUsers();
  };

  // 매칭 대기 사용자 페이지 변경 핸들러
  const handleUnmatchedUsersPageChange = (_: unknown, newPage: number) => {
    setUnmatchedUsersPage(newPage);
    fetchUnmatchedUsers();
  };

  // 매칭 대기 사용자 페이지당 항목 수 변경 핸들러
  const handleUnmatchedUsersLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUnmatchedUsersLimit(parseInt(event.target.value, 10));
    setUnmatchedUsersPage(1); // 페이지 번호를 1로 설정
    fetchUnmatchedUsers();
  };

  // 매칭 대기 사용자 선택 핸들러
  const handleUnmatchedUserSelect = async (user: UnmatchedUser) => {
    setSelectedUnmatchedUser(user);

    try {
      setSelectedUserId(user.id);
      setUserDetailModalOpen(true);
      setLoadingUserDetail(true);
      setUserDetailError(null);
      setUserDetail(null);

      console.log('유저 상세 정보 조회 요청:', user.id);
      const data = await AdminService.userAppearance.getUserDetails(user.id);
      console.log('유저 상세 정보 응답:', data);

      setUserDetail(data);
    } catch (error: any) {
      console.error('유저 상세 정보 조회 중 오류:', error);
      setUserDetailError(error.message || '유저 상세 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // 유저 상세 정보 모달 닫기
  const handleCloseUserDetailModal = () => {
    setUserDetailModalOpen(false);
  };

  // 매칭 대기 사용자 매칭 처리 함수
  const processUnmatchedUserMatching = async () => {
    if (!selectedUnmatchedUser) {
      setUnmatchedUsersError('매칭할 사용자를 선택해주세요.');
      return;
    }

    setUnmatchedUsersLoading(true);
    setUnmatchedUsersError(null);

    try {
      const response = await axiosServer.post('/admin/matching/user', {
        userId: selectedUnmatchedUser.id
      });

      console.log('매칭 대기 사용자 매칭 처리 응답:', response.data);

      // 매칭 성공 후 목록 새로고침
      fetchUnmatchedUsers();
      setSelectedUnmatchedUser(null);
    } catch (err: any) {
      console.error('매칭 처리 오류:', err);

      // 서버에서 받은 에러 메시지 표시
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          '매칭 처리 중 오류가 발생했습니다.';

      setUnmatchedUsersError(errorMessage);
    } finally {
      setUnmatchedUsersLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        매칭 관리
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} aria-label="매칭 관리 탭">
        <Tab label="단일 매칭" />
        <Tab label="매칭 시뮬레이션" />
        <Tab label="매칭 대기 사용자" />
        <Tab label="매칭 상대 이력" />
        <Tab label="00시 매칭 여부" />
        <Tab label="잔여 사용자 매칭" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <UserSearch
          searchTerm={searchTerm}
          searchLoading={searchLoading}
          error={error}
          searchResults={searchResults}
          selectedUser={selectedUser}
          setSearchTerm={setSearchTerm}
          searchUsers={searchUsers}
          handleUserSelect={handleUserSelect}
        />
        <SingleMatching
          selectedUser={selectedUser}
          matchingLoading={matchingLoading}
          matchingResult={matchingResult}
          processSingleMatching={processSingleMatching}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <UserSearch
          searchTerm={searchTerm}
          searchLoading={searchLoading}
          error={error}
          searchResults={searchResults}
          selectedUser={selectedUser}
          setSearchTerm={setSearchTerm}
          searchUsers={searchUsers}
          handleUserSelect={handleUserSelect}
        />
        <MatchingSimulation
          selectedUser={selectedUser}
          simulationLoading={simulationLoading}
          simulationResult={simulationResult}
          matchLimit={matchLimit}
          selectedPartnerIndex={selectedPartnerIndex}
          setMatchLimit={setMatchLimit}
          runMatchingSimulation={runMatchingSimulation}
          handlePartnerSelect={handlePartnerSelect}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <UnmatchedUsers
          unmatchedUsers={unmatchedUsers}
          unmatchedUsersLoading={unmatchedUsersLoading}
          unmatchedUsersError={unmatchedUsersError}
          unmatchedUsersTotalCount={unmatchedUsersTotalCount}
          unmatchedUsersPage={unmatchedUsersPage}
          unmatchedUsersLimit={unmatchedUsersLimit}
          unmatchedUsersSearchTerm={unmatchedUsersSearchTerm}
          unmatchedUsersGenderFilter={unmatchedUsersGenderFilter}
          selectedUnmatchedUser={selectedUnmatchedUser}
          setUnmatchedUsersSearchTerm={setUnmatchedUsersSearchTerm}
          setUnmatchedUsersGenderFilter={setUnmatchedUsersGenderFilter}
          handleUnmatchedUsersSearch={handleUnmatchedUsersSearch}
          handleUnmatchedUsersPageChange={handleUnmatchedUsersPageChange}
          handleUnmatchedUsersLimitChange={handleUnmatchedUsersLimitChange}
          handleUnmatchedUserSelect={handleUnmatchedUserSelect}
          processUnmatchedUserMatching={processUnmatchedUserMatching}
          fetchUnmatchedUsers={fetchUnmatchedUsers}
        />

        {/* 사용자 상세 정보 모달 */}
        {userDetail && (
          <UserDetailModal
            open={userDetailModalOpen}
            onClose={handleCloseUserDetailModal}
            userId={selectedUserId}
            userDetail={userDetail}
            loading={loadingUserDetail}
            error={userDetailError}
            onRefresh={() => {
              // 데이터 새로고침
              fetchUnmatchedUsers();
            }}
          />
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <MatcherHistory
          searchTerm={searchTerm}
          searchLoading={searchLoading}
          error={error}
          searchResults={searchResults}
          selectedUser={selectedUser}
          setSearchTerm={setSearchTerm}
          searchUsers={searchUsers}
          handleUserSelect={handleUserSelect}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <Paper sx={{ p: 3, mb: 3, maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            00시 매칭 On/Off
          </Typography>
          {batchStatusLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Typography>상태를 불러오는 중...</Typography>
            </Box>
          ) : batchStatusError ? (
            <Alert severity="error">{batchStatusError}</Alert>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Switch checked={!!batchStatus} onChange={toggleStatus} />
              <Typography>{batchStatus ? 'ON' : 'OFF'}</Typography>
            </Box>
          )}
        </Paper>
      </TabPanel>


      <TabPanel value={activeTab} index={5}>
        <Paper sx={{ p: 3, mb: 3, maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            (굉장히 급조한 API) 잔여 사용자 매칭 (위험)
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button variant="default" color="primary" onClick={doMatchRestMembers}>
              잔여 사용자 매칭하기
            </Button>

            {restMembers && (
              <TextareaAutosize
                value={restMembers}
              />
            )}
          </Box>
        </Paper>
      </TabPanel>

    </Box>
  );
}
