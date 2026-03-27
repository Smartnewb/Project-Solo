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
				<div className="h-4 bg-gray-200 rounded w-3/4" />
				<div className="h-4 bg-gray-200 rounded w-1/2" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="rounded-md bg-red-50 p-4">
				<div className="flex items-center gap-2">
					<span className="text-red-600 text-sm font-medium">데이터 로드 실패</span>
				</div>
				{error?.message && (
					<p className="mt-1 text-red-500 text-xs">{error.message}</p>
				)}
				{onRetry && (
					<button
						onClick={onRetry}
						className="mt-2 text-xs text-red-600 underline hover:text-red-800"
					>
						재시도
					</button>
				)}
			</div>
		);
	}

	if (isEmpty) {
		return (
			<div className="rounded-md bg-gray-50 p-4 text-center">
				<p className="text-gray-500 text-sm">데이터 없음</p>
			</div>
		);
	}

	return (
		<>
			{isStale && (
				<div className="mb-2 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
					{staleMessage}
				</div>
			)}
			{children}
		</>
	);
}
