'use client';
import { Button, Spinner, TextField, Label, Input, TextArea, Description, Select, ListBox } from '@heroui/react';
import { ArrowLeft as ArrowBackIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TargetGender, VideoPreviewResponse, VideoStatus } from '@/types/admin';
import { usePreviewVideo, useCreateVideo, useUpdateVideo, useVideoAdminDetail, } from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { getApiErrorMessage } from '@/app/utils/errors';
import { TARGET_GENDER_OPTIONS } from '@/app/admin/content/constants';
interface Props {
    mode: 'create' | 'edit';
    id?: string;
}
// datetime-local ↔ ISO 변환 (로컬 시각 기준)
function toLocalInput(iso?: string | null): string {
    if (!iso)
        return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function VideoForm({ mode, id }: Props) {
    const router = useRouter();
    const toast = useToast();
    const previewVideo = usePreviewVideo();
    const createVideo = useCreateVideo();
    const updateVideo = useUpdateVideo();
    const detailQuery = useVideoAdminDetail(mode === 'edit' && id ? id : '');
    const [url, setUrl] = useState('');
    const [preview, setPreview] = useState<VideoPreviewResponse | null>(null);
    const [displayTitle, setDisplayTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<VideoStatus>('draft');
    const [featuredAt, setFeaturedAt] = useState('');
    const [priority, setPriority] = useState('');
    const [targetGender, setTargetGender] = useState<TargetGender>('ALL');
    // edit 모드에서 URL을 실제로 바꿨는지 (바꿨을 때만 재추출 전송)
    const [urlDirty, setUrlDirty] = useState(false);
    // edit 모드: 상세 로드 후 폼 초기화
    useEffect(() => {
        if (mode !== 'edit' || !detailQuery.data)
            return;
        const d = detailQuery.data;
        setDisplayTitle(d.displayTitle ?? '');
        setDescription(d.description ?? '');
        setStatus(d.status);
        setFeaturedAt(toLocalInput(d.featuredAt));
        setPriority(d.priority ?? '');
        setTargetGender(d.targetGender ?? 'ALL');
        setPreview({
            provider: d.video.provider,
            videoId: d.video.videoId,
            thumbnailUrl: d.video.thumbnailUrl,
            aspectRatio: d.video.aspectRatio,
            channelTitle: d.video.channelTitle,
            embedUrl: d.video.embedUrl,
            title: d.title,
        });
    }, [mode, detailQuery.data]);
    const goList = () => router.push('/admin/content?tab=video');
    const handlePreview = async () => {
        if (!url.trim()) {
            toast.error('YouTube URL을 입력해주세요.');
            return;
        }
        try {
            const res = await previewVideo.mutateAsync(url.trim());
            setPreview(res);
            // 운영자 보정 제목 미입력 시 oEmbed 원제목으로 기본값
            if (!displayTitle)
                setDisplayTitle(res.title.slice(0, 40));
            if (mode === 'edit')
                setUrlDirty(true);
        }
        catch (err: unknown) {
            // No silent fallback — 실패 시 보정 단계 노출 안 함
            setPreview(mode === 'edit' ? preview : null);
            toast.error(getApiErrorMessage(err, '영상 메타데이터 조회에 실패했습니다.'));
        }
    };
    const buildFeaturedAtIso = (): string | undefined => {
        if (!featuredAt)
            return undefined;
        return new Date(featuredAt).toISOString();
    };
    const handleCreate = async (publishNow: boolean) => {
        if (!preview)
            return;
        try {
            await createVideo.mutateAsync({
                url: url.trim(),
                displayTitle: displayTitle.trim() || undefined,
                description: description.trim() || undefined,
                status: publishNow ? 'published' : 'draft',
                featuredAt: buildFeaturedAtIso(),
                priority: priority.trim() || undefined,
                targetGender,
            });
            toast.success(publishNow ? '영상이 등록·발행되었습니다.' : '영상이 임시저장되었습니다.');
            goList();
        }
        catch (err: unknown) {
            toast.error(getApiErrorMessage(err, '등록에 실패했습니다.'));
        }
    };
    const handleUpdate = async () => {
        if (!id)
            return;
        try {
            await updateVideo.mutateAsync({
                id,
                data: {
                    displayTitle: displayTitle.trim(),
                    description: description.trim(),
                    status,
                    featuredAt: featuredAt ? buildFeaturedAtIso() : undefined,
                    priority: priority.trim(),
                    targetGender,
                    ...(urlDirty && url.trim() ? { url: url.trim() } : {}),
                },
            });
            toast.success('영상이 수정되었습니다.');
            goList();
        }
        catch (err: unknown) {
            toast.error(getApiErrorMessage(err, '수정에 실패했습니다.'));
        }
    };
    const isBusy = createVideo.isPending || updateVideo.isPending;
    if (mode === 'edit' && detailQuery.isLoading) {
        return (<div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spinner size="sm"></Spinner>
      </div>);
    }
    return (<div style={{ padding: 24, maxWidth: 720, marginInline: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <Button onPress={goList} variant="tertiary">{<ArrowBackIcon></ArrowBackIcon>}
          목록
        </Button>
        <h1 className="text-2xl font-bold">
          {mode === 'create' ? '영상 링크 등록' : '영상 링크 수정'}
        </h1>
      </div>

      {/* Step 1 — URL & 미리보기 */}
      <section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
        <p style={{ marginBottom: 8 }}>
          1. YouTube Shorts URL
        </p>
        <p style={{ display: 'block', marginBottom: 16 }}>
          서버가 oEmbed로 제목·채널·썸네일을 추출합니다. 잘못된/비공개/삭제된 영상은 등록되지 않습니다.
        </p>
        <div className="flex flex-wrap gap-4">
          <TextField className="mb-4"><Input placeholder="https://www.youtube.com/shorts/..." value={url} onChange={(e) => {
            setUrl(e.target.value);
            if (mode === 'edit')
                setUrlDirty(true);
        }}></Input></TextField>
          <Button onPress={handlePreview} isDisabled={previewVideo.isPending} variant="secondary" style={{ whiteSpace: 'nowrap' }}>
            {previewVideo.isPending ? '확인 중...' : '미리보기 확인'}
          </Button>
        </div>

        {preview && (<div style={{ marginTop: 16 }} className="rounded-xl border p-4">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }} className="p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.thumbnailUrl} alt={preview.title} width={72} height={100} style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}></img>
              <div style={{ minWidth: 0 }}>
                <p>
                  {preview.title}
                </p>
                <p>
                  {preview.channelTitle} · {preview.aspectRatio} · {preview.provider}
                </p>
                <p>
                  videoId: {preview.videoId}
                </p>
              </div>
            </div>
          </div>)}
      </section>

      {/* Step 2 — 보정 필드 (미리보기 성공 시만) */}
      {preview && (<section style={{ padding: 24 }} className="rounded-xl border bg-white p-4">
          <p style={{ marginBottom: 16 }}>
            2. 노출 정보
          </p>
          <div className="flex flex-wrap gap-4">
            <TextField className="mb-4"><Label>{"노출 제목 (운영자 보정)"}</Label><Input value={displayTitle} onChange={(e) => setDisplayTitle(e.target.value)} {...{ maxLength: 40 }}></Input><Description>{`${displayTitle.length}/40자 | 비워두면 원제목이 사용됩니다.`}</Description></TextField>
            <TextField className="mb-4"><Label>{"설명 (선택)"}</Label><TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} {...{ maxLength: 100 }}></TextArea><Description>{`${description.length}/100자`}</Description></TextField>
            <div className="flex flex-wrap gap-4">
              <TextField className="mb-4"><Label>{"상단 고정 시각 (선택)"}</Label><Input type="datetime-local" value={featuredAt} onChange={(e) => setFeaturedAt(e.target.value)}></Input></TextField>
              <TextField className="mb-4"><Label>{"노출 우선순위 (선택)"}</Label><Input value={priority} onChange={(e) => setPriority(e.target.value)}></Input></TextField>
            </div>
            <div className="block"><Select aria-label="노출 대상" value={targetGender} onChange={(key) => {
                const value = String(key ?? "");
                setTargetGender(value as TargetGender);
            }} className="min-w-[120px]"><Label>노출 대상</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>{TARGET_GENDER_OPTIONS.map(opt => <ListBox.Item key={opt.value} id={opt.value} textValue={String(opt.label)}>{opt.label}</ListBox.Item>)}</ListBox></Select.Popover></Select></div>
            {mode === 'edit' && (<div className="block"><Select aria-label="상태" value={status} onChange={(key) => {
                    const value = String(key ?? "");
                    setStatus(value as VideoStatus);
                }} className="min-w-[120px]"><Label>상태</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={"draft"} textValue={"\uCD08\uC548"}>초안</ListBox.Item><ListBox.Item id={"published"} textValue={"\uAC8C\uC2DC\uC911"}>게시중</ListBox.Item></ListBox></Select.Popover></Select></div>)}
          </div>

          <hr style={{ marginBlock: 24 }}></hr>

          <div className="flex flex-wrap gap-4">
            <Button onPress={goList} isDisabled={isBusy} variant="tertiary">
              취소
            </Button>
            {mode === 'create' ? (<>
                <Button onPress={() => handleCreate(false)} isDisabled={isBusy} variant="secondary">
                  임시저장
                </Button>
                <Button onPress={() => handleCreate(true)} isDisabled={isBusy} variant="primary">
                  등록 & 발행
                </Button>
              </>) : (<Button onPress={handleUpdate} isDisabled={isBusy} variant="primary">
                저장
              </Button>)}
          </div>
        </section>)}
    </div>);
}
