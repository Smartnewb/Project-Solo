'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import { ghostInjectionKeys } from '../../_shared/query-keys';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/shared/ui/dialog';
import { PhoneFrame } from './phone-frame';
import {
	DEFAULT_SIMULATION,
	type PreviewSimulation,
	APPROVED_PHOTO_OPTIONS,
	COUNTRY_OPTIONS,
	MATCH_STATUS_OPTIONS,
} from './lib/preview-simulation';
import { PreviewHeader } from './sections/PreviewHeader';
import { PreviewMainImage } from './sections/PreviewMainImage';
import { PreviewBasicInfo } from './sections/PreviewBasicInfo';
import { PreviewMBTI } from './sections/PreviewMBTI';
import { PreviewIdealType } from './sections/PreviewIdealType';
import { PreviewAdditionalPhoto } from './sections/PreviewAdditionalPhoto';
import { PreviewCompatibilityPlaceholder } from './sections/PreviewCompatibilityPlaceholder';
import { PreviewMatchReasonPlaceholder } from './sections/PreviewMatchReasonPlaceholder';
import { PreviewBottomLikeBar } from './sections/PreviewBottomLikeBar';

interface GhostMobilePreviewModalProps {
	ghostAccountId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function GhostMobilePreviewModal({
	ghostAccountId,
	open,
	onOpenChange,
}: GhostMobilePreviewModalProps) {
	const [sim, setSim] = useState<PreviewSimulation>(DEFAULT_SIMULATION);

	const previewQuery = useQuery({
		queryKey: ghostInjectionKeys.ghostProfilePreview(ghostAccountId ?? ''),
		queryFn: () => ghostInjection.getProfilePreview(ghostAccountId as string),
		enabled: open && Boolean(ghostAccountId),
	});

	const profile = previewQuery.data;
	const validImages = profile?.profileImages.filter((img) => img.imageUrl || img.url) ?? [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-5xl">
				<DialogHeader>
					<DialogTitle>매칭 시 노출 미리보기</DialogTitle>
				</DialogHeader>

				<div className="flex gap-6">
					{/* 시뮬 토글 패널 */}
					<div className="w-64 space-y-4 text-sm">
						<SimGroup
							label="상대 유저 승인 사진수"
							options={APPROVED_PHOTO_OPTIONS}
							value={sim.approvedPhotoCount}
							onChange={(v) => setSim((p) => ({ ...p, approvedPhotoCount: v }))}
						/>
						<SimGroup
							label="국가"
							options={COUNTRY_OPTIONS}
							value={sim.country}
							onChange={(v) => setSim((p) => ({ ...p, country: v }))}
						/>
						<SimGroup
							label="매칭 상태"
							options={MATCH_STATUS_OPTIONS}
							value={sim.matchStatus}
							onChange={(v) => setSim((p) => ({ ...p, matchStatus: v }))}
						/>
					</div>

					{/* 폰 프레임 */}
					<PhoneFrame>
						{previewQuery.isLoading ? (
							<div className="flex h-full items-center justify-center">
								<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
							</div>
						) : !profile ? (
							<div className="p-6 text-center text-sm text-slate-500">
								불러오지 못했습니다.
							</div>
						) : (
							<>
								<PreviewHeader />
								<PreviewMainImage profile={profile} country={sim.country} />
								<PreviewBasicInfo profile={profile} />
								{validImages[1] && (
									<PreviewAdditionalPhoto
										image={validImages[1]}
										index={1}
										approvedPhotoCount={sim.approvedPhotoCount}
									/>
								)}
								<PreviewMBTI profile={profile} />
								<PreviewCompatibilityPlaceholder />
								<PreviewIdealType profile={profile} />
								<PreviewMatchReasonPlaceholder />
								{validImages[2] && (
									<PreviewAdditionalPhoto
										image={validImages[2]}
										index={2}
										approvedPhotoCount={sim.approvedPhotoCount}
									/>
								)}
								{validImages.slice(3).map((img, i) => (
									<PreviewAdditionalPhoto
										key={img.id}
										image={img}
										index={i + 3}
										approvedPhotoCount={sim.approvedPhotoCount}
									/>
								))}
								<PreviewBottomLikeBar matchStatus={sim.matchStatus} />
							</>
						)}
					</PhoneFrame>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function SimGroup<T extends string | number>({
	label,
	options,
	value,
	onChange,
}: {
	label: string;
	options: T[];
	value: T;
	onChange: (v: T) => void;
}) {
	return (
		<div className="space-y-1.5">
			<div className="font-medium text-slate-700">{label}</div>
			<div className="flex flex-wrap gap-1.5">
				{options.map((opt) => (
					<button
						key={String(opt)}
						type="button"
						onClick={() => onChange(opt)}
						className={
							value === opt
								? 'rounded-md border border-[#ff385c] bg-[#f7f7f7] px-2.5 py-1 text-xs font-medium text-[#e00b41]'
								: 'rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:border-slate-300'
						}
					>
						{String(opt)}
					</button>
				))}
			</div>
		</div>
	);
}
