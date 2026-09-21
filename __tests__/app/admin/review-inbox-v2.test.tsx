import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ReviewInboxV2 from '@/app/admin/review-inbox/review-inbox-v2';

const reviewInboxResponse = {
  summary: {
    approval: 2,
    judgment: 3,
    done: 19,
  },
  doneBreakdown: {
    profile_report: 6,
    community_report: 1,
    support_chat: 12,
  },
  buckets: {
    approval: {
      total: 2,
      items: [
        {
          id: 'profile_report:p-1',
          sourceKind: 'profile_report',
          sourceId: 'p-1',
          sourceStatus: 'pending',
          bucket: 'approval',
          title: '한국인 혐오 발언 프로필 신고',
          source: '프로필 신고 · 대기중',
          recommendation: '원본 화면에서 처리',
          why: '접수된 신고라 사람이 승인/반려를 결정해야 합니다.',
          summary: '프로필 소개글에 혐오 표현 신고가 접수되었습니다.',
          createdAt: '2026-04-15T09:00:00.000Z',
          evidence: [
            { id: 'e-1', type: 'text', label: '신고 사유 · 혐오 표현' },
            { id: 'e-2', type: 'image', label: '첨부 이미지 1장' },
          ],
          actions: [
            { id: 'open-profile-report', label: '원본 화면 열기', tone: 'primary', href: '/admin/reports' },
          ],
        },
        {
          id: 'community_report:c-1',
          sourceKind: 'community_report',
          sourceId: 'c-1',
          sourceStatus: 'pending',
          bucket: 'approval',
          title: '커뮤니티 게시글 신고',
          source: '커뮤니티 신고 · 대기중',
          recommendation: '원본 화면에서 처리',
          why: '게시글 신고가 접수되어 조치 여부를 정해야 합니다.',
          summary: '게시글 내용이 신고되어 검토가 필요합니다.',
          createdAt: '2026-04-15T08:00:00.000Z',
          evidence: [{ id: 'e-3', type: 'text', label: '게시글 제목 · 테스트 게시글' }],
          actions: [
            { id: 'open-community-report', label: '원본 화면 열기', tone: 'primary', href: '/admin/community' },
          ],
        },
      ],
    },
    judgment: {
      total: 3,
      items: [
        {
          id: 'support_chat:s-1',
          sourceKind: 'support_chat',
          sourceId: 's-1',
          sourceStatus: 'waiting_admin',
          bucket: 'judgment',
          title: '민지 문의 세션',
          source: '고객지원 · 어드민 대기',
          recommendation: '세션 열기',
          why: 'AI 응대 후 어드민 인수가 필요합니다.',
          summary: '환불이 안 들어왔어요',
          createdAt: '2026-04-15T10:00:00.000Z',
          evidence: [
            { id: 'e-4', type: 'history', label: '도메인 · 결제' },
            { id: 'e-5', type: 'text', label: '최근 메시지 · 환불이 안 들어왔어요' },
          ],
          actions: [
            { id: 'open-support-session', label: '세션 열기', tone: 'primary', href: '/admin/support-chat?session=s-1' },
          ],
        },
        {
          id: 'profile_report:p-2',
          sourceKind: 'profile_report',
          sourceId: 'p-2',
          sourceStatus: 'reviewing',
          bucket: 'judgment',
          title: '프로필 사진 품질 논란 — 셀카 vs 타인 사진',
          source: '프로필 신고 · 검토중',
          recommendation: '최종 판단 필요',
          why: '이미 검토중 상태라 최종 판단이 남았습니다.',
          summary: '프로필 사진 진위 여부를 사람이 직접 판단해야 합니다.',
          createdAt: '2026-04-15T07:00:00.000Z',
          evidence: [{ id: 'e-6', type: 'image', label: '프로필 사진 2장 비교' }],
          actions: [
            { id: 'open-profile-report-reviewing', label: '원본 화면 열기', tone: 'primary', href: '/admin/reports' },
          ],
        },
      ],
    },
    done: {
      total: 19,
      items: [
        {
          id: 'support_chat:s-done-1',
          sourceKind: 'support_chat',
          sourceId: 's-done-1',
          sourceStatus: 'resolved',
          bucket: 'done',
          title: '혜진 문의 세션',
          source: '1:1 문의 · 해결 완료',
          recommendation: '세션 다시 보기',
          why: 'AI가 먼저 응대한 뒤 어드민이 이어서 정리한 1:1 문의입니다.',
          summary: '문제 해결됐어요 감사합니다',
          createdAt: '2026-04-12T10:00:00.000Z',
          completedAt: '2026-04-15T11:00:00.000Z',
          handlerKind: 'ai_assisted',
          handlerLabel: 'AI 응대 후 어드민 개입',
          evidence: [
            { id: 'done-1', type: 'history', label: '도메인 · 계정' },
            { id: 'done-2', type: 'history', label: '처리 결과 · 해결 완료' },
            { id: 'done-3', type: 'history', label: '처리 방식 · AI 응대 후 어드민 개입' },
          ],
          actions: [
            { id: 'open-support-session-done', label: '세션 다시 보기', tone: 'primary', href: '/admin/support-chat?session=s-done-1' },
          ],
        },
      ],
    },
  },
  generatedAt: '2026-04-15T10:01:00.000Z',
  warnings: [],
};

describe('ReviewInboxV2', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(reviewInboxResponse),
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the simplified inbox and switches review buckets', async () => {
    const user = userEvent.setup();

    render(<ReviewInboxV2 />);

    expect(await screen.findByRole('heading', { level: 1, name: '검토 인박스' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '사람 승인 필요 2건 보기' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('heading', { level: 2, name: '한국인 혐오 발언 프로필 신고' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '직접 판단 필요 3건 보기' }));

    expect(screen.getByRole('button', { name: '직접 판단 필요 3건 보기' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('heading', { level: 2, name: '민지 문의 세션' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '완료 이력 19건 보기' }));

    expect(screen.getByRole('button', { name: '완료 이력 19건 보기' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('heading', { level: 2, name: '혜진 문의 세션' })).toBeInTheDocument();
    expect(screen.getAllByText('1:1 문의')[0]).toBeInTheDocument();
    expect(screen.getAllByText('AI 응대 후 어드민 개입')[0]).toBeInTheDocument();
  });
});
