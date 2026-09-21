import { Lock } from 'lucide-react';

export function PreviewBlurredPhoto({
	sampleUrl,
	requiredPhotos,
}: {
	sampleUrl?: string;
	requiredPhotos: number;
}) {
	return (
		<div className="my-4 aspect-square w-full px-3">
			<div className="relative h-full w-full overflow-hidden rounded-3xl bg-slate-200">
				{sampleUrl && (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={sampleUrl}
						alt=""
						className="absolute inset-0 h-full w-full object-cover blur-xl"
					/>
				)}
				<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 text-white">
					<Lock className="h-8 w-8" />
					<div className="text-sm font-medium">사진 {requiredPhotos}장 이상 등록 시 공개</div>
					<div className="text-xs opacity-80">
						내 사진을 추가하면 더 많은 사진을 볼 수 있어요
					</div>
				</div>
			</div>
		</div>
	);
}
