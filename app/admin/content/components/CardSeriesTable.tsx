'use client';
import { Label, Button, Spinner, Select, ListBox } from '@heroui/react';
import { Pencil as EditIcon, Trash2 as DeleteIcon, Send as SendIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminCardNewsItem, ContentStatus } from '@/types/admin';
import { useCardNewsList, useDeleteCardNews, useUrlState, } from '@/app/admin/hooks';
import { CONTENT_URL_KEYS, useDebouncedUrlSearch, } from '@/app/admin/hooks/use-url-state';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { formatDateTimeKR } from '@/app/utils/formatters';
import { getApiErrorMessage } from '@/app/utils/errors';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { ContentFilters } from './ContentFilters';
import { PublishDialog } from './PublishDialog';
import { ExternalPageButton } from './seo/ExternalPageButton';
import { LEGACY_CATEGORY_SENTINEL } from '../constants';
function deriveStatus(item: AdminCardNewsItem): ContentStatus {
    return item.publishedAt ? 'published' : 'draft';
}
export function CardSeriesTable() {
    const router = useRouter();
    const toast = useToast();
    const confirmAction = useConfirm();
    const { get, getNumber, setMany } = useUrlState();
    const category = get(CONTENT_URL_KEYS.category);
    const status = get(CONTENT_URL_KEYS.status);
    const search = get(CONTENT_URL_KEYS.search);
    const page = getNumber(CONTENT_URL_KEYS.page, 0);
    const rowsPerPage = getNumber(CONTENT_URL_KEYS.rowsPerPage, 10);
    const [searchInput, setSearchInput] = useDebouncedUrlSearch(search, setMany);
    const [publishItem, setPublishItem] = useState<{
        id: string;
        title: string;
    } | null>(null);
    const categoryParam = category && category !== LEGACY_CATEGORY_SENTINEL ? category : undefined;
    const { data, isLoading } = useCardNewsList({
        page: page + 1,
        limit: rowsPerPage,
        track: 'cards',
        ...(categoryParam ? { categoryCode: categoryParam } : {}),
    });
    const deleteCardNews = useDeleteCardNews();
    const items = data?.items || [];
    const filtered = useMemo(() => {
        if (category === LEGACY_CATEGORY_SENTINEL)
            return [];
        return items.filter((it) => {
            if (search && !it.title.toLowerCase().includes(search.toLowerCase()))
                return false;
            if (status) {
                const s = deriveStatus(it);
                if (s !== status)
                    return false;
            }
            return true;
        });
    }, [items, category, status, search]);
    const handleEdit = (id: string) => {
        router.push(`/admin/content/card-series/edit/${id}`);
    };
    const handleDelete = async (id: string) => {
        const ok = await confirmAction({
            title: '카드시리즈 삭제',
            message: '이 카드시리즈를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
        });
        if (!ok)
            return;
        try {
            await deleteCardNews.mutateAsync(id);
            toast.success('카드시리즈가 삭제되었습니다.');
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
      <ContentFilters category={category} status={status} search={searchInput} onChange={(next) => {
            if (next.search !== undefined) {
                setSearchInput(next.search);
                return;
            }
            const update: Record<string, string | null> = {
                [CONTENT_URL_KEYS.page]: '0',
            };
            if (next.category !== undefined)
                update[CONTENT_URL_KEYS.category] = next.category || null;
            if (next.status !== undefined)
                update[CONTENT_URL_KEYS.status] = next.status || null;
            setMany(update);
        }}></ContentFilters>

      <div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr className="border-b">
              <th scope="col" className="border-b px-4 py-3">제목</th>
              <th scope="col" className="border-b px-4 py-3">카테고리</th>
              <th scope="col" className="border-b px-4 py-3">상태</th>
              <th scope="col" className="border-b px-4 py-3">조회수</th>
              <th scope="col" className="border-b px-4 py-3">생성일</th>
              <th scope="col" className="border-b px-4 py-3">작업</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (<tr className="border-b">
                <td colSpan={6} className="border-b px-4 py-3">
                  <p style={{ paddingBlock: 32 }}>
                    카드시리즈가 없습니다.
                  </p>
                </td>
              </tr>) : (filtered.map((item) => {
            const derived = deriveStatus(item);
            return (<tr key={item.id} className="border-b">
                    <td className="border-b px-4 py-3">
                      <p>
                        {item.title}
                      </p>
                      {item.description && (<p>
                          {item.description}
                        </p>)}
                    </td>
                    <td className="border-b px-4 py-3">
                      <CategoryBadge code={item.category?.code || 'unknown'}></CategoryBadge>
                    </td>
                    <td className="border-b px-4 py-3">
                      <StatusBadge status={derived}></StatusBadge>
                    </td>
                    <td className="border-b px-4 py-3">{item.readCount}</td>
                    <td className="border-b px-4 py-3">{formatDateTimeKR(item.createdAt)}</td>
                    <td className="border-b px-4 py-3">
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <Button onPress={() => handleEdit(item.id)} variant="tertiary" isIconOnly={true} aria-label={"수정"}>
                          <EditIcon></EditIcon>
                        </Button>
                        {derived !== 'published' && (<Button onPress={() => setPublishItem({ id: item.id, title: item.title })} variant="tertiary" isIconOnly={true} aria-label={"발행"}>
                            <SendIcon></SendIcon>
                          </Button>)}
                        {derived === 'published' && (<ExternalPageButton kind="card-news" slugOrId={item.id}></ExternalPageButton>)}
                        <Button onPress={() => handleDelete(item.id)} variant="tertiary" isIconOnly={true} aria-label={"삭제"}>
                          <DeleteIcon></DeleteIcon>
                        </Button>
                      </div>
                    </td>
                  </tr>);
        }))}
          </tbody>
        </table>
        <div className="flex items-center justify-end gap-3 border-t p-4"><div><Select aria-label="페이지당 행 수" value={rowsPerPage} onChange={(key) => {
            const value = String(key ?? "");
            setMany({ rpp: parseInt(value, 10), p: 0 });
        }} className="min-w-[120px]"><Label>페이지당 행 수</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={5} textValue={"5"}>5</ListBox.Item><ListBox.Item id={10} textValue={"10"}>10</ListBox.Item><ListBox.Item id={25} textValue={"25"}>25</ListBox.Item><ListBox.Item id={50} textValue={"50"}>50</ListBox.Item></ListBox></Select.Popover></Select></div><Button variant="secondary" isDisabled={page <= 0} onPress={() => ((_, newPage) => setMany({ p: newPage }))(null, page - 1)}>이전</Button><span>{page + 1} 페이지 / {data?.total || 0}개</span><Button variant="secondary" isDisabled={(page + 1) * rowsPerPage >= (data?.total || 0)} onPress={() => ((_, newPage) => setMany({ p: newPage }))(null, page + 1)}>다음</Button></div>
      </div>

      <PublishDialog open={!!publishItem} onClose={() => setPublishItem(null)} type="card-series" item={publishItem}></PublishDialog>
    </div>);
}
