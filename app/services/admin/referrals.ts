import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';

type Envelope<T> = T | { data: T };

function unwrap<T>(response: Envelope<T>): T {
	return response && typeof response === 'object' && 'data' in response
		? (response as { data: T }).data
		: (response as T);
}

export type ReferralMode = 'STANDARD' | 'MANUAL_COMPENSATED';

export type ReferralOwner = {
	id: string;
	name: string;
	phoneSuffix: string;
	status: string | null;
	referralCode: string | null;
};

export type ReferralPreview = {
	state: string;
	reason: string | null;
	invitee: { id: string; name: string; phoneSuffix: string; status: string | null; createdAt: string | null };
	inviter: ReferralOwner | null;
	invitation: {
		id: string;
		referralCode: string;
		rewardMode: ReferralMode;
		rewardStatus: string;
		rewardCompletedAt: string | null;
	} | null;
	allowedActions: ReferralMode[];
	cached?: boolean;
};

export const referrals = {
	lookupCode: async (code: string): Promise<{ owner: ReferralOwner | null }> =>
		unwrap(await adminGet<Envelope<{ owner: ReferralOwner | null }>>(`/admin/v2/referrals/codes/${encodeURIComponent(code)}`)),
	preview: async (userId: string, referralCode: string): Promise<ReferralPreview> =>
		unwrap(await adminPost<Envelope<ReferralPreview>>(`/admin/v2/referrals/users/${userId}/preview`, { referralCode })),
	connect: async (
		userId: string,
		body: { referralCode: string; mode: ReferralMode; reason?: string },
		idempotencyKey: string,
	): Promise<ReferralPreview> =>
		unwrap(
			await adminPost<Envelope<ReferralPreview>>(
				`/admin/v2/referrals/users/${userId}/connect`,
				body,
				{ headers: { 'Idempotency-Key': idempotencyKey } },
			),
		),
};
