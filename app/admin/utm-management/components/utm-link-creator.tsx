'use client';

import { useState, useCallback, useMemo, type ReactNode } from 'react';
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
  Divider,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AdminService from '@/app/services/admin';
import type { UtmLink } from '@/app/services/admin';
import type { UtmDestinationType, UtmRegion } from '@/app/services/admin/utm';
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

type DestinationType = Exclude<UtmDestinationType, 'deeplink'>;
type SectionTone = 'required' | 'recommended' | 'advanced';

const CHANNEL_PRESETS = [
  { label: '에브리타임', source: 'everytime', medium: 'community' },
  { label: '오프라인 포스터', source: 'poster', medium: 'offline' },
  { label: '인스타그램', source: 'instagram', medium: 'social' },
  { label: '틱톡 오가닉', source: 'tiktok', medium: 'social' },
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
      <Tooltip title={tooltip} arrow placement="top" describeChild>
        <HelpOutlineIcon
          aria-hidden="true"
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

const DESTINATION_COPY: Record<
  DestinationType,
  { label: string; description: string }
> = {
  web: {
    label: '웹',
    description: '전체 UTM query가 URL에 붙습니다.',
  },
  appstore_ios: {
    label: 'iOS',
    description: 'App Store ct 캠페인 토큰 중심으로 이동합니다.',
  },
  appstore_android: {
    label: 'Android',
    description: 'Play Store referrer에 전체 UTM이 인코딩됩니다.',
  },
};

function SectionHeader({
  title,
  badgeLabel,
  badgeColor,
  description,
  tone,
  open,
  onToggle,
}: {
  title: string;
  badgeLabel: string;
  badgeColor: 'error' | 'warning' | 'default';
  description: string;
  tone: SectionTone;
  open: boolean;
  onToggle?: () => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 2,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor:
          tone === 'required'
            ? '#fff5f5'
            : tone === 'recommended'
              ? '#fffbeb'
              : '#f9fafb',
        cursor: onToggle ? 'pointer' : 'default',
      }}
      onClick={onToggle}
    >
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" fontWeight={800}>
            {title}
          </Typography>
          <Chip
            label={badgeLabel}
            color={badgeColor}
            size="small"
            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
          />
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 0.5, display: 'block' }}
        >
          {description}
        </Typography>
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
}

function SectionCard({
  tone,
  children,
}: {
  tone: SectionTone;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '5px solid',
        borderLeftColor:
          tone === 'required'
            ? 'error.main'
            : tone === 'recommended'
              ? 'warning.main'
              : 'secondary.main',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {children}
    </Box>
  );
}

