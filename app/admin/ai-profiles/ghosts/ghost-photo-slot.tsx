'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageOff, Maximize2, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type { GhostPhotoItem, ImageVendor } from '@/app/types/ghost-injection';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import { Button } from '@/shared/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import {
	DEFAULT_VENDOR_ID,
	findVendorOption,
	vendorOptionsForSelect,
	vendorSupportsReference,
} from '../_shared/ghost-vendor-options';
import { ReasonInput, isReasonValid } from '../_shared/reason-input';
import { ghostInjectionKeys } from '../_shared/query-keys';
import { GhostPromptPreviewModal } from './ghost-prompt-preview-modal';

interface GhostPhotoSlotProps {
	ghostAccountId: string;
	slotIndex: number;
	photo?: GhostPhotoItem;
	ghostAge?: number;
}

const VENDOR_SELECT_OPTIONS = vendorOptionsForSelect();

export function GhostPhotoSlot({ ghostAccountId, slotIndex, photo, ghostAge }: GhostPhotoSlotProps) {
	const toast = useToast();
	const queryClient = useQueryClient();

	const [replaceOpen, setReplaceOpen] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [imageId, setImageId] = useState('');
	const [replaceReason, setReplaceReason] = useState('');

	const [removeOpen, setRemoveOpen] = useState(false);
	const [removeReason, setRemoveReason] = useState('');

	const [regenOpen, setRegenOpen] = useState(false);
	const [regenVendorId, setRegenVendorId] = useState(DEFAULT_VENDOR_ID);
	const [regenPrompt, setRegenPrompt] = useState('');
	const [regenReason, setRegenReason] = useState('');
	const [regenRefs, setRegenRefs] = useState('');

	const vendor: ImageVendor = findVendorOption(regenVendorId)?.value ?? 'seedream';
	const canUseReference = vendorSupportsReference(vendor);

	const invalidateGhostQueries = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghostDetail(ghostAccountId) });
		queryClient.invalidateQueries({ queryKey: ghostInjectionKeys.ghosts() });
	}, [queryClient, ghostAccountId]);

	const replaceMutation = useMutation({
		mutationFn: () =>
			ghostInjection.replaceGhostPhoto(ghostAccountId, slotIndex, {
				newImageId: imageId.trim(),
				reason: replaceReason.trim(),
			}),
		onSuccess: () => {
			toast.success(`슬롯 ${slotIndex} 사진이 교체되었습니다.`);
			invalidateGhostQueries();
			setReplaceOpen(false);
			setImageId('');
			setReplaceReason('');
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const removeMutation = useMutation({
		mutationFn: () =>
			ghostInjection.removeGhostPhoto(ghostAccountId, slotIndex, {
				reason: removeReason.trim(),
			}),
		onSuccess: () => {
			toast.success(`슬롯 ${slotIndex} 사진이 제거되었습니다.`);
			invalidateGhostQueries();
			setRemoveOpen(false);
			setRemoveReason('');
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const regenMutation = useMutation({
		mutationFn: () => {
			const refUrls = regenRefs
				.split('\n')
				.map((line) => line.trim())
				.filter(Boolean);
			return ghostInjection.regenerateSingleSlot(ghostAccountId, slotIndex, {
				reason: regenReason.trim(),
				prompt: regenPrompt.trim() || undefined,
				vendor,
				referencePhotoUrls: canUseReference && refUrls.length > 0 ? refUrls : undefined,
			});
		},
		onSuccess: () => {
			toast.success(`슬롯 ${slotIndex} AI 재생성이 완료되었습니다.`);
			invalidateGhostQueries();
			setRegenOpen(false);
			setRegenPrompt('');
			setRegenReason('');
			setRegenRefs('');
		},
		onError: (error) =>
			toast.error(`사진 생성에 실패했습니다. 기존 슬롯은 유지됩니다. (${getAdminErrorMessage(error)})`),
	});

	const canReplace =
		imageId.trim().length > 0 && isReasonValid(replaceReason) && !replaceMutation.isPending;

	const canRemove = Boolean(photo) && isReasonValid(removeReason) && !removeMutation.isPending;

	const canRegen = isReasonValid(regenReason) && !regenMutation.isPending;

	return (
		<div className="space-y-2">
			<div className="group relative aspect-square overflow-hidden rounded-md border bg-slate-100">
				{photo ? (
					<button
						type="button"
						className="block h-full w-full cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
						onClick={() => setPreviewOpen(true)}
						aria-label={`슬롯 ${slotIndex} 사진 크게 보기`}
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={photo.url} alt={`슬롯 ${slotIndex}`} className="h-full w-full object-cover" />
						<span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100 group-focus-within:bg-black/20 group-focus-within:opacity-100">
							<span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow">
								<Maximize2 className="h-4 w-4" />
							</span>
						</span>
					</button>
				) : (
					<div className="flex h-full w-full items-center justify-center text-slate-400">
						<ImageOff className="h-6 w-6" />
					</div>
				)}
				<div className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
					{slotIndex}
				</div>
			</div>

			<div className="flex gap-1">
				<Popover open={replaceOpen} onOpenChange={setReplaceOpen}>
					<PopoverTrigger asChild>
						<Button variant="outline" size="sm" className="flex-1 text-xs">
							<RefreshCw className="mr-1 h-3 w-3" /> 교체
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-80" align="start">
						<div className="space-y-3">
							<div>
								<Label className="text-xs">새 Image ID</Label>
								<Input
									value={imageId}
									onChange={(event) => setImageId(event.target.value)}
									placeholder="이미지 UUID 입력"
									className="h-8"
								/>
							</div>
							<ReasonInput value={replaceReason} onChange={setReplaceReason} minLength={10} rows={2} />
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setReplaceOpen(false)}
									disabled={replaceMutation.isPending}
								>
									취소
								</Button>
								<Button size="sm" onClick={() => replaceMutation.mutate()} disabled={!canReplace}>
									{replaceMutation.isPending ? '교체 중…' : '교체'}
								</Button>
							</div>
						</div>
					</PopoverContent>
				</Popover>

				<Button
					variant="outline"
					size="sm"
					className="flex-1 border-violet-200 text-xs text-violet-700 hover:bg-violet-50"
					onClick={() => setRegenOpen(true)}
				>
					<Sparkles className="mr-1 h-3 w-3" /> AI
				</Button>

				<Button
					variant="outline"
					size="sm"
					className="border-red-200 px-2 text-xs text-red-700 hover:bg-red-50"
					onClick={() => setRemoveOpen(true)}
					disabled={!photo}
					aria-label={`슬롯 ${slotIndex} 사진 제거`}
				>
					<Trash2 className="h-3 w-3" />
				</Button>
			</div>

			<Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
				<DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none [&>button]:rounded-full [&>button]:bg-white/90 [&>button]:p-1 [&>button]:text-slate-900">
					<DialogHeader className="sr-only">
						<DialogTitle>슬롯 {slotIndex} 사진 크게 보기</DialogTitle>
						<DialogDescription>선택한 사진 슬롯의 원본 비율 확대 보기입니다.</DialogDescription>
					</DialogHeader>
					{photo && (
						<div className="flex max-h-[88vh] items-center justify-center rounded-md bg-black/90 p-2">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={photo.url}
								alt={`슬롯 ${slotIndex} 확대 이미지`}
								className="max-h-[84vh] max-w-full rounded object-contain"
							/>
						</div>
					)}
				</DialogContent>
			</Dialog>

			<Dialog open={removeOpen} onOpenChange={(open) => !removeMutation.isPending && setRemoveOpen(open)}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-red-700">
							<Trash2 className="h-4 w-4" />
							슬롯 {slotIndex} 사진 제거
						</DialogTitle>
						<DialogDescription>
							이 슬롯 사진만 제거합니다. 마지막 남은 사진은 서버에서 제거가 차단됩니다.
						</DialogDescription>
					</DialogHeader>

					<ReasonInput value={removeReason} onChange={setRemoveReason} minLength={10} rows={3} />

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setRemoveOpen(false)}
							disabled={removeMutation.isPending}
						>
							취소
						</Button>
						<Button
							variant="destructive"
							onClick={() => removeMutation.mutate()}
							disabled={!canRemove}
						>
							{removeMutation.isPending ? '제거 중…' : '사진 제거'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={regenOpen} onOpenChange={setRegenOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Sparkles className="h-4 w-4 text-violet-500" />
							슬롯 {slotIndex} — AI 재생성
						</DialogTitle>
						<DialogDescription>
							AI로 이 슬롯 사진만 새로 생성합니다. 실패해도 기존 사진은 보존됩니다.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-1">
							<Label className="text-xs">벤더</Label>
							<Select
								value={regenVendorId}
								onValueChange={(v) => {
									setRegenVendorId(v);
									setRegenRefs('');
								}}
							>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{VENDOR_SELECT_OPTIONS.map((opt) => (
										<SelectItem key={opt.id} value={opt.id}>
											<span>{opt.label}</span>
											<span className="ml-1.5 text-[10px] text-slate-400">{opt.pricePerImage}</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1">
							<div className="flex items-center justify-between">
								<Label className="text-xs">프롬프트 (선택)</Label>
								<GhostPromptPreviewModal age={ghostAge} vendor={vendor} />
							</div>
							<Textarea
								value={regenPrompt}
								onChange={(e) => setRegenPrompt(e.target.value)}
								placeholder="비워두면 프로필 기반 기본 프롬프트 사용"
								rows={2}
								className="text-xs"
							/>
						</div>

						{canUseReference && (
							<div className="space-y-1">
								<Label className="text-xs">레퍼런스 URL (선택, 줄바꿈으로 구분)</Label>
								<Textarea
									value={regenRefs}
									onChange={(e) => setRegenRefs(e.target.value)}
									placeholder="https://..."
									rows={2}
									className="text-xs"
								/>
							</div>
						)}

						<ReasonInput value={regenReason} onChange={setRegenReason} minLength={10} rows={2} />
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setRegenOpen(false)}
							disabled={regenMutation.isPending}
						>
							취소
						</Button>
						<Button
							onClick={() => regenMutation.mutate()}
							disabled={!canRegen}
							className="bg-violet-600 hover:bg-violet-700"
						>
							{regenMutation.isPending ? '생성 중…' : 'AI 재생성'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
