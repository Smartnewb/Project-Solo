'use client';

import { ReactNode } from 'react';

interface DataStatusProps {
	isLoading: boolean;
	isError: boolean;
	error?: Error | null;
	isEmpty?: boolean;
	isStale?: boolean;
	staleMessage?: string;
	onRetry?: () => void;
	children: ReactNode;
	skeleton?: ReactNode;
}

export function DataStatus({
	isLoading,
	isError,
	error,
	isEmpty,
	isStale,
	staleMessage = 'API 미연동, 추정치입니다',
	onRetry,
	children,
	skeleton,
}: DataStatusProps) {
	if (isLoading) {
		return skeleton ?? (
			<div className="animate-pulse space-y-2">
				<div className="h-4 w-3/4 rounded bg-[#f2f2f2]" />
				<div className="h-4 w-1/2 rounded bg-[#f2f2f2]" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="rounded-[14px] border border-[#ffd1da] bg-[#fff5f7] p-4">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-[#c13515]">데이터 로드 실패</span>
				</div>
				{error?.message && (
					<p className="mt-1 text-xs text-[#c13515]">{error.message}</p>
				)}
				{onRetry && (
					<button
						onClick={onRetry}
						className="mt-2 text-xs text-[#c13515] underline hover:text-[#b32505]"
					>
						재시도
					</button>
				)}
			</div>
		);
	}

	if (isEmpty) {
		return (
			<div className="rounded-[14px] border border-[#dddddd] bg-[#f7f7f7] p-4 text-center">
				<p className="text-sm text-[#6a6a6a]">데이터 없음</p>
			</div>
		);
	}

	return (
		<>
			{isStale && (
				<div className="mb-2 inline-flex items-center rounded-full bg-[#fff8e8] px-2.5 py-0.5 text-xs font-medium text-[#b26a00]">
					{staleMessage}
				</div>
			)}
			{children}
		</>
	);
}
