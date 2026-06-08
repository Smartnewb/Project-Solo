'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { VideoPreviewResponse, VideoStatus } from '@/types/admin';
import {
  usePreviewVideo,
  useCreateVideo,
  useUpdateVideo,
  useVideoAdminDetail,
} from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { getApiErrorMessage } from '@/app/utils/errors';

interface Props {
  mode: 'create' | 'edit';
  id?: string;
}

// datetime-local ↔ ISO 변환 (로컬 시각 기준)
function toLocalInput(iso?: string | null): string {
  if (!iso) return '';
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
  // edit 모드에서 URL을 실제로 바꿨는지 (바꿨을 때만 재추출 전송)
  const [urlDirty, setUrlDirty] = useState(false);

  // edit 모드: 상세 로드 후 폼 초기화
  useEffect(() => {
    if (mode !== 'edit' || !detailQuery.data) return;
    const d = detailQuery.data;
    setDisplayTitle(d.displayTitle ?? '');
    setDescription(d.description ?? '');
    setStatus(d.status);
    setFeaturedAt(toLocalInput(d.featuredAt));
    setPriority(d.priority ?? '');
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
      if (!displayTitle) setDisplayTitle(res.title.slice(0, 40));
      if (mode === 'edit') setUrlDirty(true);
    } catch (err: unknown) {
      // No silent fallback — 실패 시 보정 단계 노출 안 함
      setPreview(mode === 'edit' ? preview : null);
      toast.error(getApiErrorMessage(err, '영상 메타데이터 조회에 실패했습니다.'));
    }
  };

  const buildFeaturedAtIso = (): string | undefined => {
    if (!featuredAt) return undefined;
    return new Date(featuredAt).toISOString();
  };

  const handleCreate = async (publishNow: boolean) => {
    if (!preview) return;
    try {
      await createVideo.mutateAsync({
        url: url.trim(),
        displayTitle: displayTitle.trim() || undefined,
        description: description.trim() || undefined,
        status: publishNow ? 'published' : 'draft',
        featuredAt: buildFeaturedAtIso(),
        priority: priority.trim() || undefined,
      });
      toast.success(publishNow ? '영상이 등록·발행되었습니다.' : '영상이 임시저장되었습니다.');
      goList();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, '등록에 실패했습니다.'));
    }
  };

  const handleUpdate = async () => {
    if (!id) return;
    try {
      await updateVideo.mutateAsync({
        id,
        data: {
          displayTitle: displayTitle.trim(),
          description: description.trim(),
          status,
          featuredAt: featuredAt ? buildFeaturedAtIso() : undefined,
          priority: priority.trim(),
          ...(urlDirty && url.trim() ? { url: url.trim() } : {}),
        },
      });
      toast.success('영상이 수정되었습니다.');
      goList();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, '수정에 실패했습니다.'));
    }
  };

  const isBusy = createVideo.isPending || updateVideo.isPending;

  if (mode === 'edit' && detailQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={goList} color="inherit">
          목록
        </Button>
        <Typography variant="h5" fontWeight="bold">
          {mode === 'create' ? '영상 링크 등록' : '영상 링크 수정'}
        </Typography>
      </Box>

      {/* Step 1 — URL & 미리보기 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          1. YouTube Shorts URL
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          서버가 oEmbed로 제목·채널·썸네일을 추출합니다. 잘못된/비공개/삭제된 영상은 등록되지 않습니다.
        </Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder="https://www.youtube.com/shorts/..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (mode === 'edit') setUrlDirty(true);
            }}
          />
          <Button
            variant="outlined"
            onClick={handlePreview}
            disabled={previewVideo.isPending}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {previewVideo.isPending ? '확인 중...' : '미리보기 확인'}
          </Button>
        </Stack>

        {preview && (
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.thumbnailUrl}
                alt={preview.title}
                width={72}
                height={100}
                style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight="bold">
                  {preview.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {preview.channelTitle} · {preview.aspectRatio} · {preview.provider}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  videoId: {preview.videoId}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Paper>

      {/* Step 2 — 보정 필드 (미리보기 성공 시만) */}
      {preview && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            2. 노출 정보
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              label="노출 제목 (운영자 보정)"
              value={displayTitle}
              onChange={(e) => setDisplayTitle(e.target.value)}
              inputProps={{ maxLength: 40 }}
              helperText={`${displayTitle.length}/40자 | 비워두면 원제목이 사용됩니다.`}
            />
            <TextField
              fullWidth
              size="small"
              label="설명 (선택)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              inputProps={{ maxLength: 100 }}
              helperText={`${description.length}/100자`}
              multiline
              rows={2}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                size="small"
                label="상단 고정 시각 (선택)"
                type="datetime-local"
                value={featuredAt}
                onChange={(e) => setFeaturedAt(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="노출 우선순위 (선택)"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                sx={{ flex: 1 }}
              />
            </Stack>
            {mode === 'edit' && (
              <TextField
                select
                size="small"
                label="상태"
                value={status}
                onChange={(e) => setStatus(e.target.value as VideoStatus)}
              >
                <MenuItem value="draft">초안</MenuItem>
                <MenuItem value="published">게시중</MenuItem>
              </TextField>
            )}
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button onClick={goList} color="inherit" disabled={isBusy}>
              취소
            </Button>
            {mode === 'create' ? (
              <>
                <Button
                  variant="outlined"
                  onClick={() => handleCreate(false)}
                  disabled={isBusy}
                >
                  임시저장
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleCreate(true)}
                  disabled={isBusy}
                >
                  등록 & 발행
                </Button>
              </>
            ) : (
              <Button variant="contained" onClick={handleUpdate} disabled={isBusy}>
                저장
              </Button>
            )}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
