'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import {
  CONTENT_TIERS,
  CONTENT_TIER_LABEL,
  RELATIONSHIP_STAGES,
  RELATIONSHIP_STAGE_LABEL,
  type AiProfileContentTier,
  type AiProfileRelationshipStage,
  type PreviewChatTurn,
} from '@/app/types/ai-profile-generator';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { useAiProfileErrorHandler } from '../_shared-error';

interface Props {
  draftId: string;
  disabled?: boolean;
}

const MAX_USER_TURNS = 3;
type Mode = 'single' | 'turns';

export function PreviewChatPanel({ draftId, disabled = false }: Props) {
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.draftDetail(draftId),
  );
  const [mode, setMode] = useState<Mode>('turns');
  const [userMessages, setUserMessages] = useState<string[]>([]);
  const [turns, setTurns] = useState<PreviewChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [stage, setStage] =
    useState<AiProfileRelationshipStage>('stranger');
  const [tier, setTier] = useState<AiProfileContentTier | 'default'>('default');
  const [errorText, setErrorText] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (messages: string[]) => {
      const contentTier = tier === 'default' ? undefined : tier;
      if (mode === 'single') {
        return aiProfileGenerator.previewChat(draftId, {
          userMessage: messages[messages.length - 1],
          relationshipStage: stage,
          contentTier,
        });
      }
      return aiProfileGenerator.previewChatTurns(draftId, {
        userMessages: messages,
        relationshipStage: stage,
        contentTier,
      });
    },
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
    const next =
      mode === 'turns' ? [...userMessages, trimmed] : [trimmed];
    if (mode === 'turns' && next.length > MAX_USER_TURNS) return;
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

  const reachedLimit =
    mode === 'turns' && userMessages.length >= MAX_USER_TURNS;
  const inputDisabled = disabled || mutation.isPending || reachedLimit;

  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Preview Chat</CardTitle>
            <p className="text-xs text-slate-500">
              {disabled
                ? '편집 가능한 Draft에서만 시뮬레이션할 수 있습니다.'
                : '현재 Draft 스냅샷으로 시뮬레이션합니다. 저장되지 않습니다.'}
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
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <SelectTrigger className="h-7 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="turns">다중 턴</SelectItem>
              <SelectItem value="single">단일 턴</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={stage}
            onValueChange={(v) =>
              setStage(v as AiProfileRelationshipStage)
            }
          >
            <SelectTrigger className="h-7 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIP_STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {RELATIONSHIP_STAGE_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tier} onValueChange={(v) => setTier(v as typeof tier)}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">기본 등급</SelectItem>
              {CONTENT_TIERS.map((t) => (
                <SelectItem key={t} value={t}>
                  {CONTENT_TIER_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
