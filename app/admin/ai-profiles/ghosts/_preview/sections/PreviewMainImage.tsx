import { Check } from 'lucide-react';
import type { GhostProfilePreviewResponse } from '@/app/types/ghost-injection';
import type { PreviewCountry } from '../lib/preview-simulation';
import { PREVIEW_WATERMARK_TEXT } from '../lib/preview-watermark';

interface Props {
	profile: GhostProfilePreviewResponse;
	country: PreviewCountry;
}

const SMART_UNIV_LOGO_BASE = 'https://image.smartnewbie.dev/university';

function getUnivLogoUrl(code: string | null, country: PreviewCountry): string | null {
	if (!code) return null;
	return `${SMART_UNIV_LOGO_BASE}/${country}/${code}.png`;
}

function formatLastLogin(updatedAt: string | null): string {
	if (!updatedAt) return '오프라인';
	const diff = Date.now() - new Date(updatedAt).getTime();
	const hours = Math.floor(diff / (1000 * 60 * 60));
	if (hours < 1) return '방금 접속';
	if (hours < 24) return `${hours}시간 전`;
	return `${Math.floor(hours / 24)}일 전`;
}

export function PreviewMainImage({ profile, country }: Props) {
	const main = profile.profileImages.find((img) => img.isMain) ?? profile.profileImages[0];
	const url = main?.imageUrl || main?.url;
	const univLogo = getUnivLogoUrl(profile.universityDetails?.code ?? null, country);

	return (
		<div className="relative aspect-square w-full overflow-hidden">
			{url ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img src={url} alt="main" className="absolute inset-0 h-full w-full object-cover" />
			) : (
				<div className="absolute inset-0 bg-slate-200" />
			)}
			<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />

			{/* 워터마크 */}
			<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
				<div className="-rotate-12 text-xs text-white/30">{PREVIEW_WATERMARK_TEXT}</div>
			</div>

			{/* 오버레이 */}
			<div className="absolute bottom-4 left-5 right-5 text-white">
				<div className="mb-1 inline-flex items-center gap-1 rounded-md bg-[#ff385c] px-2 py-1 text-xs font-bold">
					<span>최근 접속</span>
					<span className="font-light">{formatLastLogin(profile.updatedAt)}</span>
				</div>
				<div className="mb-1 text-3xl font-bold">{profile.age}살</div>
				<div className="mb-1 flex items-center gap-2">
					{univLogo && (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={univLogo} alt="univ" className="h-5 w-5 object-contain" />
					)}
					<span className="text-base opacity-90">{profile.universityDetails?.name}</span>
				</div>
				{profile.universityDetails?.authentication && (
					<div className="flex items-center gap-1">
						<Check className="h-4 w-4 text-cyan-300" />
						<span className="text-sm text-cyan-300">대학 인증 완료</span>
					</div>
				)}
			</div>
		</div>
	);
}
