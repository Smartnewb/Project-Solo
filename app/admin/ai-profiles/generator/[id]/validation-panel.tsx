'use client';

import { AlertTriangle, ShieldAlert } from 'lucide-react';
import type { AiProfileDraft } from '@/app/types/ai-profile-generator';
import { cn } from '@/shared/utils';

interface Props {
  validation: AiProfileDraft['validation'];
}

const SEVERITY_CLASS: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-slate-50 border-slate-200 text-slate-700',
  medium: 'bg-amber-50 border-amber-200 text-amber-800',
  high: 'bg-red-50 border-red-200 text-red-800',
};

const SEVERITY_LABEL: Record<'low' | 'medium' | 'high', string> = {
  low: '낮음',
  medium: '중간',
  high: '높음',
};

function formatDate(value: string | null): string {
  if (!value) return '검증 기록 없음';
  try {
    return new Date(value).toLocaleString('ko-KR');
  } catch {
    return value;
  }
}

export function ValidationPanel({ validation }: Props) {
  const { warnings, blockedFlags, lastValidatedAt } = validation;

  return (
    <aside className="sticky top-4 space-y-3 rounded-md border border-slate-200 bg-white p-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">검증 결과</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          마지막 검증: {formatDate(lastValidatedAt)}
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          경고 ({warnings.length})
        </h3>
        {warnings.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            경고 없음
          </div>
        ) : (
          <ul className="space-y-1.5">
            {warnings.map((warning, index) => {
              const severity = (warning.severity ?? 'low') as
                | 'low'
                | 'medium'
                | 'high';
              return (
                <li
                  key={`${String(warning.domain)}-${warning.code ?? warning.path ?? index}-${index}`}
                  className={cn(
                    'rounded-md border px-3 py-2 text-xs',
                    SEVERITY_CLASS[severity],
                  )}
                >
                  <div className="flex items-center gap-1 font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    <span>[{SEVERITY_LABEL[severity]}]</span>
                    <span className="font-mono">{String(warning.domain)}</span>
                    {warning.path ? (
                      <>
                        <span className="text-slate-500">·</span>
                        <span className="font-mono">{warning.path}</span>
                      </>
                    ) : null}
                    {warning.code ? (
                      <>
                        <span className="text-slate-500">·</span>
                        <span className="font-mono">{warning.code}</span>
                      </>
                    ) : null}
                  </div>
                  <p className="mt-1">{warning.message}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {blockedFlags.length > 0 ? (
        <section className="space-y-2 rounded-md border border-red-300 bg-red-50 p-3">
          <h3 className="flex items-center gap-1 text-xs font-semibold text-red-800">
            <ShieldAlert className="h-3.5 w-3.5" />
            발행 차단 사유 ({blockedFlags.length})
          </h3>
          <ul className="space-y-1">
            {blockedFlags.map((flag) => (
              <li
                key={flag}
                className="flex items-center gap-1 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs text-red-800"
              >
                <span className="font-mono">{flag}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  );
}
