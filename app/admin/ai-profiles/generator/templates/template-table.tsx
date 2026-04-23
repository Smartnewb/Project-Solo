'use client';

import type { AiProfileTemplate } from '@/app/types/ai-profile-generator';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { formatDate } from '../_shared/format';

interface Props {
  items: AiProfileTemplate[];
  isLoading: boolean;
  onEdit: (template: AiProfileTemplate) => void;
  onArchive: (template: AiProfileTemplate) => void;
}

function truncate(value: string | null | undefined, max = 60): string {
  if (!value) return '-';
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

const SKELETON_ROWS = 5;

export function TemplateTable({ items, isLoading, onEdit, onArchive }: Props) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead>설명</TableHead>
            <TableHead className="w-16 text-right">버전</TableHead>
            <TableHead className="w-24">상태</TableHead>
            <TableHead className="w-20 text-right">사용 수</TableHead>
            <TableHead className="w-40">마지막 사용</TableHead>
            <TableHead className="w-40">수정일</TableHead>
            <TableHead className="w-48 text-right">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: SKELETON_ROWS }).map((_, idx) => (
              <TableRow key={`skeleton-${idx}`}>
                <TableCell colSpan={8}>
                  <div className="h-6 animate-pulse rounded bg-slate-100" />
                </TableCell>
              </TableRow>
            ))
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-6 text-center text-slate-400">
                템플릿이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            items.map((template) => {
              const archived = template.status === 'archived';
              return (
                <TableRow key={template.id}>
                  <TableCell className="font-medium text-slate-900">
                    {template.name}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {truncate(template.description, 80)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-600">
                    v{template.version}
                  </TableCell>
                  <TableCell>
                    <Badge variant={archived ? 'outline' : 'default'}>
                      {archived ? '아카이브' : '활성'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-slate-700">
                    {template.usageCount}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {formatDate(template.lastUsedAt)}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {formatDate(template.updatedAt ?? template.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {archived ? null : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(template)}
                          >
                            편집
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onArchive(template)}
                          >
                            아카이브
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
