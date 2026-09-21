'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ghostChat } from '@/app/services/admin/ghost-chat';
import type {
	GhostChatConnectionState,
	GhostChatEvent,
} from '@/app/types/ghost-chat';

interface UseGhostChatEventsOptions {
	enabled?: boolean;
	onEvent?: (event: GhostChatEvent) => void;
	onReconnect?: () => void;
}

interface UseGhostChatEventsReturn {
	state: GhostChatConnectionState;
	lastEventAt: string | null;
	error: string | null;
	reconnect: () => void;
}

const RECONNECT_DELAY_MS = 3000;

export function useGhostChatEvents({
	enabled = true,
	onEvent,
	onReconnect,
}: UseGhostChatEventsOptions = {}): UseGhostChatEventsReturn {
	const [state, setState] = useState<GhostChatConnectionState>(
		enabled ? 'connecting' : 'closed',
	);
	const [lastEventAt, setLastEventAt] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const sourceRef = useRef<EventSource | null>(null);
	const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const enabledRef = useRef(enabled);
	const onEventRef = useRef(onEvent);
	const onReconnectRef = useRef(onReconnect);

	useEffect(() => {
		enabledRef.current = enabled;
	}, [enabled]);

	useEffect(() => {
		onEventRef.current = onEvent;
	}, [onEvent]);

	useEffect(() => {
		onReconnectRef.current = onReconnect;
	}, [onReconnect]);

	const clearReconnectTimer = useCallback(() => {
		if (reconnectTimerRef.current) {
			clearTimeout(reconnectTimerRef.current);
			reconnectTimerRef.current = null;
		}
	}, []);

	const closeSource = useCallback(() => {
		if (sourceRef.current) {
			sourceRef.current.close();
			sourceRef.current = null;
		}
	}, []);

	const connect = useCallback(() => {
		clearReconnectTimer();
		closeSource();

		if (!enabledRef.current) {
			setState('closed');
			return;
		}

		setState((current) => (current === 'reconnecting' ? 'reconnecting' : 'connecting'));

		const source = new EventSource(ghostChat.eventsUrl(), { withCredentials: true });
		sourceRef.current = source;

		source.addEventListener('open', () => {
			setState('connected');
			setError(null);
			setLastEventAt(new Date().toISOString());
		});

		source.addEventListener('message', (event) => {
			try {
				const parsed = JSON.parse((event as MessageEvent).data) as GhostChatEvent;
				onEventRef.current?.(parsed);
				setLastEventAt(new Date().toISOString());
			} catch {
				setError('Ghost Chat 이벤트를 해석할 수 없습니다.');
			}
		});

		source.addEventListener('error', () => {
			source.close();
			if (sourceRef.current === source) {
				sourceRef.current = null;
			}

			if (!enabledRef.current) {
				setState('closed');
				return;
			}

			setState('reconnecting');
			setError('실시간 연결이 끊어졌습니다. 재연결을 시도합니다.');
			onReconnectRef.current?.();
			reconnectTimerRef.current = setTimeout(() => {
				connect();
			}, RECONNECT_DELAY_MS);
		});
	}, [clearReconnectTimer, closeSource]);

	const reconnect = useCallback(() => {
		setState('reconnecting');
		onReconnectRef.current?.();
		connect();
	}, [connect]);

	useEffect(() => {
		if (!enabled) {
			clearReconnectTimer();
			closeSource();
			setState('closed');
			return;
		}

		enabledRef.current = true;
		connect();

		return () => {
			clearReconnectTimer();
			closeSource();
		};
	}, [clearReconnectTimer, closeSource, connect, enabled]);

	return {
		state,
		lastEventAt,
		error,
		reconnect,
	};
}
