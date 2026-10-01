'use client';
import { Label, Button, Spinner, Chip, Select, ListBox } from '@heroui/react';
import { Pencil as EditIcon, Trash2 as DeleteIcon, Send as SendIcon, ExternalLink as OpenInNewIcon, Archive as ArchiveIcon, Megaphone as CampaignIcon } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNoticeList, useDeleteNotice, useArchiveNotice, useUrlState, } from '@/app/admin/hooks';
import { CONTENT_URL_KEYS, useDebouncedUrlSearch, } from '@/app/admin/hooks/use-url-state';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { getApiErrorMessage } from '@/app/utils/errors';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { StatusBadge } from './StatusBadge';
import { ContentFilters } from './ContentFilters';
import { UrgentNoticeBox } from './UrgentNoticeBox';
import { PublishDialog } from './PublishDialog';
import { PushResendDialog } from './PushResendDialog';
import { sanitizeUrl } from '@/shared/lib/safe-url';
function formatExpires(expiresAt?: string | null) {
    if (!expiresAt)
        return '제한없음';
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff < 0)
        return '만료됨';
    const days = Math.ceil(diff / 86400000);
    return `D-${days}`;
}
export function NoticeTable() {
    const router = useRouter();
    const toast = useToast();
    const confirmAction = useConfirm();
    const { get, getNumber, setMany } = useUrlState();
    const status = get(CONTENT_URL_KEYS.status);
    const search = get(CONTENT_URL_KEYS.search);
    const page = getNumber(CONTENT_URL_KEYS.page, 0);
    const rowsPerPage = getNumber(CONTENT_URL_KEYS.rowsPerPage, 10);
    const [searchInput, setSearchInput] = useDebouncedUrlSearch(search, setMany);
    const [publishItem, setPublishItem] = useState<{
        id: string;
        title: string;
    } | null>(null);
    const [resendItem, setResendItem] = useState<{
        id: string;
        title: string;
        pushTitle?: string | null;
        pushMessage?: string | null;
    } | null>(null);
    const { data, isLoading } = useNoticeList({
        page: page + 1,
        limit: rowsPerPage,
        ...(status ? { status } : {}),
        ...(search ? { search } : {}),
    });
    const deleteNotice = useDeleteNotice();
    const archiveNotice = useArchiveNotice();
    const items = data?.items || [];
    const handleEdit = (id: string) => {
        router.push(`/admin/content/notice/edit/${id}`);
    };
    const handleDelete = async (id: string) => {
        const ok = await confirmAction({
            title: '공지 삭제',
            message: '이 공지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
        });
        if (!ok)
            return;
        try {
            await deleteNotice.mutateAsync(id);
            toast.success('공지가 삭제되었습니다.');
        }
        catch (err: unknown) {
            toast.error(getApiErrorMessage(err, '삭제에 실패했습니다.'));
        }
    };
    const handleArchive = async (id: string) => {
        const ok = await confirmAction({
            title: '공지 보관',
            message: '이 공지를 보관 처리하시겠습니까? 사용자에게 더 이상 노출되지 않습니다.',
        });
        if (!ok)
            return;
        try {
            await archiveNotice.mutateAsync(id);
            toast.success('공지가 보관되었습니다.');
        }
        catch (err: unknown) {
            toast.error(getApiErrorMessage(err, '보관에 실패했습니다.'));
        }
    };
    if (isLoading && items.length === 0) {
        return (<div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spinner size="sm"></Spinner>
      </div>);
    }
    return (<div>
      <UrgentNoticeBox></UrgentNoticeBox>

      <ContentFilters category="" status={status} search={searchInput} onChange={(next) => {
            if (next.search !== undefined) {
                setSearchInput(next.search);
                return;
            }
            const update: Record<string, string | null> = {
                [CONTENT_URL_KEYS.page]: '0',
            };
            if (next.status !== undefined)
                update[CONTENT_URL_KEYS.status] = next.status || null;
            setMany(update);
        }} hideCategory></ContentFilters>

      <div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr className="border-b">
              <th scope="col" className="border-b px-4 py-3">제목</th>
              <th scope="col" className="border-b px-4 py-3">우선순위</th>
              <th scope="col" className="border-b px-4 py-3">만료</th>
              <th scope="col" className="border-b px-4 py-3">링크</th>
              <th scope="col" className="border-b px-4 py-3">상태</th>
              <th scope="col" className="border-b px-4 py-3">작업</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (<tr className="border-b">
                <td colSpan={6} className="border-b px-4 py-3">
                  <p style={{ paddingBlock: 32 }}>
                    공지가 없습니다.
                  </p>
                </td>
              </tr>) : (items.map((item) => (<tr key={item.id} className="border-b">
                  <td className="border-b px-4 py-3">
                    <p>
                      {item.title}
                    </p>
                    {item.subtitle && (<p>
                        {item.subtitle}
                      </p>)}
                  </td>
                  <td className="border-b px-4 py-3">
                    <Chip>{item.priority === 'high' ? '긴급' : '일반'}</Chip>
                  </td>
                  <td className="border-b px-4 py-3">{formatExpires(item.expiresAt)}</td>
                  <td className="border-b px-4 py-3">
                    {(item.url ?? item.linkUrl) ? (<a href={sanitizeUrl(item.url ?? item.linkUrl) ?? undefined} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        이동 <OpenInNewIcon></OpenInNewIcon>
                      </a>) : ('-')}
                  </td>
                  <td className="border-b px-4 py-3">
                    <StatusBadge status={item.status} expiresAt={item.expiresAt}></StatusBadge>
                  </td>
                  <td className="border-b px-4 py-3">
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <Button onPress={() => handleEdit(item.id)} variant="tertiary" isIconOnly={true} aria-label={"수정"}>
                        <EditIcon></EditIcon>
                      </Button>
                      {item.status !== 'published' && (<Button onPress={() => setPublishItem({ id: item.id, title: item.title })} variant="tertiary" isIconOnly={true} aria-label={"발행"}>
                          <SendIcon></SendIcon>
                        </Button>)}
                      {item.status === 'published' && (<>
                          <Button onPress={() => setResendItem({
                    id: item.id,
                    title: item.title,
                    pushTitle: item.pushTitle,
                    pushMessage: item.pushMessage,
                })} variant="tertiary" isIconOnly={true} aria-label={"푸시 재발송"}>
                            <CampaignIcon></CampaignIcon>
                          </Button>
                          <Button onPress={() => handleArchive(item.id)} isDisabled={archiveNotice.isPending} variant="tertiary" isIconOnly={true} aria-label={"보관"}>
                            <ArchiveIcon></ArchiveIcon>
                          </Button>
                        </>)}
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
        }} className="min-w-[120px]"><Label>페이지당 행 수</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={5} textValue={"5"}>5</ListBox.Item><ListBox.Item id={10} textValue={"10"}>10</ListBox.Item><ListBox.Item id={25} textValue={"25"}>25</ListBox.Item><ListBox.Item id={50} textValue={"50"}>50</ListBox.Item></ListBox></Select.Popover></Select></div><Button variant="secondary" isDisabled={page <= 0} onPress={() => ((_, newPage) => setMany({ p: newPage }))(null, page - 1)}>이전</Button><span>{page + 1} 페이지 / {data?.meta?.totalItems || 0}개</span><Button variant="secondary" isDisabled={(page + 1) * rowsPerPage >= (data?.meta?.totalItems || 0)} onPress={() => ((_, newPage) => setMany({ p: newPage }))(null, page + 1)}>다음</Button></div>
      </div>

      <PublishDialog open={!!publishItem} onClose={() => setPublishItem(null)} type="notice" item={publishItem}></PublishDialog>

      <PushResendDialog open={!!resendItem} onClose={() => setResendItem(null)} item={resendItem}></PushResendDialog>
    </div>);
}
