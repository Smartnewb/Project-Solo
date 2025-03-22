"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import ProfileSection from '@/components/profile/ProfileSection';
import PreferencesSection from '@/components/profile/PreferencesSection';
import NotificationList from '@/components/NotificationList';

type Tab = 'profile' | 'preferences' | 'notifications' | 'offline';

export default function MyProfilePage() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-3 bg-gray-200 rounded col-span-2"></div>
                <div className="h-3 bg-gray-200 rounded col-span-1"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-lg font-semibold mb-4">프로필</h1>
        <p>로그인이 필요합니다. <Link href="/login" className="text-blue-600 hover:underline">로그인 페이지로 이동</Link></p>
      </div>
    );
  }

  const tabs = [
    { id: 'profile' as Tab, name: '기본 정보' },
    { id: 'preferences' as Tab, name: '선호 조건' },
    { id: 'notifications' as Tab, name: '알림' },
    { id: 'offline' as Tab, name: '오프라인 데이팅', href: '/home/my-profile/offline' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSection />;
      case 'preferences':
        return <PreferencesSection />;
      case 'notifications':
        return (
          <div className="py-6">
            <h2 className="text-lg font-semibold mb-4">알림</h2>
            <NotificationList />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">내 프로필</h1>
      
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          {tabs.map((tab) => {
            if (tab.href) {
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className="py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300"
                >
                  {tab.name}
                </Link>
              );
            }
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
} 