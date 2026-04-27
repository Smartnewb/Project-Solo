'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import { formatDateTimeKR } from '@/app/utils/formatters';
import type { GhostListItem, GhostTargetStatus } from '@/app/types/ghost-injection';
import { Badge } from '@/shared/ui/badge';
import { Switch } from '@/shared/ui/switch';
import { ghostInjectionKeys } from '../../_shared/query-keys';
import { GhostExposureHistory } from './ghost-exposure-history';

function GhostListRow({
	ghost,
	isSelected,
	onSelect,
	onToggleStatus,
}: {
	ghost: GhostListItem;
	isSelected: boolean;
	onSelect: () => void;
	onToggleStatus: (targetStatus: GhostTargetStatus) => void;
}) {
	const isActive = ghost.status === 'ACTIVE';

	return (
		<div
			className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
				isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
			}`}
			onClick={onSelect}
		>
			{ghost.primaryPhotoUrl ? (
				<img
					src={ghost.primaryPhotoUrl}
					alt={ghost.name}
					className="h-10 w-10 rounded-full object-cover flex-shrink-0"
				/>
			) : (
				<div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500 text-sm font-medium">
					{ghost.name.charAt(0)}
				</div>
			)}

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="font-medium text-sm text-gray-900 truncate">{ghost.name}</span>
					<Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
						{isActive ? 'ACTIVE' : 'INACTIVE'}
					</Badge>
				</div>
				{ghost.lastExposedAt && (
					<p className="text-xs text-gray-400 mt-0.5">{formatDateTimeKR(ghost.lastExposedAt)}</p>
				)}
			</div>

			<Switch
				checked={isActive}
				onCheckedChange={(checked) => onToggleStatus(checked ? 'ACTIVE' : 'INACTIVE')}
				onClick={(e) => e.stopPropagation()}
				className="flex-shrink-0"
			/>
		</div>
	);
}

export function GhostExposuresClient() {
	const [selectedGhostId, setSelectedGhostId] = useState<string | null>(null);
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery({
		queryKey: ghostInjectionKeys.ghostList({ page: 1, limit: 50, sort: 'createdAt', order: 'desc' }),
		queryFn: () =>
			ghostInjection.listGhosts({ page: 1, limit: 50, sort: 'createdAt', order: 'desc' }),
	});

	const toggleMutation = useMutation({
		mutationFn: ({
			ghostAccountId,
			targetStatus,
		}: {
			ghostAccountId: string;
			targetStatus: GhostTargetStatus;
		}) =>
			ghostInjection.toggleGhostStatus(ghostAccountId, {
				targetStatus,
				reason: '어드민 노출 관리 페이지에서 상태 변경',
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });
		},
	});

	const ghosts = data?.items ?? [];
	const selectedGhost = ghosts.find((g) => g.ghostAccountId === selectedGhostId) ?? null;

	return (
		<div className="flex h-full gap-4">
			<div className="w-80 flex-shrink-0 flex flex-col">
				<div className="mb-3">
					<h2 className="text-base font-semibold text-gray-900">Ghost 목록</h2>
					<p className="text-xs text-gray-500 mt-0.5">Ghost를 선택하면 노출 이력을 확인합니다</p>
				</div>

				{isLoading && (
					<p className="text-sm text-gray-500 text-center py-8">불러오는 중...</p>
				)}

				<div className="space-y-2 overflow-y-auto flex-1">
					{ghosts.map((ghost) => (
						<GhostListRow
							key={ghost.ghostAccountId}
							ghost={ghost}
							isSelected={ghost.ghostAccountId === selectedGhostId}
							onSelect={() => setSelectedGhostId(ghost.ghostAccountId)}
							onToggleStatus={(targetStatus) =>
								toggleMutation.mutate({ ghostAccountId: ghost.ghostAccountId, targetStatus })
							}
						/>
					))}
				</div>
			</div>

			<div className="flex-1 overflow-y-auto">
				{selectedGhost ? (
					<div>
						<div className="mb-4">
							<h2 className="text-base font-semibold text-gray-900">
								{selectedGhost.name} 노출 이력
							</h2>
							<p className="text-xs text-gray-500 mt-0.5">
								ghostAccountId: {selectedGhost.ghostAccountId}
							</p>
						</div>
						<GhostExposureHistory ghostAccountId={selectedGhost.ghostAccountId} />
					</div>
				) : (
					<div className="flex items-center justify-center h-full">
						<p className="text-sm text-gray-400">좌측에서 Ghost를 선택하세요</p>
					</div>
				)}
			</div>
		</div>
	);
}
