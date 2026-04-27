import type { GhostProfilePreviewResponse } from '@/app/types/ghost-injection';

export function PreviewMBTI({ profile }: { profile: GhostProfilePreviewResponse }) {
	if (!profile.mbti) return null;
	return (
		<div className="mx-3 my-4 rounded-2xl border border-slate-200 bg-white p-4">
			<div className="mb-2 text-xs font-medium text-slate-500">MBTI</div>
			<div className="text-2xl font-bold text-slate-900">{profile.mbti}</div>
			{profile.additionalPreferences && (
				<div className="mt-3 grid grid-cols-2 gap-3 text-xs">
					<div>
						<div className="text-slate-500">선호 MBTI</div>
						<div className="font-medium text-slate-700">
							{profile.additionalPreferences.goodMbti}
						</div>
					</div>
					<div>
						<div className="text-slate-500">기피 MBTI</div>
						<div className="font-medium text-slate-700">
							{profile.additionalPreferences.badMbti}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
