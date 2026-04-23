'use client';

import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

export function StringListInput({
  value,
  onChange,
  placeholder,
  disabled,
  label,
}: Props) {
  const [draft, setDraft] = useState('');

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setDraft('');
      return;
    }
    onChange([...value, trimmed]);
    setDraft('');
  };

  const handleRemove = (target: string) => {
    onChange(value.filter((item) => item !== target));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      {label ? <Label>{label}</Label> : null}
      <div className="flex flex-wrap gap-1.5 rounded-md border border-input bg-background p-2 min-h-[36px]">
        {value.length === 0 ? (
          <span className="text-xs text-slate-400">항목 없음</span>
        ) : (
          value.map((item) => (
            <Badge key={item} variant="secondary" className="gap-1 pr-1">
              <span>{item}</span>
              {disabled ? null : (
                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  className="inline-flex h-4 w-4 items-center justify-center rounded hover:bg-slate-300"
                  aria-label={`${item} 삭제`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))
        )}
      </div>
      {disabled ? null : (
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? '항목을 입력한 뒤 Enter 또는 추가'}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAdd}
            disabled={!draft.trim()}
          >
            추가
          </Button>
        </div>
      )}
    </div>
  );
}
