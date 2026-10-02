import { ComboBox, ListBox, Button, Spinner, Chip, Modal, TextField, Label, Input, Select } from '@heroui/react';
import { History as HistoryIcon, Plus as AddIcon } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { ko } from 'date-fns/locale';
import { safeFormat, formatDateTimeWithoutTimezoneConversion } from '@/app/utils/formatters';
import { UserSearchResult, MatchingResult } from '../types';
import AdminService from '@/app/services/admin';
import { adminGet } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
// 매칭 이력 아이템 인터페이스
interface MatchHistoryItem {
    id: string;
    score: number;
    type: string;
    publishedAt: string;
    user: {
        id: string;
        name: string;
        age: number;
        gender: string;
        profileImageUrl?: string;
        universityDetails?: {
            name: string;
            department: string;
        };
    };
    matcher?: {
        id: string;
        name: string;
        age: number;
        gender: string;
        profileImageUrl?: string;
        universityDetails?: {
            name: string;
            department: string;
        };
    };
}
// 매칭 이력 응답 인터페이스
interface MatchHistoryResponse {
    items: MatchHistoryItem[];
    meta: {
        currentPage: number;
        itemsPerPage: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}
// 중복 매칭 확인 응답 인터페이스
interface MatchCountResponse {
    totalCount: number;
    matches: {
        id: string;
        publishedAt: string;
        type: string;
    }[];
}
interface SingleMatchingProps {
    selectedUser: UserSearchResult | null;
    matchingLoading: boolean;
    matchingResult: MatchingResult | null;
    processSingleMatching: () => void;
}
const SingleMatching: React.FC<SingleMatchingProps> = ({ selectedUser, matchingLoading, matchingResult, processSingleMatching }) => {
    const toast = useToast();
    const directMatchCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // 매칭 이력 관련 상태
    const [showMatchHistory, setShowMatchHistory] = useState<boolean>(false);
    const [matchHistory, setMatchHistory] = useState<MatchHistoryResponse | null>(null);
    const [historyLoading, setHistoryLoading] = useState<boolean>(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [historyPage, setHistoryPage] = useState<number>(1);
    const [historyLimit, setHistoryLimit] = useState<number>(5);
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(new Date());
    // 중복 매칭 확인 관련 상태
    const [matchCount, setMatchCount] = useState<MatchCountResponse | null>(null);
    const [matchCountLoading, setMatchCountLoading] = useState<boolean>(false);
    const [matchCountError, setMatchCountError] = useState<string | null>(null);
    // 직접 매칭 생성 관련 상태
    const [directMatchDialogOpen, setDirectMatchDialogOpen] = useState<boolean>(false);
    const [targetUserSearch, setTargetUserSearch] = useState<string>('');
    const [targetUserSearchResults, setTargetUserSearchResults] = useState<UserSearchResult[]>([]);
    const [selectedTargetUser, setSelectedTargetUser] = useState<UserSearchResult | null>(null);
    const [matchType, setMatchType] = useState<'rematching' | 'scheduled'>('scheduled');
    const [directMatchLoading, setDirectMatchLoading] = useState<boolean>(false);
    const [directMatchError, setDirectMatchError] = useState<string | null>(null);
    const [directMatchResult, setDirectMatchResult] = useState<any>(null);
    // 매칭 이력 조회 함수
    const fetchMatchHistory = async () => {
        if (!selectedUser || !startDate || !endDate)
            return;
        setHistoryLoading(true);
        setHistoryError(null);
        try {
            // 날짜 형식 변환 (YYYY-MM-DD)
            const formattedStartDate = safeFormat(startDate, 'yyyy-MM-dd');
            const formattedEndDate = safeFormat(endDate, 'yyyy-MM-dd');
            // AdminService를 사용하여 API 호출
            const data = await AdminService.matching.getMatchHistory(formattedStartDate, formattedEndDate, historyPage, historyLimit, selectedUser.name);
            ;
            setMatchHistory(data);
        }
        catch (err: any) {
            setHistoryError(err.response?.data?.message || err.message || '매칭 이력을 불러오는 중 오류가 발생했습니다.');
        }
        finally {
            setHistoryLoading(false);
        }
    };
    // 매칭 이력 토글 함수
    const toggleMatchHistory = () => {
        const newState = !showMatchHistory;
        setShowMatchHistory(newState);
        if (newState && !matchHistory) {
            fetchMatchHistory();
        }
    };
    // 페이지 변경 핸들러
    const handlePageChange = (_: unknown, newPage: number) => {
        setHistoryPage(newPage + 1);
    };
    // 페이지당 항목 수 변경 핸들러
    const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setHistoryLimit(parseInt(event.target.value, 10));
        setHistoryPage(1);
    };
    // 시작일 변경 핸들러
    const handleStartDateChange = (newDate: Date | null) => {
        setStartDate(newDate);
        setHistoryPage(1);
        if (newDate && endDate && showMatchHistory) {
            // 날짜가 변경되면 새로운 데이터 로드
            setTimeout(() => fetchMatchHistory(), 0);
        }
    };
    // 종료일 변경 핸들러
    const handleEndDateChange = (newDate: Date | null) => {
        setEndDate(newDate);
        setHistoryPage(1);
        if (startDate && newDate && showMatchHistory) {
            // 날짜가 변경되면 새로운 데이터 로드
            setTimeout(() => fetchMatchHistory(), 0);
        }
    };
    // 검색 버튼 핸들러
    const handleSearch = () => {
        fetchMatchHistory();
    };
    // 페이지 또는 항목 수 변경 시 데이터 다시 로드
    useEffect(() => {
        if (showMatchHistory && startDate && endDate) {
            fetchMatchHistory();
        }
    }, [historyPage, historyLimit]);
    // 중복 매칭 확인 함수
    const checkMatchCount = async () => {
        if (!matchingResult || !matchingResult.success || !selectedUser)
            return;
        setMatchCountLoading(true);
        setMatchCountError(null);
        try {
            // 요청자 ID와 매칭 상대 ID로 중복 매칭 여부 확인
            const data = await AdminService.matching.getMatchCount(matchingResult.requester.id, matchingResult.partner.id);
            ;
            // 매칭 이력을 날짜 기준으로 오름차순 정렬 (가장 오래된 매칭이 첫 번째)
            if (data && data.matches && data.matches.length > 0) {
                data.matches.sort((a: {
                    publishedAt: string;
                }, b: {
                    publishedAt: string;
                }) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
            }
            setMatchCount(data);
        }
        catch (err: any) {
            setMatchCountError(err.response?.data?.message || err.message || '중복 매칭 확인 중 오류가 발생했습니다.');
        }
        finally {
            setMatchCountLoading(false);
        }
    };
    // 매칭 결과가 변경되면 중복 매칭 여부 확인
    useEffect(() => {
        if (matchingResult && matchingResult.success) {
            checkMatchCount();
        }
        else {
            setMatchCount(null);
        }
    }, [matchingResult]);
    // 선택된 사용자가 변경되면 매칭 이력 초기화
    useEffect(() => {
        setShowMatchHistory(false);
        setMatchHistory(null);
        setHistoryPage(1);
        setStartDate(new Date());
        setEndDate(new Date());
        setMatchCount(null);
    }, [selectedUser]);
    // 언마운트 시 자동 닫기 타이머 정리
    useEffect(() => () => {
        if (directMatchCloseTimer.current)
            clearTimeout(directMatchCloseTimer.current);
    }, []);
    // 타겟 사용자 검색 함수
    const searchTargetUsers = async (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setTargetUserSearchResults([]);
            return;
        }
        try {
            const isPhone = /^[\d\-]+$/.test(searchTerm);
            const response = await adminGet<any>('/admin/v2/users/search', {
                page: '1',
                limit: '20',
                ...(isPhone ? { phoneNumber: searchTerm } : { name: searchTerm }),
            });
            ;
            let results = [];
            if (response && response.data && Array.isArray(response.data)) {
                results = response.data;
            }
            else if (response && Array.isArray(response)) {
                results = response;
            }
            setTargetUserSearchResults(results);
        }
        catch (error: any) {
            setTargetUserSearchResults([]);
            toast.error(error?.response?.data?.message || '사용자 검색 중 오류가 발생했습니다.');
        }
    };
    // 직접 매칭 생성 함수
    const createDirectMatch = async () => {
        if (!selectedUser || !selectedTargetUser) {
            setDirectMatchError('매칭할 사용자들을 모두 선택해주세요.');
            return;
        }
        setDirectMatchLoading(true);
        setDirectMatchError(null);
        try {
            const response = await AdminService.matching.createDirectMatch(selectedUser.id, selectedTargetUser.id, matchType);
            ;
            setDirectMatchResult(response);
            // 성공 시 다이얼로그 닫기
            directMatchCloseTimer.current = setTimeout(() => {
                setDirectMatchDialogOpen(false);
                resetDirectMatchForm();
            }, 2000);
        }
        catch (err: any) {
            const errorMessage = err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                '직접 매칭 생성 중 오류가 발생했습니다.';
            setDirectMatchError(errorMessage);
        }
        finally {
            setDirectMatchLoading(false);
        }
    };
    // 직접 매칭 폼 초기화
    const resetDirectMatchForm = () => {
        if (directMatchCloseTimer.current) {
            clearTimeout(directMatchCloseTimer.current);
            directMatchCloseTimer.current = null;
        }
        setTargetUserSearch('');
        setTargetUserSearchResults([]);
        setSelectedTargetUser(null);
        setMatchType('scheduled');
        setDirectMatchError(null);
        setDirectMatchResult(null);
    };
    // 직접 매칭 다이얼로그 열기
    const openDirectMatchDialog = () => {
        resetDirectMatchForm();
        setDirectMatchDialogOpen(true);
    };
    // 직접 매칭 다이얼로그 닫기
    const closeDirectMatchDialog = () => {
        setDirectMatchDialogOpen(false);
        resetDirectMatchForm();
    };
    return (<>
      {/* 선택된 사용자 정보 */}
      {selectedUser && (<section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
          <p>
            선택된 사용자:
          </p>
          <section style={{ padding: 16 }} className="rounded-xl border bg-white p-4">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={selectedUser.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
              <div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <p>
                    {selectedUser.name} ({selectedUser.age}세, {selectedUser.gender === 'MALE' ? '남성' : '여성'})
                  </p>
                  {selectedUser.appearanceGrade && (<Chip size="sm">{selectedUser.appearanceGrade}</Chip>)}
                </div>
                <p>
                  {selectedUser.university ? (typeof selectedUser.university === 'string' ?
                selectedUser.university :
                selectedUser.university.name) : selectedUser.universityDetails?.name ?
                `${selectedUser.universityDetails.name} ${selectedUser.universityDetails.department || ''}` :
                '대학 정보 없음'}
                </p>
              </div>
            </div>
          </section>

          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <Button onPress={processSingleMatching} isDisabled={matchingLoading} variant="primary" style={{ flex: 1 }}>
              {matchingLoading ? <Spinner size="sm"></Spinner> : '매칭 실행'}
            </Button>

            <Button onPress={openDirectMatchDialog} variant="primary" style={{ flex: 1 }}>{<AddIcon></AddIcon>}
              수동 매칭 생성
            </Button>

            <Button onPress={toggleMatchHistory} variant="secondary" style={{ flex: 1 }}>{<HistoryIcon></HistoryIcon>}
              {showMatchHistory ? '매칭 이력 닫기' : '매칭 이력 보기'}
            </Button>
          </div>
        </section>)}

      {/* 매칭 이력 */}
      {selectedUser && (<div hidden={!showMatchHistory}>
          <section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
            <h2 className="text-lg font-semibold">
              {selectedUser.name}님의 매칭 이력
            </h2>

            <div style={{ marginBottom: 24 }}>
              <div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <TextField className="min-w-[150px]"><Label>{"시작일"}</Label><Input type="date" value={startDate ? new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ""} onChange={event => (handleStartDateChange)(event.target.value ? new Date(event.target.value + "T00:00:00") : null)}></Input></TextField>
                  </div>
                  <div style={{ flex: 1 }}>
                    <TextField className="min-w-[150px]"><Label>{"종료일"}</Label><Input type="date" value={endDate ? new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ""} onChange={event => (handleEndDateChange)(event.target.value ? new Date(event.target.value + "T00:00:00") : null)}></Input></TextField>
                  </div>
                  <Button onPress={handleSearch} variant="primary" style={{ height: 40 }}>
                    조회하기
                  </Button>
                </div>
              </div>
            </div>

            {historyLoading && (<div style={{ display: 'flex', justifyContent: 'center', marginBlock: 16 }}>
                <Spinner size="sm"></Spinner>
              </div>)}

            {historyError && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
                {historyError}
              </aside>)}

            {!historyLoading && matchHistory && (<>
                {matchHistory.items.length > 0 ? (<>
                    <div>
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                          <tr style={{ backgroundColor: '#f5f5f5' }} className="border-b">
                            <th scope="col" className="border-b px-4 py-3">매칭 ID</th>
                            <th scope="col" className="border-b px-4 py-3">매칭 점수</th>
                            <th scope="col" className="border-b px-4 py-3">매칭 타입</th>
                            <th scope="col" className="border-b px-4 py-3">매칭 발표 시간</th>
                            <th scope="col" className="border-b px-4 py-3">매칭 상대 정보</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matchHistory.items.map((item) => (<tr key={item.id} className="border-b">
                              <td className="border-b px-4 py-3">{item.id}</td>
                              <td className="border-b px-4 py-3">{item.score.toFixed(1)}</td>
                              <td className="border-b px-4 py-3">
                                <Chip size="sm">{item.type === 'scheduled' ? '무료 매칭' :
                            item.type === 'admin' ? '관리자 매칭' :
                                item.type === 'rematching' ? '유료 매칭' :
                                    item.type}</Chip>
                              </td>
                              <td className="border-b px-4 py-3">
                                {formatDateTimeWithoutTimezoneConversion(item.publishedAt)}
                              </td>
                              <td className="border-b px-4 py-3">
                                {item.matcher ? (<div style={{ display: 'flex', alignItems: 'center' }}>
                                    {item.matcher.profileImageUrl ? (<img src={item.matcher.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>) : (<span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                                        {item.matcher.name ? item.matcher.name.charAt(0) : '?'}
                                      </span>)}
                                    <div>
                                      <p>{item.matcher.name} ({item.matcher.age}세)</p>
                                      {item.matcher.universityDetails && (<p>
                                          {item.matcher.universityDetails.name} {item.matcher.universityDetails.department}
                                        </p>)}
                                    </div>
                                  </div>) : (<p>매칭 상대 없음</p>)}
                              </td>
                            </tr>))}
                        </tbody>
                      </table>
                    </div>

                    {/* 페이지네이션 */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                      <div className="flex items-center justify-end gap-3 border-t p-4"><div><Select aria-label="페이지당 행 수" value={matchHistory.meta.itemsPerPage} onChange={(key) => {
                        const value = String(key ?? "");
                        (handleLimitChange)({ target: { value: value }, currentTarget: { value: value } } as never);
                    }} className="min-w-[120px]"><Label>페이지당 행 수</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={5} textValue={"5"}>5</ListBox.Item><ListBox.Item id={10} textValue={"10"}>10</ListBox.Item><ListBox.Item id={25} textValue={"25"}>25</ListBox.Item></ListBox></Select.Popover></Select></div><Button variant="secondary" isDisabled={matchHistory.meta.currentPage - 1 <= 0} onPress={() => (handlePageChange)(null, matchHistory.meta.currentPage - 1 - 1)}>이전</Button><span>{matchHistory.meta.currentPage - 1 + 1} 페이지 / {matchHistory.meta.totalItems}개</span><Button variant="secondary" isDisabled={(matchHistory.meta.currentPage - 1 + 1) * matchHistory.meta.itemsPerPage >= matchHistory.meta.totalItems} onPress={() => (handlePageChange)(null, matchHistory.meta.currentPage - 1 + 1)}>다음</Button></div>
                    </div>
                  </>) : (<aside role="alert" className="rounded-lg border p-3">
                    {selectedUser.name}님의 매칭 이력이 없습니다.
                  </aside>)}
              </>)}

            {!historyLoading && !matchHistory && !historyError && (<aside role="alert" className="rounded-lg border p-3">
                매칭 이력을 불러오는 중입니다...
              </aside>)}
          </section>
        </div>)}

      {/* 매칭 결과 */}
      {matchingResult && (<div style={{ marginTop: 32 }}>
          <h2 className="text-lg font-semibold">
            매칭 결과
          </h2>
          {matchingResult.success ? (<>
              <aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
                매칭 성공! 유사도: {(matchingResult.similarity * 100).toFixed(1)}%
              </aside>

              {/* 중복 매칭 정보 */}
              {matchCount && (<>
                  <aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
                    {matchCount.totalCount === 0
                        ? "이 사용자들은 이전에 매칭된 이력이 없습니다."
                        : matchCount.totalCount === 1
                            ? "이 사용자들은 처음 매칭되었습니다."
                            : `이 사용자들은 이전에 ${matchCount.totalCount}번 매칭된 이력이 있습니다. (재매칭)`}
                  </aside>

                  {/* 중복 매칭 상세 정보 */}
                  {matchCount.totalCount > 0 && matchCount.matches.length > 0 && (<div style={{ marginBottom: 16 }}>
                      <p>
                        {matchCount.totalCount === 1 ? "첫 매칭 이력:" : "재매칭 이력:"}
                      </p>
                      <div>
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-left">
                            <tr style={{ backgroundColor: '#f5f5f5' }} className="border-b">
                              <th scope="col" className="border-b px-4 py-3">매칭 ID</th>
                              <th scope="col" className="border-b px-4 py-3">매칭 타입</th>
                              <th scope="col" className="border-b px-4 py-3">매칭 일시</th>
                            </tr>
                          </thead>
                          <tbody>
                            {matchCount.matches.map((match, index) => (<tr key={match.id} style={{ backgroundColor: matchCount.totalCount === 1
                                    ? 'rgba(76, 175, 80, 0.08)' // 첫 매칭인 경우 연한 초록색
                                    : index === 0
                                        ? 'rgba(255, 152, 0, 0.08)' // 재매칭 중 첫 번째 매칭은 연한 주황색
                                        : 'inherit' // 나머지는 기본 색상
                            }} className="border-b">
                                <td className="border-b px-4 py-3">{match.id}</td>
                                <td className="border-b px-4 py-3">
                                  <Chip size="sm">{match.type === 'scheduled' ? '무료 매칭' :
                                match.type === 'admin' ? '관리자 매칭' :
                                    match.type === 'rematching' ? '유료 매칭' :
                                        match.type}</Chip>
                                  {/* 첫 번째 매칭은 항상 "첫 매칭"으로 표시 */}
                                  {index === 0 && (<Chip size="sm">{"첫 매칭"}</Chip>)}
                                  {/* 두 번째 이상의 매칭은 순서대로 표시 */}
                                  {index > 0 && (<Chip size="sm">{`${index + 1}번째 매칭`}</Chip>)}
                                </td>
                                <td className="border-b px-4 py-3">
                                  {formatDateTimeWithoutTimezoneConversion(match.publishedAt)}
                                </td>
                              </tr>))}
                          </tbody>
                        </table>
                      </div>
                    </div>)}
                </>)}

              {matchCountLoading && (<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Spinner size="sm"></Spinner>
                  <p>중복 매칭 여부 확인 중...</p>
                </div>)}

              {matchCountError && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
                  {matchCountError}
                </aside>)}
              <div style={{ display: 'flex', gap: 24 }}>
                {/* 요청자 정보 */}
                <div style={{ flex: 1 }}>
                  <div className="rounded-xl border p-4">
                    <div className="p-4">
                      <h2 className="text-lg font-semibold">
                        요청자 정보
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                        <img src={matchingResult.requester.profileImages?.find(img => img.isMain)?.url} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
                        <div>
                          <p>
                            {matchingResult.requester.name} ({matchingResult.requester.age}세)
                          </p>
                          <p>
                            {matchingResult.requester.gender === 'MALE' ? '남성' : '여성'}
                            {matchingResult.requester.rank && ` • ${matchingResult.requester.rank}등급`}
                            {matchingResult.requester.mbti && ` • ${matchingResult.requester.mbti}`}
                          </p>
                        </div>
                      </div>
                      <hr style={{ marginBottom: 16 }}></hr>
                      <p>
                        {matchingResult.requester.universityDetails?.name} {matchingResult.requester.universityDetails?.department}
                      </p>
                      <p>
                        {matchingResult.requester.universityDetails?.grade} {matchingResult.requester.universityDetails?.studentNumber}
                      </p>

                      {/* 선호 조건 */}
                      {matchingResult.requester.preferences && matchingResult.requester.preferences.length > 0 && (<div style={{ marginTop: 16 }}>
                          <p>
                            선호 조건:
                          </p>
                          {matchingResult.requester.preferences.map((pref, index) => (<div key={index} style={{ marginBottom: 8 }}>
                              <p>
                                {pref.typeName}:
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {pref.selectedOptions.map(option => (<Chip key={option.id} size="sm">{option.displayName}</Chip>))}
                              </div>
                            </div>))}
                        </div>)}
                    </div>
                  </div>
                </div>

                {/* 매칭 상대 정보 */}
                <div style={{ flex: 1 }}>
                  <div className="rounded-xl border p-4">
                    <div className="p-4">
                      <h2 className="text-lg font-semibold">
                        매칭 상대 정보
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                        <img src={matchingResult.partner.profileImages?.find(img => img.isMain)?.url} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
                        <div>
                          <p>
                            {matchingResult.partner.name} ({matchingResult.partner.age}세)
                          </p>
                          <p>
                            {matchingResult.partner.gender === 'MALE' ? '남성' : '여성'}
                            {matchingResult.partner.rank && ` • ${matchingResult.partner.rank}등급`}
                            {matchingResult.partner.mbti && ` • ${matchingResult.partner.mbti}`}
                          </p>
                        </div>
                      </div>
                      <hr style={{ marginBottom: 16 }}></hr>
                      <p>
                        {matchingResult.partner.universityDetails?.name} {matchingResult.partner.universityDetails?.department}
                      </p>
                      <p>
                        {matchingResult.partner.universityDetails?.grade} {matchingResult.partner.universityDetails?.studentNumber}
                      </p>

                      {/* 선호 조건 */}
                      {matchingResult.partner.preferences && matchingResult.partner.preferences.length > 0 && (<div style={{ marginTop: 16 }}>
                          <p>
                            선호 조건:
                          </p>
                          {matchingResult.partner.preferences.map((pref, index) => (<div key={index} style={{ marginBottom: 8 }}>
                              <p>
                                {pref.typeName}:
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {pref.selectedOptions.map(option => (<Chip key={option.id} size="sm">{option.displayName}</Chip>))}
                              </div>
                            </div>))}
                        </div>)}
                    </div>
                  </div>
                </div>
              </div>
            </>) : (<aside role="alert" className="rounded-lg border p-3">
              매칭 실패: {matchingResult.success === false ? '적합한 매칭 상대를 찾을 수 없습니다.' : '알 수 없는 오류가 발생했습니다.'}
            </aside>)}
        </div>)}

      {/* 직접 매칭 생성 다이얼로그 */}
      <Modal.Backdrop isOpen={directMatchDialogOpen} isDismissable={!directMatchLoading} isKeyboardDismissDisabled={directMatchLoading} onOpenChange={next => {
            if (!next && !directMatchLoading)
                closeDirectMatchDialog();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 900, minWidth: 0 }}>
        <Modal.Heading>
          직접 매칭 생성
        </Modal.Heading>
        <Modal.Body>
          <div style={{ paddingTop: 16 }}>
            {/* 요청자 정보 */}
            <p>
              매칭 요청자:
            </p>
            {selectedUser && (<section style={{ padding: 16, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img src={selectedUser.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
                  <div>
                    <p>
                      {selectedUser.name} ({selectedUser.age}세, {selectedUser.gender === 'MALE' ? '남성' : '여성'})
                    </p>
                    <p>
                      {selectedUser.university ? (typeof selectedUser.university === 'string' ?
                selectedUser.university :
                selectedUser.university.name) : selectedUser.universityDetails?.name ?
                `${selectedUser.universityDetails.name} ${selectedUser.universityDetails.department || ''}` :
                '대학 정보 없음'}
                    </p>
                  </div>
                </div>
              </section>)}

            {/* 매칭 타입 선택 */}
            <div style={{ marginBottom: 24 }}>
              <label>매칭 타입</label>
              <Select value={matchType} aria-label={"매칭 타입"} onChange={(key) => {
            const value = String(key ?? "");
            setMatchType(value as 'rematching' | 'scheduled');
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                <ListBox.Item id={"scheduled"} textValue={"\uC77C\uBC18 \uB9E4\uCE6D (scheduled)"}>일반 매칭 (scheduled)</ListBox.Item>
                <ListBox.Item id={"rematching"} textValue={"\uC7AC\uB9E4\uCE6D (rematching)"}>재매칭 (rematching)</ListBox.Item>
              </ListBox></Select.Popover></Select>
            </div>

            {/* 타겟 사용자 검색 */}
            <p>
              매칭 대상자:
            </p>
            <ComboBox value={selectedTargetUser?.id ?? null} onChange={id => setSelectedTargetUser(targetUserSearchResults.find(user => user.id === id) ?? null)} inputValue={targetUserSearch} onInputChange={value => {
            setTargetUserSearch(value);
            if (value.length >= 2)
                void searchTargetUsers(value);
        }} defaultFilter={() => true} className="mb-6">
              <Label>사용자 검색 (이름 또는 전화번호)</Label><ComboBox.InputGroup><Input placeholder="최소 2글자 이상 입력하세요"/><ComboBox.Trigger /></ComboBox.InputGroup>
              <ComboBox.Popover><ListBox>{targetUserSearchResults.map(user => <ListBox.Item key={user.id} id={user.id} textValue={`${user.name} (${user.age}세, ${user.gender === 'MALE' ? '남성' : '여성'})`}><span>{user.name} ({user.age}세, {user.gender === 'MALE' ? '남성' : '여성'})</span><small>{typeof user.university === 'string' ? user.university : user.university?.name ?? user.universityDetails?.name ?? '대학 정보 없음'}</small></ListBox.Item>)}</ListBox></ComboBox.Popover>
            </ComboBox>

            {/* 선택된 타겟 사용자 정보 */}
            {selectedTargetUser && (<section style={{ padding: 16, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
                <p>
                  선택된 매칭 대상자:
                </p>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img src={selectedTargetUser.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
                  <div>
                    <p>
                      {selectedTargetUser.name} ({selectedTargetUser.age}세, {selectedTargetUser.gender === 'MALE' ? '남성' : '여성'})
                    </p>
                    <p>
                      {selectedTargetUser.university ? (typeof selectedTargetUser.university === 'string' ?
                selectedTargetUser.university :
                selectedTargetUser.university.name) : selectedTargetUser.universityDetails?.name ?
                `${selectedTargetUser.universityDetails.name} ${selectedTargetUser.universityDetails.department || ''}` :
                '대학 정보 없음'}
                    </p>
                  </div>
                </div>
              </section>)}

            {/* 오류 메시지 */}
            {directMatchError && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
                {directMatchError}
              </aside>)}

            {/* 성공 메시지 */}
            {directMatchResult && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
                직접 매칭이 성공적으로 생성되었습니다!
              </aside>)}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onPress={closeDirectMatchDialog} isDisabled={directMatchLoading} variant="tertiary">
            취소
          </Button>
          <Button onPress={createDirectMatch} isDisabled={directMatchLoading || !!directMatchResult || !selectedUser || !selectedTargetUser} variant="primary">
            {directMatchLoading ? <Spinner size="sm"></Spinner> : '매칭 생성'}
          </Button>
        </Modal.Footer>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>
    </>);
};
export default SingleMatching;
