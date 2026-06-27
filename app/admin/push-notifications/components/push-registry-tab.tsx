'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import {
	pushNotificationRegistry,
	type PushNotificationAdminRegistryResponse,
} from '@/app/services/admin/push-notification-registry';
import { DirectNotificationList } from './registry/direct-notification-list';
import { PushRegistryFilters } from './registry/push-registry-filters';
import { PushRegistryGraph } from './registry/push-registry-graph';
import {
	filterRegistryRows,
	formatCategoryName,
	initialRegistryFilters,
	type RegistryRow,
	type PushRegistryView,
} from './registry/push-registry-model';
import { PushRegistrySummaryCard } from './registry/push-registry-summary';
import { PushRegistryTable } from './registry/push-registry-table';

export type { PushRegistryView };

type Props = {
	view: PushRegistryView;
	onViewChange?: (view: PushRegistryView) => void;
};

export function PushRegistryTab({ view, onViewChange }: Props) {
	const [registry, setRegistry] = useState<PushNotificationAdminRegistryResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filters, setFilters] = useState(initialRegistryFilters);
	const [currentView, setCurrentView] = useState<PushRegistryView>(view);

	useEffect(() => {
		setCurrentView(view);
	}, [view]);

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
	const selectedCategoryLabel = filters.category === 'all' ? null : formatCategoryName(filters.category);

	const showTable = () => {
		setCurrentView('table');
		onViewChange?.('table');
	};

	const handleSelectCategory = (category: string) => {
		setFilters({ ...initialRegistryFilters, category, direct: 'registry-only' });
		showTable();
	};

	const handleSelectEventType = (eventType: string, category: string) => {
		setFilters({ ...initialRegistryFilters, category, eventType, direct: 'registry-only' });
		showTable();
	};

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
			<ActiveRegistryFilter
				categoryLabel={selectedCategoryLabel}
				eventType={filters.eventType === 'all' ? null : filters.eventType}
				onClear={() => setFilters(initialRegistryFilters)}
				onShowGraph={() => {
					setCurrentView('graph');
					onViewChange?.('graph');
				}}
			/>

			{filters.direct !== 'direct-only' ? (
				currentView === 'graph' ? (
					<PushRegistryGraph
						rows={filteredRows}
						onSelectCategory={handleSelectCategory}
						onSelectEventType={handleSelectEventType}
					/>
				) : (
					<PushRegistryTable rows={filteredRows} />
				)
			) : null}

			<DirectNotificationList items={directItems} filter={filters.direct} />
		</Box>
	);
}

function ActiveRegistryFilter({
	categoryLabel,
	eventType,
	onClear,
	onShowGraph,
}: {
	categoryLabel: string | null;
	eventType: string | null;
	onClear: () => void;
	onShowGraph: () => void;
}) {
	if (!categoryLabel && !eventType) return null;

	return (
		<Alert
			severity="info"
			sx={{ mb: 2, alignItems: 'center' }}
			action={
				<Stack direction="row" spacing={1}>
					<Button color="inherit" size="small" onClick={onShowGraph}>
						구조도
					</Button>
					<Button color="inherit" size="small" onClick={onClear}>
						전체 보기
					</Button>
				</Stack>
			}
		>
			<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
				<Typography variant="body2">구조도에서 선택한 알림만 보고 있습니다.</Typography>
				{categoryLabel ? <Chip size="small" label={categoryLabel} /> : null}
				{eventType ? <Chip size="small" label={eventType} /> : null}
			</Stack>
		</Alert>
	);
}
