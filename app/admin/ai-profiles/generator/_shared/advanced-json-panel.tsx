'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';
import { Textarea } from '@/shared/ui/textarea';

interface Props {
  label?: string;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  disabled?: boolean;
}

function toText(value: Record<string, unknown>): string {
  if (!value || Object.keys(value).length === 0) return '';
  return JSON.stringify(value, null, 2);
}

export function AdvancedJsonPanel({
  label = '추가 키 (고급)',
  value,
  onChange,
  disabled,
}: Props) {
  const [draft, setDraft] = useState<string>(() => toText(value));
  const [error, setError] = useState<string | null>(null);

  // External updates clobber in-progress drafts; acceptable for now since parents memoize.
  useEffect(() => {
    setDraft(toText(value));
    setError(null);
  }, [value]);

  const applyDraft = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError(null);
      onChange({});
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        setError('객체(JSON) 형식이 필요합니다.');
        return;
      }
      setError(null);
      onChange(parsed as Record<string, unknown>);
    } catch (err) {
      setError(`JSON 파싱 실패: ${(err as Error).message}`);
    }
  };

  return (
    <Collapsible className="rounded-md border border-slate-200">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50">
        <span>{label}</span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 border-t border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            구조화 필드에서 지원하지 않는 키를 JSON 객체로 편집합니다.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={applyDraft}
            disabled={disabled}
          >
            적용
          </Button>
        </div>
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={applyDraft}
          rows={5}
          className="font-mono text-xs"
          placeholder={'{\n  "customKey": "값"\n}'}
          disabled={disabled}
        />
        {error ? (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
