import type { GhostProfilePreviewResponse } from '@/app/types/ghost-injection';

export function PreviewIdealType({ profile }: { profile: GhostProfilePreviewResponse }) {
	return (
		<div className="mx-3 my-4 rounded-2xl border border-slate-200 bg-white p-4">
			<div className="mb-3 text-base font-semibold text-slate-900">이상형</div>
			{profile.idealTypeResult && (
				<div className="mb-3">
					<div className="text-sm font-medium text-[#ff385c]">
						{profile.idealTypeResult.name}
					</div>
					<div className="mt-1 flex flex-wrap gap-1.5">
						{profile.idealTypeResult.tags.map((tag) => (
							<span
								key={tag}
								className="rounded-full bg-[#f7f7f7] px-2 py-0.5 text-xs text-[#e00b41]"
							>
								#{tag}
							</span>
						))}
					</div>
				</div>
			)}
			{profile.preferences.map((group) => (
				<div key={group.typeKey ?? group.typeName} className="mb-2">
					<div className="text-xs font-medium text-slate-500">{group.typeName}</div>
					<div className="mt-1 flex flex-wrap gap-1.5">
						{group.selectedOptions.map((opt) => (
							<span
								key={opt.id}
								className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
							>
								{opt.displayName}
							</span>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
