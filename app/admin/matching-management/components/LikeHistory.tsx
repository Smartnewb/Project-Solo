'use client';
import { Button, Spinner, Chip, TextField, Label, Input } from '@heroui/react';
import React, { useState, useEffect } from 'react';
import { ko } from 'date-fns/locale';
import { safeFormat, safeToLocaleDateString } from '@/app/utils/formatters';
import AdminService from '@/app/services/admin';
import { LikeHistoryResponse } from '../types';
import UserDetailModal from '@/components/admin/appearance/UserDetailModal';
const LikeHistory: React.FC = () => {
    // 좋아요 이력 관련 상태
    const [likeHistory, setLikeHistory] = useState<LikeHistoryResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(new Date());
    const [nameFilter, setNameFilter] = useState<string>('');
    // 사용자 상세 모달 관련 상태
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [userDetailModalOpen, setUserDetailModalOpen] = useState<boolean>(false);
    const [userDetail, setUserDetail] = useState<any>(null);
    const [loadingUserDetail, setLoadingUserDetail] = useState<boolean>(false);
    const [userDetailError, setUserDetailError] = useState<string | null>(null);
    // 좋아요 이력 조회
    const fetchLikeHistory = async () => {
        if (!startDate || !endDate) {
            setError('시작일과 종료일을 선택해주세요.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // 날짜 형식 변환 (YYYY-MM-DD)
            const formattedStartDate = safeFormat(startDate, 'yyyy-MM-dd');
            const formattedEndDate = safeFormat(endDate, 'yyyy-MM-dd');
            // AdminService를 사용하여 API 호출
            const data = await AdminService.matching.getLikeHistory(formattedStartDate, formattedEndDate, page, limit, nameFilter.trim() || undefined);
            ;
            setLikeHistory(data);
        }
        catch (err: any) {
            setError(err.response?.data?.message || err.message || '좋아요 이력을 불러오는 중 오류가 발생했습니다.');
        }
        finally {
            setLoading(false);
        }
    };
    // 페이지 변경 시 자동 재조회
    useEffect(() => {
        if (likeHistory && startDate && endDate) {
            fetchLikeHistory();
        }
    }, [page]);
    // 사용자 프로필 클릭 핸들러
    const handleUserClick = async (userId: string) => {
        setSelectedUserId(userId);
        setUserDetailModalOpen(true);
        setLoadingUserDetail(true);
        setUserDetailError(null);
        try {
            const response = await AdminService.userAppearance.getUserDetails(userId);
            setUserDetail(response);
        }
        catch (error: any) {
            setUserDetailError(error.response?.data?.message || error.message || '사용자 정보를 불러오는 중 오류가 발생했습니다.');
        }
        finally {
            setLoadingUserDetail(false);
        }
    };
    // 사용자 상세 모달 닫기
    const handleCloseUserDetailModal = () => {
        setUserDetailModalOpen(false);
        setSelectedUserId(null);
        setUserDetail(null);
        setUserDetailError(null);
    };
    // 페이지 변경 핸들러
    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };
    // 매칭 상태에 따른 칩 색상
    const getStatusChipColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'warning';
            case 'ACCEPTED':
                return 'success';
            case 'REJECTED':
                return 'error';
            case 'EXPIRED':
                return 'default';
            default:
                return 'default';
        }
    };
    // 매칭 상태 한글 표시
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING':
                return '대기중';
            case 'ACCEPTED':
                return '수락됨';
            case 'REJECTED':
                return '거절됨';
            case 'EXPIRED':
                return '만료됨';
            default:
                return status;
        }
    };
    // 날짜 포맷팅
    const formatDate = (dateString: string) => {
        return safeToLocaleDateString(dateString, 'ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    return (<div>
      <h2 className="text-lg font-semibold">
        좋아요 이력 조회
      </h2>

      {/* 검색 조건 */}
      <section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
        <div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="min-w-0">
              <TextField className="min-w-[150px]"><Label>{"시작일"}</Label><Input type="date" value={startDate ? new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ""} onChange={event => setStartDate(event.target.value ? new Date(event.target.value + "T00:00:00") : null)}></Input></TextField>
            </div>
            <div className="min-w-0">
              <TextField className="min-w-[150px]"><Label>{"종료일"}</Label><Input type="date" value={endDate ? new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : ""} onChange={event => setEndDate(event.target.value ? new Date(event.target.value + "T00:00:00") : null)}></Input></TextField>
            </div>
            <div className="min-w-0">
              <TextField className="mb-4"><Label>{"이름 검색"}</Label><Input value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} placeholder="보낸 사람 또는 받은 사람 이름"></Input></TextField>
            </div>
            <div className="min-w-0">
              <Button fullWidth onPress={fetchLikeHistory} isDisabled={loading} variant="primary" style={{ height: '40px' }}>
                조회
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 오류 메시지 */}
      {error && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
          {error}
        </aside>)}

      {/* 로딩 상태 */}
      {loading && (<div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Spinner size="sm"></Spinner>
        </div>)}

      {/* 결과 테이블 */}
      {likeHistory && !loading && (<>
          <section style={{ marginBottom: 16 }} className="rounded-xl border bg-white p-4">
            <p style={{ padding: 16 }}>
              총 {likeHistory.pagination.totalItems}건의 좋아요 이력
            </p>
            
            <div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr className="border-b">
                    <th scope="col" className="border-b px-4 py-3">보낸 사람</th>
                    <th scope="col" className="border-b px-4 py-3">받은 사람</th>
                    <th scope="col" className="border-b px-4 py-3">매칭 상태</th>
                    <th scope="col" className="border-b px-4 py-3">좋아요 발송일</th>
                    <th scope="col" className="border-b px-4 py-3">확인일</th>
                    <th scope="col" className="border-b px-4 py-3">만료 여부</th>
                    <th scope="col" className="border-b px-4 py-3">인연이 아니였나봐요 클릭 여부</th>
                  </tr>
                </thead>
                <tbody>
                  {likeHistory.items.length === 0 ? (<tr className="border-b">
                      <td colSpan={7} style={{ paddingBlock: 32 }} className="border-b px-4 py-3">
                        조회된 좋아요 이력이 없습니다.
                      </td>
                    </tr>) : (likeHistory.items.map((item) => (<tr key={item.id} className="border-b">
                        <td className="border-b px-4 py-3">
                          <Button variant="tertiary" onPress={() => handleUserClick(item.sender.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <img src={item.sender.profileImage} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
                            <p>{item.sender.name}</p>
                          </Button>
                        </td>
                        <td className="border-b px-4 py-3">
                          <Button variant="tertiary" onPress={() => handleUserClick(item.receiver.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <img src={item.receiver.profileImage} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
                            <p>{item.receiver.name}</p>
                          </Button>
                        </td>
                        <td className="border-b px-4 py-3">
                          <Chip size="sm">{getStatusLabel(item.matchStatus)}</Chip>
                        </td>
                        <td className="border-b px-4 py-3">{formatDate(item.createdAt)}</td>
                        <td className="border-b px-4 py-3">
                          {item.viewedAt ? formatDate(item.viewedAt) : '-'}
                        </td>
                        <td className="border-b px-4 py-3">
                          <Chip size="sm">{item.isExpired ? '만료됨' : '유효함'}</Chip>
                        </td>
                        <td className="border-b px-4 py-3">
                          <Chip size="sm">{item.isNoShow ? '클릭함' : '클릭 안함'}</Chip>
                        </td>
                      </tr>)))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 페이지네이션 */}
          {likeHistory.pagination.totalPages > 1 && (<div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <nav aria-label="페이지 이동" className="flex items-center justify-center gap-3"><Button variant="secondary" isDisabled={page <= 1} onPress={() => (handlePageChange)({} as never, page - 1)}>이전</Button><Input type="number" aria-label="페이지 번호" min={1} max={likeHistory.pagination.totalPages} value={page} onChange={event => (handlePageChange)({} as never, Number(event.target.value))} className="w-16 rounded border p-2"></Input><span>/ {likeHistory.pagination.totalPages}</span><Button variant="secondary" isDisabled={page >= likeHistory.pagination.totalPages} onPress={() => (handlePageChange)({} as never, page + 1)}>다음</Button></nav>
            </div>)}
        </>)}

      {/* 사용자 상세 정보 모달 */}
      {userDetail && (<UserDetailModal open={userDetailModalOpen} onClose={handleCloseUserDetailModal} userId={selectedUserId} userDetail={userDetail} loading={loadingUserDetail} error={userDetailError} onRefresh={() => {
                // 데이터 새로고침
                if (selectedUserId) {
                    handleUserClick(selectedUserId);
                }
            }}></UserDetailModal>)}
    </div>);
};
export default LikeHistory;
