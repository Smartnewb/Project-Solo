import type { GhostProfileImage } from '@/app/types/ghost-injection';
import type { ApprovedPhotoCount } from '../lib/preview-simulation';
import { PREVIEW_WATERMARK_TEXT } from '../lib/preview-watermark';
import { PreviewBlurredPhoto } from './PreviewBlurredPhoto';

interface Props {
	image: GhostProfileImage;
	index: number; // 0-based
	approvedPhotoCount: ApprovedPhotoCount;
}

export function PreviewAdditionalPhoto({ image, index, approvedPhotoCount }: Props) {
	const requiredPhotos = index + 1;
	const blocked = approvedPhotoCount < requiredPhotos;
	const url = image.imageUrl || image.url;

	if (blocked) {
		return <PreviewBlurredPhoto sampleUrl={url} requiredPhotos={requiredPhotos} />;
	}

	return (
		<div className="my-4 aspect-square w-full overflow-hidden rounded-3xl px-3">
			<div className="relative h-full w-full overflow-hidden rounded-3xl">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="-rotate-12 text-xs text-white/30">{PREVIEW_WATERMARK_TEXT}</div>
				</div>
			</div>
		</div>
	);
}
