'use client';
import { Button } from '@heroui/react';
import { Plus as AddIcon, Upload as UploadIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { useStyleReferenceList, useCreateStyleReference, useBulkCreateStyleReference, useDeactivateStyleReference, useReactivateStyleReference, } from '@/app/admin/hooks';
import type { CreateStyleReferenceRequest, BulkCreateResult } from '@/app/services/admin';
import { StyleReferenceStats } from './components/StyleReferenceStats';
import { StyleReferenceFilters } from './components/StyleReferenceFilters';
import type { Filters } from './components/StyleReferenceFilters';
import { StyleReferenceGrid } from './components/StyleReferenceGrid';
import { StyleReferenceUploadDialog } from './components/StyleReferenceUploadDialog';
import { StyleReferenceBulkDialog } from './components/StyleReferenceBulkDialog';
const PAGE_SIZE = 30;
const DEFAULT_FILTERS: Filters = {
    gender: 'ALL',
    category: 'ALL',
    status: 'ALL',
};
export default function StyleReferenceV2() {
    const toast = useToast();
    const confirmAction = useConfirm();
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
    const [page, setPage] = useState(1);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [loadingId, setLoadingId] = useState<string | undefined>();
    // filters → API params 변환 (ALL 값은 전달 안 함)
    const listParams = {
        page,
        pageSize: PAGE_SIZE,
        ...(filters.gender !== 'ALL' && { gender: filters.gender }),
        ...(filters.category !== 'ALL' && { category: filters.category }),
    };
    const { data, isLoading, error } = useStyleReferenceList(listParams);
    const createMutation = useCreateStyleReference();
    const bulkMutation = useBulkCreateStyleReference();
    const deactivateMutation = useDeactivateStyleReference();
    const reactivateMutation = useReactivateStyleReference();
    // status 필터는 클라이언트 사이드 (API에 status 파라미터 없음)
    const filteredItems = (data?.items ?? []).filter((item) => {
        if (filters.status === 'ACTIVE')
            return item.isActive;
        if (filters.status === 'INACTIVE')
            return !item.isActive;
        return true;
    });
    const handleFiltersChange = (next: Filters) => {
        setFilters(next);
        setPage(1);
    };
    const handleDeactivate = async (id: string) => {
        const ok = await confirmAction({
            title: '이미지 비활성화',
            message: '이 이미지를 비활성화하시겠습니까? 유저에게 보이지 않게 됩니다. 나중에 재활성화할 수 있습니다.',
        });
        if (!ok)
            return;
        setLoadingId(id);
        try {
            await deactivateMutation.mutateAsync(id);
            toast.success('비활성화되었습니다.');
        }
        catch {
            toast.error('비활성화에 실패했습니다.');
        }
        finally {
            setLoadingId(undefined);
        }
    };
    const handleReactivate = async (id: string) => {
        setLoadingId(id);
        try {
            await reactivateMutation.mutateAsync(id);
            toast.success('재활성화되었습니다.');
        }
        catch {
            toast.error('재활성화에 실패했습니다.');
        }
        finally {
            setLoadingId(undefined);
        }
    };
    const handleCreate = async (formData: CreateStyleReferenceRequest) => {
        await createMutation.mutateAsync(formData);
        toast.success('이미지가 등록되었습니다.');
    };
    const handleBulkCreate = async (items: CreateStyleReferenceRequest[]): Promise<BulkCreateResult> => {
        const result = await bulkMutation.mutateAsync(items);
        if (result.created > 0)
            toast.success(`${result.created}개 등록 완료`);
        return result;
    };
    const is403 = error &&
        (error as any)?.response?.status === 403;
    return (<div>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="text-2xl font-bold">
          V4 스타일 레퍼런스 관리
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onPress={() => setBulkOpen(true)} variant="secondary">{<UploadIcon></UploadIcon>}
            일괄 등록
          </Button>
          <Button onPress={() => setUploadOpen(true)} variant="primary">{<AddIcon></AddIcon>}
            이미지 등록
          </Button>
        </div>
      </div>

      {/* Feature Flag 403 안내 */}
      {is403 && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 24 }}>
          V4 매칭 기능이 비활성 상태입니다. Feature Flags 메뉴에서{' '}
          <strong>V4_MATCHING_ENABLED</strong>를 활성화해주세요.
        </aside>)}

      {/* 통계 */}
      <StyleReferenceStats></StyleReferenceStats>

      {/* 필터 */}
      <StyleReferenceFilters filters={filters} onChange={handleFiltersChange}></StyleReferenceFilters>

      {/* 그리드
                              status 필터(ACTIVE/INACTIVE) 적용 시 페이지 내 클라이언트 필터이므로
                              pagination total을 서버 total 대신 filteredItems.length로 교체해
                              잘못된 페이지 수 노출을 막는다. */}
      <StyleReferenceGrid items={filteredItems} total={filters.status !== 'ALL' ? filteredItems.length : (data?.total ?? 0)} page={page} pageSize={PAGE_SIZE} isLoading={isLoading} loadingId={loadingId} onPageChange={setPage} onDeactivate={handleDeactivate} onReactivate={handleReactivate}></StyleReferenceGrid>

      {/* 다이얼로그 */}
      <StyleReferenceUploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} onSubmit={handleCreate} isLoading={createMutation.isPending}></StyleReferenceUploadDialog>
      <StyleReferenceBulkDialog open={bulkOpen} onClose={() => setBulkOpen(false)} onSubmit={handleBulkCreate} isLoading={bulkMutation.isPending}></StyleReferenceBulkDialog>
    </div>);
}
