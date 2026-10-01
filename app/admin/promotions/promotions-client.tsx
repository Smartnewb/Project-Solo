'use client';
import { Button, Spinner } from '@heroui/react';
import { Plus as AddIcon } from 'lucide-react';
import { useState } from 'react';
import { PromotionTable } from './components/PromotionTable';
import { PromotionFormDrawer } from './components/PromotionFormDrawer';
import { usePromotionList, useCreatePromotion, useUpdatePromotion, useTogglePromotionActive, useDeletePromotion, } from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import type { Promotion, CreatePromotionRequest } from '@/types/admin';
export default function PromotionsClient() {
    const toast = useToast();
    const confirmAction = useConfirm();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editPromotion, setEditPromotion] = useState<Promotion | null>(null);
    const { data: promotions = [], isLoading, error } = usePromotionList();
    const createMutation = useCreatePromotion();
    const updateMutation = useUpdatePromotion();
    const toggleMutation = useTogglePromotionActive();
    const deleteMutation = useDeletePromotion();
    const handleAdd = () => {
        setEditPromotion(null);
        setDrawerOpen(true);
    };
    const handleEdit = (p: Promotion) => {
        setEditPromotion(p);
        setDrawerOpen(true);
    };
    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await toggleMutation.mutateAsync({ id, isActive });
            toast.success(isActive ? '활성화했습니다.' : '비활성화했습니다.');
        }
        catch {
            toast.error('상태 변경에 실패했습니다.');
        }
    };
    const handleDelete = async (id: string) => {
        const ok = await confirmAction({
            title: '프로모션 삭제',
            message: '삭제된 프로모션은 목록에 유지되지만 노출되지 않습니다. 삭제하시겠습니까?',
        });
        if (!ok)
            return;
        try {
            await deleteMutation.mutateAsync(id);
            toast.success('삭제했습니다.');
        }
        catch {
            toast.error('삭제에 실패했습니다.');
        }
    };
    const handleSubmit = async (data: CreatePromotionRequest) => {
        if (editPromotion) {
            await updateMutation.mutateAsync({ id: editPromotion.id, data });
            toast.success('수정했습니다.');
        }
        else {
            await createMutation.mutateAsync(data);
            toast.success('등록했습니다.');
        }
        setDrawerOpen(false);
        setEditPromotion(null);
    };
    return (<div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="text-2xl font-bold">
          프로모션 관리
        </h1>
        <Button onPress={handleAdd} variant="primary">{<AddIcon></AddIcon>}
          프로모션 등록
        </Button>
      </div>

      {error && (<p style={{ marginBottom: 16 }}>
          목록을 불러오는데 실패했습니다.
        </p>)}

      {isLoading ? (<div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 32 }}>
          <Spinner size="sm"></Spinner>
        </div>) : (<PromotionTable promotions={promotions} onEdit={handleEdit} onDelete={handleDelete} onToggleActive={handleToggleActive}></PromotionTable>)}

      <PromotionFormDrawer open={drawerOpen} onClose={() => {
            setDrawerOpen(false);
            setEditPromotion(null);
        }} onSubmit={handleSubmit} editPromotion={editPromotion}></PromotionFormDrawer>
    </div>);
}
