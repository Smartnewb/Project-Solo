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
  const tokenRef = useRef<string | null>(null);
  const [state, setState] = useState<SocketState>({
    connected: false,
    sessionJoined: false,
    error: null,
  });

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (tokenRef.current) {
      return tokenRef.current;
    }
    try {
      const res = await fetch('/api/admin/auth/token');
      if (!res.ok) return null;
      const data = await res.json();
      const token = data.accessToken ?? null;
      tokenRef.current = token;
      return token;
    } catch {
      return null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (socketRef.current?.connected) {
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      setState((prev) => ({ ...prev, error: '인증 토큰이 없습니다.' }));
      return;
    }

    const socket = io(`${SOCKET_URL}/support-chat`, {
      auth: (cb) => {
        cb({ token: `Bearer ${token}` });
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setState((prev) => ({ ...prev, connected: true, error: null }));

      socket.emit('join_session', { sessionId }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          setState((prev) => ({ ...prev, sessionJoined: true }));
        } else {
          setState((prev) => ({ ...prev, error: response.error || '세션 참여에 실패했습니다.' }));
        }
      });
    });

    socket.on('connect_error', (error) => {
      setState((prev) => ({ ...prev, connected: false, error: `연결 실패: ${error.message}` }));
    });

    socket.on('disconnect', () => {
      setState((prev) => ({ ...prev, connected: false, sessionJoined: false }));
    });

    socket.on('new_message', (message: SupportMessage) => {
      onNewMessage?.(message);
    });

    socket.on('session_status_changed', (event: SessionStatusChangedEvent) => {
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
        resolve(false);
        return;
      }

      socketRef.current.emit(
        'send_message',
        { sessionId, content },
        (response: { success: boolean; error?: string }) => {
          if (response.success) {
            resolve(true);
          } else {
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
    tokenRef.current = null;
    disconnect();
    void connect();
  }, [disconnect, connect]);

  useEffect(() => {
    void connect();
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
