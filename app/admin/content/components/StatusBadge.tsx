'use client';
import { Chip } from '@heroui/react';
import type { ContentStatus } from '@/types/admin';
interface Props {
    status: ContentStatus;
    scheduledAt?: string | null;
    expiresAt?: string | null;
}
export function StatusBadge({ status, scheduledAt, expiresAt }: Props) {
    const now = new Date();
    const label = status === 'archived' ? '보관' : status === 'draft' ? (scheduledAt && new Date(scheduledAt) > now ? '예약됨' : '초안') : status === 'published' ? (expiresAt && new Date(expiresAt) < now ? '만료' : '게시중') : status;
    const color = label === '게시중' ? 'success' : label === '예약됨' ? 'warning' : 'default';
    return <Chip size="sm" color={color}>{label}</Chip>;
}
