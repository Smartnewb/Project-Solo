import type { SupportMessage, SupportSenderType } from '@/app/types/support-chat';

export function canMutateSupportMessage(
	message: Pick<SupportMessage, 'senderType' | 'senderId'>,
	adminUserId?: string | null,
): boolean {
	if (message.senderType === 'bot') {
		return true;
	}
	if (message.senderType === 'admin' && !!adminUserId && message.senderId === adminUserId) {
		return true;
	}
	return false;
}

export function isSupportReplySender(senderType: SupportSenderType): boolean {
	return senderType === 'bot' || senderType === 'admin';
}
