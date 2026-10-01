'use client';
import { Button, Spinner, Chip, TextField, Label, Input } from '@heroui/react';
import React, { useState } from 'react';
import { ko } from 'date-fns/locale';
import { safeFormat } from '@/app/utils/formatters';
import AdminService from '@/app/services/admin';
import { MatcherHistoryResponse, UserSearchResult } from '../types';
import UserDetailModal from '@/components/admin/appearance/UserDetailModal';
interface MatcherHistoryProps {
    searchTerm: string;
    searchLoading: boolean;
    error: string | null;
    searchResults: UserSearchResult[];
    selectedUser: UserSearchResult | null;
    setSearchTerm: (term: string) => void;
    searchUsers: () => void;
    handleUserSelect: (user: UserSearchResult) => void;
}
const MatcherHistory: React.FC<MatcherHistoryProps> = ({ searchTerm, searchLoading, error, searchResults, selectedUser, setSearchTerm, searchUsers, handleUserSelect }) => {
    // 매칭 상대 이력 관련 상태
    const [matcherHistory, setMatcherHistory] = useState<MatcherHistoryResponse | null>(null);
    const [historyLoading, setHistoryLoading] = useState<boolean>(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [historyPage, setHistoryPage] = useState<number>(1);
    const [historyLimit, setHistoryLimit] = useState<number>(10);
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(new Date());
    const [requesterNameFilter, setRequesterNameFilter] = useState<string>('');
    // 사용자 프로필 상세 모달 상태
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [userDetail, setUserDetail] = useState<any>(null);
    const [userDetailLoading, setUserDetailLoading] = useState(false);
    const [userDetailError, setUserDetailError] = useState<string | null>(null);
    // 프로필 클릭 시 모달 오픈 + 상세 정보 조회
    const handleViewUserDetail = async (userId?: string) => {
        if (!userId)
            return;
        try {
            setSelectedUserId(userId);
            setUserModalOpen(true);
            setUserDetailLoading(true);
            setUserDetailError(null);
            setUserDetail(null);
            const data = await AdminService.userAppearance.getUserDetails(userId);
            setUserDetail(data);
        }
        catch (err: any) {
            setUserDetailError(err.message || '유저 상세 정보를 불러오는 중 오류가 발생했습니다.');
        }
        finally {
            setUserDetailLoading(false);
        }
    };
    // 매칭 상대 이력 조회 함수
    const fetchMatcherHistory = async () => {
        if (!selectedUser || !startDate || !endDate)
            return;
        setHistoryLoading(true);
        setHistoryError(null);
        try {
            // 날짜 형식 변환 (YYYY-MM-DD)
            const formattedStartDate = safeFormat(startDate, 'yyyy-MM-dd');
            const formattedEndDate = safeFormat(endDate, 'yyyy-MM-dd');
            // AdminService를 사용하여 API 호출
            const data = await AdminService.matching.getMatcherHistory(selectedUser.id, formattedStartDate, formattedEndDate, historyPage, historyLimit, requesterNameFilter.trim() || undefined);
            ;
            setMatcherHistory(data);
        }
        catch (err: any) {
            setHistoryError(err.response?.data?.message || err.message || '매칭 상대 이력을 불러오는 중 오류가 발생했습니다.');
        }
        finally {
            setHistoryLoading(false);
        }
    };
    // 페이지 변경 핸들러
    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setHistoryPage(value);
    };
    // 페이지 변경 시 자동으로 데이터 가져오기.
    // 마운트 시(첫 렌더)에는 조회하지 않고, 이후 historyPage 변경 시에만 조회.
    // (1페이지로 되돌아오는 경우 포함 — 기존 `> 1` 가드가 1페이지 복귀를 누락시켰음)
    const isFirstRender = React.useRef(true);
    React.useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (selectedUser && startDate && endDate) {
            fetchMatcherHistory();
        }
    }, [historyPage]);
    // 검색 실행
    const handleSearch = () => {
        // 페이지가 1이 아니면 1로 리셋 → useEffect 가 1페이지로 재조회.
        // 이미 1페이지면 상태 변화가 없어 effect 가 안 도므로 직접 조회.
        if (historyPage !== 1) {
            setHistoryPage(1);
        }
        else {
            fetchMatcherHistory();
        }
    };
    // 엔터 키 핸들러
    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            if (event.currentTarget === event.target) {
                if ((event.target as HTMLInputElement).name === 'searchTerm') {
                    searchUsers();
                }
                else if ((event.target as HTMLInputElement).name === 'requesterName') {
                    handleSearch();
                }
            }
        }
    };
    // 매칭 타입 표시 함수
    const getMatchTypeLabel = (type: string) => {
        switch (type) {
            case 'scheduled':
                return '무료 매칭';
            case 'admin':
                return '관리자 매칭';
            case 'rematching':
                return '유료 매칭';
            default:
                return type;
        }
    };
    // 매칭 타입 색상 함수
    const getMatchTypeColor = (type: string) => {
        switch (type) {
            case 'scheduled':
                return 'primary';
            case 'admin':
                return 'secondary';
            case 'rematching':
                return 'warning';
            default:
                return 'default';
        }
    };
    return (<div>
      <section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold">
          매칭 상대 이력 조회
        </h2>
        <p style={{ marginBottom: 24 }}>
          특정 사용자가 몇 번 매칭 상대로 선택되었는지 조회할 수 있습니다.
        </p>

        {/* 사용자 검색 */}
        <div style={{ marginBottom: 24 }}>
          <p>
            사용자 검색
          </p>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <TextField className="mb-4"><Label>{"사용자 이름"}</Label><Input name="searchTerm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={handleKeyPress}></Input></TextField>
            <Button onPress={searchUsers} isDisabled={searchLoading || !searchTerm.trim()} variant="primary">
              {searchLoading ? <Spinner size="sm"></Spinner> : '검색'}
            </Button>
          </div>

          {error && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
              {error}
            </aside>)}

          {/* 검색 결과 */}
          {searchResults.length > 0 && (<div style={{ marginBottom: 16 }}>
              <p>
                검색 결과
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {searchResults.map((user) => (<Button key={user.id} variant={selectedUser?.id === user.id ? "primary" : "secondary"} onPress={() => handleUserSelect(user)}>{`${user.name} (${user.age}세, ${user.gender === 'MALE' ? '남' : '여'})`}</Button>))}
              </div>
            </div>)}
        </div>

        {/* 선택된 사용자 정보 */}
        {selectedUser && (<div style={{ marginBottom: 24, backgroundColor: '#f8f9fa' }} className="rounded-xl border p-4">
            <div className="p-4">
              <p>
                선택된 사용자
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <img src={selectedUser.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
                <div>
                  <h2 onClick={() => handleViewUserDetail(selectedUser.id)} style={{ cursor: 'pointer', color: "var(--accent)" }} className="text-lg font-semibold">
                    {selectedUser.name}{selectedUser.deletedAt ? ' (탈퇴)' : ''}
                  </h2>
                  <p>
                    {selectedUser.age}세 · {selectedUser.gender === 'MALE' ? '남성' : '여성'}
                  </p>
                  {selectedUser.universityDetails && (<p>
                      {selectedUser.universityDetails.name}
                      {selectedUser.universityDetails.department && ` · ${selectedUser.universityDetails.department}`}
                    </p>)}
                </div>
              </div>
            </div>
          </div>)}

        {/* 조회 조건 설정 */}
        {selectedUser && (<div style={{ marginBottom: 24 }}>
            <p>
              조회 조건
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="min-w-0">
                <TextField className="min-w-[150px]"><Label>{"시작일"}</Label><Input type="date" value={startDate ? new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ""} onChange={event => setStartDate(event.target.value ? new Date(event.target.value + "T00:00:00") : null)}></Input></TextField>
              </div>
              <div className="min-w-0">
                <TextField className="min-w-[150px]"><Label>{"종료일"}</Label><Input type="date" value={endDate ? new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ""} onChange={event => setEndDate(event.target.value ? new Date(event.target.value + "T00:00:00") : null)}></Input></TextField>
              </div>
              <div className="min-w-0">
                <TextField className="mb-4"><Label>{"요청자 이름 (선택사항)"}</Label><Input name="requesterName" value={requesterNameFilter} onChange={(e) => setRequesterNameFilter(e.target.value)} onKeyPress={handleKeyPress}></Input></TextField>
              </div>
              <div className="min-w-0">
                <Button onPress={handleSearch} isDisabled={historyLoading || !startDate || !endDate} variant="primary">
                  {historyLoading ? <Spinner size="sm"></Spinner> : '조회'}
                </Button>
              </div>
            </div>
          </div>)}

        {/* 매칭 상대 이력 결과 */}
        {selectedUser && (<div>
            {historyError && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
                {historyError}
              </aside>)}

            {historyLoading && (<div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <Spinner size="sm"></Spinner>
              </div>)}

            {!historyLoading && matcherHistory && (<>
                {/* 요약 정보 */}
                <div style={{ marginBottom: 24, backgroundColor: '#e3f2fd' }} className="rounded-xl border p-4">
                  <div className="p-4">
                    <h2 className="text-lg font-semibold">
                      매칭 상대 이력 요약
                    </h2>
                    <p>
                      총 {matcherHistory.totalMatchCount}번
                    </p>
                    <p>
                      {matcherHistory.matcherInfo.name}님이 매칭 상대로 선택된 총 횟수
                    </p>
                  </div>
                </div>

                {/* 상세 이력 */}
                {matcherHistory.items.length > 0 ? (<>
                    <p>
                      상세 이력 ({matcherHistory.meta.totalItems}건)
                    </p>
                    <div>
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                          <tr style={{ backgroundColor: '#f5f5f5' }} className="border-b">
                            <th scope="col" className="border-b px-4 py-3">매칭 ID</th>
                            <th scope="col" className="border-b px-4 py-3">매칭 점수</th>
                            <th scope="col" className="border-b px-4 py-3">매칭 타입</th>
                            <th scope="col" className="border-b px-4 py-3">매칭 발표 시간</th>
                            <th scope="col" className="border-b px-4 py-3">요청자 정보</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matcherHistory.items.map((item) => (<tr key={item.id} className="border-b">
                              <td className="border-b px-4 py-3">{item.id}</td>
                              <td className="border-b px-4 py-3">{item.score.toFixed(1)}</td>
                              <td className="border-b px-4 py-3">
                                <Chip size="sm">{getMatchTypeLabel(item.type)}</Chip>
                              </td>
                              <td className="border-b px-4 py-3">
                                {safeFormat(item.publishedAt, 'yyyy-MM-dd HH:mm')}
                              </td>
                              <td className="border-b px-4 py-3">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <img src={item.requester.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
                                  <div>
                                    <Button variant="tertiary" aria-label="사용자 상세" onPress={() => handleViewUserDetail(item.requester.id)} style={{ cursor: 'pointer', color: "var(--accent)" }}>
                                      {item.requester.name}{item.requester.deletedAt ? ' (탈퇴)' : ''}
                                    </Button>
                                    <p>
                                      {item.requester.age}세 · {item.requester.gender === 'MALE' ? '남' : '여'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                            </tr>))}
                        </tbody>
                      </table>
                    </div>

                    {/* 페이지네이션 */}
                    {matcherHistory.meta.totalPages > 1 && (<div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                        <nav aria-label="페이지 이동" className="flex items-center justify-center gap-3"><Button variant="secondary" isDisabled={historyPage <= 1} onPress={() => (handlePageChange)({} as never, historyPage - 1)}>이전</Button><Input type="number" aria-label="페이지 번호" min={1} max={matcherHistory.meta.totalPages} value={historyPage} onChange={event => (handlePageChange)({} as never, Number(event.target.value))} className="w-16 rounded border p-2"></Input><span>/ {matcherHistory.meta.totalPages}</span><Button variant="secondary" isDisabled={historyPage >= matcherHistory.meta.totalPages} onPress={() => (handlePageChange)({} as never, historyPage + 1)}>다음</Button></nav>
                      </div>)}
                  </>) : (<aside role="alert" className="rounded-lg border p-3">
                    해당 기간에 매칭 상대로 선택된 이력이 없습니다.
                  </aside>)}
              </>)}
          </div>)}
      </section>
      {/* 사용자 프로필 상세 모달 */}
      <UserDetailModal open={userModalOpen} onClose={() => setUserModalOpen(false)} userId={selectedUserId} userDetail={userDetail || { id: '', name: '', age: 0, gender: 'MALE', profileImages: [] }} loading={userDetailLoading} error={userDetailError}></UserDetailModal>
    </div>);
};
export default MatcherHistory;
