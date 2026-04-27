'use client';

import Image from 'next/image';
import { useId, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Trash2, Upload, X } from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { useToast } from '@/shared/ui/admin/toast';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/utils';
import {
	ACCEPT_IMAGE_ATTR,
	MAX_IMAGE_MB,
	validateImageFile,
} from '@/app/admin/ai-profiles/_shared/image-upload-constants';
import type { UploadedPhotoLocal } from './use-ghost-batch-setup';

interface UploadZoneProps {
	uploaded: UploadedPhotoLocal[];
	remainingNeeded: number;
	totalNeeded: number;
	onUploadComplete: (results: UploadedPhotoLocal[]) => void;
	onRemove: (s3Url: string) => void;
	onClearAll: () => void;
}

export function UploadZone({
	uploaded,
	remainingNeeded,
	totalNeeded,
	onUploadComplete,
	onRemove,
	onClearAll,
}: UploadZoneProps) {
	const toast = useToast();
	const inputId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const [isDragOver, setIsDragOver] = useState(false);

	const mutation = useMutation({
		mutationFn: (files: File[]) => ghostInjection.uploadPhotos(files),
		onSuccess: (data) => {
			const results: UploadedPhotoLocal[] = data.uploads.map((u) => ({
				s3Url: u.s3Url,
				filename: u.filename,
				sizeBytes: u.sizeBytes,
			}));
			onUploadComplete(results);
			toast.success(`${results.length}장 업로드 완료`);
		},
		onError: (error) => toast.error(getAdminErrorMessage(error)),
	});

	const handleFiles = (selected: FileList | File[] | null) => {
		if (!selected) return;
		const all = Array.from(selected);
		if (all.length === 0) return;

		const validated: File[] = [];
		const rejected: string[] = [];
		for (const f of all) {
			const error = validateImageFile(f);
			if (error?.kind === 'mime') {
				rejected.push(`${error.filename}: 지원하지 않는 형식`);
				continue;
			}
			if (error?.kind === 'size') {
				rejected.push(`${error.filename}: ${MAX_IMAGE_MB}MB 초과`);
				continue;
			}
			validated.push(f);
		}

		if (rejected.length > 0) {
			toast.error(rejected.join(' · '));
		}

		let toUpload = validated;
		if (validated.length > remainingNeeded) {
			toUpload = validated.slice(0, remainingNeeded);
			toast.info(
				`${validated.length - remainingNeeded}장은 정원을 초과하여 제외되었습니다.`,
			);
		}

		if (toUpload.length === 0) return;
		mutation.mutate(toUpload);
	};

	const handleClick = () => {
		if (mutation.isPending || remainingNeeded <= 0) return;
		inputRef.current?.click();
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDragOver(false);
		if (mutation.isPending || remainingNeeded <= 0) return;
		handleFiles(event.dataTransfer.files);
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm font-semibold text-slate-800">업로드된 사진</p>
					<p className="text-xs text-slate-500">
						<span className="font-semibold text-slate-700 tabular-nums">
							{uploaded.length}
						</span>
						/{totalNeeded} (필요 {totalNeeded}장 · 페르소나 1명당 3장)
					</p>
				</div>
				{uploaded.length > 0 ? (
					<Button
						type="button"
						size="sm"
						variant="ghost"
						className="text-red-600 hover:bg-red-50 hover:text-red-700"
						onClick={onClearAll}
						disabled={mutation.isPending}
					>
						<Trash2 className="mr-1 h-3.5 w-3.5" />
						전체 삭제
					</Button>
				) : null}
			</div>

			<div
				onClick={handleClick}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleClick();
					}
				}}
				onDragOver={(e) => {
					e.preventDefault();
					if (!isDragOver) setIsDragOver(true);
				}}
				onDragLeave={() => setIsDragOver(false)}
				onDrop={handleDrop}
				role="button"
				tabIndex={0}
				className={cn(
					'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition',
					remainingNeeded <= 0
						? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
						: isDragOver
							? 'cursor-pointer border-slate-900 bg-slate-50 text-slate-700'
							: 'cursor-pointer border-slate-300 bg-white text-slate-600 hover:border-slate-500 hover:bg-slate-50',
				)}
			>
				<input
					ref={inputRef}
					id={inputId}
					type="file"
					multiple
					accept={ACCEPT_IMAGE_ATTR}
					hidden
					onChange={(e) => {
						handleFiles(e.target.files);
						e.currentTarget.value = '';
					}}
				/>
				{mutation.isPending ? (
					<>
						<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
						<p className="text-sm">업로드 중…</p>
					</>
				) : (
					<>
						<Upload className="h-6 w-6 text-slate-400" />
						<p className="text-sm font-medium">
							{remainingNeeded > 0
								? '드래그하여 업로드하거나 클릭해서 파일을 선택하세요'
								: '필요한 장수를 모두 업로드했습니다'}
						</p>
						<p className="text-xs text-slate-500">
							JPEG · PNG · WebP · {MAX_IMAGE_MB}MB 이하 · 더 필요한 장수 {Math.max(0, remainingNeeded)}장
						</p>
					</>
				)}
			</div>

			{uploaded.length > 0 ? (
				<div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
					{uploaded.map((item) => (
						<div
							key={item.s3Url}
							className="group relative aspect-square overflow-hidden rounded border border-slate-200 bg-slate-50"
						>
							<Image
								src={item.s3Url}
								alt={item.filename}
								fill
								sizes="120px"
								className="object-cover"
								unoptimized
							/>
							<button
								type="button"
								onClick={() => onRemove(item.s3Url)}
								className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-slate-700 opacity-0 transition group-hover:opacity-100 hover:bg-white"
								aria-label={`${item.filename} 삭제`}
							>
								<X className="h-3 w-3" />
							</button>
						</div>
					))}
				</div>
			) : null}
		</div>
	);
}