function FieldShell({
  children,
  helper,
}: {
  children: ReactNode;
  helper: ReactNode;
}) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 1.25,
        bgcolor: 'background.paper',
        minWidth: 0,
      }}
    >
      {children}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 1, lineHeight: 1.45 }}
      >
        {helper}
      </Typography>
    </Box>
  );
}

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
  const [region, setRegion] = useState<UtmRegion>('kr');
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

  const previewUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (source) params.set('utm_source', source);
    if (medium) params.set('utm_medium', medium);
    if (campaign) params.set('utm_campaign', campaign);
    if (content) params.set('utm_content', content);
    if (term) params.set('utm_term', term);
    if (utmId) params.set('utm_id', utmId);

    const query = params.toString();
    if (destinationType === 'appstore_ios') {
      return `https://apps.apple.com/${region}/app/id6746120889${campaign ? `?ct=${encodeURIComponent(campaign)}&pt=126413580&mt=8` : ''}`;
    }
    if (destinationType === 'appstore_android') {
      return `https://play.google.com/store/apps/details?id=com.smartnewb.sometimes${query ? `&referrer=${encodeURIComponent(query)}` : ''}`;
    }
    return `https://some-in-univ.com${query ? `?${query}` : ''}`;
  }, [campaign, content, destinationType, medium, region, source, term, utmId]);

  const trackingScore = useMemo(() => {
    let score = 0;
    if (source) score += 15;
    if (medium) score += 15;
    if (campaign) score += 20;
    if (destinationType) score += 10;
    if (content) score += 8;
    if (term) score += 5;
    if (utmId) score += 10;
    if (sourcePlatform) score += 8;
    if (creativeFormat) score += 5;
    if (marketingTactic) score += 6;
    if (bindingCampaignId) score += 6;
    if (bindingAdsetId || bindingAdGroupId || bindingAdId || bindingCreativeId) {
      score += 4;
    }
    return Math.min(score, 100);
  }, [
    bindingAdGroupId,
    bindingAdId,
    bindingAdsetId,
    bindingCampaignId,
    bindingCreativeId,
    campaign,
    content,
    creativeFormat,
    destinationType,
    marketingTactic,
    medium,
    source,
    sourcePlatform,
    term,
    utmId,
  ]);

  const scoreColor =
    trackingScore >= 80 ? 'success.main' : trackingScore >= 55 ? 'warning.main' : 'error.main';
  const scoreLabel =
    trackingScore >= 80
      ? '분석 가능성 높음'
      : trackingScore >= 55
        ? '분석 가능성 보통'
        : '필수값 위주';

  const previewParams = [
    { key: 'utm_source', value: source, label: '채널별 성과' },
    { key: 'utm_medium', value: medium, label: '트래픽 유형' },
    { key: 'utm_campaign', value: campaign, label: '캠페인별 성과' },
    { key: 'utm_content', value: content, label: '소재 A/B' },
    { key: 'utm_term', value: term, label: '타겟/키워드' },
    { key: 'utm_id', value: utmId, label: '플랫폼 통합 키' },
  ];

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
        region: destinationType === 'appstore_ios' ? region : undefined,
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
      setRegion('kr');
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

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) 360px' },
          gap: 2,
          alignItems: 'flex-start',
        }}
      >
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          <Box
            sx={{
              p: 3,
              display: 'flex',
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: 2,
              flexDirection: { xs: 'column', md: 'row' },
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={800}>
                새 UTM 링크 생성
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                필수값은 빠르게 채우고, 권장값은 어떤 성과 분석에 쓰이는지 확인하면서 입력합니다.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'common.white',
                  bgcolor: scoreColor,
                  fontWeight: 800,
                }}
              >
                {trackingScore}
              </Box>
              <Box sx={{ maxWidth: 260 }}>
                <Typography variant="subtitle2" fontWeight={800}>
                  {scoreLabel}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                  광고 ID까지 연결하면 플랫폼 drilldown과 전환 export 품질이 더 좋아집니다.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* ── [필수] ── */}
        <SectionCard tone="required">
        <SectionHeader
          title="필수 입력"
          badgeLabel="필수"
          badgeColor="error"
          description="링크 생성과 최소 성과 집계에 반드시 필요한 값입니다."
          tone="required"
          open={true}
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
            p: 2,
          }}
        >
          <FieldShell helper="유입이 시작된 장소입니다. 프리셋을 쓰면 source와 medium이 함께 채워집니다.">
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
          </FieldShell>

          <FieldShell helper="예산과 성과를 묶어 볼 캠페인 단위입니다. 기간, 목적, 타겟이 드러나게 작성하세요.">
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
          </FieldShell>

          <FieldShell helper="채널 성과의 1차 그룹 기준입니다. 직접입력 채널에서만 수정합니다.">
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
          </FieldShell>

          <FieldShell helper="paid, social, cpc, referral, offline처럼 트래픽 유형을 구분합니다.">
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
          </FieldShell>

          <FieldShell helper="관리자 목록에서 보는 내부 이름입니다. 기본값은 source_campaign 조합입니다.">
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
          </FieldShell>

          <FieldShell helper={DESTINATION_COPY[destinationType].description}>
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
              <>
                <TextField
                  select
                  label="App Store 지역"
                  value={region}
                  onChange={(e) => setRegion(e.target.value as UtmRegion)}
                  size="small"
                  sx={{ mt: 1, minWidth: 180 }}
                >
                  <MenuItem value="kr">대한민국 (KR)</MenuItem>
                  <MenuItem value="jp">일본 (JP)</MenuItem>
                </TextField>
                <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                  지역을 지정하지 않는 기존 요청은 대한민국(KR)으로 유지됩니다.
                  iOS App Store URL에는 utm_campaign만 ct 파라미터로 반영되며,
                  content/term 등은 short URL 리다이렉트 이벤트로 추적됩니다.
                </Alert>
              </>
            )}
            {destinationType === 'appstore_android' && (
              <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                Android Play Store는 referrer에 전체 UTM 파라미터가
                인코딩되어 전달됩니다.
              </Alert>
            )}
          </FieldShell>
        </Box>
        </SectionCard>

        {/* ── [권장] ── */}
        <SectionCard tone="recommended">
        <SectionHeader
          title="권장 입력"
          badgeLabel="권장"
          badgeColor="warning"
          description="소재, 타겟, 플랫폼, 전술별 성과를 나눠 보기 위한 값입니다."
          tone="recommended"
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
              p: 2,
            }}
          >
            <FieldShell helper="같은 캠페인 안에서 소재, 문구, 배너 위치, QR 버전을 구분합니다.">
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
            </FieldShell>
            <FieldShell helper="검색 키워드나 타겟 세그먼트를 넣습니다. 검색 광고가 아니어도 타겟 분리에 유용합니다.">
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
            </FieldShell>
            <FieldShell helper="플랫폼이 달라도 같은 캠페인을 묶는 안정적인 ID입니다. 자동 생성값 사용을 권장합니다.">
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
            </FieldShell>
            <FieldShell helper="source만으로 구분이 어려운 실제 광고/유입 플랫폼입니다.">
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
            </FieldShell>
            <FieldShell helper="이미지, 영상, 릴스, QR 등 소재 형식별 전환율 비교에 사용합니다.">
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
            </FieldShell>
            <FieldShell helper="신규획득, 리타게팅, 이벤트, 추천 등 운영 관점의 전술 비교에 사용합니다.">
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
            </FieldShell>
          </Box>
        </Collapse>
        </SectionCard>

        {/* ── [고급] Platform binding ── */}
        <SectionCard tone="advanced">
        <SectionHeader
          title="광고 플랫폼 바인딩"
          badgeLabel="고급"
          badgeColor="default"
          description="광고 관리자 원본 ID를 연결해 광고 단위 drilldown과 전환 export를 안정화합니다."
          tone="advanced"
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
              p: 2,
            }}
          >
            <FieldShell helper="플랫폼에 따라 Meta Adset 또는 Google Ad group 필드를 보여줍니다.">
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
            </FieldShell>
            <FieldShell helper="광고 플랫폼의 캠페인 ID입니다. 관리자 화면에서 복사한 값을 넣습니다.">
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
            </FieldShell>
            {bindingPlatform === 'meta' ? (
              <FieldShell helper="Meta의 타겟/그룹 단위입니다. 그룹별 성과 연결에 필요합니다.">
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
              </FieldShell>
            ) : (
              <FieldShell helper="Google Ads의 광고 그룹 단위입니다. 그룹별 성과 연결에 필요합니다.">
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
              </FieldShell>
            )}
            <FieldShell helper="개별 광고 ID입니다. 광고 단위 전환 연결에 필요합니다.">
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
            </FieldShell>
            <FieldShell helper="소재 ID입니다. 같은 광고 안의 이미지/영상 성과를 구분할 때 사용합니다.">
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
            </FieldShell>
            <FieldShell helper="광고가 노출된 위치입니다. 예: Instagram Feed, Reels, YouTube, campus poster.">
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
            </FieldShell>
            <FieldShell helper="플랫폼 내부 유입면입니다. Meta의 ig/fb/an/msg 또는 Google/YouTube 구분에 사용합니다.">
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
            </FieldShell>
          </Box>
        </Collapse>
        </SectionCard>

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
          </Box>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            position: { xl: 'sticky' },
            top: { xl: 16 },
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={800}>
              실시간 URL 프리뷰
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              목적지별로 실제 생성될 URL 형태를 미리 확인합니다.
            </Typography>
            <Box
              sx={{
                mt: 1.5,
                p: 1.5,
                borderRadius: 2,
                bgcolor: '#101828',
                color: '#d1fadf',
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 12,
                lineHeight: 1.55,
                wordBreak: 'break-all',
              }}
            >
              {previewUrl}
            </Box>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight={800}>
              포함된 파라미터
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1.5 }}>
              {previewParams.map((param) => (
                <Box
                  key={param.key}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    px: 1.25,
                    py: 1,
                    bgcolor: param.value ? 'grey.50' : 'background.paper',
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="primary" fontWeight={800}>
                      {param.key}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {param.label}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={param.value ? '입력됨' : '미입력'}
                    color={param.value ? 'success' : 'default'}
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                </Box>
              ))}
            </Box>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight={800}>
              생성 전 검증
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1.5 }}>
              <Alert severity={source && medium && campaign ? 'success' : 'warning'} variant="outlined">
                필수값 {source && medium && campaign ? '완료' : '입력이 필요합니다'}: source, medium, campaign
              </Alert>
              <Alert severity={utmId ? 'success' : 'info'} variant="outlined">
                UTM ID {utmId ? '입력됨' : '미입력'}: 플랫폼을 넘는 캠페인 통합 키입니다.
              </Alert>
              <Alert severity={bindingCampaignId ? 'success' : 'info'} variant="outlined">
                광고 Campaign ID {bindingCampaignId ? '입력됨' : '미입력'}: 광고 관리자 drilldown에 사용됩니다.
              </Alert>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight={800}>
              이 값으로 볼 수 있는 것
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1,
                mt: 1.5,
              }}
            >
              {[
                ['채널별 유입', 'utm_source'],
                ['캠페인별 가입', 'utm_campaign'],
                ['소재별 전환', 'utm_content'],
                ['광고 ID 분석', 'binding'],
              ].map(([title, key]) => (
                <Box
                  key={key}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 1,
                    minHeight: 72,
                  }}
                >
                  <Typography variant="caption" fontWeight={800}>
                    {title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {key} 기준
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      </Box>

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
