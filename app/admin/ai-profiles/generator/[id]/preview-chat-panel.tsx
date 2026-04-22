'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import type { PreviewChatTurn } from '@/app/types/ai-profile-generator';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Textarea } from '@/shared/ui/textarea';
import { useDraftErrorHandler } from './use-draft-mutation';

interface Props {
  draftId: string;
  disabled?: boolean;
}

const MAX_USER_TURNS = 3;

export function PreviewChatPanel({ draftId, disabled = false }: Props) {
  const handleError = useDraftErrorHandler(draftId);
  const [userMessages, setUserMessages] = useState<string[]>([]);
  const [turns, setTurns] = useState<PreviewChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (messages: string[]) =>
      aiProfileGenerator.previewChat(draftId, { userMessages: messages }),
    onSuccess: (data) => {
      setTurns(data.turns);
      setErrorText(null);
    },
    onError: (error) => {
      setErrorText(error instanceof Error ? error.message : '요청 실패');
      handleError(error);
    },
  });

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (userMessages.length >= MAX_USER_TURNS) return;
    const next = [...userMessages, trimmed];
    setUserMessages(next);
    setInput('');
    mutation.mutate(next);
  };

  const reset = () => {
    setUserMessages([]);
    setTurns([]);
    setInput('');
    setErrorText(null);
  };

  const reachedLimit = userMessages.length >= MAX_USER_TURNS;
  const inputDisabled = disabled || mutation.isPending || reachedLimit;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">Preview Chat</CardTitle>
          <p className="text-xs text-slate-500">
            {disabled
              ? '편집 가능한 Draft에서만 시뮬레이션할 수 있습니다.'
              : '현재 draft 스냅샷으로 3턴까지 시뮬레이션합니다. 저장되지 않습니다.'}
          </p>
        </div>
        {!disabled ? (
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            disabled={mutation.isPending}
          >
            초기화
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3">
          {turns.length === 0 && !mutation.isPending ? (
            <p className="text-center text-xs text-slate-400">
              메시지를 보내어 시뮬레이션을 시작하세요.
            </p>
          ) : null}
          {turns.map((turn, idx) => (
            <div
              key={idx}
              className={`flex ${
                turn.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                  turn.role === 'user'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-slate-800 shadow-sm'
                }`}
              >
                {turn.content}
              </div>
            </div>
          ))}
          {mutation.isPending ? (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg bg-white px-3 py-2 text-xs text-slate-400 shadow-sm">
                생성 중…
              </div>
            </div>
          ) : null}
        </div>

        {errorText ? (
          <Alert variant="destructive">
            <AlertDescription>{errorText}</AlertDescription>
          </Alert>
        ) : null}

        {reachedLimit ? (
          <p className="text-xs text-slate-500">
            3턴에 도달했습니다. 초기화 후 다시 시도하세요.
          </p>
        ) : null}

        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="메시지를 입력하세요."
            rows={2}
            disabled={inputDisabled}
            className="text-xs"
          />
          <Button
            size="sm"
            onClick={send}
            disabled={inputDisabled || input.trim().length === 0}
          >
            {mutation.isPending ? '전송 중…' : '전송'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
