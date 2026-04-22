'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Unlock } from 'lucide-react';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import {
  DOMAIN_LABEL,
  type AiProfileDomain,
  type AiProfileDomainStatus,
} from '@/app/types/ai-profile-generator';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { Switch } from '@/shared/ui/switch';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { useAiProfileErrorHandler } from '../_shared-error';
import { DomainJsonEditor } from './domain-json-editor';
import { DomainStatusBadge } from './domain-status-badge';

interface Props {
  draftId: string;
  domain: AiProfileDomain;
  status: AiProfileDomainStatus;
  payload: unknown;
  version: number;
  locked: string[] | undefined;
  draftLockedFields: Record<string, string[] | undefined>;
  readOnly?: boolean;
}

const DOMAIN_LOCK_FLAG = '__all__';

function isDomainLocked(locked: string[] | undefined): boolean {
  if (!locked || locked.length === 0) return false;
  return locked.includes(DOMAIN_LOCK_FLAG);
}

export function DomainCard({
  draftId,
  domain,
  status,
  payload,
  version,
  locked,
  draftLockedFields,
  readOnly = false,
}: Props) {
  const queryClient = useQueryClient();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.draftDetail(draftId),
  );

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
    });

  const generateMutation = useMutation({
    mutationFn: () =>
      aiProfileGenerator.generateDomain(draftId, domain, {
        expectedVersion: version,
      }),
    onSuccess: invalidate,
    onError: handleError,
  });

  const regenerateMutation = useMutation({
    mutationFn: () =>
      aiProfileGenerator.regenerateDomain(draftId, domain, {
        expectedVersion: version,
      }),
    onSuccess: invalidate,
    onError: handleError,
  });

  const saveMutation = useMutation({
    mutationFn: (next: unknown) =>
      aiProfileGenerator.patchDomain(draftId, domain, {
        expectedVersion: version,
        payload: next,
      }),
    onSuccess: invalidate,
    onError: handleError,
  });

  const lockedNow = isDomainLocked(locked);

  const lockMutation = useMutation({
    mutationFn: (nextLocked: boolean) => {
      const nextLockedFields: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(draftLockedFields)) {
        if (value && value.length > 0) nextLockedFields[key] = value;
      }
      if (nextLocked) {
        nextLockedFields[domain] = [DOMAIN_LOCK_FLAG];
      } else {
        delete nextLockedFields[domain];
      }
      return aiProfileGenerator.patchDraft(draftId, {
        expectedVersion: version,
        lockedFields: nextLockedFields as Partial<
          Record<AiProfileDomain, string[]>
        >,
      });
    },
    onSuccess: invalidate,
    onError: handleError,
  });

  const mutations = [
    generateMutation,
    regenerateMutation,
    saveMutation,
    lockMutation,
  ];
  const isBusy =
    status === 'generating' || mutations.some((m) => m.isPending);

  const canGenerate = status === 'empty';
  const canRegenerate =
    status === 'ready' ||
    status === 'stale' ||
    status === 'blocked' ||
    status === 'failed';

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{DOMAIN_LABEL[domain]}</CardTitle>
          <DomainStatusBadge status={status} />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          {lockedNow ? (
            <Lock className="h-3.5 w-3.5" />
          ) : (
            <Unlock className="h-3.5 w-3.5" />
          )}
          <span>잠금</span>
          <Switch
            checked={lockedNow}
            disabled={isBusy || readOnly}
            onCheckedChange={(checked) => lockMutation.mutate(checked)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!readOnly ? (
          <div className="flex flex-wrap items-center gap-2">
            {canGenerate ? (
              <Button
                size="sm"
                onClick={() => generateMutation.mutate()}
                disabled={isBusy || lockedNow}
              >
                {generateMutation.isPending ? '생성 중…' : '생성'}
              </Button>
            ) : null}
            {canRegenerate ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => regenerateMutation.mutate()}
                disabled={isBusy || lockedNow}
              >
                {regenerateMutation.isPending ? '재생성 중…' : '재생성'}
              </Button>
            ) : null}
          </div>
        ) : null}
        <DomainJsonEditor
          value={payload}
          onSave={async (next) => {
            await saveMutation.mutateAsync(next);
          }}
          disabled={isBusy || lockedNow || readOnly}
          readOnly={readOnly}
          saving={saveMutation.isPending}
        />
      </CardContent>
    </Card>
  );
}
