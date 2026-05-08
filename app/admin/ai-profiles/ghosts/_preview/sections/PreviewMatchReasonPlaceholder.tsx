import { Sparkles } from 'lucide-react';

export function PreviewMatchReasonPlaceholder() {
	return (
		<div className="mx-3 my-4 rounded-2xl border border-dashed border-[#ffd1da] bg-[#f7f7f7]/50 p-4">
			<div className="flex items-start gap-2">
				<Sparkles className="mt-0.5 h-4 w-4 text-[#ff385c]" />
				<div>
					<div className="text-sm font-semibold text-[#e00b41]">매칭 이유 카드</div>
					<div className="mt-1 text-xs text-[#ff385c]/80">
						매칭 시 미호 AI 가 자동 생성합니다. 미리보기에서는 표시되지 않습니다.
					</div>
				</div>
			</div>
		</div>
	);
}
