'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import AdminService from '@/app/services/admin';
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';
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

	useEffect(() => {
		const unpatch = patchAdminAxios();
		return () => unpatch();
	}, []);

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
		const fetchPartners = async () => {
			try {
				setPartnersLoading(true);
				const data = await AdminService.care.getPartners(selectedTarget.user_id);
				setPartners(data);
			} catch {
				setPartners([]);
			} finally {
				setPartnersLoading(false);
			}
		};
		fetchPartners();
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
		<Box sx={{ p: 3 }}>
			<Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
				유저 집중 케어
			</Typography>
			<CareStats
				pending={stats.pending}
				cared={stats.cared}
				dismissed={stats.dismissed}
				loading={loading}
			/>
			{error && (
				<Typography color="error" sx={{ mb: 2 }}>
					{error}
				</Typography>
			)}
			<Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
				<Box sx={{ width: 320, flexShrink: 0 }}>
					<CareTargetList
						targets={targets}
						selectedTarget={selectedTarget}
						onSelect={setSelectedTarget}
						loading={loading}
						searchTerm={searchInput}
						onSearchChange={setSearchInput}
						pagination={pagination}
						onPageChange={(page) =>
							fetchTargets(page, searchTerm || undefined)
						}
					/>
				</Box>
				<CareDetailPanel
					target={selectedTarget}
					partners={partners}
					partnersLoading={partnersLoading}
					onDismiss={handleDismiss}
					onSelectPartner={handleSelectPartner}
					dismissLoading={dismissLoading}
				/>
			</Box>
			<CareExecuteModal
				open={modalOpen}
				onClose={handleModalClose}
				target={selectedTarget}
				partner={selectedPartner}
				onExecute={handleExecute}
				executing={executing}
				executeError={executeError}
			/>
		</Box>
	);
}

export default function CareV2() {
	return <CareV2Content />;
}
