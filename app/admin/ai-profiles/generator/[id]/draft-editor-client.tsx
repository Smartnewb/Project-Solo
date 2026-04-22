'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, Upload } from 'lucide-react';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import {
  DOMAIN_GROUP_LABEL,
  DOMAIN_GROUP_ORDER,
  DOMAIN_TO_GROUP,
  FULL_DOMAINS,
  type AiProfileDomain,
  type AiProfileDomainGroup,
  type AiProfileDomainStatus,
} from '@/app/types/ai-profile-generator';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { useToast } from '@/shared/ui/admin/toast';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import {
  DRAFT_STATUS_LABEL,
  DRAFT_STATUS_VARIANT,
} from '../_shared/status';
import { useAiProfileErrorHandler } from '../_shared-error';
import { DomainCard } from './domain-card';
import { DomainGroup } from './domain-group';
import { GalleryPanel } from './gallery-panel';
import { PhotoSlotCard } from './photo-slot-card';
import { PreviewChatPanel } from './preview-chat-panel';
import { PublishDialog } from './publish-dialog';
import { RepresentativeImagePanel } from './representative-image-panel';
import { TemplateApplyMenu } from './template-apply-menu';
import { ValidationPanel } from './validation-panel';

interface Props {
  draftId: string;
}

export function DraftEditorClient({ draftId }: Props) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.draftDetail(draftId),
  );

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const detailQuery = useQuery({
    queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
    queryFn: () => aiProfileGenerator.getDraft(draftId),
    retry: (failureCount, error) => {
      if (error instanceof AdminApiError && error.status === 404) return false;
      return failureCount < 2;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => aiProfileGenerator.deleteDraft(draftId),
    onSuccess: () => {
      toast.success('Draft가 삭제되었습니다.');
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.drafts(),
      });
      router.push('/admin/ai-profiles/generator');
    },
    onError: handleError,
  });

  if (detailQuery.isLoading) {
    return (
      <section className="space-y-4 px-6 py-8">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="space-y-3 lg:col-span-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-md bg-slate-100"
              />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-md bg-slate-100" />
        </div>
      </section>
    );
  }

  if (detailQuery.isError) {
    const err = detailQuery.error;
    if (err instanceof AdminApiError && err.status === 404) {
      return (
        <section className="space-y-3 px-6 py-8">
          <Alert>
            <AlertDescription>
              Draft를 찾을 수 없습니다.
              <Link
                href="/admin/ai-profiles/generator"
                className="ml-2 underline"
              >
                목록으로
              </Link>
            </AlertDescription>
          </Alert>
        </section>
      );
    }
    return (
      <section className="space-y-3 px-6 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Draft를 불러오지 못했습니다.
            {err instanceof Error ? ` (${err.message})` : null}
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  const draft = detailQuery.data;
  if (!draft) return null;

  const readOnly =
    draft.status === 'published' || draft.status === 'archived';
  const canPublish = draft.status === 'draft' || draft.status === 'failed';

  const domainsByGroup = DOMAIN_GROUP_ORDER.reduce(
    (acc, group) => {
      acc[group] = FULL_DOMAINS.filter((d) => DOMAIN_TO_GROUP[d] === group);
      return acc;
    },
    {} as Record<AiProfileDomainGroup, AiProfileDomain[]>,
  );

  return (
    <section className="space-y-4 px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/ai-profiles/generator"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-3 w-3" /> 목록으로
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">
            Draft 편집
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-mono">{draft.id}</span>
            <Badge variant={DRAFT_STATUS_VARIANT[draft.status]}>
              {DRAFT_STATUS_LABEL[draft.status]}
            </Badge>
            <span>v{draft.version}</span>
            {draft.publishedCompanionId ? (
              <span className="font-mono text-emerald-600">
                companion: {draft.publishedCompanionId}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!readOnly ? (
            <TemplateApplyMenu
              draftId={draftId}
              currentVersion={draft.version}
            />
          ) : null}
          <Button
            size="sm"
            onClick={() => setPublishOpen(true)}
            disabled={!canPublish}
          >
            <Upload className="mr-1 h-4 w-4" /> 발행
          </Button>
          {!readOnly ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-1 h-4 w-4" /> 삭제
            </Button>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="space-y-5 lg:col-span-3">
          {DOMAIN_GROUP_ORDER.map((group) => {
            const domains = domainsByGroup[group];
            if (!domains || domains.length === 0) return null;
            return (
              <DomainGroup key={group} label={DOMAIN_GROUP_LABEL[group]}>
                <div className="grid gap-4 md:grid-cols-2">
                  {domains.map((domain) => {
                    const status: AiProfileDomainStatus =
                      draft.domainStatus?.[domain] ?? 'empty';
                    return (
                      <DomainCard
                        key={domain}
                        draftId={draftId}
                        domain={domain}
                        status={status}
                        payload={draft.domains?.[domain] ?? null}
                        version={draft.version}
                        locked={draft.lockedFields?.[domain]}
                        draftLockedFields={draft.lockedFields ?? {}}
                        readOnly={readOnly}
                      />
                    );
                  })}
                </div>
                {group === 'photo' ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <PhotoSlotCard
                      draftId={draftId}
                      version={draft.version}
                      gallery={draft.gallery ?? []}
                      representativeImageUrl={draft.representativeImageUrl}
                      readOnly={readOnly}
                    />
                    <RepresentativeImagePanel
                      draftId={draftId}
                      version={draft.version}
                      representativeImageUrl={draft.representativeImageUrl}
                      gallery={draft.gallery ?? []}
                      readOnly={readOnly}
                    />
                    <div className="md:col-span-2">
                      <GalleryPanel
                        draftId={draftId}
                        version={draft.version}
                        gallery={draft.gallery ?? []}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                ) : null}
              </DomainGroup>
            );
          })}
        </div>
        <div className="space-y-4 lg:col-span-1">
          <ValidationPanel validation={draft.validation} />
          <PreviewChatPanel draftId={draftId} disabled={readOnly} />
        </div>
      </div>

      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        draftId={draftId}
        version={draft.version}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Draft 삭제</DialogTitle>
            <DialogDescription>
              이 Draft를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteMutation.isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '삭제 중…' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
