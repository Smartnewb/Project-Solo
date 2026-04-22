'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { useAiProfileErrorHandler } from '../_shared-error';
import { DomainStatusBadge } from './domain-status-badge';

interface Props {
  draftId: string;
  domain: AiProfileDomain;
  status: AiProfileDomainStatus;
  payload: unknown;
  version: number;
  readOnly?: boolean;
  onOpenFieldEdit?: (domain: AiProfileDomain, path: string) => void;
  onOpenFieldRegenerate?: (domain: AiProfileDomain, path: string) => void;
  onOpenInstruction?: (domain: AiProfileDomain) => void;
}

// TODO(phase7): replace with full field-tree + per-field action menu.
// For now: read-only JSON view + domain-level generate/regenerate + instruction CTA.
export function DomainCard({
  draftId,
  domain,
  status,
  payload,
  version,
  readOnly = false,
  onOpenInstruction,
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
    mutationFn: (mode: 'generate' | 'regenerate') =>
      aiProfileGenerator.generateDomain(draftId, domain, {
        expectedVersion: version,
        mode,
      }),
    onSuccess: invalidate,
    onError: handleError,
  });

  const isBusy = status === 'generating' || generateMutation.isPending;

  const canGenerate = status === 'empty';
  const canRegenerate =
    status === 'ready' ||
    status === 'stale' ||
    status === 'blocked' ||
    status === 'failed';

  const jsonText =
    payload == null
      ? '(비어 있음)'
      : JSON.stringify(payload, null, 2);

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{DOMAIN_LABEL[domain]}</CardTitle>
          <DomainStatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!readOnly ? (
          <div className="flex flex-wrap items-center gap-2">
            {canGenerate ? (
              <Button
                size="sm"
                onClick={() => generateMutation.mutate('generate')}
                disabled={isBusy}
              >
                {generateMutation.isPending ? '생성 중…' : '생성'}
              </Button>
            ) : null}
            {canRegenerate ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => generateMutation.mutate('regenerate')}
                disabled={isBusy}
              >
                전체 재생성
              </Button>
            ) : null}
            {onOpenInstruction ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenInstruction(domain)}
                disabled={isBusy}
              >
                자연어 수정
              </Button>
            ) : null}
          </div>
        ) : null}
        <pre className="max-h-64 overflow-auto rounded bg-slate-50 p-3 text-xs text-slate-700">
          {jsonText}
        </pre>
      </CardContent>
    </Card>
  );
}
