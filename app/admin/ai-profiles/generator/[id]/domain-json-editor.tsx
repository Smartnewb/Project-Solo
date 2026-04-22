'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';

interface Props {
  value: unknown;
  onSave: (next: unknown) => Promise<void>;
  disabled?: boolean;
  readOnly?: boolean;
  saving?: boolean;
}

function stringify(value: unknown): string {
  if (value == null) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function DomainJsonEditor({
  value,
  onSave,
  disabled,
  readOnly,
  saving,
}: Props) {
  const serialized = useMemo(() => stringify(value), [value]);
  const [text, setText] = useState<string>(serialized);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(serialized);
    setError(null);
  }, [serialized]);

  const dirty = text !== serialized;

  const handleSave = async () => {
    setError(null);
    let parsed: unknown;
    try {
      parsed = text.trim() === '' ? null : JSON.parse(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'JSON 파싱 실패');
      return;
    }
    try {
      await onSave(parsed);
    } catch {
      // onSave handles its own error toast; don't overwrite parse-ok state.
    }
  };

  const handleReset = () => {
    setText(serialized);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        readOnly={readOnly}
        disabled={disabled}
        spellCheck={false}
        className="min-h-64 w-full font-mono text-xs"
      />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>JSON 오류: {error}</AlertDescription>
        </Alert>
      ) : null}
      {!readOnly ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={disabled || !dirty || saving}
          >
            초기화
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={disabled || !dirty || saving}
          >
            {saving ? '저장 중…' : '파싱 후 저장'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
