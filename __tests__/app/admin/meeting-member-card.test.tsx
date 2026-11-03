import React from 'react';
jest.mock('next/dynamic', () => () => function ProfileModal(props: { userId: string; spacious: boolean; onClose: () => void }) {
 return <div role="dialog" aria-label="프로필 상세"><span>{props.userId}</span><span>{props.spacious ? '큰 화면' : ''}</span><button onClick={props.onClose}>닫기</button></div>;
});
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemberCard, type MemberView } from '@/app/admin/meeting/member-card';

function view(status: NonNullable<MemberView['deposit']>['status'], contactRestricted = false): MemberView {
	return {
		member: {
			memberId: 'member-1', userId: 'user-1', name: '검증 참가자', gender: 'MALE',
			teamId: 'team-1', side: 'HOST', leftAt: null, contactRestricted, lastAdminAction: null,
		},
		deposit: {
			id: 'deposit-1', roomId: 'room-1', memberId: 'member-1', paymentId: 'payment-1',
			idempotencyKey: 'key-1', amount: 30000, refundedAmount: status === 'PARTIALLY_REFUNDED' ? 10000 : 0,
			status, paidAt: '2026-10-01T00:00:00Z', settledAt: null, lastError: null,
			createdAt: '2026-10-01T00:00:00Z', updatedAt: null, deletedAt: null,
		},
		checkin: null,
	};
}

describe('Meeting member refund correction', () => {
	it.each(['FORFEITED', 'PARTIALLY_REFUNDED'] as const)('allows correction of %s after a contact dispute is cleared', (status) => {
		const memberView = view(status);
		const onAction = jest.fn();
		render(<MemberCard view={memberView} roomStatus="SETTLED" busy={false} onAction={onAction} />);
		fireEvent.click(screen.getByRole('button', { name: '환불 정정' }));
		expect(onAction).toHaveBeenCalledWith('refund', memberView);
	});

	it('requires clearing the contact restriction before correcting a forfeiture', () => {
		render(<MemberCard view={view('FORFEITED', true)} roomStatus="SETTLED" busy={false} onAction={jest.fn()} />);
		expect(screen.queryByRole('button', { name: '환불 정정' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: '연락처 제한 해제' })).toBeEnabled();
	});

	it.each(['SETTLING', 'FULLY_REFUNDED'] as const)('never offers another refund for %s', (status) => {
		render(<MemberCard view={view(status)} roomStatus="SETTLED" busy={false} onAction={jest.fn()} />);
		expect(screen.queryByRole('button', { name: /환불 정정|환불 재시도/ })).not.toBeInTheDocument();
	});
});

 it('shows participant identity without technical IDs and handles a broken photo', () => {
    const memberView = view('FULLY_REFUNDED');
    Object.assign(memberView.member, { age: 24, appearanceGrade: 'A', universityName: '테스트대학교', profileImageUrl: '/photo.jpg' });
    render(<MemberCard view={memberView} roomStatus="SETTLED" busy={false} onAction={jest.fn()} />);
    expect(screen.getByText('검증 참가자')).toBeVisible();
    expect(screen.queryByText(/24세/)).not.toBeInTheDocument();
    expect(screen.getByText(/A등급/)).toBeVisible();
    expect(screen.getByText('테스트대학교')).toBeVisible();
    expect(screen.queryByText(/user-1|member-1/)).not.toBeInTheDocument();
    fireEvent.error(screen.getByRole('img', { name: '검증 참가자 프로필' }));
    expect(screen.getByText('사진 없음')).toBeVisible();
 });

it('opens the selected participant in the spacious profile modal and closes it', () => {
 render(<MemberCard view={view('FULLY_REFUNDED')} roomStatus="SETTLED" busy={false} onAction={jest.fn()} />);
 fireEvent.click(screen.getByRole('button', { name: '프로필 상세보기' }));
 expect(screen.getByRole('dialog', { name: '프로필 상세' })).toBeVisible();
 expect(screen.getByText('user-1')).toBeVisible();
 expect(screen.getByText('큰 화면')).toBeVisible();
 fireEvent.click(screen.getByRole('button', { name: '닫기' }));
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
