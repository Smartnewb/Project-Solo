'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { pushNotificationCatalog } from '@/app/services/admin';
import type {
	PushNotificationCatalogResponse,
	PushNotificationItem,
	FreshmenMilestone,
} from '@/app/services/admin';

const NotificationGraph = dynamic(() => import('./notification-graph').then(mod => ({ default: mod.NotificationGraph })), {
	ssr: false,
	loading: () => (
		<div className="flex items-center justify-center h-full text-slate-400 text-sm">
			3D 씬 로딩 중...
		</div>
	),
});

type Locale = 'ko' | 'ja' | 'all';

const CATEGORY_COLORS: Record<string, string> = {
	matching: '#ec4899',
	engagement: '#8b5cf6',
	community: '#06b6d4',
	chat: '#10b981',
	admin: '#f59e0b',
	reward: '#f97316',
	support: '#6366f1',
	campaign: '#ef4444',
	payment: '#14b8a6',
	system: '#64748b',
};

const CATEGORY_LABELS: Record<string, string> = {
	matching: '매칭',
	engagement: '참여',
	community: '커뮤니티',
	chat: '채팅',
	admin: '관리자',
	reward: '리워드',
	support: '고객지원',
	campaign: '캠페인',
	payment: '결제',
	system: '시스템',
};

