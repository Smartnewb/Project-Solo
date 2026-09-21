'use client';

import { type ReactNode } from 'react';
import { cn } from '@/shared/utils';

interface PhoneFrameProps {
	children: ReactNode;
	className?: string;
}

export function PhoneFrame({ children, className }: PhoneFrameProps) {
	return (
		<div
			className={cn(
				'relative h-[812px] w-[375px] overflow-hidden rounded-[44px]',
				'border-[14px] border-zinc-900 bg-white shadow-2xl',
				className,
			)}
		>
			{/* notch */}
			<div className="absolute left-1/2 top-0 z-50 h-[28px] w-[120px] -translate-x-1/2 rounded-b-2xl bg-zinc-900" />
			<div className="h-full w-full overflow-y-auto">{children}</div>
		</div>
	);
}
