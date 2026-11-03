import { canMutateSupportMessage } from '@/app/admin/support-chat/lib/can-mutate-message';

describe('canMutateSupportMessage', () => {
	it('allows bot replies', () => {
		expect(canMutateSupportMessage({ senderType: 'bot' })).toBe(true);
	});

	it('allows admin replies regardless of author, including Slack replies without an author', () => {
		expect(canMutateSupportMessage({ senderType: 'admin' })).toBe(true);
	});

	it('rejects user messages', () => {
		expect(canMutateSupportMessage({ senderType: 'user' })).toBe(false);
	});
});
