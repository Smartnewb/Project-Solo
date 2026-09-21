'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Download, Plus, User } from 'lucide-react';
import { ghostReferencePool } from '@/app/services/admin/ghost-reference-pool';
import type {
	GhostReferenceImage,
	ListReferencePoolQuery,
} from '@/app/types/ghost-injection';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Pager } from '../_shared/pager';
import { referencePoolKeys } from '../_shared/query-keys';
import { CurationBatchSheet } from './curation-batch-sheet';
import { DeactivateDialog } from './deactivate-dialog';
import { ImportFromGhostSheet } from './import-from-ghost-sheet';
import { ImportFromUserSheet } from './import-from-user-sheet';
import { ReferencePoolFilters } from './reference-pool-filters';
import { ReferencePoolGrid } from './reference-pool-grid';
import { ReferencePoolStats } from './reference-pool-stats';

const PAGE_LIMIT = 50;

export function ReferencePoolClient() {
	const [query, setQuery] = useState<ListReferencePoolQuery>({
		isActive: true,
		limit: PAGE_LIMIT,
		offset: 0,
	});
	const [createOpen, setCreateOpen] = useState(false);
	const [importGhostOpen, setImportGhostOpen] = useState(false);
	const [importUserOpen, setImportUserOpen] = useState(false);
	const [deactivateTarget, setDeactivateTarget] = useState<GhostReferenceImage | null>(null);

	const listQuery = useQuery({
		queryKey: referencePoolKeys.list(query),
		queryFn: () => ghostReferencePool.list(query),
		placeholderData: keepPreviousData,
	});

	const items = listQuery.data?.items ?? [];
	const total = listQuery.data?.total ?? 0;
	const limit = query.limit ?? PAGE_LIMIT;
	const offset = query.offset ?? 0;
	const page = Math.floor(offset / limit) + 1;
	const totalPages = Math.max(1, Math.ceil(total / limit));

	return (
		<section className="space-y-4 px-6 py-8">
			<header className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold text-slate-900">레퍼런스 풀</h1>
					<p className="mt-1 text-sm text-slate-500">
						Ghost 사진 생성에 사용되는 레퍼런스 이미지 풀을 관리합니다. 어드민이 큐레이션한
						이미지가 Seedream img2img의 베이스가 됩니다.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" onClick={() => setImportUserOpen(true)}>
						<User className="mr-1 h-4 w-4" /> 유저 사진 임포트
					</Button>
					<Button variant="outline" onClick={() => setImportGhostOpen(true)}>
						<Download className="mr-1 h-4 w-4" /> Ghost 임포트
					</Button>
					<Button onClick={() => setCreateOpen(true)}>
						<Plus className="mr-1 h-4 w-4" /> AI 생성
					</Button>
				</div>
			</header>

			<ReferencePoolStats
				onCreateBatch={() => setCreateOpen(true)}
				onImportFromGhost={() => setImportGhostOpen(true)}
				onImportFromUser={() => setImportUserOpen(true)}
			/>

			<ReferencePoolFilters
				query={query}
				onChange={(next) => setQuery({ ...next, limit, offset: 0 })}
			/>

			{listQuery.isError ? (
				<Alert variant="destructive">
					<AlertDescription>레퍼런스 풀을 불러오지 못했습니다.</AlertDescription>
				</Alert>
			) : null}

			<ReferencePoolGrid
				items={items}
				isLoading={listQuery.isLoading}
				onDeactivate={setDeactivateTarget}
			/>

			<Pager
				page={page}
				totalPages={totalPages}
				total={total}
				totalUnit="장"
				disabled={listQuery.isFetching}
				onPrev={() =>
					setQuery((prev) => ({
						...prev,
						offset: Math.max(0, (prev.offset ?? 0) - limit),
					}))
				}
				onNext={() =>
					setQuery((prev) => ({
						...prev,
						offset: (prev.offset ?? 0) + limit,
					}))
				}
			/>

			<CurationBatchSheet open={createOpen} onOpenChange={setCreateOpen} />
			<ImportFromGhostSheet open={importGhostOpen} onOpenChange={setImportGhostOpen} />
			<ImportFromUserSheet open={importUserOpen} onOpenChange={setImportUserOpen} />
			<DeactivateDialog
				item={deactivateTarget}
				onClose={() => setDeactivateTarget(null)}
			/>
		</section>
	);
}
