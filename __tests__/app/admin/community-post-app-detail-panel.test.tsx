import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CommunityPostAppDetailPanel } from '@/app/admin/community/components/CommunityPostAppDetailPanel';
import type { ScheduledCommentTimelineItem } from '@/app/services/admin/community-automation';

const basePost = {
	id: 'article-1',
	title: '게시글 제목',
	content: '게시글 본문',
	authorName: '작성자',
	createdAt: '2026-05-06T10:00:00.000Z',
};

const scheduledItem: ScheduledCommentTimelineItem = {
	contentId: 'content-1',
	articleId: 'article-1',
	ghostAccountId: 'ghost-account-1',
	ghostName: '고스트',
	ghostUserId: 'ghost-user-1',
	content: '예약 댓글',
	status: 'scheduled',
	scheduledAt: '2026-05-06T10:30:00.000Z',
	publishedAt: null,
	commentId: null,
	rejectionReason: null,
	createdAt: '2026-05-06T10:00:00.000Z',
	updatedAt: null,
	healthFlags: ['due_soon'],
};

function renderPanel(items: ScheduledCommentTimelineItem[]) {
	return render(
		<CommunityPostAppDetailPanel
			post={basePost}
			comments={[]}
			onSubmitGhostComment={jest.fn()}
			scheduledComments={items}
			onReloadScheduledComments={jest.fn()}
			onCancelScheduledComment={jest.fn()}
			onRescheduleScheduledComment={jest.fn()}
		/>,
	);
}

describe('CommunityPostAppDetailPanel scheduled timeline', () => {
	it('maps scheduled status and health labels and exposes scheduled actions', () => {
		renderPanel([scheduledItem]);

		fireEvent.click(screen.getByRole('tab', { name: '예약 타임라인' }));

		expect(screen.getByText('예약 댓글')).toBeInTheDocument();
		expect(screen.getByText('예약됨')).toBeInTheDocument();
		expect(screen.getByText('5분 이내')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '시간 변경' })).toBeInTheDocument();
	});

	it('does not expose actions for published or withdrawn items', () => {
		renderPanel([
			{ ...scheduledItem, contentId: 'content-2', content: '발화 댓글', status: 'published' },
			{ ...scheduledItem, contentId: 'content-3', content: '취소 댓글', status: 'withdrawn' },
		]);

		fireEvent.click(screen.getByRole('tab', { name: '예약 타임라인' }));

		expect(screen.getByText('발화됨')).toBeInTheDocument();
		expect(screen.getByText('취소됨')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: '취소' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: '시간 변경' })).not.toBeInTheDocument();
	});
});
