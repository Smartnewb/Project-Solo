'use client';
import { Label, Button, Spinner, Select, ListBox } from '@heroui/react';
import { Pencil as EditIcon, Trash2 as DeleteIcon, Send as SendIcon, ListPlus as PlaylistAddIcon } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { VideoStatus } from '@/types/admin';
import { useVideoAdminList, useDeleteVideo, useUrlState } from '@/app/admin/hooks';
import { CONTENT_URL_KEYS } from '@/app/admin/hooks/use-url-state';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { formatDateTimeKR } from '@/app/utils/formatters';
import { getApiErrorMessage } from '@/app/utils/errors';
import { StatusBadge } from './StatusBadge';
import { PublishDialog } from './PublishDialog';
import { BulkVideoImportDialog } from './BulkVideoImportDialog';
export function VideoTable() {
    const router = useRouter();
    const toast = useToast();
    const confirmAction = useConfirm();
    const { get, getNumber, setMany } = useUrlState();
    const status = get(CONTENT_URL_KEYS.status);
    const page = getNumber(CONTENT_URL_KEYS.page, 0);
    const rowsPerPage = getNumber(CONTENT_URL_KEYS.rowsPerPage, 10);
    const [publishItem, setPublishItem] = useState<{
        id: string;
        title: string;
    } | null>(null);
    const [bulkImportOpen, setBulkImportOpen] = useState(false);
    const { data, isLoading } = useVideoAdminList({
        page: page + 1,
        limit: rowsPerPage,
        ...(status ? { status: status as VideoStatus } : {}),
    });
    const deleteVideo = useDeleteVideo();
    const items = data?.items || [];
    const handleEdit = (id: string) => {
        router.push(`/admin/content/video/edit/${id}`);
    };
    const handleDelete = async (id: string) => {
        const ok = await confirmAction({
            title: '영상 삭제',
            message: '이 영상을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
        });
        if (!ok)
            return;
        try {
            await deleteVideo.mutateAsync(id);
            toast.success('영상이 삭제되었습니다.');
        }
        catch (err: unknown) {
            toast.error(getApiErrorMessage(err, '삭제에 실패했습니다.'));
        }
    };
    if (isLoading && items.length === 0) {
        return (<div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spinner size="sm"></Spinner>
      </div>);
    }
    return (<div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 160 }}>
          <label id="video-filter-status">상태</label>
          <Select aria-label="상태" value={status} onChange={(key) => {
            const value = String(key ?? "");
            setMany({
                [CONTENT_URL_KEYS.status]: String(value) || null,
                [CONTENT_URL_KEYS.page]: '0',
            });
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
            <ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
            <ListBox.Item id={"draft"} textValue={"\uCD08\uC548"}>초안</ListBox.Item>
            <ListBox.Item id={"published"} textValue={"\uAC8C\uC2DC\uC911"}>게시중</ListBox.Item>
          </ListBox></Select.Popover></Select>
        </div>
        <div style={{ flex: 1 }}></div>
        <Button onPress={() => setBulkImportOpen(true)} variant="secondary">{<PlaylistAddIcon></PlaylistAddIcon>}
          일괄 추가
        </Button>
      </div>

      <div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr className="border-b">
              <th scope="col" className="border-b px-4 py-3">영상</th>
              <th scope="col" className="border-b px-4 py-3">채널</th>
              <th scope="col" className="border-b px-4 py-3">상태</th>
              <th scope="col" className="border-b px-4 py-3">발행일</th>
              <th scope="col" className="border-b px-4 py-3">조회/좋아요</th>
              <th scope="col" className="border-b px-4 py-3">작업</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (<tr className="border-b">
                <td colSpan={6} className="border-b px-4 py-3">
                  <p style={{ paddingBlock: 32 }}>
                    등록된 영상이 없습니다.
                  </p>
                </td>
              </tr>) : (items.map((item) => (<tr key={item.id} className="border-b">
                  <td className="border-b px-4 py-3">
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.video.thumbnailUrl} alt={item.title} width={40} height={56} style={{ borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}></img>
                      <div style={{ minWidth: 0 }}>
                        <p>
                          {item.title}
                        </p>
                        {item.displayTitle && (<p>
                            노출명: {item.displayTitle}
                          </p>)}
                      </div>
                    </div>
                  </td>
                  <td className="border-b px-4 py-3">{item.video.channelTitle || '-'}</td>
                  <td className="border-b px-4 py-3">
                    <StatusBadge status={item.status}></StatusBadge>
                  </td>
                  <td className="border-b px-4 py-3">
                    {item.publishedAt ? formatDateTimeKR(item.publishedAt) : '-'}
                  </td>
                  <td className="border-b px-4 py-3">
                    {item.readCount} / {item.likeCount}
                  </td>
                  <td className="border-b px-4 py-3">
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <Button onPress={() => handleEdit(item.id)} variant="tertiary" isIconOnly={true} aria-label={"수정"}>
                        <EditIcon></EditIcon>
                      </Button>
                      {item.status !== 'published' && (<Button onPress={() => setPublishItem({ id: item.id, title: item.title })} variant="tertiary" isIconOnly={true} aria-label={"발행"}>
                          <SendIcon></SendIcon>
                        </Button>)}
                      <Button onPress={() => handleDelete(item.id)} variant="tertiary" isIconOnly={true} aria-label={"삭제"}>
                        <DeleteIcon></DeleteIcon>
                      </Button>
                    </div>
                  </td>
                </tr>)))}
          </tbody>
        </table>
        <div className="flex items-center justify-end gap-3 border-t p-4"><div><Select aria-label="페이지당 행 수" value={rowsPerPage} onChange={(key) => {
            const value = String(key ?? "");
            setMany({ rpp: parseInt(value, 10), p: 0 });
        }} className="min-w-[120px]"><Label>페이지당 행 수</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={5} textValue={"5"}>5</ListBox.Item><ListBox.Item id={10} textValue={"10"}>10</ListBox.Item><ListBox.Item id={25} textValue={"25"}>25</ListBox.Item><ListBox.Item id={50} textValue={"50"}>50</ListBox.Item></ListBox></Select.Popover></Select></div><Button variant="secondary" isDisabled={page <= 0} onPress={() => ((_, newPage) => setMany({ p: newPage }))(null, page - 1)}>이전</Button><span>{page + 1} 페이지 / {data?.total || 0}개</span><Button variant="secondary" isDisabled={(page + 1) * rowsPerPage >= (data?.total || 0)} onPress={() => ((_, newPage) => setMany({ p: newPage }))(null, page + 1)}>다음</Button></div>
      </div>

      <PublishDialog open={!!publishItem} onClose={() => setPublishItem(null)} type="video" item={publishItem}></PublishDialog>

      <BulkVideoImportDialog open={bulkImportOpen} onClose={() => setBulkImportOpen(false)}></BulkVideoImportDialog>
    </div>);
}
