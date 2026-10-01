"use client";
import {
  Button,
  Chip,
  Description,
  Input,
  Label,
  ListBox,
  Modal,
  Radio,
  RadioGroup,
  Select,
  Spinner,
  TextArea,
  TextField,
  Tooltip,
} from "@heroui/react";
import {
  CircleHelp as HelpOutlineIcon,
  ChevronDown as ExpandMoreIcon,
  ChevronUp as ExpandLessIcon,
  Copy as ContentCopyIcon,
  Download as DownloadIcon,
  QrCode as QrCode2Icon,
} from "lucide-react";

import { useState, useCallback, useMemo, type ReactNode } from "react";

import AdminService from "@/app/services/admin";
import type { UtmLink } from "@/app/services/admin";
import type { UtmDestinationType, UtmRegion } from "@/app/services/admin/utm";
import { useToast } from "@/shared/ui/admin/toast";
import QRCode from "qrcode";
import {
  PLACEMENT_OPTIONS,
  PLATFORM_BINDING_OPTIONS,
  SITE_SOURCE_NAME_OPTIONS,
  UTM_CREATIVE_FORMAT_OPTIONS,
  UTM_MARKETING_TACTIC_OPTIONS,
  UTM_SOURCE_PLATFORM_OPTIONS,
} from "../utm-options";

type DestinationType = Exclude<UtmDestinationType, "deeplink">;
type SectionTone = "required" | "recommended" | "advanced";

const CHANNEL_PRESETS = [
  { label: "에브리타임", source: "everytime", medium: "community" },
  { label: "오프라인 포스터", source: "poster", medium: "offline" },
  { label: "인스타그램", source: "instagram", medium: "social" },
  { label: "틱톡 오가닉", source: "tiktok", medium: "social" },
  { label: "Meta 광고", source: "meta", medium: "cpc" },
  { label: "Google 광고", source: "google", medium: "cpc" },
  { label: "친구 추천", source: "friend", medium: "referral" },
  { label: "앱스토어 검색", source: "appstore", medium: "organic" },
  { label: "기타 (직접입력)", source: "", medium: "" },
];

/* ── Tooltip 문구 (기획서 3.2절) ── */
const UTM_FIELD_TOOLTIPS: Record<string, string> = {
  channel:
    "유입이 시작된 장소입니다. 예: google, meta, instagram, everytime. 프리셋을 쓰면 source/medium이 같이 채워집니다.",
  campaign:
    "예산과 성과를 묶어 볼 캠페인 단위입니다. 기간/목적/타겟이 드러나게 작성하세요. 예: 2026_spring_signup_kr20f.",
  source:
    "URL의 utm_source입니다. 유입 출처입니다. 대시보드 채널 성과의 1차 그룹 기준입니다.",
  medium:
    "URL의 utm_medium입니다. paid/social/cpc/referral/offline처럼 트래픽 유형을 나타냅니다.",
  content:
    "URL의 utm_content입니다. 같은 캠페인 안에서 소재, 문구, 배너 위치, QR 포스터 버전을 구분합니다.",
  term: "URL의 utm_term입니다. 검색 키워드 또는 타겟 세그먼트를 넣습니다. 검색 광고가 아니면 선택입니다.",
  utmId:
    "플랫폼이 달라도 같은 캠페인을 묶는 안정적인 ID입니다. 자동 생성값 사용을 권장합니다.",
  sourcePlatform:
    "실제 광고/유입 플랫폼입니다. Meta Ads와 Instagram Organic처럼 source만으로 구분이 어려운 경우 필요합니다.",
  creativeFormat:
    "이미지, 영상, 릴스, QR 등 소재 형식입니다. 형식별 전환율 비교에 사용합니다.",
  marketingTactic:
    "신규획득, 리타게팅, 이벤트, 추천 등 마케팅 전술입니다. 운영 관점의 성과 비교에 사용합니다.",
  bindingCampaignId:
    "광고 플랫폼의 캠페인 ID입니다. Meta/Google 관리자 화면에서 복사합니다.",
  bindingAdsetId:
    "Meta는 Adset, Google은 Ad group 단위입니다. 타겟/그룹별 성과 연결에 필요합니다.",
  bindingAdGroupId:
    "Meta는 Adset, Google은 Ad group 단위입니다. 타겟/그룹별 성과 연결에 필요합니다.",
  bindingAdId: "개별 광고 ID입니다. 광고 단위 전환 연결에 필요합니다.",
  bindingCreativeId:
    "소재 ID입니다. 같은 광고 안의 이미지/영상 성과를 구분할 때 사용합니다.",
  bindingPlacement:
    "광고가 노출된 위치입니다. 예: Instagram Feed, Reels, YouTube, campus poster.",
  bindingSiteSourceName:
    "플랫폼 내부 유입면입니다. Meta의 ig/fb/an/msg 또는 Google/YouTube 구분에 사용합니다.",
  destination:
    "사용자가 클릭 후 이동할 위치입니다. 웹은 전체 UTM query가 붙고, Android는 referrer에 UTM이 들어갑니다. iOS는 App Store 캠페인 토큰 중심입니다.",
  memo: "URL에는 노출되지 않는 내부 메모입니다. 예산, 요청자, 실험 가설, 소재 링크를 남기세요.",
  name: "관리자 목록에서 보는 내부 이름입니다. 자동 생성되며 필요하면 소재/목적을 추가하세요.",
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
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {label}
      <Tooltip>
        <Tooltip.Trigger aria-label={`${label} 도움말`}>
          <HelpOutlineIcon size={16} aria-hidden="true" />
        </Tooltip.Trigger>
        <Tooltip.Content>{tooltip}</Tooltip.Content>
      </Tooltip>
    </span>
  );
}

