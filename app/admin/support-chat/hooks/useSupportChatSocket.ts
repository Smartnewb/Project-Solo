'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { SupportMessage, SupportSessionStatus } from '@/app/types/support-chat';

interface SocketState {
  connected: boolean;
  sessionJoined: boolean;
  error: string | null;
}

interface SessionStatusChangedEvent {
  sessionId: string;
  oldStatus: SupportSessionStatus;
  newStatus: SupportSessionStatus;
  assignedAdminId?: string;
}

interface TypingEvent {
  sessionId: string;
  userId: string;
  isTyping: boolean;
}

interface UseSupportChatSocketOptions {
  sessionId: string;
  onNewMessage?: (message: SupportMessage) => void;
  onStatusChanged?: (event: SessionStatusChangedEvent) => void;
  onTyping?: (event: TypingEvent) => void;
}

interface UseSupportChatSocketReturn {
  state: SocketState;
  sendMessage: (content: string) => Promise<boolean>;
  setTyping: (isTyping: boolean) => void;
  reconnect: () => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8044';

export function useSupportChatSocket({
  sessionId,
  onNewMessage,
  onStatusChanged,
  onTyping,
}: UseSupportChatSocketOptions): UseSupportChatSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<SocketState>({
    connected: false,
    sessionJoined: false,
    error: null,
  });

  const getAccessToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }, []);

  const connect = useCallback(() => {
    const token = getAccessToken();
    if (!token) {
      setState((prev) => ({ ...prev, error: '인증 토큰이 없습니다.' }));
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    const socket = io(`${SOCKET_URL}/support-chat`, {
      auth: (cb) => {
        cb({ token: `Bearer ${getAccessToken()}` });
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[SupportChat] WebSocket 연결됨');
      setState((prev) => ({ ...prev, connected: true, error: null }));

      socket.emit('join_session', { sessionId }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          console.log('[SupportChat] 세션 참여 성공:', sessionId);
          setState((prev) => ({ ...prev, sessionJoined: true }));
        } else {
          console.error('[SupportChat] 세션 참여 실패:', response.error);
          setState((prev) => ({ ...prev, error: response.error || '세션 참여에 실패했습니다.' }));
        }
      });
    });

    socket.on('connect_error', (error) => {
      console.error('[SupportChat] 연결 에러:', error.message);
      setState((prev) => ({ ...prev, connected: false, error: `연결 실패: ${error.message}` }));
    });

    socket.on('disconnect', (reason) => {
      console.log('[SupportChat] 연결 해제:', reason);
      setState((prev) => ({ ...prev, connected: false, sessionJoined: false }));
    });

    socket.on('new_message', (message: SupportMessage) => {
      console.log('[SupportChat] 새 메시지:', message);
      onNewMessage?.(message);
    });

    socket.on('session_status_changed', (event: SessionStatusChangedEvent) => {
      console.log('[SupportChat] 세션 상태 변경:', event);
      onStatusChanged?.(event);
    });

    socket.on('typing', (event: TypingEvent) => {
      onTyping?.(event);
    });

    socketRef.current = socket;
  }, [sessionId, getAccessToken, onNewMessage, onStatusChanged, onTyping]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState({ connected: false, sessionJoined: false, error: null });
    }
  }, []);

  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socketRef.current?.connected || !state.sessionJoined) {
        console.error('[SupportChat] 메시지 전송 실패: 연결되지 않음');
        resolve(false);
        return;
      }

      socketRef.current.emit(
        'send_message',
        { sessionId, content },
        (response: { success: boolean; error?: string }) => {
          if (response.success) {
            console.log('[SupportChat] 메시지 전송 성공');
            resolve(true);
          } else {
            console.error('[SupportChat] 메시지 전송 실패:', response.error);
            resolve(false);
          }
        }
      );
    });
  }, [sessionId, state.sessionJoined]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (socketRef.current?.connected && state.sessionJoined) {
      socketRef.current.emit('typing', { sessionId, isTyping });
    }
  }, [sessionId, state.sessionJoined]);

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [disconnect, connect]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    state,
    sendMessage,
    setTyping,
    reconnect,
  };
}
