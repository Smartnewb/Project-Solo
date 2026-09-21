'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import BannerCard from './components/BannerCard';
import BannerFormDialog from './components/BannerFormDialog';
import type { Banner, BannerPosition, CreateBannerRequest, UpdateBannerRequest } from '@/types/admin';
import {
  useBannerList,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
  useUpdateBannerOrder,
} from '@/app/admin/hooks';
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
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

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
    } catch {
      queryClient.invalidateQueries({ queryKey: contentKeys.bannerList(position) });
      toast.error('순서 변경에 실패했습니다.');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateBanner.mutateAsync({ id, data: { isActive } });
    } catch {
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
    if (!ok) return;

    try {
      await deleteBanner.mutateAsync(id);
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const handleFormSubmit = async (
    imageFile: File | null,
    data: CreateBannerRequest
  ) => {
    if (editBanner) {
      const updateData: UpdateBannerRequest = {
        actionUrl: data.actionUrl,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
      };
      await updateBanner.mutateAsync({ id: editBanner.id, data: updateData });
    } else {
      if (!imageFile) throw new Error('이미지가 필요합니다.');
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

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          배너 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
        >
          배너 등록
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="전체" value="all" />
        <Tab label="홈" value="home" />
        <Tab label="모먼트" value="moment" />
      </Tabs>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {(error as any).message || '배너 목록을 불러오는데 실패했습니다.'}
        </Typography>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : banners.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">등록된 배너가 없습니다.</Typography>
        </Box>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="banners">
            {(provided) => (
              <Box ref={provided.innerRef} {...provided.droppableProps}>
                {banners.map((banner, index) => (
                  <Draggable
                    key={banner.id}
                    draggableId={banner.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <BannerCard
                          banner={banner}
                          onToggleActive={handleToggleActive}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          isDragging={snapshot.isDragging}
                          dragHandleProps={provided.dragHandleProps}
                        />
                      </Box>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <BannerFormDialog
        open={formDialogOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        editBanner={editBanner}
      />
    </Box>
  );
}

export default function BannersV2() {
  return <BannersPageContent />;
}
