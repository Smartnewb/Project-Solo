import type { GhostProfilePreviewResponse } from '@/app/types/ghost-injection';

export function PreviewBasicInfo({ profile }: { profile: GhostProfilePreviewResponse }) {
	return (
		<div className="space-y-3 px-4 py-4">
			<h3 className="text-base font-semibold text-slate-900">{profile.name} 님은</h3>
			{profile.introductions && profile.introductions.length > 0 && (
				<div className="space-y-2">
					{profile.introductions.map((line, i) => (
						<p key={i} className="text-sm leading-6 text-slate-700">
							{line}
						</p>
					))}
				</div>
			)}
			{profile.characteristics.map((group) => (
				<div key={group.typeKey ?? group.typeName}>
					<div className="mb-1 text-xs font-medium text-slate-500">{group.typeName}</div>
					<div className="flex flex-wrap gap-1.5">
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
			{profile.keywords && profile.keywords.length > 0 && (
				<div>
					<div className="mb-1 text-xs font-medium text-slate-500">키워드</div>
					<div className="flex flex-wrap gap-1.5">
						{profile.keywords.map((kw) => (
							<span
								key={kw}
								className="rounded-full bg-[#f7f7f7] px-2.5 py-1 text-xs text-[#e00b41]"
							>
								#{kw}
							</span>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
