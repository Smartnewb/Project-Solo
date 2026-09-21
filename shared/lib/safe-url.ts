/**
 * Returns the URL unchanged when it is safe to render into href/window.open,
 * else null. Allows same-origin relative paths (`/admin/...`) and absolute
 * http(s) URLs only — React does not strip `javascript:`/`data:` schemes, and
 * a crafted link on an admin page would run in the admin origin when clicked.
 */
export function sanitizeUrl(
	value?: string | null,
	{ allowRelative = true }: { allowRelative?: boolean } = {},
): string | null {
	if (!value || typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	if (allowRelative && trimmed.startsWith('/') && !trimmed.startsWith('//')) {
		return trimmed;
	}
	try {
		const url = new URL(trimmed);
		if (url.protocol === 'https:' || url.protocol === 'http:') {
			return url.toString();
		}
		return null;
	} catch {
		return null;
	}
}
