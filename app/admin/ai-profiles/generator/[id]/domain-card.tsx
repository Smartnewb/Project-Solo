'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, RefreshCcw } from 'lucide-react';
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
import { FieldEditDialog } from './field-edit-dialog';
import { FieldRegenerateDialog } from './field-regenerate-dialog';

interface Props {
  draftId: string;
  domain: AiProfileDomain;
  status: AiProfileDomainStatus;
  payload: unknown;
  version: number;
  readOnly?: boolean;
  onOpenInstruction?: (domain: AiProfileDomain) => void;
}

interface Leaf {
  path: string; // full path including domain prefix
  relativePath: string; // within-domain path
  value: unknown;
}

const MAX_DEPTH = 5;

function collectLeaves(
  value: unknown,
  prefix: string,
  relativePrefix: string,
  depth: number,
  out: Leaf[],
) {
  if (depth > MAX_DEPTH) return;
  if (value === null || value === undefined) {
    out.push({ path: prefix, relativePath: relativePrefix, value });
    return;
  }
  if (Array.isArray(value)) {
    if (value.length === 0 || value.every((v) => typeof v !== 'object' || v === null)) {
      out.push({ path: prefix, relativePath: relativePrefix, value });
      return;
    }
    value.forEach((item, idx) => {
      const nextRel = `${relativePrefix}[${idx}]`;
      collectLeaves(item, `${prefix}[${idx}]`, nextRel, depth + 1, out);
    });
    return;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      out.push({ path: prefix, relativePath: relativePrefix, value });
      return;
    }
    for (const [k, v] of entries) {
      const nextRel = relativePrefix ? `${relativePrefix}.${k}` : k;
      collectLeaves(v, `${prefix}.${k}`, nextRel, depth + 1, out);
    }
    return;
  }
  out.push({ path: prefix, relativePath: relativePrefix, value });
}

function previewValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') {
    return value.length > 60 ? `${value.slice(0, 60)}…` : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    const json = JSON.stringify(value);
    return json.length > 60 ? `${json.slice(0, 60)}…` : json;
  } catch {
    return String(value);
  }
}

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

  const [editState, setEditState] = useState<{
    path: string;
    value: unknown;
  } | null>(null);
  const [regenState, setRegenState] = useState<{ path: string } | null>(null);

  const isBusy = status === 'generating' || generateMutation.isPending;
  const canGenerate = status === 'empty';
  const canRegenerate =
    status === 'ready' ||
    status === 'stale' ||
    status === 'blocked' ||
    status === 'failed';

  const leaves: Leaf[] = [];
  if (payload !== null && payload !== undefined) {
    collectLeaves(payload, domain, '', 0, leaves);
  }

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

        {leaves.length === 0 ? (
          <p className="text-xs text-slate-500">(비어 있음)</p>
        ) : (
          <div className="max-h-72 overflow-y-auto rounded border border-slate-200 bg-slate-50 text-xs">
            <ul className="divide-y divide-slate-100">
              {leaves.map((leaf) => (
                <li
                  key={leaf.path}
                  className="flex items-start gap-2 px-2 py-1.5"
                >
                  <div className="flex-1 space-y-0.5">
                    <div className="font-mono text-[10px] text-slate-500">
                      {leaf.relativePath || '(root)'}
                    </div>
                    <div className="truncate text-slate-800">
                      {previewValue(leaf.value)}
                    </div>
                  </div>
                  {!readOnly ? (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setEditState({
                            path: leaf.path,
                            value: leaf.value,
                          })
                        }
                        className="rounded p-1 text-slate-500 hover:bg-white hover:text-slate-800"
                        aria-label="편집"
                        disabled={isBusy}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegenState({ path: leaf.path })}
                        className="rounded p-1 text-slate-500 hover:bg-white hover:text-slate-800"
                        aria-label="재생성"
                        disabled={isBusy}
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      {editState ? (
        <FieldEditDialog
          open={editState !== null}
          onOpenChange={(open) => {
            if (!open) setEditState(null);
          }}
          draftId={draftId}
          version={version}
          domain={domain}
          initialPath={editState.path}
          initialValue={editState.value}
        />
      ) : null}

      {regenState ? (
        <FieldRegenerateDialog
          open={regenState !== null}
          onOpenChange={(open) => {
            if (!open) setRegenState(null);
          }}
          draftId={draftId}
          version={version}
          domain={domain}
          initialPath={regenState.path}
        />
      ) : null}
    </Card>
  );
}
