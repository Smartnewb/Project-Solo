'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import AdminService from '@/app/services/admin';
import BannerCard from './components/BannerCard';
import BannerFormDialog from './components/BannerFormDialog';
import type { Banner, BannerPosition, CreateBannerRequest, UpdateBannerRequest } from '@/types/admin';

type TabValue = 'all' | BannerPosition;

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState<TabValue>('all');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBannerId, setDeleteBannerId] = useState<string | null>(null);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError('');
      const position = tabValue === 'all' ? undefined : tabValue;
      const data = await AdminService.banners.getList(position);
      setBanners(data.sort((a, b) => a.order - b.order));
    } catch (err: any) {
      setError(err.message || '배너 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [tabValue]);

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

    setBanners(updatedItems);

    try {
      await AdminService.banners.updateOrder({
        banners: updatedItems.map((item) => ({
          id: item.id,
          order: item.order,
        })),
      });
    } catch (err) {
      console.error('순서 변경 실패:', err);
      fetchBanners();
      alert('순서 변경에 실패했습니다.');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await AdminService.banners.update(id, { isActive });
      setBanners((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive } : b))
      );
    } catch (err) {
      console.error('활성화 상태 변경 실패:', err);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditBanner(banner);
    setFormDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteBannerId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteBannerId) return;

    try {
      await AdminService.banners.delete(deleteBannerId);
      setBanners((prev) => prev.filter((b) => b.id !== deleteBannerId));
      setDeleteDialogOpen(false);
      setDeleteBannerId(null);
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제에 실패했습니다.');
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
      await AdminService.banners.update(editBanner.id, updateData);
    } else {
      if (!imageFile) throw new Error('이미지가 필요합니다.');
      await AdminService.banners.create(imageFile, data);
    }
    fetchBanners();
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
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
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

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>배너 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            이 배너를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
