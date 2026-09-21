import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CommunityPostAppDetailPanel } from '@/app/admin/community/components/CommunityPostAppDetailPanel';
import type {
	LiveCommentSuggestion,
	ScheduledCommentTimelineItem,
} from '@/app/services/admin/community-automation';

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

const suggestions: LiveCommentSuggestion[] = [
	{
		tone: 'empathetic',
		content: '그건 진짜 고민될 만하다',
		reason: '게시글 감정에 공감',
		quality: {
			verdict: 'pass',
			scores: { naturalness: 0.9, relevance: 0.9, operatorLikeRisk: 0.1, safetyRisk: 0 },
		},
	},
	{
		tone: 'question',
		content: '혹시 주변에도 비슷한 사람 있어?',
		reason: '대화 질문',
		quality: {
			verdict: 'pass',
			scores: { naturalness: 0.8, relevance: 0.8, operatorLikeRisk: 0.1, safetyRisk: 0 },
		},
	},
	{
		tone: 'mood_shift',
		content: '일단 오늘은 맛있는 거 먹고 생각하자',
		reason: '분위기 전환',
		quality: {
			verdict: 'pass',
			scores: { naturalness: 0.8, relevance: 0.7, operatorLikeRisk: 0.1, safetyRisk: 0 },
		},
	},
];

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

	it('loads live comment suggestions and submits a selected candidate', async () => {
		const onLoadLiveCommentSuggestions = jest.fn().mockResolvedValue(suggestions);
		const onSubmitGhostComment = jest.fn().mockResolvedValue({
			comment: {
				id: 'comment-1',
				articleId: 'article-1',
				userId: 'ghost-user-1',
				nickname: '익명',
				content: suggestions[0].content,
				createdAt: '2026-05-06T10:00:00.000Z',
			},
			ghost: { ghostAccountId: 'ghost-account-1', ghostUserId: 'ghost-user-1', name: '고스트' },
			selectionMode: 'auto',
			ghostCandidateCount: 1,
		});

		render(
			<CommunityPostAppDetailPanel
				post={basePost}
				comments={[]}
				onSubmitGhostComment={onSubmitGhostComment}
				onLoadLiveCommentSuggestions={onLoadLiveCommentSuggestions}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: '댓글 후보 3개 추천' }));

		expect(await screen.findByText('공감형')).toBeInTheDocument();
		expect(screen.getByText('질문형')).toBeInTheDocument();
		expect(screen.getByText('분위기 전환형')).toBeInTheDocument();

		fireEvent.click(screen.getAllByRole('button', { name: '즉시 발송' })[1]);

		await waitFor(() => {
			expect(onSubmitGhostComment).toHaveBeenCalledWith('article-1', {
				content: suggestions[0].content,
				ghostAccountId: undefined,
				delayMinutes: undefined,
			});
		});
	});
});
