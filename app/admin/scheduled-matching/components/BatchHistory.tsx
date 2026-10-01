'use client';
import { Label, Button, Spinner, Chip, Select, ListBox } from '@heroui/react';
import { RefreshCw as RefreshIcon, Eye as VisibilityIcon } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { scheduledMatchingService } from '../service';
import type { Country, BatchHistory as BatchHistoryType, BatchStatus } from '../types';
import { formatDateTime, formatDuration } from '../utils';
import BatchDetailModal from './BatchDetailModal';
const STATUS_CONFIG: Record<BatchStatus, {
    label: string;
    color: 'success' | 'info' | 'error' | 'warning';
}> = {
    completed: { label: '완료', color: 'success' },
    running: { label: '실행 중', color: 'info' },
    failed: { label: '실패', color: 'error' },
    cancelled: { label: '취소됨', color: 'warning' },
};
export default function BatchHistory() {
    const [countryFilter, setCountryFilter] = useState<'ALL' | Country>('ALL');
    const [batches, setBatches] = useState<BatchHistoryType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
    const fetchBatches = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            if (countryFilter === 'ALL') {
                const [krBatches, jpBatches] = await Promise.all([
                    scheduledMatchingService.getBatchesByCountry('KR', 50, 0),
                    scheduledMatchingService.getBatchesByCountry('JP', 50, 0),
                ]);
                const allBatches = [...krBatches, ...jpBatches].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
                setBatches(allBatches);
            }
            else {
                const data = await scheduledMatchingService.getBatchesByCountry(countryFilter, 50, 0);
                setBatches(data);
            }
        }
        catch {
            setError('배치 히스토리를 불러오는데 실패했습니다.');
        }
        finally {
            setLoading(false);
        }
    }, [countryFilter]);
    useEffect(() => {
        fetchBatches();
    }, [fetchBatches]);
    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    const getSuccessRate = (batch: BatchHistoryType): string => {
        if (batch.totalUsers === 0)
            return '-';
        return `${((batch.successCount / batch.totalUsers) * 100).toFixed(1)}%`;
    };
    const paginatedBatches = batches.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    return (<div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="text-lg font-semibold">배치 히스토리</h2>
        <span title={"새로고침"}>
          <Button onPress={fetchBatches} aria-label="배치 히스토리 새로고침" variant="tertiary" isIconOnly={true}>
            <RefreshIcon></RefreshIcon>
          </Button>
        </span>
      </div>

      {error && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
          {error}
        </aside>)}

      <section style={{ padding: 16, marginBottom: 16 }} className="rounded-xl border bg-white p-4">
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ minWidth: 150 }}>
            <label>국가</label>
            <Select value={countryFilter} aria-label={"국가"} onChange={(key) => {
            const value = String(key ?? "");
            setCountryFilter(value as 'ALL' | Country);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
              <ListBox.Item id={"ALL"} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
              <ListBox.Item id={"KR"} textValue={"\uD83C\uDDF0\uD83C\uDDF7 \uD55C\uAD6D"}>🇰🇷 한국</ListBox.Item>
              <ListBox.Item id={"JP"} textValue={"\uD83C\uDDEF\uD83C\uDDF5 \uC77C\uBCF8"}>🇯🇵 일본</ListBox.Item>
            </ListBox></Select.Popover></Select>
          </div>
        </div>
      </section>

      {loading ? (<div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 32 }}>
          <Spinner size="sm"></Spinner>
        </div>) : (<div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr style={{ backgroundColor: "#f3f4f6" }} className="border-b">
                <th scope="col" className="border-b px-4 py-3">배치 ID</th>
                <th scope="col" className="border-b px-4 py-3">국가</th>
                <th scope="col" className="border-b px-4 py-3">상태</th>
                <th scope="col" className="border-b px-4 py-3">시작 시간</th>
                <th scope="col" className="border-b px-4 py-3">소요 시간</th>
                <th scope="col" className="border-b px-4 py-3">전체</th>
                <th scope="col" className="border-b px-4 py-3">성공</th>
                <th scope="col" className="border-b px-4 py-3">실패</th>
                <th scope="col" className="border-b px-4 py-3">성공률</th>
                <th scope="col" className="border-b px-4 py-3">상세</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBatches.length === 0 ? (<tr className="border-b">
                  <td colSpan={10} style={{ paddingBlock: 32 }} className="border-b px-4 py-3">
                    <p>배치 히스토리가 없습니다.</p>
                  </td>
                </tr>) : (paginatedBatches.map((batch) => {
                const statusConfig = STATUS_CONFIG[batch.status];
                const countryFlag = batch.country === 'KR' ? '🇰🇷' : '🇯🇵';
                const successRate = parseFloat(getSuccessRate(batch));
                return (<tr key={batch.id} className="border-b">
                      <td className="border-b px-4 py-3">
                        <p>
                          {batch.id.substring(0, 8)}...
                        </p>
                      </td>
                      <td className="border-b px-4 py-3">{countryFlag}</td>
                      <td className="border-b px-4 py-3">
                        <Chip size="sm">{statusConfig.label}</Chip>
                      </td>
                      <td className="border-b px-4 py-3">{formatDateTime(batch.startedAt)}</td>
                      <td className="border-b px-4 py-3">{formatDuration(batch.startedAt, batch.completedAt)}</td>
                      <td className="border-b px-4 py-3">{batch.totalUsers}</td>
                      <td style={{ color: "#15803d" }} className="border-b px-4 py-3">
                        {batch.successCount}
                      </td>
                      <td style={{ color: "#dc2626" }} className="border-b px-4 py-3">
                        {batch.failureCount}
                      </td>
                      <td className="border-b px-4 py-3">
                        <Chip size="sm">{getSuccessRate(batch)}</Chip>
                      </td>
                      <td className="border-b px-4 py-3">
                        <span title={"상세 보기"}>
                          <Button onPress={() => setSelectedBatchId(batch.id)} aria-label={`${batch.country} 배치 상세 보기`} variant="tertiary" isIconOnly={true}>
                            <VisibilityIcon></VisibilityIcon>
                          </Button>
                        </span>
                      </td>
                    </tr>);
            }))}
            </tbody>
          </table>
          <div className="flex items-center justify-end gap-3 border-t p-4"><div><Select aria-label="페이지당 행 수" value={rowsPerPage} onChange={(key) => {
                const value = String(key ?? "");
                (handleChangeRowsPerPage)({ target: { value: value }, currentTarget: { value: value } } as never);
            }} className="min-w-[120px]"><Label>페이지당 행 수</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={5} textValue={"5"}>5</ListBox.Item><ListBox.Item id={10} textValue={"10"}>10</ListBox.Item><ListBox.Item id={25} textValue={"25"}>25</ListBox.Item><ListBox.Item id={50} textValue={"50"}>50</ListBox.Item></ListBox></Select.Popover></Select></div><Button variant="secondary" isDisabled={page <= 0} onPress={() => (handleChangePage)(null, page - 1)}>이전</Button><span>{page + 1} 페이지 / {batches.length}개</span><Button variant="secondary" isDisabled={(page + 1) * rowsPerPage >= batches.length} onPress={() => (handleChangePage)(null, page + 1)}>다음</Button></div>
        </div>)}

      <BatchDetailModal batchId={selectedBatchId} open={!!selectedBatchId} onClose={() => setSelectedBatchId(null)}></BatchDetailModal>
    </div>);
}
