'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AdminService from '@/app/services/admin';
import type { UtmLink } from '@/app/services/admin';
import { useToast } from '@/shared/ui/admin/toast';
import QRCode from 'qrcode';

type DestinationType = 'web' | 'appstore_ios' | 'appstore_android';

const CHANNEL_PRESETS = [
  { label: '에브리타임', source: 'everytime', medium: 'community' },
  { label: '오프라인 포스터', source: 'poster', medium: 'offline' },
  { label: '인스타그램', source: 'instagram', medium: 'social' },
  { label: '틱톡', source: 'tiktok', medium: 'social' },
  { label: 'Meta 광고', source: 'meta', medium: 'cpc' },
  { label: 'Google 광고', source: 'google', medium: 'cpc' },
  { label: '친구 추천', source: 'friend', medium: 'referral' },
  { label: '앱스토어 검색', source: 'appstore', medium: 'organic' },
  { label: '기타 (직접입력)', source: '', medium: '' },
];

interface UtmLinkCreatorProps {
  onCreated: () => void;
}

export default function UtmLinkCreator({ onCreated }: UtmLinkCreatorProps) {
  const toast = useToast();

  const [channelIndex, setChannelIndex] = useState<number>(0);
  const [source, setSource] = useState(CHANNEL_PRESETS[0].source);
  const [medium, setMedium] = useState(CHANNEL_PRESETS[0].medium);
  const [campaign, setCampaign] = useState('');
  const [content, setContent] = useState('');
  const [destinationType, setDestinationType] = useState<DestinationType>('web');
  const [memo, setMemo] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [resultOpen, setResultOpen] = useState(false);
  const [createdLink, setCreatedLink] = useState<UtmLink | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const isCustomChannel = channelIndex === CHANNEL_PRESETS.length - 1;

  const handleChannelChange = (index: number) => {
    setChannelIndex(index);
    const preset = CHANNEL_PRESETS[index];
    setSource(preset.source);
    setMedium(preset.medium);
    updateName(preset.source, campaign);
  };

  const updateName = (src: string, camp: string) => {
    if (src && camp) {
      setName(`${src}_${camp}`);
    } else if (src) {
      setName(src);
    } else {
      setName('');
    }
  };

  const handleCampaignChange = (value: string) => {
    setCampaign(value);
    updateName(source, value);
  };

  const handleSubmit = async () => {
    if (!source || !medium || !campaign) {
      toast.warning('소스, 매체, 캠페인은 필수입니다.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await AdminService.utm.createLink({
        name: name || `${source}_${campaign}`,
        utmSource: source,
        utmMedium: medium,
        utmCampaign: campaign,
        utmContent: content || undefined,
        destinationType,
        memo: memo || undefined,
      });

      setCreatedLink(result);

      const url = result.shortUrl || result.destinationUrl;
      const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
      setQrDataUrl(dataUrl);

      setResultOpen(true);
      toast.success('UTM 링크가 생성되었습니다.');
      onCreated();

      // Reset form
      setCampaign('');
      setContent('');
      setMemo('');
      setName('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || '링크 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} 복사 완료`);
    } catch {
      toast.error('클립보드 복사에 실패했습니다.');
    }
  };

  const downloadQr = () => {
    if (!qrDataUrl || !createdLink) return;
    const link = document.createElement('a');
    link.download = `qr_${createdLink.name}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          새 UTM 링크 생성
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <TextField
            select
            label="채널"
            value={channelIndex}
            onChange={(e) => handleChannelChange(Number(e.target.value))}
            fullWidth
          >
            {CHANNEL_PRESETS.map((preset, i) => (
              <MenuItem key={i} value={i}>
                {preset.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="캠페인"
            placeholder="예: 2026_spring_event"
            value={campaign}
            onChange={(e) => handleCampaignChange(e.target.value)}
            required
            fullWidth
          />

          <TextField
            label="소스 (utm_source)"
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              updateName(e.target.value, campaign);
            }}
            disabled={!isCustomChannel}
            required
            fullWidth
          />

          <TextField
            label="매체 (utm_medium)"
            value={medium}
            onChange={(e) => setMedium(e.target.value)}
            disabled={!isCustomChannel}
            required
            fullWidth
          />

          <TextField
            label="콘텐츠 (utm_content)"
            placeholder="선택 사항"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
          />

          <TextField
            label="링크 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            helperText="자동 생성되며 직접 수정 가능"
            fullWidth
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <FormLabel sx={{ fontWeight: 600 }}>목적지</FormLabel>
          <RadioGroup
            row
            value={destinationType}
            onChange={(e) => setDestinationType(e.target.value as DestinationType)}
          >
            <FormControlLabel value="web" control={<Radio size="small" />} label="웹" />
            <FormControlLabel value="appstore_ios" control={<Radio size="small" />} label="iOS" />
            <FormControlLabel value="appstore_android" control={<Radio size="small" />} label="Android" />
          </RadioGroup>
        </Box>

        <TextField
          label="메모"
          placeholder="이 링크의 용도나 메모"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          multiline
          rows={2}
          fullWidth
          sx={{ mt: 2 }}
        />

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || !source || !medium || !campaign}
          >
            {submitting ? <CircularProgress size={20} /> : '링크 생성'}
          </Button>
        </Box>
      </Paper>

      <Dialog open={resultOpen} onClose={() => setResultOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>링크 생성 완료</DialogTitle>
        <DialogContent dividers>
          {createdLink && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">최종 도착 URL (클릭 추적 없음)</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <TextField
                    value={createdLink.destinationUrl}
                    size="small"
                    fullWidth
                    slotProps={{ input: { readOnly: true } }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(createdLink.destinationUrl, '최종 도착 URL')}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {createdLink.shortUrl && (
                <Box>
                  <Typography variant="caption" color="textSecondary">추적 URL</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <TextField
                      value={createdLink.shortUrl}
                      size="small"
                      fullWidth
                      slotProps={{ input: { readOnly: true } }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(createdLink.shortUrl!, '추적 URL')}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              )}

              {qrDataUrl && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mt: 1 }}>
                  <img src={qrDataUrl} alt="QR Code" style={{ width: 200, height: 200 }} />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={downloadQr}
                  >
                    QR 다운로드
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setResultOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
