'use client';

import { useState, useCallback, useMemo } from 'react';
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
  Tooltip,
  Chip,
  Collapse,
  Alert,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AdminService from '@/app/services/admin';
import type { UtmLink } from '@/app/services/admin';
import { useToast } from '@/shared/ui/admin/toast';
import QRCode from 'qrcode';
import {
  PLACEMENT_OPTIONS,
  PLATFORM_BINDING_OPTIONS,
  SITE_SOURCE_NAME_OPTIONS,
  UTM_CREATIVE_FORMAT_OPTIONS,
  UTM_MARKETING_TACTIC_OPTIONS,
  UTM_SOURCE_PLATFORM_OPTIONS,
} from '../utm-options';

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

/* ── Tooltip 문구 (기획서 3.2절) ── */
const UTM_FIELD_TOOLTIPS: Record<string, string> = {
  channel:
    '유입이 시작된 장소입니다. 예: google, meta, instagram, everytime. 프리셋을 쓰면 source/medium이 같이 채워집니다.',
  campaign:
    '예산과 성과를 묶어 볼 캠페인 단위입니다. 기간/목적/타겟이 드러나게 작성하세요. 예: 2026_spring_signup_kr20f.',
  source:
    'URL의 utm_source입니다. 유입 출처입니다. 대시보드 채널 성과의 1차 그룹 기준입니다.',
  medium:
    'URL의 utm_medium입니다. paid/social/cpc/referral/offline처럼 트래픽 유형을 나타냅니다.',
  content:
    'URL의 utm_content입니다. 같은 캠페인 안에서 소재, 문구, 배너 위치, QR 포스터 버전을 구분합니다.',
  term: 'URL의 utm_term입니다. 검색 키워드 또는 타겟 세그먼트를 넣습니다. 검색 광고가 아니면 선택입니다.',
  utmId:
    '플랫폼이 달라도 같은 캠페인을 묶는 안정적인 ID입니다. 자동 생성값 사용을 권장합니다.',
  sourcePlatform:
    '실제 광고/유입 플랫폼입니다. Meta Ads와 Instagram Organic처럼 source만으로 구분이 어려운 경우 필요합니다.',
  creativeFormat:
    '이미지, 영상, 릴스, QR 등 소재 형식입니다. 형식별 전환율 비교에 사용합니다.',
  marketingTactic:
    '신규획득, 리타게팅, 이벤트, 추천 등 마케팅 전술입니다. 운영 관점의 성과 비교에 사용합니다.',
  bindingCampaignId:
    '광고 플랫폼의 캠페인 ID입니다. Meta/Google 관리자 화면에서 복사합니다.',
  bindingAdsetId:
    'Meta는 Adset, Google은 Ad group 단위입니다. 타겟/그룹별 성과 연결에 필요합니다.',
  bindingAdGroupId:
    'Meta는 Adset, Google은 Ad group 단위입니다. 타겟/그룹별 성과 연결에 필요합니다.',
  bindingAdId: '개별 광고 ID입니다. 광고 단위 전환 연결에 필요합니다.',
  bindingCreativeId:
    '소재 ID입니다. 같은 광고 안의 이미지/영상 성과를 구분할 때 사용합니다.',
  bindingPlacement:
    '광고가 노출된 위치입니다. 예: Instagram Feed, Reels, YouTube, campus poster.',
  bindingSiteSourceName:
    '플랫폼 내부 유입면입니다. Meta의 ig/fb/an/msg 또는 Google/YouTube 구분에 사용합니다.',
  destination:
    '사용자가 클릭 후 이동할 위치입니다. 웹은 전체 UTM query가 붙고, Android는 referrer에 UTM이 들어갑니다. iOS는 App Store 캠페인 토큰 중심입니다.',
  memo: 'URL에는 노출되지 않는 내부 메모입니다. 예산, 요청자, 실험 가설, 소재 링크를 남기세요.',
  name: '관리자 목록에서 보는 내부 이름입니다. 자동 생성되며 필요하면 소재/목적을 추가하세요.',
};

/* ── label + tooltip 아이콘 래퍼 ── */
function FieldWithTooltip({
  label,
  tooltip,
}: {
  label: string;
  tooltip?: string;
}) {
  if (!tooltip) return <>{label}</>;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
      }}
    >
      {label}
      <Tooltip title={tooltip} arrow placement="top">
        <HelpOutlineIcon
          sx={{
            fontSize: 16,
            color: 'text.secondary',
            cursor: 'help',
            verticalAlign: 'middle',
          }}
        />
      </Tooltip>
    </Box>
  );
}

