import React from 'react';
import OfflineDatingSection from '@/app/components/OfflineDatingSection';

export default function OfflineDatingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">오프라인 소개팅 관리</h1>
      <OfflineDatingSection title="나의 오프라인 소개팅" />
    </div>
  );
} 