'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/utils';

const TABS = [
  { href: '/admin/ai-profiles/generator', label: 'Draft' },
  { href: '/admin/ai-profiles/generator/templates', label: '템플릿' },
  { href: '/admin/ai-profiles/generator/prompt-versions', label: '프롬프트 버전' },
  { href: '/admin/ai-profiles/generator/batch', label: '배치' },
];

export function GeneratorTabs() {
  const pathname = usePathname() ?? '';
  return (
    <nav className="flex gap-1 border-b">
      {TABS.map((tab) => {
        const active =
          pathname === tab.href ||
          (tab.href !== '/admin/ai-profiles/generator' &&
            pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-4 py-2 text-sm transition-colors',
              active
                ? 'border-b-2 border-slate-900 font-semibold text-slate-900'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