/* ── utmId 자동 생성 ── */
const generateUtmId = (src: string, camp: string) => {
  if (!src || !camp) return "";
  return `${src}_${camp}`;
};

const DESTINATION_COPY: Record<
  DestinationType,
  { label: string; description: string }
> = {
  web: {
    label: "웹",
    description: "전체 UTM query가 URL에 붙습니다.",
  },
  appstore_ios: {
    label: "iOS",
    description: "App Store ct 캠페인 토큰 중심으로 이동합니다.",
  },
  appstore_android: {
    label: "Android",
    description: "Play Store referrer에 전체 UTM이 인코딩됩니다.",
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
  badgeColor: "error" | "warning" | "default";
  description: string;
  tone: SectionTone;
  open: boolean;
  onToggle?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        paddingInline: 16,
        paddingBlock: 12,
        borderBottom: "1px solid",
        borderColor: "#e4e4e7",
        backgroundColor:
          tone === "required"
            ? "#fff5f5"
            : tone === "recommended"
              ? "#fffbeb"
              : "#f9fafb",
        cursor: onToggle ? "pointer" : "default",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p className="font-semibold">{title}</p>
          <Chip size="sm">{badgeLabel}</Chip>
        </div>
        <p style={{ marginTop: 4, display: "block" }}>{description}</p>
      </div>
      {onToggle && (
        <Button
          style={{ padding: 4 }}
          variant={"secondary"}
          isIconOnly
          aria-label={title}
          aria-expanded={open}
          onPress={onToggle}
        >
          {open ? <ExpandLessIcon size={16} /> : <ExpandMoreIcon size={16} />}
        </Button>
      )}
    </div>
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
    <div
      style={{
        border: "1px solid",
        borderColor: "#e4e4e7",
        borderLeft: "5px solid",
        borderLeftColor:
          tone === "required"
            ? "#dc2626"
            : tone === "recommended"
              ? "#d97706"
              : "#7a4ae2",
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#ffffff",
      }}
    >
      {children}
    </div>
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
    <div
      style={{
        border: "1px solid",
        borderColor: "#e4e4e7",
        borderRadius: 12,
        padding: 10,
        backgroundColor: "#ffffff",
        minWidth: 0,
      }}
    >
      {children}
      <p style={{ display: "block", marginTop: 8, lineHeight: 1.45 }}>
        {helper}
      </p>
    </div>
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
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [term, setTerm] = useState("");
  const [utmId, setUtmId] = useState("");
  const [utmIdDirty, setUtmIdDirty] = useState(false);
  const [prevAutoUtmId, setPrevAutoUtmId] = useState("");
  const [sourcePlatform, setSourcePlatform] = useState("");
  const [creativeFormat, setCreativeFormat] = useState("");
  const [marketingTactic, setMarketingTactic] = useState("");
  const [bindingPlatform, setBindingPlatform] = useState<"meta" | "google_ads">(
    "meta",
  );
  const [bindingCampaignId, setBindingCampaignId] = useState("");
  const [bindingAdsetId, setBindingAdsetId] = useState("");
  const [bindingAdGroupId, setBindingAdGroupId] = useState("");
  const [bindingAdId, setBindingAdId] = useState("");
  const [bindingCreativeId, setBindingCreativeId] = useState("");
  const [bindingPlacement, setBindingPlacement] = useState("");
  const [bindingSiteSourceName, setBindingSiteSourceName] = useState("");
  const [destinationType, setDestinationType] =
    useState<DestinationType>("web");
  const [region, setRegion] = useState<UtmRegion>("kr");
  const [memo, setMemo] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ── collapse state ── */
  const [recommendedOpen, setRecommendedOpen] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(true);

  /* ── result dialog ── */
  const [resultOpen, setResultOpen] = useState(false);
  const [createdLink, setCreatedLink] = useState<UtmLink | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const isCustomChannel = channelIndex === CHANNEL_PRESETS.length - 1;

  /* ── name 자동 생성 ── */
  const updateName = useCallback((src: string, camp: string) => {
    if (src && camp) {
      setName(`${src}_${camp}`);
    } else if (src) {
      setName(src);
    } else {
      setName("");
    }
  }, []);

  /* ── utmId 자동 생성 (dirty 플래그 관리) ── */
  const autoGenerateUtmId = useCallback(
    (src: string, camp: string) => {
      if (utmIdDirty) return;
      const next = generateUtmId(src, camp);
      if (next && (utmId === "" || utmId === prevAutoUtmId)) {
        setUtmId(next);
        setPrevAutoUtmId(next);
      }
    },
    [utmId, utmIdDirty, prevAutoUtmId],
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
    const genericCampaigns = ["spring", "test", "google", "ad", "campaign"];
    if (
      campaign &&
      genericCampaigns.some((g) => campaign.toLowerCase().includes(g))
    ) {
      warnings.push(
        "캠페인명이 너무 일반적입니다. 기간/목적/타겟이 드러나도록 구체적으로 작성하세요.",
      );
    }

    // source / sourcePlatform 충돌
    if (
      source &&
      sourcePlatform &&
      ((source === "google" && sourcePlatform !== "google_ads") ||
        (source === "meta" && sourcePlatform !== "meta_ads") ||
        (source === "instagram" && !sourcePlatform.includes("meta")))
    ) {
      warnings.push(
        `source="${source}"와 sourcePlatform="${sourcePlatform}" 조합이 일관되지 않을 수 있습니다.`,
      );
    }

    // medium / tactic 충돌
    if (medium === "organic" && marketingTactic === "retargeting") {
      warnings.push(
        'medium="organic"과 tactic="retargeting"은 일반적으로 함께 쓰이지 않습니다.',
      );
    }

    return warnings;
  }, [campaign, source, sourcePlatform, medium, marketingTactic]);

  const previewUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (source) params.set("utm_source", source);
    if (medium) params.set("utm_medium", medium);
    if (campaign) params.set("utm_campaign", campaign);
    if (content) params.set("utm_content", content);
    if (term) params.set("utm_term", term);
    if (utmId) params.set("utm_id", utmId);

    const query = params.toString();
    if (destinationType === "appstore_ios") {
      return `https://apps.apple.com/${region}/app/id6746120889${campaign ? `?ct=${encodeURIComponent(campaign)}&pt=126413580&mt=8` : ""}`;
    }
    if (destinationType === "appstore_android") {
      return `https://play.google.com/store/apps/details?id=com.smartnewb.sometimes${query ? `&referrer=${encodeURIComponent(query)}` : ""}`;
    }
    return `https://some-in-univ.com${query ? `?${query}` : ""}`;
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
    if (
      bindingAdsetId ||
      bindingAdGroupId ||
      bindingAdId ||
      bindingCreativeId
    ) {
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
    trackingScore >= 80
      ? "#16a34a"
      : trackingScore >= 55
        ? "#d97706"
        : "#dc2626";
  const scoreLabel =
    trackingScore >= 80
      ? "분석 가능성 높음"
      : trackingScore >= 55
        ? "분석 가능성 보통"
        : "필수값 위주";

  const previewParams = [
    { key: "utm_source", value: source, label: "채널별 성과" },
    { key: "utm_medium", value: medium, label: "트래픽 유형" },
    { key: "utm_campaign", value: campaign, label: "캠페인별 성과" },
    { key: "utm_content", value: content, label: "소재 A/B" },
    { key: "utm_term", value: term, label: "타겟/키워드" },
    { key: "utm_id", value: utmId, label: "플랫폼 통합 키" },
  ];

  const handleSubmit = async () => {
    if (!source || !medium || !campaign) {
      toast.warning("소스, 매체, 캠페인은 필수입니다.");
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
        region: destinationType === "appstore_ios" ? region : undefined,
        memo: memo || undefined,
        platformBindings: [
          {
            platform: bindingPlatform,
            campaignId: bindingCampaignId || undefined,
            adsetId:
              bindingPlatform === "meta"
                ? bindingAdsetId || undefined
                : undefined,
            adGroupId:
              bindingPlatform === "google_ads"
                ? bindingAdGroupId || undefined
                : undefined,
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
            binding.creativeId,
        ),
      });

      setCreatedLink(result);

      const url = result.shortUrl || result.destinationUrl;
      const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
      setQrDataUrl(dataUrl);

      setResultOpen(true);
      toast.success("UTM 링크가 생성되었습니다.");
      onCreated();

      // Reset form
      setCampaign("");
      setContent("");
      setTerm("");
      setUtmId("");
      setUtmIdDirty(false);
      setPrevAutoUtmId("");
      setSourcePlatform("");
      setCreativeFormat("");
      setMarketingTactic("");
      setBindingCampaignId("");
      setBindingAdsetId("");
      setBindingAdGroupId("");
      setBindingAdId("");
      setBindingCreativeId("");
      setBindingPlacement("");
      setBindingSiteSourceName("");
      setRegion("kr");
      setMemo("");
      setName("");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "링크 생성에 실패했습니다.",
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
      toast.error("클립보드 복사에 실패했습니다.");
    }
  };

  const downloadQr = () => {
    if (!qrDataUrl || !createdLink) return;
    const link = document.createElement("a");
    link.download = `qr_${createdLink.name}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
        <div style={{ overflow: "hidden" }}>
          <div
            className="flex-col md:flex-row"
            style={{
              padding: 24,
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              borderBottom: "1px solid",
              borderColor: "#e4e4e7",
            }}
          >
            <div>
              <h2 className="text-lg font-semibold">새 UTM 링크 생성</h2>
              <p style={{ marginTop: 4 }}>
                필수값은 빠르게 채우고, 권장값은 어떤 성과 분석에 쓰이는지
                확인하면서 입력합니다.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  color: "#ffffff",
                  backgroundColor: scoreColor,
                  fontWeight: 800,
                }}
              >
                {trackingScore}
              </div>
              <div style={{ maxWidth: 260 }}>
                <p>{scoreLabel}</p>
                <p style={{ lineHeight: 1.45 }}>
                  광고 ID까지 연결하면 플랫폼 drilldown과 전환 export 품질이 더
                  좋아집니다.
                </p>
              </div>
            </div>
          </div>
          <div
            className="flex-col md:flex-row"
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                <FieldShell helper="유입이 시작된 장소입니다. 프리셋을 쓰면 source와 medium이 함께 채워집니다.">
                  <Select
                    selectedKey={channelIndex}
                    onSelectionChange={(key) =>
                      ((e) => handleChannelChange(Number(e.target.value)))({
                        target: { value: key },
                      } as React.ChangeEvent<HTMLInputElement>)
                    }
                    isRequired
                  >
                    <Label>
                      {
                        <FieldWithTooltip
                          label="채널"
                          tooltip={UTM_FIELD_TOOLTIPS.channel}
                        />
                      }
                    </Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {CHANNEL_PRESETS.map((preset, i) => (
                          <ListBox.Item
                            key={i}
                            id={i}
                            textValue={String(preset.label)}
                          >
                            {preset.label}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </FieldShell>
                <FieldShell helper="예산과 성과를 묶어 볼 캠페인 단위입니다. 기간, 목적, 타겟이 드러나게 작성하세요.">
                  <TextField>
                    <Label>
                      {
                        <FieldWithTooltip
                          label="캠페인"
                          tooltip={UTM_FIELD_TOOLTIPS.campaign}
                        />
                      }
                    </Label>
                    <Input
                      placeholder="예: 2026_spring_event"
                      value={campaign}
                      onChange={(e) => handleCampaignChange(e.target.value)}
                      required
                    />
                  </TextField>
                </FieldShell>
                <FieldShell helper="채널 성과의 1차 그룹 기준입니다. 직접입력 채널에서만 수정합니다.">
                  <TextField>
                    <Label>
                      {
                        <FieldWithTooltip
                          label="소스 (utm_source)"
                          tooltip={UTM_FIELD_TOOLTIPS.source}
                        />
                      }
                    </Label>
                    <Input
                      value={source}
                      onChange={(e) => handleSourceChange(e.target.value)}
                      required
                      disabled={!isCustomChannel}
                    />
                  </TextField>
                </FieldShell>
                <FieldShell helper="paid, social, cpc, referral, offline처럼 트래픽 유형을 구분합니다.">
                  <TextField>
                    <Label>
                      {
                        <FieldWithTooltip
                          label="매체 (utm_medium)"
                          tooltip={UTM_FIELD_TOOLTIPS.medium}
                        />
                      }
                    </Label>
                    <Input
                      value={medium}
                      onChange={(e) => setMedium(e.target.value)}
                      required
                      disabled={!isCustomChannel}
                    />
                  </TextField>
                </FieldShell>
                <FieldShell helper="관리자 목록에서 보는 내부 이름입니다. 기본값은 source_campaign 조합입니다.">
                  <TextField>
                    <Label>
                      {
                        <FieldWithTooltip
                          label="링크 이름"
                          tooltip={UTM_FIELD_TOOLTIPS.name}
                        />
                      }
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <Description>{"자동 생성되며 직접 수정 가능"}</Description>
                  </TextField>
                </FieldShell>
                <FieldShell
                  helper={DESTINATION_COPY[destinationType].description}
                >
                  <RadioGroup
                    value={destinationType}
                    onChange={(value) =>
                      setDestinationType(value as DestinationType)
                    }
                  >
                    <Label>목적지</Label>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(DESTINATION_COPY).map(([value, copy]) => (
                        <Radio key={value} value={value}>
                          <Radio.Content>
                            <Radio.Control>
                              <Radio.Indicator />
                            </Radio.Control>
                            <Label>{copy.label}</Label>
                          </Radio.Content>
                        </Radio>
                      ))}
                    </div>
                  </RadioGroup>
                  {destinationType === "appstore_ios" && (
                    <>
                      <Select
                        style={{ marginTop: 8, minWidth: 180 }}
                        selectedKey={region}
                        onSelectionChange={(key) =>
                          ((e) => setRegion(e.target.value as UtmRegion))({
                            target: { value: key },
                          } as React.ChangeEvent<HTMLInputElement>)
                        }
                      >
                        <Label>{"App Store 지역"}</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            <ListBox.Item id={"kr"} textValue={"대한민국 (KR)"}>
                              대한민국 (KR)
                            </ListBox.Item>
                            <ListBox.Item id={"jp"} textValue={"일본 (JP)"}>
                              일본 (JP)
                            </ListBox.Item>
                          </ListBox>
                        </Select.Popover>
                      </Select>
                      <div
                        role="alert"
                        className="rounded-lg border border-default p-3 text-sm"
                        style={{ marginTop: 8 }}
                      >
                        지역을 지정하지 않는 기존 요청은 대한민국(KR)으로
                        유지됩니다. iOS App Store URL에는 utm_campaign만 ct
                        파라미터로 반영되며, content/term 등은 short URL
                        리다이렉트 이벤트로 추적됩니다.
                      </div>
                    </>
                  )}
                  {destinationType === "appstore_android" && (
                    <div
                      role="alert"
                      className="rounded-lg border border-default p-3 text-sm"
                      style={{ marginTop: 8 }}
                    >
                      Android Play Store는 referrer에 전체 UTM 파라미터가
                      인코딩되어 전달됩니다.
                    </div>
                  )}
                </FieldShell>
              </div>
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
              <div hidden={!recommendedOpen}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  <FieldShell helper="같은 캠페인 안에서 소재, 문구, 배너 위치, QR 버전을 구분합니다.">
                    <TextField>
                      <Label>
                        {
                          <FieldWithTooltip
                            label="콘텐츠 (utm_content) (권장)"
                            tooltip={UTM_FIELD_TOOLTIPS.content}
                          />
                        }
                      </Label>
                      <Input
                        placeholder="예: video_a, poster_qr_01"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                      />
                    </TextField>
                  </FieldShell>
                  <FieldShell helper="검색 키워드나 타겟 세그먼트를 넣습니다. 검색 광고가 아니어도 타겟 분리에 유용합니다.">
                    <TextField>
                      <Label>
                        {
                          <FieldWithTooltip
                            label="Term (utm_term) (권장)"
                            tooltip={UTM_FIELD_TOOLTIPS.term}
                          />
                        }
                      </Label>
                      <Input
                        placeholder="예: female_univ_20s"
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                      />
                    </TextField>
                  </FieldShell>
                  <FieldShell helper="플랫폼이 달라도 같은 캠페인을 묶는 안정적인 ID입니다. 자동 생성값 사용을 권장합니다.">
                    <TextField>
                      <Label>
                        {
                          <FieldWithTooltip
                            label="UTM ID (utm_id) (권장)"
                            tooltip={UTM_FIELD_TOOLTIPS.utmId}
                          />
                        }
                      </Label>
                      <Input
                        placeholder="자동 생성됨"
                        value={utmId}
                        onChange={(e) => {
                          setUtmId(e.target.value);
                          setUtmIdDirty(true);
                        }}
                      />
                      <Description>
                        {utmIdDirty
                          ? "수동 수정됨 — 자동 생성 중단"
                          : "source + campaign 조합으로 자동 생성"}
                      </Description>
                    </TextField>
                  </FieldShell>
                  <FieldShell helper="source만으로 구분이 어려운 실제 광고/유입 플랫폼입니다.">
                    <Select
                      selectedKey={sourcePlatform}
                      onSelectionChange={(key) =>
                        ((e) => setSourcePlatform(e.target.value))({
                          target: { value: key },
                        } as React.ChangeEvent<HTMLInputElement>)
                      }
                    >
                      <Label>
                        {
                          <FieldWithTooltip
                            label="Source platform (권장)"
                            tooltip={UTM_FIELD_TOOLTIPS.sourcePlatform}
                          />
                        }
                      </Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {UTM_SOURCE_PLATFORM_OPTIONS.map((option) => (
                            <ListBox.Item
                              key={option.value || "empty-source-platform"}
                              id={option.value}
                              textValue={String(option.label)}
                            >
                              {option.label}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </FieldShell>
                  <FieldShell helper="이미지, 영상, 릴스, QR 등 소재 형식별 전환율 비교에 사용합니다.">
                    <Select
                      selectedKey={creativeFormat}
                      onSelectionChange={(key) =>
                        ((e) => setCreativeFormat(e.target.value))({
                          target: { value: key },
                        } as React.ChangeEvent<HTMLInputElement>)
                      }
                    >
                      <Label>
                        {
                          <FieldWithTooltip
                            label="Creative format (권장)"
                            tooltip={UTM_FIELD_TOOLTIPS.creativeFormat}
                          />
                        }
                      </Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {UTM_CREATIVE_FORMAT_OPTIONS.map((option) => (
                            <ListBox.Item
                              key={option.value || "empty-creative-format"}
                              id={option.value}
                              textValue={String(option.label)}
                            >
                              {option.label}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </FieldShell>
                  <FieldShell helper="신규획득, 리타게팅, 이벤트, 추천 등 운영 관점의 전술 비교에 사용합니다.">
                    <Select
                      selectedKey={marketingTactic}
                      onSelectionChange={(key) =>
                        ((e) => setMarketingTactic(e.target.value))({
                          target: { value: key },
                        } as React.ChangeEvent<HTMLInputElement>)
                      }
                    >
                      <Label>
                        {
                          <FieldWithTooltip
                            label="Marketing tactic (권장)"
                            tooltip={UTM_FIELD_TOOLTIPS.marketingTactic}
                          />
                        }
                      </Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {UTM_MARKETING_TACTIC_OPTIONS.map((option) => (
                            <ListBox.Item
                              key={option.value || "empty-marketing-tactic"}
                              id={option.value}
                              textValue={String(option.label)}
                            >
                              {option.label}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </FieldShell>
                </div>
              </div>
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
              <div hidden={!advancedOpen}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  <FieldShell helper="플랫폼에 따라 Meta Adset 또는 Google Ad group 필드를 보여줍니다.">
                    <Select
                      selectedKey={bindingPlatform}
                      onSelectionChange={(key) =>
                        ((e) =>
                          setBindingPlatform(
                            e.target.value as "meta" | "google_ads",
                          ))({
                          target: { value: key },
                        } as React.ChangeEvent<HTMLInputElement>)
                      }
                    >
                      <Label>{"Platform"}</Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {PLATFORM_BINDING_OPTIONS.map((option) => (
                            <ListBox.Item
                              key={option.value}
                              id={option.value}
                              textValue={String(option.label)}
                            >
                              {option.label}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </FieldShell>
                  <FieldShell helper="광고 플랫폼의 캠페인 ID입니다. 관리자 화면에서 복사한 값을 넣습니다.">
                    <TextField>
                      <Label>
                        {
                          <FieldWithTooltip
                            label="Campaign ID"
                            tooltip={UTM_FIELD_TOOLTIPS.bindingCampaignId}
                          />
                        }
                      </Label>
                      <Input
                        value={bindingCampaignId}
                        onChange={(e) => setBindingCampaignId(e.target.value)}
                      />
                    </TextField>
                  </FieldShell>
                  {bindingPlatform === "meta" ? (
                    <FieldShell helper="Meta의 타겟/그룹 단위입니다. 그룹별 성과 연결에 필요합니다.">
                      <TextField>
                        <Label>
                          {
                            <FieldWithTooltip
                              label="Adset ID"
                              tooltip={UTM_FIELD_TOOLTIPS.bindingAdsetId}
                            />
                          }
                        </Label>
                        <Input
                          value={bindingAdsetId}
                          onChange={(e) => setBindingAdsetId(e.target.value)}
                        />
                      </TextField>
                    </FieldShell>
                  ) : (
                    <FieldShell helper="Google Ads의 광고 그룹 단위입니다. 그룹별 성과 연결에 필요합니다.">
                      <TextField>
                        <Label>
                          {
                            <FieldWithTooltip
                              label="Ad group ID"
                              tooltip={UTM_FIELD_TOOLTIPS.bindingAdGroupId}
                            />
                          }
                        </Label>
                        <Input
                          value={bindingAdGroupId}
                          onChange={(e) => setBindingAdGroupId(e.target.value)}
                        />
                      </TextField>
                    </FieldShell>
                  )}
                  <FieldShell helper="개별 광고 ID입니다. 광고 단위 전환 연결에 필요합니다.">
                    <TextField>
                      <Label>
                        {
                          <FieldWithTooltip
                            label="Ad ID"
                            tooltip={UTM_FIELD_TOOLTIPS.bindingAdId}
                          />
                        }
                      </Label>
                      <Input
                        value={bindingAdId}
                        onChange={(e) => setBindingAdId(e.target.value)}
                      />
                    </TextField>
                  </FieldShell>
                  <FieldShell helper="소재 ID입니다. 같은 광고 안의 이미지/영상 성과를 구분할 때 사용합니다.">
                    <TextField>
                      <Label>
                        {
                          <FieldWithTooltip
                            label="Creative ID"
                            tooltip={UTM_FIELD_TOOLTIPS.bindingCreativeId}
                          />
                        }
                      </Label>
                      <Input
                        value={bindingCreativeId}
                        onChange={(e) => setBindingCreativeId(e.target.value)}
                      />
                    </TextField>
                  </FieldShell>
                  <FieldShell helper="광고가 노출된 위치입니다. 예: Instagram Feed, Reels, YouTube, campus poster.">
                    <Select
                      selectedKey={bindingPlacement}
                      onSelectionChange={(key) =>
                        ((e) => setBindingPlacement(e.target.value))({
                          target: { value: key },
                        } as React.ChangeEvent<HTMLInputElement>)
                      }
                    >
                      <Label>
                        {
                          <FieldWithTooltip
                            label="Placement"
                            tooltip={UTM_FIELD_TOOLTIPS.bindingPlacement}
                          />
                        }
                      </Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {PLACEMENT_OPTIONS.map((option) => (
                            <ListBox.Item
                              key={option.value || "empty-placement"}
                              id={option.value}
                              textValue={String(option.label)}
                            >
                              {option.label}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </FieldShell>
                  <FieldShell helper="플랫폼 내부 유입면입니다. Meta의 ig/fb/an/msg 또는 Google/YouTube 구분에 사용합니다.">
                    <Select
                      selectedKey={bindingSiteSourceName}
                      onSelectionChange={(key) =>
                        ((e) => setBindingSiteSourceName(e.target.value))({
                          target: { value: key },
                        } as React.ChangeEvent<HTMLInputElement>)
                      }
                    >
                      <Label>
                        {
                          <FieldWithTooltip
                            label="Site source name"
                            tooltip={UTM_FIELD_TOOLTIPS.bindingSiteSourceName}
                          />
                        }
                      </Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {SITE_SOURCE_NAME_OPTIONS.map((option) => (
                            <ListBox.Item
                              key={option.value || "empty-site-source-name"}
                              id={option.value}
                              textValue={String(option.label)}
                            >
                              {option.label}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </FieldShell>
                </div>
              </div>
            </SectionCard>
            {/* ── 메모 ── */}
            <div style={{ marginTop: 16 }}>
              <TextField>
                <Label>
                  {
                    <FieldWithTooltip
                      label="메모"
                      tooltip={UTM_FIELD_TOOLTIPS.memo}
                    />
                  }
                </Label>
                <TextArea
                  placeholder="이 링크의 용도나 메모"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </TextField>
            </div>
            {/* ── Validation warnings ── */}
            {validationWarnings.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {validationWarnings.map((w, i) => (
                  <div
                    key={i}
                    role="alert"
                    className="rounded-lg border border-default p-3 text-sm"
                  >
                    {w}
                  </div>
                ))}
              </div>
            )}
            {/* ── 생성 버튼 ── */}
            <div
              style={{
                marginTop: 16,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                onClick={handleSubmit}
                variant={"primary"}
                isDisabled={submitting || !source || !medium || !campaign}
              >
                {submitting ? <Spinner aria-label="로딩 중" /> : "링크 생성"}
              </Button>
            </div>
          </div>
        </div>
        <div style={{ overflow: "hidden" }}>
          <div style={{ padding: 16 }}>
            <p>실시간 URL 프리뷰</p>
            <p style={{ display: "block", marginTop: 4 }}>
              목적지별로 실제 생성될 URL 형태를 미리 확인합니다.
            </p>
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                backgroundColor: "#101828",
                color: "#d1fadf",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 12,
                lineHeight: 1.55,
                wordBreak: "break-all",
              }}
            >
              {previewUrl}
            </div>
          </div>
          <hr />
          <div style={{ padding: 16 }}>
            <p>포함된 파라미터</p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: 12,
              }}
            >
              {previewParams.map((param) => (
                <div
                  key={param.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    border: "1px solid",
                    borderColor: "#e4e4e7",
                    borderRadius: 12,
                    paddingInline: 10,
                    paddingBlock: 8,
                    backgroundColor: "#f4f4f5",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p>{param.key}</p>
                    <p style={{ display: "block" }}>{param.label}</p>
                  </div>
                  <Chip size="sm">{param.value ? "입력됨" : "미입력"}</Chip>
                </div>
              ))}
            </div>
          </div>
          <hr />
          <div style={{ padding: 16 }}>
            <p>생성 전 검증</p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: 12,
              }}
            >
              <div
                role="alert"
                className="rounded-lg border border-default p-3 text-sm"
              >
                필수값{" "}
                {source && medium && campaign ? "완료" : "입력이 필요합니다"}:
                source, medium, campaign
              </div>
              <div
                role="alert"
                className="rounded-lg border border-default p-3 text-sm"
              >
                UTM ID {utmId ? "입력됨" : "미입력"}: 플랫폼을 넘는 캠페인 통합
                키입니다.
              </div>
              <div
                role="alert"
                className="rounded-lg border border-default p-3 text-sm"
              >
                광고 Campaign ID {bindingCampaignId ? "입력됨" : "미입력"}: 광고
                관리자 drilldown에 사용됩니다.
              </div>
            </div>
          </div>
          <hr />
          <div style={{ padding: 16 }}>
            <p>이 값으로 볼 수 있는 것</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginTop: 12,
              }}
            >
              {[
                ["채널별 유입", "utm_source"],
                ["캠페인별 가입", "utm_campaign"],
                ["소재별 전환", "utm_content"],
                ["광고 ID 분석", "binding"],
              ].map(([title, key]) => (
                <div
                  key={key}
                  style={{
                    border: "1px solid",
                    borderColor: "#e4e4e7",
                    borderRadius: 12,
                    padding: 8,
                    minHeight: 72,
                  }}
                >
                  <p className="font-semibold">{title}</p>
                  <p style={{ display: "block", marginTop: 4 }}>{key}기준</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 결과 Dialog ── */}
      <Modal.Backdrop
        isOpen={resultOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) (() => setResultOpen(false))();
        }}
      >
        <Modal.Container>
          <Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }} className="max-w-3xl">
            <Modal.Heading style={{ fontWeight: 700 }}>
              링크 생성 완료
            </Modal.Heading>
            <Modal.Body>
              {createdLink && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <div>
                    <p>최종 도착 URL (클릭 추적 없음)</p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 4,
                      }}
                    >
                      <TextField aria-label={"입력"}>
                        <Input
                          value={createdLink.destinationUrl}
                          readOnly
                          aria-label={"입력"}
                        />
                      </TextField>
                      <Button
                        onClick={() =>
                          copyToClipboard(
                            createdLink.destinationUrl,
                            "최종 도착 URL",
                          )
                        }
                        variant={"secondary"}
                        isIconOnly
                        aria-label="최종 도착 URL 복사"
                      >
                        <ContentCopyIcon size={16} />
                      </Button>
                    </div>
                  </div>
                  {createdLink.shortUrl && (
                    <div>
                      <p>추적 URL</p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginTop: 4,
                        }}
                      >
                        <TextField aria-label={"입력"}>
                          <Input
                            value={createdLink.shortUrl}
                            readOnly
                            aria-label={"입력"}
                          />
                        </TextField>
                        <Button
                          onClick={() =>
                            copyToClipboard(createdLink.shortUrl!, "추적 URL")
                          }
                          variant={"secondary"}
                          isIconOnly
                          aria-label="추적 URL 복사"
                        >
                          <ContentCopyIcon size={16} />
                        </Button>
                      </div>
                    </div>
                  )}
                  {qrDataUrl && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 8,
                      }}
                    >
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        style={{ width: 200, height: 200 }}
                      />
                      <Button onClick={downloadQr} variant={"secondary"}>
                        {<DownloadIcon size={16} />}QR 다운로드
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer style={{ paddingInline: 24, paddingBlock: 16 }}>
              <Button
                onClick={() => setResultOpen(false)}
                variant={"secondary"}
              >
                닫기
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
