'use client';
import { Label, Button, Spinner, Chip, Modal, Select, ListBox } from '@heroui/react';
import { X as CloseIcon } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { scheduledMatchingService } from '../service';
import type { BatchDetailsWithStats, DetailStatus } from '../types';
import { formatDateTime, formatDuration } from '../utils';
interface BatchDetailModalProps {
    batchId: string | null;
    open: boolean;
    onClose: () => void;
}
const DETAIL_STATUS_CONFIG: Record<DetailStatus, {
    label: string;
    color: 'success' | 'warning' | 'error' | 'default';
}> = {
    success: { label: '성공', color: 'success' },
    no_candidates: { label: '후보 없음', color: 'warning' },
    filter_exhausted: { label: '필터 소진', color: 'warning' },
    error: { label: '오류', color: 'error' },
};
export default function BatchDetailModal({ batchId, open, onClose }: BatchDetailModalProps) {
    const [data, setData] = useState<BatchDetailsWithStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [statusFilter, setStatusFilter] = useState<'ALL' | DetailStatus>('ALL');
    const fetchDetails = useCallback(async () => {
        if (!batchId)
            return;
        try {
            setLoading(true);
            setError(null);
            const result = await scheduledMatchingService.getBatchDetails(batchId, 100, 0);
            setData(result);
        }
        catch {
            setError('배치 상세 정보를 불러오는데 실패했습니다.');
        }
        finally {
            setLoading(false);
        }
    }, [batchId]);
    useEffect(() => {
        if (open && batchId) {
            setPage(0);
            setStatusFilter('ALL');
            fetchDetails();
        }
    }, [open, batchId, fetchDetails]);
    const handleClose = () => {
        setData(null);
        onClose();
    };
    const filteredDetails = data?.details.filter((d) => statusFilter === 'ALL' || d.status === statusFilter) || [];
    const paginatedDetails = filteredDetails.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const failureAnalysis = data?.details.reduce((acc, detail) => {
        if (detail.status !== 'success') {
            acc[detail.status] = (acc[detail.status] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>) || {};
    const batch = data?.batch;
    const countryFlag = batch?.country === 'KR' ? '🇰🇷' : '🇯🇵';
    return (<Modal.Backdrop isOpen={open} onOpenChange={next => {
            if (!next)
                handleClose();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 1200, minWidth: 0 }}>
      <Modal.Header><Modal.Heading style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>배치 상세</Modal.Heading>
        <Button onPress={handleClose} aria-label="배치 상세 닫기" variant="tertiary" isIconOnly={true}>
          <CloseIcon></CloseIcon>
        </Button>
      </Modal.Header>

      <Modal.Body>
        {loading && (<div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 32 }}>
            <Spinner size="sm"></Spinner>
          </div>)}

        {error && <aside role="alert" className="rounded-lg border p-3">{error}</aside>}

        {data && batch && (<>
            <section style={{ padding: 16, marginBottom: 24, backgroundColor: '#f9fafb' }} className="rounded-xl border bg-white p-4">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                <div>
                  <p>국가</p>
                  <p>{countryFlag} {batch.country}</p>
                </div>
                <div>
                  <p>상태</p>
                  <div>
                    <Chip size="sm">{batch.status}</Chip>
                  </div>
                </div>
                <div>
                  <p>시작</p>
                  <p>{formatDateTime(batch.startedAt)}</p>
                </div>
                <div>
                  <p>완료</p>
                  <p>
                    {batch.completedAt ? formatDateTime(batch.completedAt) : '-'}
                  </p>
                </div>
                <div>
                  <p>소요 시간</p>
                  <p>{formatDuration(batch.startedAt, batch.completedAt)}</p>
                </div>
              </div>

              <hr style={{ marginBlock: 16 }}></hr>

              <div style={{ display: 'flex', gap: 32 }}>
                <div style={{ textAlign: 'center' }}>
                  <h1 className="text-2xl font-bold">{batch.totalUsers}</h1>
                  <p>전체</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h1 className="text-2xl font-bold">
                    {batch.successCount}
                  </h1>
                  <p>성공</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h1 className="text-2xl font-bold">
                    {batch.failureCount}
                  </h1>
                  <p>실패</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h1 className="text-2xl font-bold">
                    {data.stats.averageProcessingTimeMs.toFixed(0)}ms
                  </h1>
                  <p>평균 처리 시간</p>
                </div>
              </div>
            </section>

            {Object.keys(failureAnalysis).length > 0 && (<section style={{ padding: 16, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
                <p>실패 원인 분석</p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {Object.entries(failureAnalysis).map(([status, count]) => {
                    const config = DETAIL_STATUS_CONFIG[status as DetailStatus];
                    const percentage = ((count / batch.failureCount) * 100).toFixed(1);
                    return (<Chip key={status} size="sm">{`${config?.label || status}: ${count}명 (${percentage}%)`}</Chip>);
                })}
                </div>
              </section>)}

            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p>개별 매칭 결과</p>
              <div style={{ minWidth: 120 }}>
                <Select value={statusFilter} aria-label="상태 필터" onChange={(key) => {
                const value = String(key ?? "");
                setStatusFilter(value as 'ALL' | DetailStatus);
                setPage(0);
            }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                  <ListBox.Item id={"ALL"} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
                  <ListBox.Item id={"success"} textValue={"\uC131\uACF5\uB9CC"}>성공만</ListBox.Item>
                  <ListBox.Item id={"no_candidates"} textValue={"\uD6C4\uBCF4 \uC5C6\uC74C"}>후보 없음</ListBox.Item>
                  <ListBox.Item id={"filter_exhausted"} textValue={"\uD544\uD130 \uC18C\uC9C4"}>필터 소진</ListBox.Item>
                  <ListBox.Item id={"error"} textValue={"\uC624\uB958"}>오류</ListBox.Item>
                </ListBox></Select.Popover></Select>
              </div>
            </div>

            <div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr style={{ backgroundColor: "#f3f4f6" }} className="border-b">
                    <th scope="col" className="border-b px-4 py-3">사용자 ID</th>
                    <th scope="col" className="border-b px-4 py-3">파트너 ID</th>
                    <th scope="col" className="border-b px-4 py-3">상태</th>
                    <th scope="col" className="border-b px-4 py-3">점수</th>
                    <th scope="col" className="border-b px-4 py-3">처리 시간</th>
                    <th scope="col" className="border-b px-4 py-3">오류 메시지</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDetails.length === 0 ? (<tr className="border-b">
                      <td colSpan={6} style={{ paddingBlock: 24 }} className="border-b px-4 py-3">
                        <p>결과가 없습니다.</p>
                      </td>
                    </tr>) : (paginatedDetails.map((detail) => {
                const statusConfig = DETAIL_STATUS_CONFIG[detail.status];
                return (<tr key={detail.id} className="border-b">
                          <td className="border-b px-4 py-3">
                            <p>
                              {detail.userId.substring(0, 8)}...
                            </p>
                          </td>
                          <td className="border-b px-4 py-3">
                            {detail.partnerId ? (<p>
                                {detail.partnerId.substring(0, 8)}...
                              </p>) : ('-')}
                          </td>
                          <td className="border-b px-4 py-3">
                            <Chip size="sm">{statusConfig.label}</Chip>
                          </td>
                          <td className="border-b px-4 py-3">
                            {detail.selectedScore ? detail.selectedScore.toFixed(2) : '-'}
                          </td>
                          <td className="border-b px-4 py-3">
                            {detail.processingTimeMs ? `${detail.processingTimeMs}ms` : '-'}
                          </td>
                          <td className="border-b px-4 py-3">
                            <p style={{ maxWidth: 200, overflow: 'hidden' }}>
                              {detail.errorMessage || '-'}
                            </p>
                          </td>
                        </tr>);
            }))}
                </tbody>
              </table>
              <div className="flex items-center justify-end gap-3 border-t p-4"><div><Select aria-label="페이지당 행 수" value={rowsPerPage} onChange={(key) => {
                const value = String(key ?? "");
                setRowsPerPage(parseInt(value, 10));
                setPage(0);
            }} className="min-w-[120px]"><Label>페이지당 행 수</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={10} textValue={"10"}>10</ListBox.Item><ListBox.Item id={20} textValue={"20"}>20</ListBox.Item><ListBox.Item id={50} textValue={"50"}>50</ListBox.Item><ListBox.Item id={100} textValue={"100"}>100</ListBox.Item></ListBox></Select.Popover></Select></div><Button variant="secondary" isDisabled={page <= 0} onPress={() => ((_, newPage) => setPage(newPage))(null, page - 1)}>이전</Button><span>{page + 1} 페이지 / {filteredDetails.length}개</span><Button variant="secondary" isDisabled={(page + 1) * rowsPerPage >= filteredDetails.length} onPress={() => ((_, newPage) => setPage(newPage))(null, page + 1)}>다음</Button></div>
            </div>
          </>)}
      </Modal.Body>
    </Modal.Dialog></Modal.Container></Modal.Backdrop>);
}
