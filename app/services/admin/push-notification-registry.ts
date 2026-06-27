import { adminGet } from '@/shared/lib/http/admin-fetch';

export type PushRegistryTrigger =
	| { type: 'event' }
	| { type: 'cron'; schedule: string; timeZone?: string };

export type PushRegistryAudience =
	| { type: 'single' }
	| { type: 'query'; resolver: string };

export interface PushRegistryTemplate {
	title: string;
	body: string;
}

export interface PushRegistryThrottle {
	key: string;
	ttlSeconds: number;
}

export interface PushRegistryPersistence {
	type: string;
	subType: string;
}

export interface PushRegistryNotificationEntry {
	category: string;
	route: string;
	deepLink: string | null;
	requiredFields: string[];
	suppressInRoom: boolean;
	trigger: PushRegistryTrigger;
	audience: PushRegistryAudience;
	template: Record<'ko' | 'ja', PushRegistryTemplate>;
	persistence: PushRegistryPersistence | null;
	throttle: PushRegistryThrottle | null;
	skipOnlineCheck: boolean;
	skipPersist: boolean;
	badge: number | null;
}

export interface DirectPushNotificationEntry {
	id: string;
	label: string;
	category: string;
	status: 'active' | 'disabled';
	trigger: string;
	audience: string;
	template: Partial<Record<'ko' | 'ja', PushRegistryTemplate>>;
	route: string;
	deepLink: string | null;
	requiredFields: string[];
	persistence: PushRegistryPersistence | null;
	throttle: PushRegistryThrottle | null;
	skipOnlineCheck: boolean;
	skipPersist: boolean;
	readonly: true;
	source: string;
	notes: string[];
}

export interface PushNotificationAdminRegistryResponse {
	version: string;
	notifications: Record<string, PushRegistryNotificationEntry>;
	directNotifications: DirectPushNotificationEntry[];
	stats: {
		total: number;
		byCategory: Record<string, number>;
		byTrigger: Record<string, number>;
	};
}

const normalizeStringArray = (value: unknown): string[] => {
	if (!Array.isArray(value)) return [];
	return value.filter((item): item is string => typeof item === 'string');
};

const normalizeNotificationEntry = (
	entry: PushRegistryNotificationEntry,
): PushRegistryNotificationEntry => ({
	...entry,
	requiredFields: normalizeStringArray(entry.requiredFields),
});

const normalizeDirectNotificationEntry = (
	entry: DirectPushNotificationEntry,
): DirectPushNotificationEntry => ({
	...entry,
	requiredFields: normalizeStringArray(entry.requiredFields),
	notes: normalizeStringArray(entry.notes),
});

const normalizeRegistryResponse = (
	response: PushNotificationAdminRegistryResponse,
): PushNotificationAdminRegistryResponse => {
	const notifications: Record<string, PushRegistryNotificationEntry> = {};
	for (const [eventType, entry] of Object.entries(response.notifications ?? {})) {
		notifications[eventType] = normalizeNotificationEntry(entry);
	}

	return {
		...response,
		notifications,
		directNotifications: (response.directNotifications ?? []).map(normalizeDirectNotificationEntry),
	};
};

export const pushNotificationRegistry = {
	getRegistry: async (): Promise<PushNotificationAdminRegistryResponse> =>
		normalizeRegistryResponse(
			await adminGet<PushNotificationAdminRegistryResponse>('/admin/notifications/registry'),
		),
};
