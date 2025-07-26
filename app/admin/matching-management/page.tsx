'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Switch,
  Paper,
  CircularProgress,
  Alert,
  TextareaAutosize,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TablePagination,
  Avatar,
  Chip
} from '@mui/material';
import axiosServer from '@/utils/axios';
import { useBatchStatus } from './useBatchStatus';

// 컴포넌트 임포트
import UserSearch from './components/UserSearch';
import SingleMatching from './components/SingleMatching';
import MatchingSimulation from './components/MatchingSimulation';
import UnmatchedUsers from './components/UnmatchedUsers';
import MatcherHistory from './components/MatcherHistory';
import TicketManagement from './components/TicketManagement';
import UserDetailModal from '@/components/admin/appearance/UserDetailModal';

// 타입 임포트
import { UserSearchResult, MatchingResult, MatchingSimulationResult, UnmatchedUser } from './types';
import { UserDetail } from '@/components/admin/appearance/UserDetailModal';
import AdminService from '@/app/services/admin';
import { Button } from '@/shared/ui';

// 매칭분석 관련 임포트
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { formatDateTimeWithoutTimezoneConversion } from '@/app/utils/formatters';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// 탭 인터페이스
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}



// 매칭분석 관련 타입

interface MatchingHistory {
  id: string;
  requesterName: string;
  requesterGender: string;
  requesterUniversity: string;
  matchedName: string;
  matchedGender: string;
  matchedUniversity: string;
  matchedAt: string;
  matchCount: number;
  requesterProfileImage?: string;
  matchedProfileImage?: string;
}

interface MatchingFailure {
  id: string;
  name: string;
  gender: string;
  university: string;
  reason: string;
  failedAt: string;
  profileImage?: string;
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
  axiosServer.post('/admin/matching/rest-members', undefined, {
    timeout: 1000 * 60 * 60
  });

const batchAllMatchableUsers = () =>
  axiosServer.post('/admin/matching/vector', undefined, {
    timeout: 1000 * 60 * 60
  });

export default function MatchingManagement() {
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
  const [vectorResult, setVectorResult] = useState<any>('');

  const doMatchRestMembers = async () => {
    try {
      const response = await matchRestMembers();
      setRestMembers(response);
    } catch (error) {
      console.error('매칭 대기 사용자 조회 오류:', error);
    }
  }

  const doBatchUpdateVectorAllMatchableUsers = async () => {
    try {
      const response = await batchAllMatchableUsers();
      setVectorResult(response);
    } catch (error) {
      console.error('매칭 조건에 포함되는 전체 사용자의 벡터 갱신 오류:', error);
    }
  }

  // 사용자 상세 정보 모달 상태
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  // 매칭분석 관련 상태
  const [matchingHistory, setMatchingHistory] = useState<any>(null);
  const [matchingFailures, setMatchingFailures] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(10);
  const [failurePage, setFailurePage] = useState(0);
  const [failureRowsPerPage, setFailureRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // 검색 관련 상태
  const [historySearchName, setHistorySearchName] = useState('');
  const [historySearchType, setHistorySearchType] = useState('all');
  const [failureSearchName, setFailureSearchName] = useState('');

  // 탭 변경 핸들러
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);

    // 매칭 대기 사용자 탭으로 이동할 때 데이터 로드
    if (newValue === 4 && unmatchedUsers.length === 0) {
      fetchUnmatchedUsers();
    }
  };

