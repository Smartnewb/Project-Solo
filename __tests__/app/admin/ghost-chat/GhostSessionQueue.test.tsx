import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GhostSessionQueue from '@/app/admin/ghost-chat/components/GhostSessionQueue';
import type { GhostChatSession } from '@/app/types/ghost-chat';

function makeSession(overrides: Partial<GhostChatSession> = {}): GhostChatSession {
	return {
		id: 'session-1',
		ghostAccountId: 'ghost-account-1',
		ghostUserId: 'ghost-user-1',
		targetUserId: 'target-user-1',
		matchId: 'match-1',
		chatRoomId: 'room-1',
		state: 'ACTIVE',
		assignedAdminId: null,
		assignedAt: null,
		firstUserMessageAt: '2026-05-03T09:00:00.000Z',
		lastUserMessageAt: null,
		lastAdminMessageAt: null,
		userMessageCount: 0,
		adminMessageCount: 0,
		closedAt: null,
		closedReason: null,
		createdAt: '2026-05-03T09:00:00.000Z',
		updatedAt: '2026-05-03T09:00:00.000Z',
		deletedAt: null,
		...overrides,
	};
}

describe('GhostSessionQueue', () => {
	it('orders cards by the latest chat activity and highlights sessions that need a reply', () => {
		const olderSession = makeSession({
			id: 'older-session',
			targetUserId: 'target-older',
			matchId: 'match-older',
			lastUserMessageAt: '2026-05-03T09:15:00.000Z',
			lastAdminMessageAt: '2026-05-03T09:20:00.000Z',
			updatedAt: '2026-05-03T09:20:00.000Z',
		});
		const recentReplyNeededSession = makeSession({
			id: 'recent-session',
			targetUserId: 'target-recent',
			matchId: 'match-recent',
			lastUserMessageAt: '2026-05-03T09:50:00.000Z',
			lastAdminMessageAt: '2026-05-03T09:30:00.000Z',
			updatedAt: '2026-05-03T09:50:00.000Z',
		});

		render(
			<GhostSessionQueue
				sessions={[olderSession, recentReplyNeededSession]}
				selectedSessionId={null}
				newSessionIds={new Set()}
				unreadMap={{}}
				getTargetProfilePreview={(id) => ({
					name: id === 'recent-session' ? '최근 상대' : '오래된 상대',
					subtitle: '테스트 프로필',
				})}
				onSelectSession={jest.fn()}
			/>,
		);

		const recentCardName = screen.getByText('최근 상대');
		const olderCardName = screen.getByText('오래된 상대');

		expect(
			recentCardName.compareDocumentPosition(olderCardName) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		expect(screen.getByText('답장 필요 · 최근 유저 메시지 우선 처리')).toBeInTheDocument();
	});
});
