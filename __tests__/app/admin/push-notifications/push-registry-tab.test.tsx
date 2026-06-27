import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PushRegistryTab } from '@/app/admin/push-notifications/components/push-registry-tab';
import { pushNotificationRegistry } from '@/app/services/admin/push-notification-registry';

jest.mock('@/app/services/admin/push-notification-registry', () => ({
	pushNotificationRegistry: {
		getRegistry: jest.fn(),
	},
}));

const registryFixture = {
	version: '2026-05-14-001',
	stats: {
		total: 46,
		byCategory: { campaign: 5, chat: 2 },
		byTrigger: { event: 42, cron: 4 },
	},
	notifications: {
		campaign_reminder: {
			category: 'campaign',
			route: '/home',
			deepLink: 'sometimes://home',
			requiredFields: ['remaining'],
			suppressInRoom: false,
			trigger: { type: 'cron', schedule: '0 19 * * *', timeZone: 'Asia/Seoul' },
			audience: { type: 'query', resolver: 'campaignIncompleteFemales' },
			template: {
				ko: { title: '아직 확인하지 않은 추천이 있어요', body: '오늘의 추천 명이 기다리고 있어요' },
				ja: { title: 'まだ確認していないおすすめがあります', body: '今日のおすすめ人が待っています' },
			},
			persistence: { type: 'general', subType: 'campaign_reminder' },
			throttle: { key: 'campaign-reminder:{userId}:{date}', ttlSeconds: 86400 },
			skipOnlineCheck: false,
			skipPersist: false,
			badge: null,
		},
		chat_message: {
			category: 'chat',
			route: '/chat/rooms',
			deepLink: null,
			requiredFields: ['roomId', 'senderId'],
			suppressInRoom: true,
			trigger: { type: 'event' },
			audience: { type: 'single' },
			template: {
				ko: { title: '새 메시지가 도착했어요', body: '대화를 확인해보세요' },
				ja: { title: '新しいメッセージが届きました', body: '会話を確認しましょう' },
			},
			persistence: { type: 'chat', subType: 'chat_message' },
			throttle: null,
			skipOnlineCheck: true,
			skipPersist: false,
			badge: 1,
		},
	},
	directNotifications: [
		{
			id: 'voice-call',
			label: 'Voice call push',
			category: 'system',
			status: 'active',
			trigger: 'voice call lifecycle events',
			audience: 'call participant',
			template: { ko: { title: '통화 알림', body: '상대방이 기다리고 있어요' } },
			route: '/voice-call',
			deepLink: null,
			requiredFields: ['callId'],
			persistence: null,
			throttle: null,
			skipOnlineCheck: true,
			skipPersist: true,
			readonly: true,
			source: 'src/voice-call/services/voice-call.service.ts',
			notes: ['registry-external direct send'],
		},
	],
};

