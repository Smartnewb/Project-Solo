import type { PushRegistryNotificationEntry } from '@/app/services/admin/push-notification-registry';

export type PushRegistryView = 'table' | 'graph';

export type RegistryRow = {
	eventType: string;
	entry: PushRegistryNotificationEntry;
};

export type RegistryFilters = {
	search: string;
	category: string;
	trigger: string;
	audience: string;
	persistence: string;
	throttle: string;
	suppressInRoom: string;
	direct: string;
};

export const initialRegistryFilters: RegistryFilters = {
	search: '',
	category: 'all',
	trigger: 'all',
	audience: 'all',
	persistence: 'all',
	throttle: 'all',
	suppressInRoom: 'all',
	direct: 'all',
};

export const formatTrigger = (entry: PushRegistryNotificationEntry): string => {
	if (entry.trigger.type === 'cron') {
		return `${entry.trigger.schedule} · ${entry.trigger.timeZone ?? 'timezone 없음'}`;
	}
	return 'event';
};

export const formatAudience = (entry: PushRegistryNotificationEntry): string =>
	entry.audience.type === 'query' ? entry.audience.resolver : 'single';

export const formatPersistence = (entry: PushRegistryNotificationEntry): string =>
	entry.persistence ? `${entry.persistence.type}/${entry.persistence.subType}` : '저장 안 함';

export const formatThrottle = (entry: Pick<PushRegistryNotificationEntry, 'throttle'>): string =>
	entry.throttle ? `${entry.throttle.key} · ${entry.throttle.ttlSeconds}s` : '-';

const includesText = (value: string, search: string): boolean =>
	value.toLowerCase().includes(search.toLowerCase());

export function filterRegistryRows(rows: RegistryRow[], filters: RegistryFilters): RegistryRow[] {
	return rows.filter(({ eventType, entry }) => {
		const text = [
			eventType,
			entry.category,
			formatTrigger(entry),
			formatAudience(entry),
			entry.template.ko.title,
			entry.template.ko.body,
			entry.template.ja.title,
			entry.template.ja.body,
			entry.route,
			entry.deepLink ?? '',
			entry.requiredFields.join(' '),
			formatPersistence(entry),
			formatThrottle(entry),
		].join(' ');
		if (filters.search && !includesText(text, filters.search)) return false;
		if (filters.category !== 'all' && entry.category !== filters.category) return false;
		if (filters.trigger !== 'all' && entry.trigger.type !== filters.trigger) return false;
		if (filters.audience !== 'all' && entry.audience.type !== filters.audience) return false;
		if (filters.persistence === 'persisted' && !entry.persistence) return false;
		if (filters.persistence === 'none' && entry.persistence) return false;
		if (filters.throttle === 'enabled' && !entry.throttle) return false;
		if (filters.throttle === 'disabled' && entry.throttle) return false;
		if (filters.suppressInRoom === 'true' && !entry.suppressInRoom) return false;
		if (filters.suppressInRoom === 'false' && entry.suppressInRoom) return false;
		return true;
	});
}
