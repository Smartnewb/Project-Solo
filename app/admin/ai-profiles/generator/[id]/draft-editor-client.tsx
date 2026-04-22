'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArrowLeft, CheckCircle2, Copy, Save, Upload } from 'lucide-react';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import {
  ALL_DOMAINS,
  DOMAIN_GROUP_LABEL,
  DOMAIN_GROUP_ORDER,
  DOMAIN_TO_GROUP,
  type AiProfileDomain,
  type AiProfileDomainStatus,
} from '@/app/types/ai-profile-generator';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';
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
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import {
  DRAFT_STATUS_LABEL,
  DRAFT_STATUS_VARIANT,
  isReadonlyStatus,
} from '../_shared/status';
import { useAiProfileErrorHandler } from '../_shared-error';
import { DomainCard } from './domain-card';
import { DomainGroup } from './domain-group';
import { DomainInstructionDialog } from './domain-instruction-dialog';
import { GalleryPanel } from './gallery-panel';
import { PhotoSlotCard } from './photo-slot-card';
import { PreviewChatPanel } from './preview-chat-panel';
import { PublishDialog } from './publish-dialog';
import { RepresentativeImagePanel } from './representative-image-panel';
import { SourceDataLockSection } from './source-data-lock-section';
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

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [publishOpen, setPublishOpen] = useState(false);
  const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [instructionDomain, setInstructionDomain] =
    useState<AiProfileDomain | null>(null);

  const detailQuery = useQuery({
    queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
    queryFn: () => aiProfileGenerator.getDraft(draftId),
    retry: (failureCount, error) => {
      if (error instanceof AdminApiError && error.status === 404) return false;
      return failureCount < 2;
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (version: number) =>
      aiProfileGenerator.archiveDraft(draftId, {
        expectedVersion: version,
        reason: archiveReason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Draft를 아카이브했습니다.');
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.drafts(),
      });
      setArchiveOpen(false);
      router.push('/admin/ai-profiles/generator');
    },
    onError: handleError,
  });

  const validateMutation = useMutation({
    mutationFn: (version: number) =>
      aiProfileGenerator.validateDraft(draftId, { expectedVersion: version }),
    onSuccess: (result) => {
      const { warningCount, blockedFlagCount, canPublish } = result.summary;
      if (canPublish) {
        toast.success('검증을 통과했습니다.');
      } else {
        toast.warning(
          `검증 완료: 경고 ${warningCount}건, 차단 ${blockedFlagCount}건`,
        );
      }
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
      });
    },
    onError: handleError,
  });

  const duplicateMutation = useMutation({
    mutationFn: (version: number) =>
      aiProfileGenerator.duplicateDraft(draftId, {
        expectedVersion: version,
        copyMedia: true,
      }),
    onSuccess: (next) => {
      toast.success('Draft를 복제했습니다.');
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.drafts(),
      });
      router.push(`/admin/ai-profiles/generator/${next.id}`);
    },
    onError: handleError,
  });

  const saveAsTemplateMutation = useMutation({
    mutationFn: () =>
      aiProfileGenerator.saveDraftAsTemplate(draftId, {
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('템플릿으로 저장했습니다.');
      setSaveAsTemplateOpen(false);
      setTemplateName('');
      setTemplateDescription('');
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

  const readOnly = isReadonlyStatus(draft.status);
  const canPublish = draft.status === 'draft' || draft.status === 'failed';

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
          <Button
            size="sm"
            variant="outline"
            onClick={() => validateMutation.mutate(draft.version)}
            disabled={validateMutation.isPending || draft.status === 'publishing'}
          >
            <CheckCircle2 className="mr-1 h-4 w-4" />{' '}
            {validateMutation.isPending ? '검증 중…' : '검증'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => duplicateMutation.mutate(draft.version)}
            disabled={duplicateMutation.isPending}
          >
            <Copy className="mr-1 h-4 w-4" /> 복제
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSaveAsTemplateOpen(true)}
          >
            <Save className="mr-1 h-4 w-4" /> 템플릿으로 저장
          </Button>
          <Button
            size="sm"
            onClick={() => setPublishOpen(true)}
            disabled={!canPublish}
          >
            <Upload className="mr-1 h-4 w-4" /> 발행
          </Button>
          {!readOnly ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setArchiveOpen(true)}
              disabled={archiveMutation.isPending}
            >
              <Archive className="mr-1 h-4 w-4" /> 아카이브
            </Button>
          ) : null}
        </div>
      </header>

      <SourceDataLockSection
        draftId={draftId}
        version={draft.version}
        sourceDataSnapshot={draft.sourceDataSnapshot}
        readOnly={readOnly}
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="space-y-5 lg:col-span-3">
          {DOMAIN_GROUP_ORDER.map((group) => {
            const domains = ALL_DOMAINS.filter(
              (d) => DOMAIN_TO_GROUP[d] === group,
            );
            if (domains.length === 0) return null;
            return (
              <DomainGroup key={group} label={DOMAIN_GROUP_LABEL[group]}>
                <div className="grid gap-4 md:grid-cols-2">
                  {domains
                    .filter((d) => d !== 'photo')
                    .map((domain) => {
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
                          readOnly={readOnly}
                          onOpenInstruction={(d) => setInstructionDomain(d)}
                        />
                      );
                    })}
                </div>
                {group === 'photo' ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <PhotoSlotCard
                      draftId={draftId}
                      version={draft.version}
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

      {instructionDomain ? (
        <DomainInstructionDialog
          open={instructionDomain !== null}
          onOpenChange={(open) => {
            if (!open) setInstructionDomain(null);
          }}
          draftId={draftId}
          version={draft.version}
          domain={instructionDomain}
        />
      ) : null}

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Draft 아카이브</DialogTitle>
            <DialogDescription>
              이 Draft를 아카이브하면 목록에서 감춰지고 수정이 불가능해집니다.
              사유를 남겨두면 추적에 도움이 됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="archive-reason">사유 (선택)</Label>
            <Textarea
              id="archive-reason"
              rows={3}
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              placeholder="예) 중복 생성, 품질 미달"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setArchiveOpen(false)}
              disabled={archiveMutation.isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => archiveMutation.mutate(draft.version)}
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? '아카이브 중…' : '아카이브'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={saveAsTemplateOpen} onOpenChange={setSaveAsTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>템플릿으로 저장</DialogTitle>
            <DialogDescription>
              현재 Draft의 설정을 생성 템플릿으로 저장합니다. 이후 새 Draft 생성
              시 선택할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="template-name">이름</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="예) 서울권 여대생 스타일"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="template-desc">설명 (선택)</Label>
              <Textarea
                id="template-desc"
                rows={2}
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveAsTemplateOpen(false)}
              disabled={saveAsTemplateMutation.isPending}
            >
              취소
            </Button>
            <Button
              onClick={() => saveAsTemplateMutation.mutate()}
              disabled={
                saveAsTemplateMutation.isPending ||
                templateName.trim().length === 0
              }
            >
              {saveAsTemplateMutation.isPending ? '저장 중…' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