export default function CatalogClient() {
	const [data, setData] = useState<PushNotificationCatalogResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [locale, setLocale] = useState<Locale>('all');
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
	const [selectedNode, setSelectedNode] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<'table' | '3d'>('3d');

	useEffect(() => {
		const fetchCatalog = async () => {
			try {
				setLoading(true);
				const result = await pushNotificationCatalog.getCatalog(locale);
				setData(result);
			} catch (err: any) {
				setError(err.message || '카탈로그를 불러오는데 실패했습니다.');
			} finally {
				setLoading(false);
			}
		};
		fetchCatalog();
	}, [locale]);

	const filteredNotifications = useMemo(() => {
		if (!data) return [];
		if (!selectedCategory) return data.notifications;
		return data.notifications.filter((n) => n.category === selectedCategory);
	}, [data, selectedCategory]);

	const categoryStats = useMemo(() => {
		if (!data) return {};
		const stats: Record<string, { total: number; dynamic: number }> = {};
		for (const n of data.notifications) {
			if (!stats[n.category]) stats[n.category] = { total: 0, dynamic: 0 };
			stats[n.category].total++;
			if (n.dynamic) stats[n.category].dynamic++;
		}
		return stats;
	}, [data]);

	const toggleExpand = useCallback((eventType: string) => {
		setExpandedItems((prev) => {
			const next = new Set(prev);
			if (next.has(eventType)) next.delete(eventType);
			else next.add(eventType);
			return next;
		});
	}, []);

	const handleNodeSelect = useCallback((eventType: string | null) => {
		setSelectedNode(eventType);
		if (eventType) {
			setExpandedItems((prev) => new Set(prev).add(eventType));
			// scroll to table row
			setTimeout(() => {
				const el = document.getElementById(`row-${eventType}`);
				if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}, 100);
		}
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-[60vh]">
				<div className="flex flex-col items-center gap-3">
					<div className="w-8 h-8 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
					<p className="text-sm text-slate-500">카탈로그 로딩 중...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-[60vh]">
				<div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
					<p className="text-red-700 font-medium mb-2">오류 발생</p>
					<p className="text-red-600 text-sm">{error}</p>
					<button
						onClick={() => window.location.reload()}
						className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition"
					>
						다시 시도
					</button>
				</div>
			</div>
		);
	}

	if (!data) return null;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">푸시 알림 구조도</h1>
					<p className="text-sm text-slate-500 mt-1">
						전체 {data.meta.totalEventTypes}개 이벤트 타입 /{' '}
						{data.meta.categories.length}개 카테고리 / {data.meta.locales.join(', ')} locale
					</p>
				</div>
				<div className="flex items-center gap-3">
					{/* View Toggle */}
					<div className="flex bg-slate-100 rounded-lg p-0.5">
						<button
							onClick={() => setViewMode('3d')}
							className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
								viewMode === '3d'
									? 'bg-white text-slate-900 shadow-sm'
									: 'text-slate-500 hover:text-slate-700'
							}`}
						>
							3D 구조도
						</button>
						<button
							onClick={() => setViewMode('table')}
							className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
								viewMode === 'table'
									? 'bg-white text-slate-900 shadow-sm'
									: 'text-slate-500 hover:text-slate-700'
							}`}
						>
							테이블
						</button>
					</div>
					{/* Locale Filter */}
					<div className="flex bg-slate-100 rounded-lg p-0.5">
						{(['all', 'ko', 'ja'] as const).map((l) => (
							<button
								key={l}
								onClick={() => setLocale(l)}
								className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
									locale === l
										? 'bg-white text-slate-900 shadow-sm'
										: 'text-slate-500 hover:text-slate-700'
								}`}
							>
								{l === 'all' ? '전체' : l.toUpperCase()}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Category Chips */}
			<div className="flex flex-wrap gap-2">
				<button
					onClick={() => setSelectedCategory(null)}
					className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${
						!selectedCategory
							? 'bg-slate-900 text-white border-slate-900'
							: 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
					}`}
				>
					전체 ({data.notifications.length})
				</button>
				{data.meta.categories.map((cat) => (
					<button
						key={cat}
						onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
						className={`px-3 py-1.5 text-xs font-medium rounded-full border transition flex items-center gap-1.5`}
						style={{
							backgroundColor:
								selectedCategory === cat ? CATEGORY_COLORS[cat] || '#64748b' : 'white',
							color: selectedCategory === cat ? 'white' : CATEGORY_COLORS[cat] || '#64748b',
							borderColor: CATEGORY_COLORS[cat] || '#64748b',
						}}
					>
						<span
							className="w-2 h-2 rounded-full"
							style={{
								backgroundColor:
									selectedCategory === cat ? 'white' : CATEGORY_COLORS[cat] || '#64748b',
							}}
						/>
						{CATEGORY_LABELS[cat] || cat} ({categoryStats[cat]?.total || 0})
					</button>
				))}
			</div>

			{/* 3D Visualization */}
			{viewMode === '3d' && (
				<div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800" style={{ height: 560 }}>
					<Suspense
						fallback={
							<div className="flex items-center justify-center h-full text-slate-400 text-sm">
								3D 씬 로딩 중...
							</div>
						}
					>
						<NotificationGraph
							notifications={filteredNotifications}
							milestones={data.freshmenMilestones}
							categories={data.meta.categories}
							selectedNode={selectedNode}
							onSelectNode={handleNodeSelect}
						/>
					</Suspense>
				</div>
			)}

			{/* Summary Cards */}
			<div className="grid grid-cols-4 gap-4">
				<SummaryCard
					label="전체 이벤트"
					value={data.meta.totalEventTypes}
					sub={`${data.notifications.filter((n) => n.dynamic).length}개 동적`}
				/>
				<SummaryCard
					label="카테고리"
					value={data.meta.categories.length}
					sub={data.meta.categories.join(', ')}
				/>
				<SummaryCard
					label="Locale"
					value={data.meta.locales.length}
					sub={data.meta.locales.map((l) => l.toUpperCase()).join(' / ')}
				/>
				<SummaryCard
					label="신입 마일스톤"
					value={data.freshmenMilestones.length}
					sub={data.freshmenMilestones.map((m) => m.milestone.toLocaleString()).join(', ')}
				/>
			</div>

			{/* Notification Table */}
			<div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-slate-50 border-b border-slate-200">
								<th className="text-left px-4 py-3 font-medium text-slate-600 w-[200px]">
									이벤트 타입
								</th>
								<th className="text-left px-4 py-3 font-medium text-slate-600 w-[100px]">
									카테고리
								</th>
								<th className="text-center px-4 py-3 font-medium text-slate-600 w-[70px]">
									동적
								</th>
								<th className="text-left px-4 py-3 font-medium text-slate-600">
									템플릿 미리보기
								</th>
								<th className="text-center px-4 py-3 font-medium text-slate-600 w-[80px]">
									변형
								</th>
							</tr>
						</thead>
						<tbody>
							{filteredNotifications.map((item) => (
								<NotificationRow
									key={item.eventType}
									item={item}
									expanded={expandedItems.has(item.eventType)}
									highlighted={selectedNode === item.eventType}
									onToggle={() => toggleExpand(item.eventType)}
									locale={locale}
								/>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Freshmen Milestones */}
			{data.freshmenMilestones.length > 0 && (
				<div className="bg-white rounded-xl border border-slate-200 p-6">
					<h2 className="text-lg font-semibold text-slate-900 mb-4">
						신입 마일스톤 알림
					</h2>
					<div className="grid grid-cols-3 gap-4">
						{data.freshmenMilestones.map((m) => (
							<MilestoneCard key={m.milestone} milestone={m} />
						))}
					</div>
				</div>
			)}

			{/* Source Info */}
			<div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-500">
				<span className="font-medium">소스:</span>{' '}
				{data.meta.sources.join(' / ')}
			</div>
		</div>
	);
}

function SummaryCard({ label, value, sub }: { label: string; value: number; sub: string }) {
	return (
		<div className="bg-white rounded-xl border border-slate-200 p-4">
			<p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
			<p className="text-2xl font-bold text-slate-900">{value}</p>
			<p className="text-xs text-slate-400 mt-1 truncate">{sub}</p>
		</div>
	);
}

function NotificationRow({
	item,
	expanded,
	highlighted,
	onToggle,
	locale,
}: {
	item: PushNotificationItem;
	expanded: boolean;
	highlighted: boolean;
	onToggle: () => void;
	locale: Locale;
}) {
	const locales = locale === 'all' ? Object.keys(item.templates) : [locale];
	const variantCount = item.variants?.length || 0;

	return (
		<>
			<tr
				id={`row-${item.eventType}`}
				className={`border-b border-slate-100 cursor-pointer transition ${
					highlighted
						? 'bg-blue-50 ring-2 ring-blue-300 ring-inset'
						: 'hover:bg-slate-50'
				}`}
				onClick={onToggle}
			>
				<td className="px-4 py-3">
					<div className="flex items-center gap-2">
						<span
							className={`text-[10px] transition-transform ${expanded ? 'rotate-90' : ''}`}
						>
							&#9654;
						</span>
						<code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
							{item.eventType}
						</code>
					</div>
				</td>
				<td className="px-4 py-3">
					<span
						className="text-xs px-2 py-0.5 rounded-full font-medium"
						style={{
							backgroundColor: (CATEGORY_COLORS[item.category] || '#64748b') + '18',
							color: CATEGORY_COLORS[item.category] || '#64748b',
						}}
					>
						{CATEGORY_LABELS[item.category] || item.category}
					</span>
				</td>
				<td className="px-4 py-3 text-center">
					{item.dynamic ? (
						<span className="inline-block w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-[10px] leading-5 font-bold">
							D
						</span>
					) : (
						<span className="inline-block w-5 h-5 rounded-full bg-slate-100 text-slate-400 text-[10px] leading-5">
							S
						</span>
					)}
				</td>
				<td className="px-4 py-3">
					<div className="space-y-1">
						{locales.map((l) => {
							const tmpl = item.templates[l];
							if (!tmpl) return null;
							return (
								<div key={l} className="flex items-start gap-2">
									<span className="text-[10px] font-mono text-slate-400 uppercase mt-0.5 flex-shrink-0 w-5">
										{l}
									</span>
									<div className="min-w-0">
										<span className="font-medium text-slate-800 text-xs">
											{tmpl.title}
										</span>
										<span className="text-slate-500 text-xs ml-2 truncate">
											{tmpl.body}
										</span>
									</div>
								</div>
							);
						})}
					</div>
				</td>
				<td className="px-4 py-3 text-center">
					{variantCount > 0 && (
						<span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
							{variantCount}
						</span>
					)}
				</td>
			</tr>
			{expanded && (
				<tr>
					<td colSpan={5} className="bg-slate-50 px-6 py-4">
						<div className="space-y-4">
							{/* Sample Params */}
							{item.dynamic && Object.keys(item.sampleParams).length > 0 && (
								<div>
									<p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
										Sample Params
									</p>
									<code className="text-xs bg-white border border-slate-200 rounded px-2 py-1 inline-block">
										{JSON.stringify(item.sampleParams)}
									</code>
								</div>
							)}
							{/* Variants */}
							{item.variants && item.variants.length > 0 && (
								<div>
									<p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
										Variants ({item.variants.length})
									</p>
									<div className="space-y-2">
										{item.variants.map((v, idx) => (
											<div
												key={idx}
												className="bg-white border border-slate-200 rounded-lg p-3"
											>
												<div className="flex items-center gap-2 mb-2">
													<span className="text-[10px] font-mono bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded">
														{v.condition}
													</span>
												</div>
												<div className="space-y-1">
													{(locale === 'all'
														? Object.keys(v.templates)
														: [locale]
													).map((l) => {
														const tmpl = v.templates[l];
														if (!tmpl || typeof tmpl !== 'object') return null;
														return (
															<div
																key={l}
																className="flex items-start gap-2 text-xs"
															>
																<span className="text-[10px] font-mono text-slate-400 uppercase mt-0.5 w-5 flex-shrink-0">
																	{l}
																</span>
																<span className="font-medium text-slate-700">
																	{tmpl.title}
																</span>
																<span className="text-slate-500 truncate">
																	{tmpl.body}
																</span>
															</div>
														);
													})}
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</td>
				</tr>
			)}
		</>
	);
}

function MilestoneCard({ milestone }: { milestone: FreshmenMilestone }) {
	const locales = Object.keys(milestone.templates);
	return (
		<div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-lg p-4">
			<div className="flex items-center justify-between mb-2">
				<span className="text-xs font-medium text-indigo-600">
					{milestone.title}
				</span>
				<span className="text-lg font-bold text-indigo-900">
					{milestone.milestone.toLocaleString()}
				</span>
			</div>
			<div className="space-y-1">
				{locales.map((l) => (
					<div key={l} className="text-xs text-slate-600">
						<span className="font-mono text-[10px] text-slate-400 uppercase mr-1">
							{l}
						</span>
						{milestone.templates[l]?.body}
					</div>
				))}
			</div>
		</div>
	);
}