describe('PushRegistryTab', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders registry summary, rows, details, and filters from the admin registry', async () => {
		(pushNotificationRegistry.getRegistry as jest.Mock).mockResolvedValue(registryFixture);

		render(<PushRegistryTab view="table" />);

		expect(screen.getByText('상황별 알림을 불러오는 중입니다')).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByText('총 46개')).toBeInTheDocument();
		});

		expect(screen.getByText('이벤트 42개 · 크론 4개')).toBeInTheDocument();
		expect(screen.getAllByText('campaign_reminder').length).toBeGreaterThan(0);
		expect(screen.getAllByText('0 19 * * *에 자동 발송 (Asia/Seoul)').length).toBeGreaterThan(0);
		expect(screen.getAllByText('캠페인 참여가 끝나지 않은 여성 유저').length).toBeGreaterThan(0);
		expect(screen.getAllByText('캠페인 참여가 끝나지 않은 유저에게 오늘 확인할 추천이 남아 있을 때 보냅니다.').length).toBeGreaterThan(0);
		expect(screen.getAllByText('remaining').length).toBeGreaterThan(0);
		expect(screen.getAllByText('오늘의 추천 명이 기다리고 있어요').length).toBeGreaterThan(0);
		expect(screen.getAllByText('Throttle: campaign-reminder:{userId}:{date} · 86400s').length).toBeGreaterThan(0);
		expect(screen.getAllByText('채팅방 안 억제: 아니오').length).toBeGreaterThan(0);
		expect(screen.getByText('Voice call push')).toBeInTheDocument();
		expect(screen.getByText('body: 상대방이 기다리고 있어요')).toBeInTheDocument();
		expect(screen.getAllByText('deepLink: -').length).toBeGreaterThan(0);
		expect(screen.getAllByText('skipOnlineCheck: true').length).toBeGreaterThan(0);
		expect(screen.getByText('skipPersist: true')).toBeInTheDocument();
		expect(screen.getByText('notes: registry-external direct send')).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText('검색'), { target: { value: 'chat' } });
		expect(screen.getAllByText('chat_message').length).toBeGreaterThan(0);
		expect(screen.queryByText('campaign_reminder')).not.toBeInTheDocument();

		expect(screen.queryByRole('button', { name: /발송/ })).not.toBeInTheDocument();
	});

	it('starts from the structure graph and filters to the table from category and notification clicks', async () => {
		(pushNotificationRegistry.getRegistry as jest.Mock).mockResolvedValue(registryFixture);
		const onViewChange = jest.fn();

		render(<PushRegistryTab view="graph" onViewChange={onViewChange} />);

		await waitFor(() => {
			expect(screen.getByRole('heading', { name: '알림 구조도' })).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole('button', { name: /채팅/ }));

		expect(onViewChange).toHaveBeenCalledWith('table');
		expect(screen.getByText('구조도에서 선택한 알림만 보고 있습니다.')).toBeInTheDocument();
		expect(screen.getAllByText('chat_message').length).toBeGreaterThan(0);
		expect(screen.queryByText('campaign_reminder')).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: '구조도' }));
		fireEvent.click(screen.getByRole('button', { name: '전체 보기' }));
		fireEvent.click(screen.getByText('campaign_reminder · 자동'));

		expect(screen.getAllByText('campaign_reminder').length).toBeGreaterThan(0);
		expect(screen.queryByText('chat_message')).not.toBeInTheDocument();
	});

	it('keeps rendering when browser history restores registry entries without array fields', async () => {
		(pushNotificationRegistry.getRegistry as jest.Mock).mockResolvedValue({
			...registryFixture,
			notifications: {
				chat_message: {
					...registryFixture.notifications.chat_message,
					requiredFields: undefined,
				},
			},
			directNotifications: [
				{
					...registryFixture.directNotifications[0],
					requiredFields: undefined,
					notes: undefined,
				},
			],
		});

		render(<PushRegistryTab view="graph" />);

		await waitFor(() => {
			expect(screen.getByRole('heading', { name: '알림 구조도' })).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole('button', { name: /채팅/ }));
		fireEvent.click(screen.getByRole('button', { name: '구조도' }));
		fireEvent.click(screen.getByRole('button', { name: '전체 보기' }));

		expect(screen.getByRole('heading', { name: '알림 구조도' })).toBeInTheDocument();
		expect(screen.getByText('Registry 외부 직접 발송')).toBeInTheDocument();
	});

	it('renders deterministic error and empty states', async () => {
		(pushNotificationRegistry.getRegistry as jest.Mock).mockRejectedValueOnce(new Error('boom'));
		const { unmount } = render(<PushRegistryTab view="table" />);

		await waitFor(() => {
			expect(screen.getByText('상황별 알림을 불러오지 못했습니다')).toBeInTheDocument();
		});

		unmount();
		(pushNotificationRegistry.getRegistry as jest.Mock).mockResolvedValueOnce({
			...registryFixture,
			stats: { ...registryFixture.stats, total: 0, byTrigger: {}, byCategory: {} },
			notifications: {},
			directNotifications: [],
		});
		render(<PushRegistryTab view="table" />);

		await waitFor(() => {
			expect(screen.getByText('등록된 상황별 알림이 없습니다')).toBeInTheDocument();
		});
	});
});
