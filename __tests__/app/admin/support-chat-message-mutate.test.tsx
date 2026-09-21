import { canMutateSupportMessage } from '@/app/admin/support-chat/lib/can-mutate-message';

describe('canMutateSupportMessage', () => {
	it('allows bot replies for any admin', () => {
		expect(
			canMutateSupportMessage({ senderType: 'bot', senderId: undefined }, 'admin-1'),
		).toBe(true);
	});

	it('allows only the author for admin replies', () => {
		expect(
			canMutateSupportMessage({ senderType: 'admin', senderId: 'admin-1' }, 'admin-1'),
		).toBe(true);
		expect(
			canMutateSupportMessage({ senderType: 'admin', senderId: 'admin-2' }, 'admin-1'),
		).toBe(false);
	});

	it('rejects user messages', () => {
		expect(
			canMutateSupportMessage({ senderType: 'user', senderId: 'user-1' }, 'admin-1'),
		).toBe(false);
	});
});
