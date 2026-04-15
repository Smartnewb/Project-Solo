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

export const DEFAULT_VENDOR: ImageVendor = 'seedream';
export const DEFAULT_VENDOR_ID = 'seedream';

export const GHOST_VENDOR_OPTIONS: VendorOption[] = [
	{
		id: 'seedream',
		value: 'seedream',
		label: 'Seedream 4.5',
		subtitle: '권장 · 한국 인물 특화',
		pricePerImage: '~$0.005',
		badges: ['저렴', 'img2img'],
		recommended: true,
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
		id: 'openai-1',
		value: 'openai',
		label: 'OpenAI gpt-image-1',
		subtitle: '자연어 이해 우수',
		pricePerImage: '~$0.04',
		badges: ['고가'],
	},
	{
		id: 'openai-2',
		value: 'openai',
		label: 'OpenAI gpt-image-2',
		subtitle: '출시 예정',
		pricePerImage: '~$0.10 (예상)',
		badges: ['출시 전'],
		disabled: true,
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
