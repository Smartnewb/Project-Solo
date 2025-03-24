'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { formatRelativeTime } from '@/app/utils/formatters';
import { NotificationType } from '@/app/types/matching';
import Link from 'next/link';

interface Notification {
  id: string;
  user_id: string;
  content: string;
  type: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationListProps {
  onClose?: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 알림 불러오기
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      
      if (!response.ok) {
        throw new Error('알림을 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      setError(null);
    } catch (err) {
      console.error('알림 불러오기 오류:', err);
      setError('알림을 불러오는 중 오류가 발생했습니다.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId],
        }),
      });

      if (!response.ok) {
        throw new Error('알림 읽음 처리에 실패했습니다.');
      }

      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );

    } catch (err) {
      console.error('알림 읽음 처리 오류:', err);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    if (unreadNotifications.length === 0) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: unreadNotifications.map(n => n.id),
        }),
      });

      if (!response.ok) {
        throw new Error('모든 알림 읽음 처리에 실패했습니다.');
      }

      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );

    } catch (err) {
      console.error('모든 알림 읽음 처리 오류:', err);
    }
  };

  // 알림 유형에 따른 라우팅 및 액션
  const handleNotificationClick = (notification: Notification) => {
    // 읽음 처리
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // 관련 페이지로 이동
    const { type, related_id } = notification;
    
    if (onClose) {
      onClose();
    }

    if (type === NotificationType.MATCH_RESULT) {
      window.location.href = '/home/matching-result';
    } else if (type === NotificationType.MEETING_INVITATION || type === NotificationType.MEETING_RESPONSE) {
      window.location.href = '/home/my-profile/offline';
    }
  };

  // 알림 유형에 따른 배경색 결정
  const getNotificationBackground = (notification: Notification) => {
    if (notification.is_read) return 'bg-gray-50';
    
    switch(notification.type) {
      case NotificationType.MATCH_RESULT:
        return 'bg-blue-50';
      case NotificationType.MEETING_INVITATION:
        return 'bg-yellow-50';
      case NotificationType.MEETING_RESPONSE:
        return 'bg-green-50';
      default:
        return 'bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">알림을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">{error}</div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
        <h2 className="text-lg font-semibold">알림</h2>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={markAllAsRead}
            className="text-xs bg-white text-blue-600 px-2 py-1 rounded hover:bg-blue-50"
          >
            모두 읽음 처리
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            새로운 알림이 없습니다.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <li 
                key={notification.id}
                className={`${getNotificationBackground(notification)} hover:bg-gray-100 cursor-pointer transition duration-150`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="px-4 py-3">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm ${notification.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                      {notification.content}
                    </p>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatRelativeTime(notification.created_at)}
                    </span>
                  </div>
                  {!notification.is_read && (
                    <div className="mt-1 flex justify-end">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationList; 