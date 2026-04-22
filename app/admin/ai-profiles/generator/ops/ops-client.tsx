'use client';

import { GeneratorTabs } from '../_tabs';
import { CleanupSection } from './cleanup-section';
import { EventsDashboard } from './events-dashboard';

export function OpsClient() {
  return (
    <section className="space-y-4 px-6 py-8">
      <GeneratorTabs />
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">운영</h1>
        <p className="mt-1 text-sm text-slate-500">
          이벤트 지표와 archive cleanup을 관리합니다.
        </p>
      </header>
      <CleanupSection />
      <EventsDashboard />
    </section>
  );
}
