'use client';
import { Button, Spinner, Tabs } from '@heroui/react';
import { Plus as AddIcon } from 'lucide-react';
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, } from '@hello-pangea/dnd';
import BannerCard from './components/BannerCard';
import BannerFormDialog from './components/BannerFormDialog';
import type { Banner, BannerPosition, CreateBannerRequest, UpdateBannerRequest } from '@/types/admin';
import { useBannerList, useCreateBanner, useUpdateBanner, useDeleteBanner, useUpdateBannerOrder, } from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { useQueryClient } from '@tanstack/react-query';
import { contentKeys } from '@/app/admin/hooks/use-content';
type TabValue = 'all' | BannerPosition;
function BannersPageContent() {
    const toast = useToast();
    const confirmAction = useConfirm();
    const queryClient = useQueryClient();
    const [tabValue, setTabValue] = useState<TabValue>('all');
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [editBanner, setEditBanner] = useState<Banner | null>(null);
    const position = tabValue === 'all' ? undefined : tabValue;
    const { data: bannersRaw = [], isLoading, error } = useBannerList(position);
    const banners = [...bannersRaw].sort((a, b) => a.order - b.order);
    const createBanner = useCreateBanner();
    const updateBanner = useUpdateBanner();
    const deleteBanner = useDeleteBanner();
    const updateBannerOrder = useUpdateBannerOrder();
    const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
        setTabValue(newValue);
    };
    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination)
            return;
        if (result.source.index === result.destination.index)
            return;
        const items = Array.from(banners);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        const updatedItems = items.map((item, index) => ({
            ...item,
            order: index,
        }));
        // Optimistically update the cache
        queryClient.setQueryData(contentKeys.bannerList(position), updatedItems);
        try {
            await updateBannerOrder.mutateAsync({
                banners: updatedItems.map((item) => ({
                    id: item.id,
                    order: item.order,
                })),
            });
        }
        catch {
            queryClient.invalidateQueries({ queryKey: contentKeys.bannerList(position) });
            toast.error('순서 변경에 실패했습니다.');
        }
    };
    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await updateBanner.mutateAsync({ id, data: { isActive } });
        }
        catch {
            toast.error('상태 변경에 실패했습니다.');
        }
    };
    const handleEdit = (banner: Banner) => {
        setEditBanner(banner);
        setFormDialogOpen(true);
    };
    const handleDelete = async (id: string) => {
        const ok = await confirmAction({
            title: '배너 삭제',
            message: '이 배너를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
        });
        if (!ok)
            return;
        try {
            await deleteBanner.mutateAsync(id);
        }
        catch {
            toast.error('삭제에 실패했습니다.');
        }
    };
    const handleFormSubmit = async (imageFile: File | null, data: CreateBannerRequest) => {
        if (editBanner) {
            const updateData: UpdateBannerRequest = {
                actionUrl: data.actionUrl,
                startDate: data.startDate || null,
                endDate: data.endDate || null,
            };
            await updateBanner.mutateAsync({ id: editBanner.id, data: updateData });
        }
        else {
            if (!imageFile)
                throw new Error('이미지가 필요합니다.');
            await createBanner.mutateAsync({ imageFile, data });
        }
    };
    const handleFormClose = () => {
        setFormDialogOpen(false);
        setEditBanner(null);
    };
    const handleAddClick = () => {
        setEditBanner(null);
        setFormDialogOpen(true);
    };
    return (<div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="text-2xl font-bold">
          배너 관리
        </h1>
        <Button onPress={handleAddClick} variant="primary">{<AddIcon></AddIcon>}
          배너 등록
        </Button>
      </div>

      <Tabs style={{ marginBottom: 24 }} selectedKey={tabValue} onSelectionChange={key => handleTabChange({} as never, key as never)}><Tabs.List aria-label="관리 항목">
        <Tabs.Tab id={"all"}>{"전체"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
        <Tabs.Tab id={"home"}>{"홈"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
        <Tabs.Tab id={"moment"}>{"모먼트"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
      </Tabs.List></Tabs>

      {error && (<p style={{ marginBottom: 16 }}>
          {(error as any).message || '배너 목록을 불러오는데 실패했습니다.'}
        </p>)}

      {isLoading ? (<div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 32 }}>
          <Spinner size="sm"></Spinner>
        </div>) : banners.length === 0 ? (<div style={{ textAlign: 'center', paddingBlock: 32 }}>
          <p>등록된 배너가 없습니다.</p>
        </div>) : (<DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="banners">
            {(provided) => (<div ref={provided.innerRef} {...provided.droppableProps}>
                {banners.map((banner, index) => (<Draggable key={banner.id} draggableId={banner.id} index={index}>
                    {(provided, snapshot) => (<div ref={provided.innerRef} {...provided.draggableProps}>
                        <BannerCard banner={banner} onToggleActive={handleToggleActive} onEdit={handleEdit} onDelete={handleDelete} isDragging={snapshot.isDragging} dragHandleProps={provided.dragHandleProps}></BannerCard>
                      </div>)}
                  </Draggable>))}
                {provided.placeholder}
              </div>)}
          </Droppable>
        </DragDropContext>)}

      <BannerFormDialog open={formDialogOpen} onClose={handleFormClose} onSubmit={handleFormSubmit} editBanner={editBanner}></BannerFormDialog>
    </div>);
}
export default function BannersV2() {
    return <BannersPageContent></BannersPageContent>;
}
