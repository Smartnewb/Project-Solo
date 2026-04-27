import { Sparkles } from 'lucide-react';

export function PreviewCompatibilityPlaceholder() {
	return (
		<div className="mx-3 my-4 rounded-2xl border border-dashed border-purple-300 bg-purple-50/50 p-4">
			<div className="flex items-start gap-2">
				<Sparkles className="mt-0.5 h-4 w-4 text-purple-500" />
				<div>
					<div className="text-sm font-semibold text-purple-700">궁합 분석 카드</div>
					<div className="mt-1 text-xs text-purple-600/80">
						매칭 시 자동 생성됩니다. 미리보기에서는 표시되지 않습니다.
					</div>
				</div>
			</div>
		</div>
	);
}