/* ── utmId 자동 생성 ── */
const generateUtmId = (src: string, camp: string) => {
  if (!src || !camp) return '';
  return `${src}_${camp}`;
};

interface UtmLinkCreatorProps {
  onCreated: () => void;
}

export default function UtmLinkCreator({ onCreated }: UtmLinkCreatorProps) {
  const toast = useToast();

  /* ── form state ── */
  const [channelIndex, setChannelIndex] = useState<number>(0);
  const [source, setSource] = useState(CHANNEL_PRESETS[0].source);
  const [medium, setMedium] = useState(CHANNEL_PRESETS[0].medium);
  const [campaign, setCampaign] = useState('');
  const [content, setContent] = useState('');
  const [term, setTerm] = useState('');
  const [utmId, setUtmId] = useState('');
  const [utmIdDirty, setUtmIdDirty] = useState(false);
  const [prevAutoUtmId, setPrevAutoUtmId] = useState('');
  const [sourcePlatform, setSourcePlatform] = useState('');
  const [creativeFormat, setCreativeFormat] = useState('');
  const [marketingTactic, setMarketingTactic] = useState('');
  const [bindingPlatform, setBindingPlatform] = useState<'meta' | 'google_ads'>('meta');
  const [bindingCampaignId, setBindingCampaignId] = useState('');
  const [bindingAdsetId, setBindingAdsetId] = useState('');
  const [bindingAdGroupId, setBindingAdGroupId] = useState('');
  const [bindingAdId, setBindingAdId] = useState('');
  const [bindingCreativeId, setBindingCreativeId] = useState('');
  const [bindingPlacement, setBindingPlacement] = useState('');
  const [bindingSiteSourceName, setBindingSiteSourceName] = useState('');
  const [destinationType, setDestinationType] = useState<DestinationType>('web');
  const [memo, setMemo] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ── collapse state ── */
  const [recommendedOpen, setRecommendedOpen] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(true);

  /* ── result dialog ── */
  const [resultOpen, setResultOpen] = useState(false);
  const [createdLink, setCreatedLink] = useState<UtmLink | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const isCustomChannel = channelIndex === CHANNEL_PRESETS.length - 1;

  /* ── name 자동 생성 ── */
  const updateName = useCallback((src: string, camp: string) => {
    if (src && camp) {
      setName(`${src}_${camp}`);
    } else if (src) {
      setName(src);
    } else {
      setName('');
    }
  }, []);

  /* ── utmId 자동 생성 (dirty 플래그 관리) ── */
  const autoGenerateUtmId = useCallback(
    (src: string, camp: string) => {
      if (utmIdDirty) return;
      const next = generateUtmId(src, camp);
      if (next && (utmId === '' || utmId === prevAutoUtmId)) {
        setUtmId(next);
        setPrevAutoUtmId(next);
      }
    },
    [utmId, utmIdDirty, prevAutoUtmId]
  );

  const handleChannelChange = (index: number) => {
    setChannelIndex(index);
    const preset = CHANNEL_PRESETS[index];
    setSource(preset.source);
    setMedium(preset.medium);
    updateName(preset.source, campaign);
    autoGenerateUtmId(preset.source, campaign);
  };

  const handleCampaignChange = (value: string) => {
    setCampaign(value);
    updateName(source, value);
    autoGenerateUtmId(source, value);
  };

  const handleSourceChange = (value: string) => {
    setSource(value);
    updateName(value, campaign);
    autoGenerateUtmId(value, campaign);
  };

  /* ── 규칙 기반 validation ── */
  const validationWarnings = useMemo(() => {
    const warnings: string[] = [];

    // 일반적 campaign 경고
    const genericCampaigns = ['spring', 'test', 'google', 'ad', 'campaign'];
    if (campaign && genericCampaigns.some((g) => campaign.toLowerCase().includes(g))) {
      warnings.push('캠페인명이 너무 일반적입니다. 기간/목적/타겟이 드러나도록 구체적으로 작성하세요.');
    }

    // source / sourcePlatform 충돌
    if (
      source &&
      sourcePlatform &&
      ((source === 'google' && sourcePlatform !== 'google_ads') ||
        (source === 'meta' && sourcePlatform !== 'meta_ads') ||
        (source === 'instagram' && !sourcePlatform.includes('meta')))
    ) {
      warnings.push(`source="${source}"와 sourcePlatform="${sourcePlatform}" 조합이 일관되지 않을 수 있습니다.`);
    }

    // medium / tactic 충돌
    if (medium === 'organic' && marketingTactic === 'retargeting') {
      warnings.push('medium="organic"과 tactic="retargeting"은 일반적으로 함께 쓰이지 않습니다.');
    }

    return warnings;
  }, [campaign, source, sourcePlatform, medium, marketingTactic]);

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
        utmTerm: term || undefined,
        utmId: utmId || undefined,
        utmSourcePlatform: sourcePlatform || undefined,
        utmCreativeFormat: creativeFormat || undefined,
        utmMarketingTactic: marketingTactic || undefined,
        destinationType,
        memo: memo || undefined,
        platformBindings: [
          {
            platform: bindingPlatform,
            campaignId: bindingCampaignId || undefined,
            adsetId: bindingPlatform === 'meta' ? bindingAdsetId || undefined : undefined,
            adGroupId: bindingPlatform === 'google_ads' ? bindingAdGroupId || undefined : undefined,
            adId: bindingAdId || undefined,
            creativeId: bindingCreativeId || undefined,
            placement: bindingPlacement || undefined,
            siteSourceName: bindingSiteSourceName || undefined,
          },
        ].filter(
          (binding) =>
            binding.campaignId ||
            binding.adsetId ||
            binding.adGroupId ||
            binding.adId ||
            binding.creativeId
        ),
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
      setTerm('');
      setUtmId('');
      setUtmIdDirty(false);
      setPrevAutoUtmId('');
      setSourcePlatform('');
      setCreativeFormat('');
      setMarketingTactic('');
      setBindingCampaignId('');
      setBindingAdsetId('');
      setBindingAdGroupId('');
      setBindingAdId('');
      setBindingCreativeId('');
      setBindingPlacement('');
      setBindingSiteSourceName('');
      setMemo('');
      setName('');
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || err.message || '링크 생성에 실패했습니다.'
      );
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

  /* ── 섹션 헤더 래퍼 ── */
  const SectionHeader = ({
    title,
    badgeLabel,
    badgeColor,
    open,
    onToggle,
  }: {
    title: string;
    badgeLabel: string;
    badgeColor: 'error' | 'warning' | 'default';
    open: boolean;
    onToggle?: () => void;
  }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 1.5,
        mt: 2,
        cursor: onToggle ? 'pointer' : 'default',
      }}
      onClick={onToggle}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          {title}
        </Typography>
        <Chip
          label={badgeLabel}
          color={badgeColor}
          size="small"
          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
        />
      </Box>
      {onToggle && (
        <IconButton size="small" sx={{ p: 0.5 }}>
          {open ? (
            <ExpandLessIcon fontSize="small" />
          ) : (
            <ExpandMoreIcon fontSize="small" />
          )}
        </IconButton>
      )}
    </Box>
  );

  return (
    <>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          새 UTM 링크 생성
        </Typography>

        {/* ── [필수] ── */}
        <SectionHeader
          title="필수 입력"
          badgeLabel="필수"
          badgeColor="error"
          open={true}
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
          }}
        >
          <TextField
            select
            label={
              <FieldWithTooltip
                label="채널"
                tooltip={UTM_FIELD_TOOLTIPS.channel}
              />
            }
            value={channelIndex}
            onChange={(e) => handleChannelChange(Number(e.target.value))}
            required
            fullWidth
          >
            {CHANNEL_PRESETS.map((preset, i) => (
              <MenuItem key={i} value={i}>
                {preset.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label={
              <FieldWithTooltip
                label="캠페인"
                tooltip={UTM_FIELD_TOOLTIPS.campaign}
              />
            }
            placeholder="예: 2026_spring_event"
            value={campaign}
            onChange={(e) => handleCampaignChange(e.target.value)}
            required
            fullWidth
          />

          <TextField
            label={
              <FieldWithTooltip
                label="소스 (utm_source)"
                tooltip={UTM_FIELD_TOOLTIPS.source}
              />
            }
            value={source}
            onChange={(e) => handleSourceChange(e.target.value)}
            disabled={!isCustomChannel}
            required
            fullWidth
          />

          <TextField
            label={
              <FieldWithTooltip
                label="매체 (utm_medium)"
                tooltip={UTM_FIELD_TOOLTIPS.medium}
              />
            }
            value={medium}
            onChange={(e) => setMedium(e.target.value)}
            disabled={!isCustomChannel}
            required
            fullWidth
          />

          <TextField
            label={
              <FieldWithTooltip
                label="링크 이름"
                tooltip={UTM_FIELD_TOOLTIPS.name}
              />
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
            helperText="자동 생성되며 직접 수정 가능"
            fullWidth
          />

          <Box>
            <FormLabel sx={{ fontWeight: 600 }}>
              <FieldWithTooltip
                label="목적지"
                tooltip={UTM_FIELD_TOOLTIPS.destination}
              />
            </FormLabel>
            <RadioGroup
              row
              value={destinationType}
              onChange={(e) =>
                setDestinationType(e.target.value as DestinationType)
              }
            >
              <FormControlLabel
                value="web"
                control={<Radio size="small" />}
                label="웹"
              />
              <FormControlLabel
                value="appstore_ios"
                control={<Radio size="small" />}
                label="iOS"
              />
              <FormControlLabel
                value="appstore_android"
                control={<Radio size="small" />}
                label="Android"
              />
            </RadioGroup>
            {destinationType === 'appstore_ios' && (
              <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                iOS App Store URL에는 utm_campaign만 ct 파라미터로
                반영됩니다. content/term 등은 short URL 리다이렉트 이벤트로
                추적됩니다.
              </Alert>
            )}
            {destinationType === 'appstore_android' && (
              <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                Android Play Store는 referrer에 전체 UTM 파라미터가
                인코딩되어 전달됩니다.
              </Alert>
            )}
          </Box>
        </Box>

        {/* ── [권장] ── */}
        <SectionHeader
          title="권장 입력"
          badgeLabel="권장"
          badgeColor="warning"
          open={recommendedOpen}
          onToggle={() => setRecommendedOpen((v) => !v)}
        />
        <Collapse in={recommendedOpen}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            <TextField
              label={
                <FieldWithTooltip
                  label="콘텐츠 (utm_content) (권장)"
                  tooltip={UTM_FIELD_TOOLTIPS.content}
                />
              }
              placeholder="예: video_a, poster_qr_01"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              fullWidth
            />
            <TextField
              label={
                <FieldWithTooltip
                  label="Term (utm_term) (권장)"
                  tooltip={UTM_FIELD_TOOLTIPS.term}
                />
              }
              placeholder="예: female_univ_20s"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              fullWidth
            />
            <TextField
              label={
                <FieldWithTooltip
                  label="UTM ID (utm_id) (권장)"
                  tooltip={UTM_FIELD_TOOLTIPS.utmId}
                />
              }
              placeholder="자동 생성됨"
              value={utmId}
              onChange={(e) => {
                setUtmId(e.target.value);
                setUtmIdDirty(true);
              }}
              helperText={
                utmIdDirty
                  ? '수동 수정됨 — 자동 생성 중단'
                  : 'source + campaign 조합으로 자동 생성'
              }
              fullWidth
            />
            <TextField
              select
              label={
                <FieldWithTooltip
                  label="Source platform (권장)"
                  tooltip={UTM_FIELD_TOOLTIPS.sourcePlatform}
                />
              }
              value={sourcePlatform}
              onChange={(e) => setSourcePlatform(e.target.value)}
              fullWidth
            >
              {UTM_SOURCE_PLATFORM_OPTIONS.map((option) => (
                <MenuItem
                  key={option.value || 'empty-source-platform'}
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={
                <FieldWithTooltip
                  label="Creative format (권장)"
                  tooltip={UTM_FIELD_TOOLTIPS.creativeFormat}
                />
              }
              value={creativeFormat}
              onChange={(e) => setCreativeFormat(e.target.value)}
              fullWidth
            >
              {UTM_CREATIVE_FORMAT_OPTIONS.map((option) => (
                <MenuItem
                  key={option.value || 'empty-creative-format'}
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={
                <FieldWithTooltip
                  label="Marketing tactic (권장)"
                  tooltip={UTM_FIELD_TOOLTIPS.marketingTactic}
                />
              }
              value={marketingTactic}
              onChange={(e) => setMarketingTactic(e.target.value)}
              fullWidth
            >
              {UTM_MARKETING_TACTIC_OPTIONS.map((option) => (
                <MenuItem
                  key={option.value || 'empty-marketing-tactic'}
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Collapse>

        {/* ── [고급] Platform binding ── */}
        <SectionHeader
          title="Platform binding"
          badgeLabel="고급"
          badgeColor="default"
          open={advancedOpen}
          onToggle={() => setAdvancedOpen((v) => !v)}
        />
        <Collapse in={advancedOpen}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(4, 1fr)',
              },
              gap: 2,
            }}
          >
            <TextField
              select
              label="Platform"
              value={bindingPlatform}
              onChange={(e) =>
                setBindingPlatform(e.target.value as 'meta' | 'google_ads')
              }
              fullWidth
            >
              {PLATFORM_BINDING_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={
                <FieldWithTooltip
                  label="Campaign ID"
                  tooltip={UTM_FIELD_TOOLTIPS.bindingCampaignId}
                />
              }
              value={bindingCampaignId}
              onChange={(e) => setBindingCampaignId(e.target.value)}
              fullWidth
            />
            {bindingPlatform === 'meta' ? (
              <TextField
                label={
                  <FieldWithTooltip
                    label="Adset ID"
                    tooltip={UTM_FIELD_TOOLTIPS.bindingAdsetId}
                  />
                }
                value={bindingAdsetId}
                onChange={(e) => setBindingAdsetId(e.target.value)}
                fullWidth
              />
            ) : (
              <TextField
                label={
                  <FieldWithTooltip
                    label="Ad group ID"
                    tooltip={UTM_FIELD_TOOLTIPS.bindingAdGroupId}
                  />
                }
                value={bindingAdGroupId}
                onChange={(e) => setBindingAdGroupId(e.target.value)}
                fullWidth
              />
            )}
            <TextField
              label={
                <FieldWithTooltip
                  label="Ad ID"
                  tooltip={UTM_FIELD_TOOLTIPS.bindingAdId}
                />
              }
              value={bindingAdId}
              onChange={(e) => setBindingAdId(e.target.value)}
              fullWidth
            />
            <TextField
              label={
                <FieldWithTooltip
                  label="Creative ID"
                  tooltip={UTM_FIELD_TOOLTIPS.bindingCreativeId}
                />
              }
              value={bindingCreativeId}
              onChange={(e) => setBindingCreativeId(e.target.value)}
              fullWidth
            />
            <TextField
              select
              label={
                <FieldWithTooltip
                  label="Placement"
                  tooltip={UTM_FIELD_TOOLTIPS.bindingPlacement}
                />
              }
              value={bindingPlacement}
              onChange={(e) => setBindingPlacement(e.target.value)}
              fullWidth
            >
              {PLACEMENT_OPTIONS.map((option) => (
                <MenuItem
                  key={option.value || 'empty-placement'}
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={
                <FieldWithTooltip
                  label="Site source name"
                  tooltip={UTM_FIELD_TOOLTIPS.bindingSiteSourceName}
                />
              }
              value={bindingSiteSourceName}
              onChange={(e) => setBindingSiteSourceName(e.target.value)}
              fullWidth
            >
              {SITE_SOURCE_NAME_OPTIONS.map((option) => (
                <MenuItem
                  key={option.value || 'empty-site-source-name'}
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Collapse>

        {/* ── 메모 ── */}
        <Box sx={{ mt: 2 }}>
          <TextField
            label={
              <FieldWithTooltip label="메모" tooltip={UTM_FIELD_TOOLTIPS.memo} />
            }
            placeholder="이 링크의 용도나 메모"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
        </Box>

        {/* ── Validation warnings ── */}
        {validationWarnings.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {validationWarnings.map((w, i) => (
              <Alert key={i} severity="warning" variant="outlined">
                {w}
              </Alert>
            ))}
          </Box>
        )}

        {/* ── 생성 버튼 ── */}
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

      {/* ── 결과 Dialog ── */}
      <Dialog
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>링크 생성 완료</DialogTitle>
        <DialogContent dividers>
          {createdLink && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  최종 도착 URL (클릭 추적 없음)
                </Typography>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}
                >
                  <TextField
                    value={createdLink.destinationUrl}
                    size="small"
                    fullWidth
                    slotProps={{ input: { readOnly: true } }}
                  />
                  <IconButton
                    size="small"
                    onClick={() =>
                      copyToClipboard(
                        createdLink.destinationUrl,
                        '최종 도착 URL'
                      )
                    }
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {createdLink.shortUrl && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    추적 URL
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mt: 0.5,
                    }}
                  >
                    <TextField
                      value={createdLink.shortUrl}
                      size="small"
                      fullWidth
                      slotProps={{ input: { readOnly: true } }}
                    />
                    <IconButton
                      size="small"
                      onClick={() =>
                        copyToClipboard(createdLink.shortUrl!, '추적 URL')
                      }
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              )}

              {qrDataUrl && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    mt: 1,
                  }}
                >
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    style={{ width: 200, height: 200 }}
                  />
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
