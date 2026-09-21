'use client';

import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert, Box, Button, CircularProgress, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import AdminService, {
  type ProfileCurationReviewImage,
  type ProfileCurationReviewUser,
} from '@/app/services/admin';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';

const DEFAULT_EXPIRY_DAYS = 14;

type PreparedImage = { assetId: string; previewUrl: string };

function defaultExpiryValue() {
  const date = new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
}

export default function ProfileCurationPage() {
  const userId = useSearchParams().get('userId');
  const [user, setUser] = useState<ProfileCurationReviewUser | null>(null);
  const [preparedImages, setPreparedImages] = useState<Record<string, PreparedImage>>({});
  const [expiresAt, setExpiresAt] = useState(defaultExpiryValue);
  const [loading, setLoading] = useState(true);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const approvedImages = useMemo(() => user?.approvedImages ?? [], [user]);

  useEffect(() => {
    let active = true;
    if (!userId) {
      setError('심사 알림의 큐레이팅 버튼에서 다시 열어주세요.');
      setLoading(false);
      return;
    }

    void AdminService.profileCuration.getReviewUser(userId)
      .then((result) => {
        if (!active) return;
        if (result.gender !== 'MALE') {
          setError('프로필 큐레이팅은 남성 회원에게만 제안할 수 있습니다.');
          return;
        }
        setUser(result);
      })
      .catch((requestError) => active && setError(getAdminErrorMessage(requestError, '회원을 불러오지 못했습니다.')))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [userId]);

  const upload = async (image: ProfileCurationReviewImage, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setUploadingImageId(image.imageId);
    try {
      const asset = await AdminService.profileCuration.uploadPreparedAsset(file);
      const previewUrl = URL.createObjectURL(file);
      setPreparedImages((current) => {
        const previous = current[image.imageId];
        if (previous) URL.revokeObjectURL(previous.previewUrl);
        return { ...current, [image.imageId]: { assetId: asset.id, previewUrl } };
      });
    } catch (requestError) {
      setError(getAdminErrorMessage(requestError, '결과 사진을 업로드하지 못했습니다.'));
    } finally {
      setUploadingImageId(null);
      event.target.value = '';
    }
  };

  const submit = async () => {
    if (!userId || !user) return;
    const items = approvedImages.filter((image) => preparedImages[image.imageId]);
    if (items.length === 0) {
      setError('제안할 결과 사진을 1장 이상 업로드해주세요.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await AdminService.profileCuration.create({
        userId,
        expiresAt: new Date(expiresAt).toISOString(),
        items: items.map((image) => ({
          sourceProfileImageId: image.imageId,
          targetSlotIndex: image.slotIndex,
          preparedImageAssetId: preparedImages[image.imageId].assetId,
        })),
      });
      setSuccess(`${items.length}장의 프로필 큐레이팅 제안을 발송했습니다.`);
    } catch (requestError) {
      setError(getAdminErrorMessage(requestError, '큐레이팅 제안을 발송하지 못했습니다.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'grid', minHeight: '100vh', placeItems: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ maxWidth: 1040, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Typography component="h1" variant="h4" fontWeight={700} gutterBottom>프로필 큐레이팅 제안</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>운영진이 검토한 결과 사진만 올리면, 회원에게 한 번의 제안으로 전달됩니다.</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {user && (
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={2}>
            <Box>
              <Typography variant="h6" fontWeight={700}>{user.name}</Typography>
              <Typography variant="body2" color="text.secondary">승인된 프로필 사진에서 최대 3장을 선택할 수 있습니다.</Typography>
            </Box>
            <TextField label="제안 만료" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} InputLabelProps={{ shrink: true }} size="small" />
          </Stack>
          <Divider sx={{ my: 3 }} />
          {approvedImages.length === 0 ? <Alert severity="warning">승인된 프로필 사진이 없어 제안을 만들 수 없습니다.</Alert> : (
            <Stack spacing={2}>
              {approvedImages.map((image) => {
                const prepared = preparedImages[image.imageId];
                const isUploading = uploadingImageId === image.imageId;
                return <Paper key={image.imageId} variant="outlined" sx={{ p: 2 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                    <Box component="img" src={image.url} alt={`현재 프로필 사진 슬롯 ${image.slotIndex + 1}`} sx={{ width: 112, aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={700}>현재 사진 · 슬롯 {image.slotIndex + 1}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>이 사진을 개선한 결과를 같은 슬롯에 제안합니다.</Typography>
                      <Button component="label" variant="outlined" disabled={isUploading || submitting}>
                        {isUploading ? '사진 업로드 중' : prepared ? '결과 사진 다시 선택' : '검토 완료 사진 업로드'}
                        <input hidden type="file" accept="image/*" onChange={(event) => void upload(image, event)} />
                      </Button>
                    </Box>
                    {prepared && <Box component="img" src={prepared.previewUrl} alt={`큐레이팅 결과 미리보기 슬롯 ${image.slotIndex + 1}`} sx={{ width: 112, aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 1 }} />}
                  </Stack>
                </Paper>;
              })}
            </Stack>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="contained" onClick={() => void submit()} disabled={submitting || uploadingImageId !== null || approvedImages.length === 0}>
              {submitting ? '제안 발송 중' : '회원에게 큐레이팅 제안하기'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
