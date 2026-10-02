'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@heroui/react';
import AdminService from '@/app/services/admin';
import type { CareTarget, CarePartner } from '@/app/services/admin/care';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
import CareStats from './components/CareStats';
import CareTargetList from './components/CareTargetList';
import CareDetailPanel from './components/CareDetailPanel';
import CareExecuteModal from './components/CareExecuteModal';

function CareV2Content() {
	const [targets, setTargets] = useState<CareTarget[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedTarget, setSelectedTarget] = useState<CareTarget | null>(null);
	const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
	const [searchTerm, setSearchTerm] = useState('');
	const [searchInput, setSearchInput] = useState('');

	const [partners, setPartners] = useState<CarePartner[]>([]);
	const [partnersLoading, setPartnersLoading] = useState(false);
	const [selectedPartner, setSelectedPartner] = useState<CarePartner | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [dismissLoading, setDismissLoading] = useState(false);
	const [executing, setExecuting] = useState(false);
	const [executeError, setExecuteError] = useState<string | null>(null);

	const confirm = useConfirm();
	const toast = useToast();

	const fetchTargets = useCallback(async (page: number = 1, search?: string) => {
		try {
			setLoading(true);
			setError(null);
			const params: { page?: number; limit?: number; search?: string } = {
				page,
				limit: 20,
			};
			if (search) {
				params.search = search;
			}
			const data = await AdminService.care.getTargets(params);
			setTargets(data.items);
			setPagination({ page: data.page, limit: data.limit, total: data.total });
		} catch (err: any) {
			setError(err.response?.data?.message || '케어 대상 목록을 불러올 수 없습니다.');
		} finally {
			setLoading(false);
		}
	}, []);

	const isFirstRender = useRef(true);
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			fetchTargets();
			return;
		}
		const timer = setTimeout(() => {
			setSearchTerm(searchInput);
			fetchTargets(1, searchInput || undefined);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchInput, fetchTargets]);

	// 파트너 fetch
	useEffect(() => {
		if (!selectedTarget) {
			setPartners([]);
			return;
		}
		let cancelled = false;
		const fetchPartners = async () => {
			try {
				setPartnersLoading(true);
				const data = await AdminService.care.getPartners(selectedTarget.user_id);
				if (!cancelled) setPartners(data);
			} catch {
				if (!cancelled) setPartners([]);
			} finally {
				if (!cancelled) setPartnersLoading(false);
			}
		};
		fetchPartners();
		return () => { cancelled = true; };
	}, [selectedTarget]);

	// 무시 핸들러
	const handleDismiss = async () => {
		if (!selectedTarget) return;
		const ok = await confirm({ message: '이 유저를 케어 대상에서 제외하시겠습니까?' });
		if (!ok) return;
		try {
			setDismissLoading(true);
			await AdminService.care.dismiss(selectedTarget.id);
			toast.success('케어 대상에서 제외되었습니다.');
			setSelectedTarget(null);
			fetchTargets(pagination.page, searchTerm || undefined);
		} catch (err: any) {
			toast.error(err.response?.data?.message || '무시 처리에 실패했습니다.');
		} finally {
			setDismissLoading(false);
		}
	};

	// 파트너 선택 → 모달 오픈
	const handleSelectPartner = (partner: CarePartner) => {
		setSelectedPartner(partner);
		setModalOpen(true);
	};

	// 케어 실행
	const handleExecute = async (
		action: 'like' | 'mutual_like' | 'open_chat',
		letterContent: string,
	) => {
		if (!selectedTarget || !selectedPartner) return;
		try {
			setExecuting(true);
			setExecuteError(null);
			await AdminService.care.execute({
				targetUserId: selectedTarget.user_id,
				partnerUserId: selectedPartner.userId,
				action,
				letterContent,
				careTargetId:
					selectedTarget.status === 'pending' ? selectedTarget.id : undefined,
			});
			toast.success('케어가 실행되었습니다.');
			setModalOpen(false);
			setSelectedPartner(null);
			setSelectedTarget(null);
			fetchTargets(pagination.page, searchTerm || undefined);
		} catch (err: any) {
			setExecuteError(err.response?.data?.message || '케어 실행에 실패했습니다.');
		} finally {
			setExecuting(false);
		}
	};

	const handleModalClose = () => {
        if (executing) return;
		setModalOpen(false);
		setSelectedPartner(null);
		setExecuteError(null);
	};

	const stats = useMemo(() => {
		const counts = { pending: 0, cared: 0, dismissed: 0 };
		for (const t of targets) {
			if (t.status in counts) counts[t.status]++;
		}
		return counts;
	}, [targets]);

	return (
		<section className="space-y-4">
			<h1 className="text-2xl font-bold">
				유저 집중 케어
			</h1>
			{error ? (
				<div
					role="alert"
					className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
				>
					<span>{error}</span>
					<Button
						size="sm"
						variant="secondary"
						onPress={() => fetchTargets(pagination.page, searchTerm || undefined)}
					>
						다시 시도
					</Button>
				</div>
			) : (
				<CareStats
					pending={stats.pending}
					cared={stats.cared}
					dismissed={stats.dismissed}
					loading={loading}
				/>
			)}
			<div className="grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
				<div>
					<CareTargetList
						targets={targets}
						selectedTarget={selectedTarget}
						onSelect={setSelectedTarget}
						loading={loading}
						error={!!error}
						searchTerm={searchInput}
						onSearchChange={setSearchInput}
						pagination={pagination}
						onPageChange={(page) =>
							fetchTargets(page, searchTerm || undefined)
						}
					/>
				</div>
				<CareDetailPanel
					target={selectedTarget}
					partners={partners}
					partnersLoading={partnersLoading}
					onDismiss={handleDismiss}
					onSelectPartner={handleSelectPartner}
					dismissLoading={dismissLoading}
				/>
			</div>
			<CareExecuteModal
                key={`${selectedTarget?.id ?? ""}:${selectedPartner?.userId ?? ""}`}
				open={modalOpen}
				onClose={handleModalClose}
				target={selectedTarget}
				partner={selectedPartner}
				onExecute={handleExecute}
				executing={executing}
				executeError={executeError}
			/>
		</section>
	);
}

export default function CareV2() {
	return <CareV2Content />;
}
