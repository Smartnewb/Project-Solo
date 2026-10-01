'use client';
import { Button, Spinner, Chip, Tabs, TextField, Label, Input, Select, ListBox, Checkbox, TextArea } from '@heroui/react';
import React, { useEffect, useState } from 'react';
import { adminGet, adminPost, adminRequest } from '@/shared/lib/http/admin-fetch';
import { useBatchStatus } from './useBatchStatus';
// 컴포넌트 임포트
import UserSearch from './components/UserSearch';
import SingleMatching from './components/SingleMatching';
import MatchingSimulation from './components/MatchingSimulation';
import UnmatchedUsers from './components/UnmatchedUsers';
import MatcherHistory from './components/MatcherHistory';
import GemsManagement from './components/GemsManagement';
import LikeHistory from './components/LikeHistory';
import ForceMatchingTab from './components/ForceMatchingTab';
import UserDetailModal from '@/components/admin/appearance/UserDetailModal';
// 타입 임포트
import { UserSearchResult, MatchingResult, MatchingSimulationResult, UnmatchedUser } from './types';
import { UserDetail } from '@/components/admin/appearance/UserDetailModal';
import AdminService from '@/app/services/admin';
// 매칭분석 관련 임포트
import { ko } from 'date-fns/locale';
import { formatDateTimeWithoutTimezoneConversion, safeFormat } from '@/app/utils/formatters';
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
    return (<div role="tabpanel" hidden={value !== index} id={`matching-tabpanel-${index}`} aria-labelledby={`matching-tab-${index}`} {...other}>
      {value === index && (<div style={{ paddingTop: 24 }}>
          {children}
        </div>)}
    </div>);
}
const matchRestMembers = () => adminRequest('/admin/v2/matching/rest-members', {
    method: 'POST',
    signal: AbortSignal.timeout(60 * 60 * 1000),
});
const batchAllMatchableUsers = () => adminPost('/admin/v2/system/batch/vector');
function MatchingManagementV2Content() {
    const [activeTab, setActiveTab] = useState<number>(0);
    const { status: batchStatus, loading: batchStatusLoading, error: batchStatusError, toggleStatus } = useBatchStatus(activeTab === 9);
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
        }
        catch { }
    };
    const doBatchUpdateVectorAllMatchableUsers = async () => {
        try {
            const response = await batchAllMatchableUsers();
            setVectorResult(response);
        }
        catch { }
    };
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
        if (newValue === 6 && unmatchedUsers.length === 0) {
            fetchUnmatchedUsers();
        }
    };
    // 매칭분석 관련 함수들
    const fetchMatchingHistory = async (pageNumber?: number) => {
        try {
            setLoading(true);
            setAnalyticsError(null);
            const formattedStartDate = safeFormat(startDate, 'yyyy-MM-dd');
            const formattedEndDate = safeFormat(endDate, 'yyyy-MM-dd');
            // 페이지 번호가 전달되면 해당 페이지를, 아니면 현재 페이지 사용
            const currentPage = pageNumber !== undefined ? pageNumber : historyPage;
            const response = await AdminService.matching.getMatchHistory(formattedStartDate, formattedEndDate, currentPage + 1, historyRowsPerPage, historySearchName.trim() || undefined, historySearchType !== 'all' ? historySearchType : undefined);
            // 각 매칭에 대해 매칭 횟수 조회
            if (response.items && response.items.length > 0) {
                const itemsWithMatchCount = await Promise.all(response.items.map(async (history: any) => {
                    try {
                        const matchCountResponse = await AdminService.matching.getUserMatchCount(history.user?.id, history.matcher?.id, formattedStartDate, formattedEndDate);
                        // 매칭 타입에 따른 횟수 계산
                        let displayCount = 1;
                        if (historySearchType === 'all') {
                            displayCount = matchCountResponse.totalCount || 1;
                        }
                        else if (historySearchType === 'scheduled') {
                            displayCount = matchCountResponse.freeMatchCount || 0;
                        }
                        else if (historySearchType === 'rematching') {
                            displayCount = matchCountResponse.paidMatchCount || 0;
                        }
                        else if (historySearchType === 'admin') {
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
                    }
                    catch (error) {
                        return {
                            ...history,
                            matchCount: 1, // 오류 시 기본값
                            totalMatchCount: 1,
                            freeMatchCount: 0,
                            paidMatchCount: 0,
                            adminMatchCount: 0
                        };
                    }
                }));
                setMatchingHistory({
                    ...response,
                    items: itemsWithMatchCount
                });
            }
            else {
                setMatchingHistory(response);
            }
        }
        catch (error: any) {
            setAnalyticsError(error.message || '매칭 내역을 불러오는 중 오류가 발생했습니다.');
        }
        finally {
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
    const handleHistoryRowsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
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
            const formattedDate = safeFormat(selectedDate, 'yyyy-MM-dd');
            // 페이지 번호가 전달되면 해당 페이지를, 아니면 현재 페이지 사용
            const currentPage = pageNumber !== undefined ? pageNumber : failurePage;
            const response = await AdminService.matching.getFailureLogs(formattedDate, currentPage + 1, failureRowsPerPage, failureSearchName.trim() || undefined);
            setMatchingFailures(response);
        }
        catch (error: any) {
            setAnalyticsError(error.message || '매칭 실패 내역을 불러오는 중 오류가 발생했습니다.');
        }
        finally {
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
    const handleFailureRowsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
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
            const isPhone = /^[\d\-]+$/.test(searchTerm.trim());
            const response = await adminGet<any>('/admin/v2/users/search', {
                page: '1',
                limit: '10',
                ...(isPhone ? { phoneNumber: searchTerm.trim() } : { name: searchTerm.trim() })
            });
            let results = [];
            if (response?.data && Array.isArray(response.data)) {
                results = response.data;
            }
            else if (response?.items && Array.isArray(response.items)) {
                results = response.items;
            }
            else if (response && Array.isArray(response)) {
                results = response;
            }
            setSearchResults(results);
            // 검색 결과가 없는 경우 명확한 메시지 표시
            if (results.length === 0) {
                setError(`"${searchTerm}" 검색 결과가 없습니다. 다른 이름으로 검색해보세요.`);
            }
            else {
                setError(null); // 검색 결과가 있으면 에러 메시지 초기화
            }
        }
        catch (err: any) {
            // 서버에서 받은 에러 메시지 표시
            const errorMessage = err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                '사용자 검색 중 오류가 발생했습니다.';
            setError(errorMessage);
            setSearchResults([]);
        }
        finally {
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
            const response = await AdminService.matching.processSingleMatching(selectedUser.id);
            setMatchingResult(response);
        }
        catch (err: any) {
            // 서버에서 받은 에러 메시지 표시
            const errorMessage = err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                '매칭 처리 중 오류가 발생했습니다.';
            setError(errorMessage);
        }
        finally {
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
            const response = await AdminService.matching.findMatches(selectedUser.id, { limit: matchLimit });
            setSimulationResult(response);
        }
        catch (err: any) {
            // 서버에서 받은 에러 메시지 표시
            const errorMessage = err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                '매칭 시뮬레이션 중 오류가 발생했습니다.';
            setError(errorMessage);
        }
        finally {
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
            const data = await AdminService.matching.getUnmatchedUsers(unmatchedUsersPage, unmatchedUsersLimit, unmatchedUsersSearchTerm || undefined, unmatchedUsersGenderFilter === 'all' ? undefined : unmatchedUsersGenderFilter);
            if (data?.items && Array.isArray(data.items)) {
                setUnmatchedUsers(data.items);
            }
            else {
                setUnmatchedUsers([]);
            }
            setUnmatchedUsersTotalCount(data?.meta?.totalItems || 0);
        }
        catch (err: any) {
            // 서버에서 받은 에러 메시지 표시
            const errorMessage = err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                '매칭 대기 사용자 조회 중 오류가 발생했습니다.';
            setUnmatchedUsersError(errorMessage);
            setUnmatchedUsers([]);
        }
        finally {
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
    const handleUnmatchedUsersLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setUnmatchedUsersLimit(Number.parseInt(event.target.value, 10));
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
            ;
            const data = await AdminService.userAppearance.getUserDetails(user.id);
            ;
            setUserDetail(data);
        }
        catch (error: any) {
            setUserDetailError(error.message || '유저 상세 정보를 불러오는 중 오류가 발생했습니다.');
        }
        finally {
            setLoadingUserDetail(false);
        }
    };
    // 매칭 내역에서 유저(본인/매칭상대) 이름·아바타 클릭 시 상세 모달 오픈 + 상세 정보 조회
    const handleViewUserDetail = async (userId?: string) => {
        if (!userId)
            return;
        try {
            setSelectedUserId(userId);
            setUserDetailModalOpen(true);
            setLoadingUserDetail(true);
            setUserDetailError(null);
            setUserDetail(null);
            const data = await AdminService.userAppearance.getUserDetails(userId);
            setUserDetail(data);
        }
        catch (error: any) {
            setUserDetailError(error.message || '유저 상세 정보를 불러오는 중 오류가 발생했습니다.');
        }
        finally {
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
            const response = await adminPost('/admin/v2/matching/user', {
                userId: selectedUnmatchedUser.id
            });
            ;
            // 매칭 성공 후 목록 새로고침
            fetchUnmatchedUsers();
            setSelectedUnmatchedUser(null);
        }
        catch (err: any) {
            // 서버에서 받은 에러 메시지 표시
            const errorMessage = err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                '매칭 처리 중 오류가 발생했습니다.';
            setUnmatchedUsersError(errorMessage);
        }
        finally {
            setUnmatchedUsersLoading(false);
        }
    };
    return (<div style={{ padding: 24 }}>
      <h1 className="text-2xl font-bold">
        매칭 관리
      </h1>

      <Tabs aria-label="매칭 관리 탭" selectedKey={activeTab} onSelectionChange={key => handleTabChange({} as never, key as never)}><Tabs.List aria-label="관리 항목">
        <Tabs.Tab id={0}>{"구슬 관리"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
        <Tabs.Tab id={1}>{"매칭 내역 조회"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
        <Tabs.Tab id={2}>{"좋아요 이력"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
        <Tabs.Tab id={3}>{"매칭 실패 내역"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
        <Tabs.Tab id={4}>{"매칭 상대 이력"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
        <Tabs.Tab id={5}>{"매칭 대기 사용자"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
        <Tabs.Tab id={6}>{"단일 매칭"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
        <Tabs.Tab id={7}>{"매칭 시뮬레이션"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
        <Tabs.Tab id={8}>{"강제 매칭"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
        <Tabs.Tab id={9}>{"00시 매칭 여부"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
        <Tabs.Tab id={10}>{"잔여 사용자 매칭"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
        <Tabs.Tab id={11}>{"임베드 데이터 갱신"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
      </Tabs.List></Tabs>

      {/* 구슬 관리 */}
      <TabPanel value={activeTab} index={0}>
        <GemsManagement searchTerm={searchTerm} searchLoading={searchLoading} error={error} searchResults={searchResults} selectedUser={selectedUser} setSearchTerm={setSearchTerm} searchUsers={searchUsers} handleUserSelect={handleUserSelect}></GemsManagement>
      </TabPanel>

      {/* 매칭 내역 조회 */}
      <TabPanel value={activeTab} index={1}>
        <div>
          <section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-semibold">
              매칭 내역 조회
            </h2>

            {/* 검색 필터 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'end' }}>
              <TextField className="min-w-[150px]"><Label>{"시작 날짜"}</Label><Input type="date" value={startDate ? new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ""} onChange={event => { if (event.target.value)
        setStartDate(new Date(event.target.value + "T00:00:00")); }}></Input></TextField>
              <TextField className="min-w-[150px]"><Label>{"종료 날짜"}</Label><Input type="date" value={endDate ? new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ""} onChange={event => { if (event.target.value)
        setEndDate(new Date(event.target.value + "T00:00:00")); }}></Input></TextField>
              <div style={{ minWidth: 150 }}>
                <p style={{ display: 'block', marginBottom: 4 }}>
                  이름 검색
                </p>
                <Input type="text" value={historySearchName} onChange={(e) => setHistorySearchName(e.target.value)} onKeyDown={(e) => {
            if (e.key === 'Enter')
                handleSearchMatchingHistory();
        }} placeholder="이름으로 검색" className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#ff385c]"></Input>
              </div>
              <div style={{ minWidth: 120 }}>
                <p style={{ display: 'block', marginBottom: 4 }}>
                  매칭 타입
                </p>
                <Select value={historySearchType} onChange={(key) => {
            const value = String(key ?? "");
            setHistorySearchType(value);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                  <ListBox.Item id={"all"} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
                  <ListBox.Item id={"scheduled"} textValue={"\uBB34\uB8CC \uB9E4\uCE6D"}>무료 매칭</ListBox.Item>
                  <ListBox.Item id={"admin"} textValue={"\uAD00\uB9AC\uC790 \uB9E4\uCE6D"}>관리자 매칭</ListBox.Item>
                  <ListBox.Item id={"rematching"} textValue={"\uC720\uB8CC \uB9E4\uCE6D"}>유료 매칭</ListBox.Item>
                </ListBox></Select.Popover></Select>
              </div>
              <Button onPress={handleSearchMatchingHistory} isDisabled={loading} variant="tertiary">
                {loading ? <Spinner size="sm"></Spinner> : '조회'}
              </Button>
            </div>

            {/* 로딩 상태 */}
            {loading && (<div style={{ display: 'flex', justifyContent: 'center', marginBlock: 32 }}>
                <Spinner size="sm"></Spinner>
                <p style={{ marginLeft: 16 }}>매칭 내역을 조회하고 있습니다...</p>
              </div>)}

            {/* 에러 상태 */}
            {analyticsError && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 24 }}>
                {analyticsError}
              </aside>)}

            {/* 데이터 테이블 */}
            {!loading && matchingHistory && (<div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr style={{ backgroundColor: '#f5f5f5' }} className="border-b">
                      <th scope="col" className="border-b px-4 py-3">매칭 ID</th>
                      <th scope="col" className="border-b px-4 py-3">매칭 점수</th>
                      <th scope="col" className="border-b px-4 py-3">매칭 타입</th>
                      <th scope="col" className="border-b px-4 py-3">매칭 발표 시간</th>
                      <th scope="col" className="border-b px-4 py-3">사용자 정보</th>
                      <th scope="col" className="border-b px-4 py-3">매칭 상대 정보</th>
                      <th scope="col" className="border-b px-4 py-3">매칭 횟수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchingHistory.items && matchingHistory.items.length > 0 ? (matchingHistory.items.map((history: any) => (<tr key={history.id} className="border-b">
                          <td className="border-b px-4 py-3">{history.id}</td>
                          <td className="border-b px-4 py-3">{history.score || '-'}</td>
                          <td className="border-b px-4 py-3">
                            {(() => {
                    const typeLabel = history.type === 'scheduled' ? '무료 매칭' :
                        history.type === 'admin' ? '관리자 매칭' :
                            history.type === 'rematching' ? '유료 매칭' :
                                history.type;
                    const typeColor = history.type === 'scheduled' ? 'success' :
                        history.type === 'admin' ? 'info' :
                            history.type === 'rematching' ? 'warning' :
                                'default';
                    return <Chip size="sm">{typeLabel}</Chip>;
                })()}
                          </td>
                          <td className="border-b px-4 py-3">
                            {formatDateTimeWithoutTimezoneConversion(history.publishedAt)}
                          </td>
                          <td className="border-b px-4 py-3">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <img src={history.user?.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
                              <div>
                                <Button variant="tertiary" aria-label="사용자 상세" onPress={() => handleViewUserDetail(history.user?.id)} style={{ cursor: 'pointer', color: "var(--accent)" }}>
                                  {history.user?.name}{history.user?.deletedAt ? ' (탈퇴)' : ''}
                                </Button>
                                <p>
                                  {history.user?.age}세 · {history.user?.gender === 'MALE' ? '남성' : '여성'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="border-b px-4 py-3">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <img src={history.matcher?.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
                              <div>
                                <Button variant="tertiary" aria-label="사용자 상세" onPress={() => handleViewUserDetail(history.matcher?.id)} style={{ cursor: 'pointer', color: "var(--accent)" }}>
                                  {history.matcher?.name}{history.matcher?.deletedAt ? ' (탈퇴)' : ''}
                                </Button>
                                <p>
                                  {history.matcher?.age}세 · {history.matcher?.gender === 'MALE' ? '남성' : '여성'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="border-b px-4 py-3">
                            {historySearchType === 'all' ? (<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Chip size="sm">{`전체: ${history.totalMatchCount || 1}`}</Chip>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                  {history.freeMatchCount > 0 && (<Chip size="sm">{`무료: ${history.freeMatchCount}`}</Chip>)}
                                  {history.paidMatchCount > 0 && (<Chip size="sm">{`유료: ${history.paidMatchCount}`}</Chip>)}
                                  {history.adminMatchCount > 0 && (<Chip size="sm">{`관리자: ${history.adminMatchCount}`}</Chip>)}
                                </div>
                              </div>) : (<Chip size="sm">{history.matchCount || 0}</Chip>)}
                          </td>
                        </tr>))) : (<tr className="border-b">
                        <td colSpan={7} style={{ paddingBlock: 32 }} className="border-b px-4 py-3">
                          <p>
                            선택한 조건에 매칭 내역이 없습니다.
                          </p>
                        </td>
                      </tr>)}
                  </tbody>
                </table>

                {/* 페이지네이션 */}
                <div className="flex items-center justify-end gap-3 border-t p-4"><div><Select aria-label="페이지당 행 수" value={historyRowsPerPage} onChange={(key) => {
                const value = String(key ?? "");
                (handleHistoryRowsPerPageChange)({ target: { value: value }, currentTarget: { value: value } } as never);
            }} className="min-w-[120px]"><Label>페이지당 행 수</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={5} textValue={"5"}>5</ListBox.Item><ListBox.Item id={10} textValue={"10"}>10</ListBox.Item><ListBox.Item id={25} textValue={"25"}>25</ListBox.Item><ListBox.Item id={50} textValue={"50"}>50</ListBox.Item></ListBox></Select.Popover></Select></div><Button variant="secondary" isDisabled={historyPage <= 0} onPress={() => (handleHistoryPageChange)(null, historyPage - 1)}>이전</Button><span>{historyPage + 1} 페이지 / {matchingHistory.meta?.totalItems || -1}개</span><Button variant="secondary" isDisabled={(historyPage + 1) * historyRowsPerPage >= (matchingHistory.meta?.totalItems || -1)} onPress={() => (handleHistoryPageChange)(null, historyPage + 1)}>다음</Button></div>
              </div>)}
          </section>
        </div>
      </TabPanel>

      {/* 좋아요 이력 */}
      <TabPanel value={activeTab} index={2}>
        <LikeHistory></LikeHistory>
      </TabPanel>

      {/* 매칭 실패 내역 */}
      <TabPanel value={activeTab} index={3}>
        <div>
          <section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-semibold">
              매칭 실패 내역
            </h2>

            {/* 검색 필터 */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'end' }}>
              <TextField className="min-w-[150px]"><Label>{"조회 날짜"}</Label><Input type="date" value={selectedDate ? new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ""} onChange={event => { if (event.target.value)
        setSelectedDate(new Date(event.target.value + "T00:00:00")); }}></Input></TextField>
              <div style={{ minWidth: 150 }}>
                <p style={{ display: 'block', marginBottom: 4 }}>
                  이름 검색
                </p>
                <Input type="text" value={failureSearchName} onChange={(e) => setFailureSearchName(e.target.value)} onKeyDown={(e) => {
            if (e.key === 'Enter')
                handleSearchMatchingFailures();
        }} placeholder="이름으로 검색" className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#ff385c]"></Input>
              </div>
              <Button onPress={handleSearchMatchingFailures} isDisabled={loading} variant="tertiary">
                {loading ? <Spinner size="sm"></Spinner> : '조회'}
              </Button>
            </div>

            {/* 로딩 상태 */}
            {loading && (<div style={{ display: 'flex', justifyContent: 'center', marginBlock: 32 }}>
                <Spinner size="sm"></Spinner>
                <p style={{ marginLeft: 16 }}>매칭 실패 내역을 조회하고 있습니다...</p>
              </div>)}

            {/* 에러 상태 */}
            {analyticsError && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 24 }}>
                {analyticsError}
              </aside>)}

            {/* 데이터 테이블 */}
            {!loading && matchingFailures && (<div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr style={{ backgroundColor: '#f5f5f5' }} className="border-b">
                      <th scope="col" className="border-b px-4 py-3">사용자 ID</th>
                      <th scope="col" className="border-b px-4 py-3">이름</th>
                      <th scope="col" className="border-b px-4 py-3">실패 사유</th>
                      <th scope="col" className="border-b px-4 py-3">실패 일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchingFailures.items && matchingFailures.items.length > 0 ? (matchingFailures.items.map((failure: any) => (<tr key={failure.id} className="border-b">
                          <td className="border-b px-4 py-3">{failure.userId}</td>
                          <td className="border-b px-4 py-3">{failure.userName}</td>
                          <td className="border-b px-4 py-3">
                            <p style={{ maxWidth: 400, wordBreak: 'break-word' }}>
                              {failure.reason}
                            </p>
                          </td>
                          <td className="border-b px-4 py-3">
                            {failure.createdAt}
                          </td>
                        </tr>))) : (<tr className="border-b">
                        <td colSpan={4} style={{ paddingBlock: 32 }} className="border-b px-4 py-3">
                          <p>
                            선택한 조건에 매칭 실패 내역이 없습니다.
                          </p>
                        </td>
                      </tr>)}
                  </tbody>
                </table>

                {/* 페이지네이션 */}
                <div className="flex items-center justify-end gap-3 border-t p-4"><div><Select aria-label="페이지당 행 수" value={failureRowsPerPage} onChange={(key) => {
                const value = String(key ?? "");
                (handleFailureRowsPerPageChange)({ target: { value: value }, currentTarget: { value: value } } as never);
            }} className="min-w-[120px]"><Label>페이지당 행 수</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={5} textValue={"5"}>5</ListBox.Item><ListBox.Item id={10} textValue={"10"}>10</ListBox.Item><ListBox.Item id={25} textValue={"25"}>25</ListBox.Item><ListBox.Item id={50} textValue={"50"}>50</ListBox.Item></ListBox></Select.Popover></Select></div><Button variant="secondary" isDisabled={failurePage <= 0} onPress={() => (handleFailurePageChange)(null, failurePage - 1)}>이전</Button><span>{failurePage + 1} 페이지 / {matchingFailures.meta?.totalItems || -1}개</span><Button variant="secondary" isDisabled={(failurePage + 1) * failureRowsPerPage >= (matchingFailures.meta?.totalItems || -1)} onPress={() => (handleFailurePageChange)(null, failurePage + 1)}>다음</Button></div>
              </div>)}
          </section>
        </div>
      </TabPanel>

      {/* 매칭 상대 이력 */}
      <TabPanel value={activeTab} index={4}>
        <MatcherHistory searchTerm={searchTerm} searchLoading={searchLoading} error={error} searchResults={searchResults} selectedUser={selectedUser} setSearchTerm={setSearchTerm} searchUsers={searchUsers} handleUserSelect={handleUserSelect}></MatcherHistory>
      </TabPanel>

      {/* 매칭 대기 사용자 */}
      <TabPanel value={activeTab} index={5}>
        <UnmatchedUsers unmatchedUsers={unmatchedUsers} unmatchedUsersLoading={unmatchedUsersLoading} unmatchedUsersError={unmatchedUsersError} unmatchedUsersTotalCount={unmatchedUsersTotalCount} unmatchedUsersPage={unmatchedUsersPage} unmatchedUsersLimit={unmatchedUsersLimit} unmatchedUsersSearchTerm={unmatchedUsersSearchTerm} unmatchedUsersGenderFilter={unmatchedUsersGenderFilter} selectedUnmatchedUser={selectedUnmatchedUser} setUnmatchedUsersSearchTerm={setUnmatchedUsersSearchTerm} setUnmatchedUsersGenderFilter={setUnmatchedUsersGenderFilter} handleUnmatchedUsersSearch={handleUnmatchedUsersSearch} handleUnmatchedUsersPageChange={handleUnmatchedUsersPageChange} handleUnmatchedUsersLimitChange={handleUnmatchedUsersLimitChange} handleUnmatchedUserSelect={handleUnmatchedUserSelect} processUnmatchedUserMatching={processUnmatchedUserMatching} fetchUnmatchedUsers={fetchUnmatchedUsers}></UnmatchedUsers>
      </TabPanel>

      {/* 단일 매칭 */}
      <TabPanel value={activeTab} index={6}>
        <UserSearch searchTerm={searchTerm} searchLoading={searchLoading} error={error} searchResults={searchResults} selectedUser={selectedUser} setSearchTerm={setSearchTerm} searchUsers={searchUsers} handleUserSelect={handleUserSelect}></UserSearch>
        <SingleMatching selectedUser={selectedUser} matchingLoading={matchingLoading} matchingResult={matchingResult} processSingleMatching={processSingleMatching}></SingleMatching>
      </TabPanel>

      {/* 매칭 시뮬레이션 */}
      <TabPanel value={activeTab} index={7}>
        <UserSearch searchTerm={searchTerm} searchLoading={searchLoading} error={error} searchResults={searchResults} selectedUser={selectedUser} setSearchTerm={setSearchTerm} searchUsers={searchUsers} handleUserSelect={handleUserSelect}></UserSearch>
        <MatchingSimulation selectedUser={selectedUser} simulationLoading={simulationLoading} simulationResult={simulationResult} matchLimit={matchLimit} selectedPartnerIndex={selectedPartnerIndex} setMatchLimit={setMatchLimit} runMatchingSimulation={runMatchingSimulation} handlePartnerSelect={handlePartnerSelect}></MatchingSimulation>
      </TabPanel>

      {/* 강제 매칭 */}
      <TabPanel value={activeTab} index={8}>
        <ForceMatchingTab></ForceMatchingTab>
      </TabPanel>

      {/* 00시 매칭 여부 */}
      <TabPanel value={activeTab} index={9}>
        <section style={{ padding: 24, marginBottom: 24, maxWidth: 400 }} className="rounded-xl border bg-white p-4">
          <h2 className="text-lg font-semibold">
            00시 매칭 On/Off
          </h2>
          {batchStatusLoading ? (<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Spinner size="sm"></Spinner>
              <p>상태를 불러오는 중...</p>
            </div>) : batchStatusError ? (<aside role="alert" className="rounded-lg border p-3">{batchStatusError}</aside>) : (<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Checkbox isSelected={!!batchStatus} onChange={() => toggleStatus()}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control></Checkbox.Content></Checkbox>
              <p>{batchStatus ? 'ON' : 'OFF'}</p>
            </div>)}
        </section>
      </TabPanel>

      {/* 잔여 사용자 매칭 */}
      <TabPanel value={activeTab} index={10}>
        <section style={{ padding: 24, marginBottom: 24, maxWidth: 400 }} className="rounded-xl border bg-white p-4">
          <h2 className="text-lg font-semibold">
            (굉장히 급조한 API) 잔여 사용자 매칭 (위험)
          </h2>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <Button onPress={doMatchRestMembers} variant="tertiary">
                잔여 사용자 매칭하기
              </Button>

              {restMembers && (<TextArea value={JSON.stringify(restMembers, null, 2)}></TextArea>)}
            </div>
        </section>
      </TabPanel>

      {/* 임베드 데이터 갱신 */}
      <TabPanel value={activeTab} index={11}>
        <section style={{ padding: 24, marginBottom: 24, maxWidth: 400 }} className="rounded-xl border bg-white p-4">
          <h2 className="text-lg font-semibold">
            매칭 조건에 포함되는 전체 사용자의 벡터 갱신 (오래걸림)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Button onPress={doBatchUpdateVectorAllMatchableUsers} variant="tertiary">
              갱신하기 (신중히 사용할 것)
            </Button>

            {vectorResult && (<TextArea value={JSON.stringify(vectorResult, null, 2)}></TextArea>)}
          </div>
        </section>
      </TabPanel>
      {/* 사용자 프로필 상세 모달 (탭 공용 단일 인스턴스) */}
      <UserDetailModal open={userDetailModalOpen} onClose={handleCloseUserDetailModal} userId={selectedUserId} userDetail={userDetail || { id: '', name: '', age: 0, gender: 'MALE', profileImages: [] }} loading={loadingUserDetail} error={userDetailError} onRefresh={() => fetchUnmatchedUsers()}></UserDetailModal>

    </div>);
}
export default function MatchingManagementV2() {
    return <MatchingManagementV2Content></MatchingManagementV2Content>;
}