  // 매칭분석 관련 함수들
  const fetchMatchingHistory = async (pageNumber?: number) => {
    try {
      setLoading(true);
      setAnalyticsError(null);

      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      // 페이지 번호가 전달되면 해당 페이지를, 아니면 현재 페이지 사용
      const currentPage = pageNumber !== undefined ? pageNumber : historyPage;

      const response = await AdminService.matching.getMatchHistory(
        formattedStartDate,
        formattedEndDate,
        currentPage + 1,
        historyRowsPerPage,
        historySearchName.trim() || undefined,
        historySearchType !== 'all' ? historySearchType : undefined
      );

      // 각 매칭에 대해 매칭 횟수 조회
      if (response.items && response.items.length > 0) {
        const itemsWithMatchCount = await Promise.all(
          response.items.map(async (history: any) => {
            try {
              const matchCountResponse = await AdminService.matching.getUserMatchCount(
                history.user?.id,
                history.matcher?.id,
                formattedStartDate,
                formattedEndDate
              );

              // 매칭 타입에 따른 횟수 계산
              let displayCount = 1;
              if (historySearchType === 'all') {
                displayCount = matchCountResponse.totalCount || 1;
              } else if (historySearchType === 'scheduled') {
                displayCount = matchCountResponse.freeMatchCount || 0;
              } else if (historySearchType === 'rematching') {
                displayCount = matchCountResponse.paidMatchCount || 0;
              } else if (historySearchType === 'admin') {
                displayCount = matchCountResponse.adminMatchCount || 0;
              }

              return {
                ...history,
                matchCount: displayCount,
                totalMatchCount: matchCountResponse.totalCount || 1,
                freeMatchCount: matchCountResponse.freeMatchCount || 0,
                paidMatchCount: matchCountResponse.paidMatchCount || 0,
                adminMatchCount: matchCountResponse.adminMatchCount || 0
              };
            } catch (error) {
              console.error('매칭 횟수 조회 중 오류:', error);
              return {
                ...history,
                matchCount: 1, // 오류 시 기본값
                totalMatchCount: 1,
                freeMatchCount: 0,
                paidMatchCount: 0,
                adminMatchCount: 0
              };
            }
          })
        );

        setMatchingHistory({
          ...response,
          items: itemsWithMatchCount
        });
      } else {
        setMatchingHistory(response);
      }
    } catch (error: any) {
      console.error('매칭 내역 조회 중 오류:', error);
      setAnalyticsError(error.message || '매칭 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 조회 버튼 클릭 시 페이지 리셋 후 조회
  const handleSearchMatchingHistory = async () => {
    setHistoryPage(0); // 페이지를 첫 번째로 리셋
    await fetchMatchingHistory(0); // 첫 번째 페이지로 조회
  };

  // 매칭 내역 페이지네이션 핸들러
  const handleHistoryPageChange = async (event: unknown, newPage: number) => {
    setHistoryPage(newPage);
    // 페이지 변경 후 데이터 조회
    await fetchMatchingHistory(newPage);
  };

  const handleHistoryRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setHistoryRowsPerPage(newRowsPerPage);
    setHistoryPage(0); // 첫 페이지로 리셋
    // 페이지 변경 후 데이터 조회
    setTimeout(() => {
      fetchMatchingHistory();
    }, 0);
  };

  const fetchMatchingFailures = async (pageNumber?: number) => {
    try {
      setLoading(true);
      setAnalyticsError(null);

      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      // 페이지 번호가 전달되면 해당 페이지를, 아니면 현재 페이지 사용
      const currentPage = pageNumber !== undefined ? pageNumber : failurePage;

      const response = await AdminService.matching.getFailureLogs(
        formattedDate,
        currentPage + 1,
        failureRowsPerPage,
        failureSearchName.trim() || undefined
      );
      setMatchingFailures(response);
    } catch (error: any) {
      console.error('매칭 실패 내역 조회 중 오류:', error);
      setAnalyticsError(error.message || '매칭 실패 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 매칭 실패 내역 조회 버튼 클릭 시 페이지 리셋 후 조회
  const handleSearchMatchingFailures = async () => {
    setFailurePage(0); // 페이지를 첫 번째로 리셋
    await fetchMatchingFailures(0); // 첫 번째 페이지로 조회
  };

  // 매칭 실패 내역 페이지네이션 핸들러
  const handleFailurePageChange = async (event: unknown, newPage: number) => {
    setFailurePage(newPage);
    // 페이지 변경 후 데이터 조회
    await fetchMatchingFailures(newPage);
  };

  const handleFailureRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setFailureRowsPerPage(newRowsPerPage);
    setFailurePage(0); // 첫 페이지로 리셋
    // 페이지 변경 후 데이터 조회
    setTimeout(() => {
      fetchMatchingFailures();
    }, 0);
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
        <Tab label="재매칭 티켓 관리" />
        <Tab label="매칭 내역 조회" />
        <Tab label="매칭 실패 내역" />
        <Tab label="매칭 상대 이력" />
        <Tab label="매칭 대기 사용자" />
        <Tab label="단일 매칭" />
        <Tab label="매칭 시뮬레이션" />
        <Tab label="00시 매칭 여부" />
        <Tab label="잔여 사용자 매칭" />
        <Tab label="임베드 데이터 갱신" />
      </Tabs>

      {/* 재매칭 티켓 관리 */}
      <TabPanel value={activeTab} index={0}>
        <TicketManagement
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

      {/* 매칭 내역 조회 */}
      <TabPanel value={activeTab} index={1}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              매칭 내역 조회
            </Typography>

            {/* 검색 필터 */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'end' }}>
              <DatePicker
                label="시작 날짜"
                value={startDate}
                onChange={(newValue) => newValue && setStartDate(newValue)}
                format="yyyy-MM-dd"
                slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
              />
              <DatePicker
                label="종료 날짜"
                value={endDate}
                onChange={(newValue) => newValue && setEndDate(newValue)}
                format="yyyy-MM-dd"
                slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
              />
              <Box sx={{ minWidth: 150 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  이름 검색
                </Typography>
                <input
                  type="text"
                  value={historySearchName}
                  onChange={(e) => setHistorySearchName(e.target.value)}
                  placeholder="이름으로 검색"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Box>
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  매칭 타입
                </Typography>
                <select
                  value={historySearchType}
                  onChange={(e) => setHistorySearchType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체</option>
                  <option value="scheduled">무료 매칭</option>
                  <option value="admin">관리자 매칭</option>
                  <option value="rematching">유료 매칭</option>
                </select>
              </Box>
              <Button
                onClick={handleSearchMatchingHistory}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : '조회'}
              </Button>
            </Box>

            {/* 로딩 상태 */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>매칭 내역을 조회하고 있습니다...</Typography>
              </Box>
            )}

            {/* 에러 상태 */}
            {analyticsError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {analyticsError}
              </Alert>
            )}

            {/* 데이터 테이블 */}
            {!loading && matchingHistory && (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>매칭 ID</TableCell>
                      <TableCell>매칭 점수</TableCell>
                      <TableCell>매칭 타입</TableCell>
                      <TableCell>매칭 발표 시간</TableCell>
                      <TableCell>사용자 정보</TableCell>
                      <TableCell>매칭 상대 정보</TableCell>
                      <TableCell>매칭 횟수</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {matchingHistory.items && matchingHistory.items.length > 0 ? (
                      matchingHistory.items.map((history: any) => (
                        <TableRow key={history.id} hover>
                          <TableCell>{history.id}</TableCell>
                          <TableCell>{history.score || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={
                                history.type === 'scheduled' ? '무료 매칭' :
                                history.type === 'admin' ? '관리자 매칭' :
                                history.type === 'rematching' ? '유료 매칭' :
                                history.type
                              }
                              color={
                                history.type === 'scheduled' ? 'success' :
                                history.type === 'admin' ? 'info' :
                                history.type === 'rematching' ? 'warning' :
                                'default'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {formatDateTimeWithoutTimezoneConversion(history.publishedAt)}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {history.user?.profileImageUrl && (
                                <Avatar
                                  src={history.user.profileImageUrl}
                                  sx={{ width: 24, height: 24 }}
                                />
                              )}
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {history.user?.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {history.user?.age}세 · {history.user?.gender === 'MALE' ? '남성' : '여성'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {history.matcher?.profileImageUrl && (
                                <Avatar
                                  src={history.matcher.profileImageUrl}
                                  sx={{ width: 24, height: 24 }}
                                />
                              )}
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {history.matcher?.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {history.matcher?.age}세 · {history.matcher?.gender === 'MALE' ? '남성' : '여성'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {historySearchType === 'all' ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Chip
                                  label={`전체: ${history.totalMatchCount || 1}`}
                                  color={history.totalMatchCount > 1 ? 'warning' : 'default'}
                                  size="small"
                                  variant="filled"
                                />
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {history.freeMatchCount > 0 && (
                                    <Chip
                                      label={`무료: ${history.freeMatchCount}`}
                                      color="success"
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                  {history.paidMatchCount > 0 && (
                                    <Chip
                                      label={`유료: ${history.paidMatchCount}`}
                                      color="warning"
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                  {history.adminMatchCount > 0 && (
                                    <Chip
                                      label={`관리자: ${history.adminMatchCount}`}
                                      color="info"
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                              </Box>
                            ) : (
                              <Chip
                                label={history.matchCount || 0}
                                color={history.matchCount > 1 ? 'warning' : history.matchCount === 0 ? 'error' : 'default'}
                                size="small"
                                variant={history.matchCount > 1 ? 'filled' : 'outlined'}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            선택한 조건에 매칭 내역이 없습니다.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* 페이지네이션 */}
                <TablePagination
                  component="div"
                  count={matchingHistory.meta?.totalItems || -1}
                  page={historyPage}
                  onPageChange={handleHistoryPageChange}
                  rowsPerPage={historyRowsPerPage}
                  onRowsPerPageChange={handleHistoryRowsPerPageChange}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="페이지당 항목 수:"
                  labelDisplayedRows={({ from, to, count }) =>
                    count === -1 ? `${from}-${to}` : `${from}-${to} / ${count}`
                  }
                />
              </TableContainer>
            )}
          </Paper>
        </LocalizationProvider>
      </TabPanel>

      {/* 매칭 실패 내역 */}
      <TabPanel value={activeTab} index={2}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              매칭 실패 내역
            </Typography>

            {/* 검색 필터 */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'end' }}>
              <DatePicker
                label="조회 날짜"
                value={selectedDate}
                onChange={(newValue) => newValue && setSelectedDate(newValue)}
                format="yyyy-MM-dd"
                slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
              />
              <Box sx={{ minWidth: 150 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  이름 검색
                </Typography>
                <input
                  type="text"
                  value={failureSearchName}
                  onChange={(e) => setFailureSearchName(e.target.value)}
                  placeholder="이름으로 검색"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Box>
              <Button
                onClick={handleSearchMatchingFailures}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : '조회'}
              </Button>
            </Box>

            {/* 로딩 상태 */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>매칭 실패 내역을 조회하고 있습니다...</Typography>
              </Box>
            )}

            {/* 에러 상태 */}
            {analyticsError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {analyticsError}
              </Alert>
            )}

            {/* 데이터 테이블 */}
            {!loading && matchingFailures && (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>사용자 ID</TableCell>
                      <TableCell>이름</TableCell>
                      <TableCell>실패 사유</TableCell>
                      <TableCell>실패 일시</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {matchingFailures.items && matchingFailures.items.length > 0 ? (
                      matchingFailures.items.map((failure: any) => (
                        <TableRow key={failure.id} hover>
                          <TableCell>{failure.userId}</TableCell>
                          <TableCell>{failure.userName}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 400, wordBreak: 'break-word' }}>
                              {failure.reason}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {failure.createdAt}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            선택한 조건에 매칭 실패 내역이 없습니다.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* 페이지네이션 */}
                <TablePagination
                  component="div"
                  count={matchingFailures.meta?.totalItems || -1}
                  page={failurePage}
                  onPageChange={handleFailurePageChange}
                  rowsPerPage={failureRowsPerPage}
                  onRowsPerPageChange={handleFailureRowsPerPageChange}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="페이지당 항목 수:"
                  labelDisplayedRows={({ from, to, count }) =>
                    count === -1 ? `${from}-${to}` : `${from}-${to} / ${count}`
                  }
                />
              </TableContainer>
            )}
          </Paper>
        </LocalizationProvider>
      </TabPanel>

      {/* 매칭 상대 이력 */}
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

      {/* 매칭 대기 사용자 */}
      <TabPanel value={activeTab} index={4}>
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

      {/* 단일 매칭 */}
      <TabPanel value={activeTab} index={5}>
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

      {/* 매칭 시뮬레이션 */}
      <TabPanel value={activeTab} index={6}>
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

      {/* 00시 매칭 여부 */}
      <TabPanel value={activeTab} index={7}>
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

      {/* 잔여 사용자 매칭 */}
      <TabPanel value={activeTab} index={8}>
        <Paper sx={{ p: 3, mb: 3, maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            (굉장히 급조한 API) 잔여 사용자 매칭 (위험)
          </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Button variant="default" onClick={doMatchRestMembers}>
                잔여 사용자 매칭하기
              </Button>

              {restMembers && (
                <TextareaAutosize
                  value={JSON.stringify(restMembers, null, 2)}
                />
              )}
            </Box>
        </Paper>
      </TabPanel>

      {/* 임베드 데이터 갱신 */}
      <TabPanel value={activeTab} index={9}>
        <Paper sx={{ p: 3, mb: 3, maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            매칭 조건에 포함되는 전체 사용자의 벡터 갱신 (오래걸림)
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Button variant="default" onClick={doBatchUpdateVectorAllMatchableUsers}>
              갱신하기 (신중히 사용할 것)
            </Button>

            {vectorResult && (
              <TextareaAutosize
                value={JSON.stringify(vectorResult, null, 2)}
              />
            )}
          </Box>
        </Paper>
      </TabPanel>

    </Box>
  );
}
