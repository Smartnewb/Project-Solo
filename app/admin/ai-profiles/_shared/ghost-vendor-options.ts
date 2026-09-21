import type { ImageVendor } from '@/app/types/ghost-injection';

export interface VendorOption {
	/** UI 고유 key (여러 모델이 같은 vendor를 쓸 수 있음) */
	id: string;
	value: ImageVendor;
	label: string;
	subtitle: string;
	pricePerImage: string;
	badges: string[];
	recommended?: boolean;
	disabled?: boolean;
	/** img2img 레퍼런스 지원 여부 */
	supportsReference?: boolean;
}

export const DEFAULT_VENDOR: ImageVendor = 'openai';
export const DEFAULT_VENDOR_ID = 'openai';

export const GHOST_VENDOR_OPTIONS: VendorOption[] = [
	{
		id: 'seedream',
		value: 'seedream',
		label: 'Seedream 4.5',
		subtitle: '일시 중지 · BytePlus 계정 제한 해제 필요',
		pricePerImage: '~$0.005',
		badges: ['저렴', 'img2img'],
		disabled: true,
		supportsReference: true,
	},
	{
		id: 'grok',
		value: 'grok',
		label: 'Grok Aurora (xAI)',
		subtitle: '포토리얼리즘 강점',
		pricePerImage: '~$0.02',
		badges: ['중간 단가'],
	},
	{
		id: 'openai',
		value: 'openai',
		label: 'OpenAI gpt-image-2',
		subtitle: '운영 기본 · 실제 생성 검증 완료',
		pricePerImage: '~$0.04',
		badges: ['고가'],
		recommended: true,
	},
];

export function findVendorOption(id: string): VendorOption | undefined {
	return GHOST_VENDOR_OPTIONS.find((option) => option.id === id);
}

/** vendor(enum)으로 UI 옵션을 찾을 때 — 주로 재생성 같은 compact UI 용 */
export function vendorOptionsForSelect(): VendorOption[] {
	return GHOST_VENDOR_OPTIONS.filter((option) => !option.disabled);
}

/** vendor enum이 img2img를 지원하는지 */
export function vendorSupportsReference(vendor: ImageVendor): boolean {
	return GHOST_VENDOR_OPTIONS.some((option) => option.value === vendor && option.supportsReference);
}
