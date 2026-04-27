export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_IMAGE_MIME_SET = new Set<string>(ALLOWED_IMAGE_MIME);
export const ACCEPT_IMAGE_ATTR = ALLOWED_IMAGE_MIME.join(',');
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_MB = 10;

export type ImageValidationError =
	| { kind: 'mime'; filename: string }
	| { kind: 'size'; filename: string };

export function validateImageFile(file: File): ImageValidationError | null {
	if (!ALLOWED_IMAGE_MIME_SET.has(file.type)) return { kind: 'mime', filename: file.name };
	if (file.size > MAX_IMAGE_BYTES) return { kind: 'size', filename: file.name };
	return null;
}
