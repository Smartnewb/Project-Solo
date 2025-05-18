'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab
} from '@mui/material';
import axiosServer from '@/utils/axios';

// 컴포넌트 임포트
import UserSearch from './components/UserSearch';
import SingleMatching from './components/SingleMatching';
import MatchingSimulation from './components/MatchingSimulation';
import UnmatchedUsers from './components/UnmatchedUsers';

// 타입 임포트
import { UserSearchResult, MatchingResult, MatchingSimulationResult, UnmatchedUser } from './types';

// 탭 인터페이스
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
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

export default function MatchingManagementPage() {
  const [activeTab, setActiveTab] = useState(0);

  // 로딩 상태
  const [error, setError] = useState<string | null>(null);

  // 사용자 검색 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

  // 단일 매칭 상태
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null);

  // 매칭 시뮬레이션 상태
  const [matchLimit, setMatchLimit] = useState(5);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<MatchingSimulationResult | null>(null);
  const [selectedPartnerIndex, setSelectedPartnerIndex] = useState<number | null>(null);

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
  const handleUnmatchedUserSelect = (user: UnmatchedUser) => {
    setSelectedUnmatchedUser(user);
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
      </TabPanel>
    </Box>
  );
}
