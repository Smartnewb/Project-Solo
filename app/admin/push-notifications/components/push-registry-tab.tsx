'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import {
	pushNotificationRegistry,
	type PushNotificationAdminRegistryResponse,
} from '@/app/services/admin/push-notification-registry';
import { DirectNotificationList } from './registry/direct-notification-list';
import { PushRegistryFilters } from './registry/push-registry-filters';
import { PushRegistryGraph } from './registry/push-registry-graph';
import {
	filterRegistryRows,
	initialRegistryFilters,
	type RegistryRow,
	type PushRegistryView,
} from './registry/push-registry-model';
import { PushRegistrySummaryCard } from './registry/push-registry-summary';
import { PushRegistryTable } from './registry/push-registry-table';

export type { PushRegistryView };

export function PushRegistryTab({ view }: { view: PushRegistryView }) {
	const [registry, setRegistry] = useState<PushNotificationAdminRegistryResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filters, setFilters] = useState(initialRegistryFilters);

	useEffect(() => {
		let mounted = true;
		setLoading(true);
		setError(null);

		pushNotificationRegistry
			.getRegistry()
			.then((data) => {
				if (mounted) setRegistry(data);
			})
			.catch((err: unknown) => {
				if (mounted) setError(err instanceof Error ? err.message : 'unknown error');
			})
			.finally(() => {
				if (mounted) setLoading(false);
			});

		return () => {
			mounted = false;
		};
	}, []);

	const rows = useMemo<RegistryRow[]>(
		() => (registry ? Object.entries(registry.notifications).map(([eventType, entry]) => ({ eventType, entry })) : []),
		[registry],
	);
	const filteredRows = useMemo(() => filterRegistryRows(rows, filters), [rows, filters]);
	const categories = useMemo(() => Array.from(new Set(rows.map((row) => row.entry.category))).sort(), [rows]);
	const directItems = registry?.directNotifications ?? [];

	if (loading) {
		return (
			<Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
				<CircularProgress size={20} />
				<Typography>상황별 알림을 불러오는 중입니다</Typography>
			</Box>
		);
	}

	if (error) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="error">상황별 알림을 불러오지 못했습니다</Alert>
			</Box>
		);
	}

	if (!registry || rows.length === 0) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="info">등록된 상황별 알림이 없습니다</Alert>
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3 }}>
			<Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', mb: 2 }}>
				<PushRegistrySummaryCard label="전체 registry" value={`총 ${registry.stats.total}개`} helper={`version ${registry.version}`} />
				<PushRegistrySummaryCard
					label="트리거"
					value={`이벤트 ${registry.stats.byTrigger.event ?? 0}개 · 크론 ${registry.stats.byTrigger.cron ?? 0}개`}
				/>
				<PushRegistrySummaryCard label="Throttle" value={`${rows.filter((row) => row.entry.throttle).length}개`} />
				<PushRegistrySummaryCard label="직접 발송" value={`${directItems.length}개`} helper="registry 외부 read-only" />
			</Box>

			<PushRegistryFilters categories={categories} filters={filters} onChange={setFilters} />

			{filters.direct !== 'direct-only' ? (
				view === 'graph' ? (
					<PushRegistryGraph rows={filteredRows} />
				) : (
					<PushRegistryTable rows={filteredRows} />
				)
			) : null}

			<DirectNotificationList items={directItems} filter={filters.direct} />
		</Box>
	);
}
