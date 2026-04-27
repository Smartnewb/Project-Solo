import { Flag, Gem } from 'lucide-react';

export function PreviewHeader() {
	return (
		<div className="flex items-center justify-between px-4 py-3">
			<button className="text-slate-700" aria-label="back" disabled>
				←
			</button>
			<div className="flex items-center gap-2">
				<div className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1.5 text-xs">
					<Gem className="h-3.5 w-3.5 text-purple-600" />
					<span className="text-[9px] font-medium text-purple-500">내 구슬</span>
					<span className="text-[13px] font-extrabold text-purple-700">0개</span>
				</div>
				<button disabled aria-label="report">
					<Flag className="h-5 w-5 text-slate-400" />
				</button>
			</div>
		</div>
	);
}
