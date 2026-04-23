'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, RefreshCw, Sparkles } from 'lucide-react';
import { ghostInjection } from '@/app/services/admin/ghost-injection';
import type { ImageVendor, PromptPreviewQuery } from '@/app/types/ghost-injection';
import { Button } from '@/shared/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/shared/ui/dialog';

interface GhostPromptPreviewModalProps {
	age?: number;
	vendor?: ImageVendor;
	trigger?: React.ReactNode;
}

export function GhostPromptPreviewModal({ age, vendor, trigger }: GhostPromptPreviewModalProps) {
	const [open, setOpen] = useState(false);
	const [negativeOpen, setNegativeOpen] = useState(false);
	const [fetchKey, setFetchKey] = useState(0);

	const query: PromptPreviewQuery = {
		age: age && age >= 18 && age <= 40 ? age : undefined,
		vendor: vendor ?? 'seedream',
		count: 3,
		mode: 'random',
	};

	const previewQuery = useQuery({
		queryKey: ['ghost-prompt-preview', query, fetchKey],
		queryFn: () => ghostInjection.promptPreview(query),
		enabled: open,
		staleTime: 0,
	});

	const data = previewQuery.data;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger ?? (
					<button
						type="button"
						className="flex items-center gap-1 text-xs text-violet-600 underline hover:text-violet-800"
					>
						<Sparkles className="h-3 w-3" />
						프롬프트 미리보기
					</button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Sparkles className="h-4 w-4 text-violet-500" />
						프롬프트 미리보기
					</DialogTitle>
					<DialogDescription>
						실제 재생성 시 사용될 프롬프트 예시입니다. 매 호출마다 조합이 달라집니다.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{previewQuery.isLoading && (
						<div className="py-8 text-center text-sm text-slate-500">불러오는 중…</div>
					)}

					{previewQuery.isError && (
						<div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
							미리보기를 불러오지 못했습니다.
						</div>
					)}

					{data && (
						<>
							<div className="flex items-center justify-between">
								<span className="text-xs font-medium text-slate-500">
									벤더: <span className="text-slate-800">{data.vendor}</span>
								</span>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setFetchKey((k) => k + 1)}
									disabled={previewQuery.isFetching}
								>
									<RefreshCw className={`mr-1 h-3.5 w-3.5 ${previewQuery.isFetching ? 'animate-spin' : ''}`} />
									다시 뽑기
								</Button>
							</div>

							<ul className="space-y-2">
								{data.variants.map((variant, idx) => (
									<li
										key={idx}
										className="rounded-md border bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700"
									>
										<span className="mr-2 font-medium text-violet-600">#{idx + 1}</span>
										{variant}
									</li>
								))}
							</ul>

							{data.negativePrompt && (
								<div className="rounded-md border border-dashed border-slate-200">
									<button
										type="button"
										className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-slate-600"
										onClick={() => setNegativeOpen((prev) => !prev)}
									>
										네거티브 프롬프트 ({data.vendor})
										{negativeOpen ? (
											<ChevronUp className="h-3.5 w-3.5" />
										) : (
											<ChevronDown className="h-3.5 w-3.5" />
										)}
									</button>
									{negativeOpen && (
										<div className="border-t bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
											{data.negativePrompt}
										</div>
									)}
								</div>
							)}

							<p className="text-[11px] text-slate-400">{data.note}</p>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
