export function formatDate(value: string | null): string {
	if (!value) return '—';
	try {
		return new Date(value).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
	} catch {
		return value;
	}
}
