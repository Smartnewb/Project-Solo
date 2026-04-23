'use client';

import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';

interface Props {
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  /** If provided, only these keys are allowed (select). */
  allowedKeys?: string[];
  /** Multi-line value textarea instead of input. */
  multiline?: boolean;
  disabled?: boolean;
  /** Optional key -> label map (select-only). */
  keyLabels?: Record<string, string>;
}

export function KeyedListInput({
  value,
  onChange,
  keyPlaceholder,
  valuePlaceholder,
  allowedKeys,
  multiline,
  disabled,
  keyLabels,
}: Props) {
  const entries = Object.entries(value);
  const usedKeys = new Set(entries.map(([k]) => k));
  const remainingAllowed = allowedKeys
    ? allowedKeys.filter((k) => !usedKeys.has(k))
    : null;

  const handleRemove = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  const handleChangeValue = (key: string, next: string) => {
    onChange({ ...value, [key]: next });
  };

  const handleRenameKey = (oldKey: string, newKey: string) => {
    if (!newKey || newKey === oldKey) return;
    const next: Record<string, string> = {};
    for (const [k, v] of entries) {
      next[k === oldKey ? newKey : k] = v;
    }
    onChange(next);
  };

  const handleAdd = () => {
    if (allowedKeys) {
      const available = remainingAllowed ?? [];
      if (available.length === 0) return;
      onChange({ ...value, [available[0]]: '' });
    } else {
      // Generate a unique placeholder key
      let i = 1;
      let candidate = `key${i}`;
      while (usedKeys.has(candidate)) {
        i += 1;
        candidate = `key${i}`;
      }
      onChange({ ...value, [candidate]: '' });
    }
  };

  const resolveLabel = (k: string) => keyLabels?.[k] ?? k;

  const canAdd =
    !disabled &&
    (allowedKeys ? (remainingAllowed?.length ?? 0) > 0 : true);

  return (
    <div className="space-y-2">
      {entries.length === 0 ? (
        <p className="text-xs text-slate-400">항목 없음</p>
      ) : null}

      {entries.map(([key, val]) => (
        <div key={key} className="flex items-start gap-2">
          <div className="w-40 shrink-0">
            {allowedKeys ? (
              <Select
                value={key}
                onValueChange={(next) => handleRenameKey(key, next)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={keyPlaceholder ?? '키 선택'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={key}>{resolveLabel(key)}</SelectItem>
                  {(remainingAllowed ?? []).map((k) => (
                    <SelectItem key={k} value={k}>
                      {resolveLabel(k)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={key}
                onChange={(event) =>
                  handleRenameKey(key, event.target.value.trim())
                }
                placeholder={keyPlaceholder ?? '키'}
                disabled={disabled}
              />
            )}
          </div>

          <div className="flex-1">
            {multiline ? (
              <Textarea
                value={val}
                onChange={(event) => handleChangeValue(key, event.target.value)}
                rows={3}
                placeholder={valuePlaceholder}
                disabled={disabled}
              />
            ) : (
              <Input
                value={val}
                onChange={(event) => handleChangeValue(key, event.target.value)}
                placeholder={valuePlaceholder}
                disabled={disabled}
              />
            )}
          </div>

          {disabled ? null : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(key)}
              aria-label={`${resolveLabel(key)} 삭제`}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      {canAdd ? (
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          항목 추가
        </Button>
      ) : null}
    </div>
  );
}
