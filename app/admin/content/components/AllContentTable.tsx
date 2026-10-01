'use client';
import { Button, Spinner, Chip } from '@heroui/react';
import { Pencil as EditIcon, Trash2 as DeleteIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { ContentStatus } from '@/types/admin';
import { useCardNewsList, useSometimeArticleList, useNoticeList, useDeleteCardNews, useDeleteSometimeArticle, useDeleteNotice, } from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { formatDateTimeKR } from '@/app/utils/formatters';
import { getApiErrorMessage } from '@/app/utils/errors';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import type { ContentType } from '../constants';
type UnifiedRow = {
    id: string;
    type: ContentType;
    title: string;
    categoryCode: string;
    status: ContentStatus;
    createdAt: string;
};
function mapArticleStatusToContentStatus(s: string): ContentStatus {
    if (s === 'published')
        return 'published';
    if (s === 'archived')
        return 'archived';
    return 'draft';
}
const TYPE_LABELS: Record<UnifiedRow['type'], string> = {
    'card-series': '카드시리즈',
    longform: '롱폼',
    article: '아티클',
    notice: '공지',
    video: '영상',
};
const TYPE_COLORS: Record<UnifiedRow['type'], 'primary' | 'secondary' | 'info' | 'error'> = {
    'card-series': 'primary',
    longform: 'secondary',
    article: 'info',
    notice: 'error',
    video: 'secondary',
};
const PAGE_INCREMENT = 20;
export function AllContentTable() {
    const router = useRouter();
    const toast = useToast();
    const confirmAction = useConfirm();
    const [pageSize, setPageSize] = useState(PAGE_INCREMENT);
    const { data: cardsData, isLoading: cardsLoading } = useCardNewsList(1, pageSize);
    const { data: articlesData, isLoading: articlesLoading } = useSometimeArticleList({
        page: 1,
        limit: pageSize,
    });
    const { data: noticesData, isLoading: noticesLoading } = useNoticeList({
        page: 1,
        limit: pageSize,
    });
    const deleteCardNews = useDeleteCardNews();
    const deleteArticle = useDeleteSometimeArticle();
    const deleteNotice = useDeleteNotice();
    const merged: UnifiedRow[] = useMemo(() => {
        const rows: UnifiedRow[] = [];
        (cardsData?.items || []).forEach((c) => {
            const cardType: ContentType = c.layoutMode === 'longform' ? 'longform' : 'card-series';
            rows.push({
                id: c.id,
                type: cardType,
                title: c.title,
                categoryCode: c.category?.code || 'unknown',
                status: c.publishedAt ? 'published' : 'draft',
                createdAt: c.createdAt,
            });
        });
        (articlesData?.items || []).forEach((a) => {
            rows.push({
                id: a.id,
                type: 'article',
                title: a.title,
                categoryCode: a.category as string,
                status: mapArticleStatusToContentStatus(a.status),
                createdAt: a.publishedAt || '',
            });
        });
        (noticesData?.items || []).forEach((n) => {
            rows.push({
                id: n.id,
                type: 'notice',
                title: n.title,
                categoryCode: n.categoryCode,
                status: n.status,
                createdAt: n.createdAt,
            });
        });
        return rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }, [cardsData, articlesData, noticesData]);
    const isLoading = cardsLoading || articlesLoading || noticesLoading;
    const visible = merged.slice(0, pageSize);
    const hasMore = (cardsData?.total ?? 0) > pageSize ||
        (articlesData?.meta?.totalItems ?? 0) > pageSize ||
        (noticesData?.meta?.totalItems ?? 0) > pageSize ||
        merged.length > pageSize;
    const handleEdit = (row: UnifiedRow) => {
        router.push(`/admin/content/${row.type}/edit/${row.id}`);
    };
    const handleDelete = async (row: UnifiedRow) => {
        const ok = await confirmAction({
            title: `${TYPE_LABELS[row.type]} 삭제`,
            message: '이 콘텐츠를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
        });
        if (!ok)
            return;
        try {
            if (row.type === 'card-series' || row.type === 'longform')
                await deleteCardNews.mutateAsync(row.id);
            else if (row.type === 'article')
                await deleteArticle.mutateAsync(row.id);
            else
                await deleteNotice.mutateAsync(row.id);
            toast.success('삭제되었습니다.');
        }
        catch (err: unknown) {
            toast.error(getApiErrorMessage(err, '삭제에 실패했습니다.'));
        }
    };
    if (isLoading) {
        return (<div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spinner size="sm"></Spinner>
      </div>);
    }
    return (<div>
      <div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr className="border-b">
              <th scope="col" className="border-b px-4 py-3">타입</th>
              <th scope="col" className="border-b px-4 py-3">제목</th>
              <th scope="col" className="border-b px-4 py-3">카테고리</th>
              <th scope="col" className="border-b px-4 py-3">상태</th>
              <th scope="col" className="border-b px-4 py-3">생성일</th>
              <th scope="col" className="border-b px-4 py-3">작업</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (<tr className="border-b">
                <td colSpan={6} className="border-b px-4 py-3">
                  <p style={{ paddingBlock: 32 }}>
                    콘텐츠가 없습니다.
                  </p>
                </td>
              </tr>) : (visible.map((row) => (<tr key={`${row.type}-${row.id}`} className="border-b">
                  <td className="border-b px-4 py-3">
                    <Chip>{TYPE_LABELS[row.type]}</Chip>
                  </td>
                  <td className="border-b px-4 py-3">
                    <p>
                      {row.title}
                    </p>
                  </td>
                  <td className="border-b px-4 py-3">
                    <CategoryBadge code={row.categoryCode}></CategoryBadge>
                  </td>
                  <td className="border-b px-4 py-3">
                    <StatusBadge status={row.status}></StatusBadge>
                  </td>
                  <td className="border-b px-4 py-3">
                    {row.createdAt ? formatDateTimeKR(row.createdAt) : '-'}
                  </td>
                  <td className="border-b px-4 py-3">
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <Button onPress={() => handleEdit(row)} variant="tertiary" isIconOnly={true} aria-label={"수정"}>
                        <EditIcon></EditIcon>
                      </Button>
                      <Button onPress={() => handleDelete(row)} variant="tertiary" isIconOnly={true} aria-label={"삭제"}>
                        <DeleteIcon></DeleteIcon>
                      </Button>
                    </div>
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>

      {hasMore && (<div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <Button onPress={() => setPageSize((p) => p + PAGE_INCREMENT)} variant="secondary">
            더 보기 (+{PAGE_INCREMENT})
          </Button>
        </div>)}
    </div>);
}
