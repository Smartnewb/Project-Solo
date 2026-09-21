'use client';

import { ChevronRight, LayoutGrid, Upload } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils';

export type StepStatus = 'pending' | 'active' | 'done';

interface ManualUploadStepperProps {
	uploadStatus: StepStatus;
	assignStatus: StepStatus;
}

export function ManualUploadStepper({
	uploadStatus,
	assignStatus,
}: ManualUploadStepperProps) {
	return (
		<ol className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs">
			<Step icon={Upload} label="① 사진 업로드" status={uploadStatus} />
			<ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden />
			<Step icon={LayoutGrid} label="② 슬롯 분배" status={assignStatus} />
		</ol>
	);
}

interface StepProps {
	icon: LucideIcon;
	label: string;
	status: StepStatus;
}

function Step({ icon: Icon, label, status }: StepProps) {
	const tone =
		status === 'done'
			? 'text-emerald-600'
			: status === 'active'
				? 'font-semibold text-slate-900'
				: 'text-slate-400';
	return (
		<li className={cn('flex items-center gap-1.5', tone)}>
			<Icon className="h-3.5 w-3.5" aria-hidden />
			<span>{label}</span>
		</li>
	);
}
