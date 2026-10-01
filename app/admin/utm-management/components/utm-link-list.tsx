"use client";
import {
  Button,
  Chip,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  TextArea,
  TextField,
  Tooltip,
} from "@heroui/react";
import {
  Copy as ContentCopyIcon,
  Link as LinkIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
} from "lucide-react";

import { useState, useEffect, useCallback } from "react";

import AdminService from "@/app/services/admin";
import type { UtmLink } from "@/app/services/admin";
import type { UtmRegion } from "@/app/services/admin/utm";
import { useToast } from "@/shared/ui/admin/toast";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import {
  PLACEMENT_OPTIONS,
  PLATFORM_BINDING_OPTIONS,
  SITE_SOURCE_NAME_OPTIONS,
  UTM_CREATIVE_FORMAT_OPTIONS,
  UTM_MARKETING_TACTIC_OPTIONS,
  UTM_SOURCE_PLATFORM_OPTIONS,
} from "../utm-options";

interface UtmLinkListProps {
  refreshKey: number;
}
function inferIosRegion(link: UtmLink): UtmRegion {
  const destination = link.destinationUrl.toLowerCase();
  if (/apps\.apple\.com\/jp(?:\/|$)/.test(destination)) return "jp";
  if (/apps\.apple\.com\/kr(?:\/|$)/.test(destination)) return "kr";
  return destination.includes("apps.apple.com") &&
    /(?:^|[_-])jp(?:[_-]|$)/i.test(link.utmCampaign)
    ? "jp"
    : "kr";
}

export default function UtmLinkList({ refreshKey }: UtmLinkListProps) {
  const toast = useToast();
  const confirm = useConfirm();

  const [links, setLinks] = useState<UtmLink[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [contentFilter, setContentFilter] = useState("");
  const [termFilter, setTermFilter] = useState("");
  const [campaignIdFilter, setCampaignIdFilter] = useState("");
  const [adsetIdFilter, setAdsetIdFilter] = useState("");
  const [adGroupIdFilter, setAdGroupIdFilter] = useState("");
  const [adIdFilter, setAdIdFilter] = useState("");
  const [creativeIdFilter, setCreativeIdFilter] = useState("");
  const [page, setPage] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [editLink, setEditLink] = useState<UtmLink | null>(null);
  const [editName, setEditName] = useState("");
  const [editMemo, setEditMemo] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTerm, setEditTerm] = useState("");
  const [editUtmId, setEditUtmId] = useState("");
  const [editSourcePlatform, setEditSourcePlatform] = useState("");
  const [editCreativeFormat, setEditCreativeFormat] = useState("");
  const [editMarketingTactic, setEditMarketingTactic] = useState("");
  const [editBindingPlatform, setEditBindingPlatform] = useState<
    "meta" | "google_ads"
  >("meta");
  const [editCampaignId, setEditCampaignId] = useState("");
  const [editAdsetId, setEditAdsetId] = useState("");
  const [editAdGroupId, setEditAdGroupId] = useState("");
  const [editAdId, setEditAdId] = useState("");
  const [editCreativeId, setEditCreativeId] = useState("");
  const [editPlacement, setEditPlacement] = useState("");
  const [editSiteSourceName, setEditSiteSourceName] = useState("");
  const [editRegion, setEditRegion] = useState<UtmRegion>("kr");
  const [bindingsEdited, setBindingsEdited] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await AdminService.utm.getLinks({
        page: page + 1,
        search: search || undefined,
        utmCampaign: campaignFilter || undefined,
        utmContent: contentFilter || undefined,
        platform: platformFilter || undefined,
        utmTerm: termFilter || undefined,
        campaignId: campaignIdFilter || undefined,
        adsetId: adsetIdFilter || undefined,
        adGroupId: adGroupIdFilter || undefined,
        adId: adIdFilter || undefined,
        creativeId: creativeIdFilter || undefined,
      });
      setLinks(result.data);
      setTotal(result.meta.total);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "링크 목록을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    campaignFilter,
    contentFilter,
    platformFilter,
    termFilter,
    campaignIdFilter,
    adsetIdFilter,
    adGroupIdFilter,
    adIdFilter,
    creativeIdFilter,
  ]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks, refreshKey]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} 복사 완료`);
    } catch {
      toast.error("클립보드 복사에 실패했습니다.");
    }
  };

  const openEdit = (link: UtmLink) => {
    setEditLink(link);
    setEditName(link.name);
    setEditMemo(link.memo || "");
    setEditContent(link.utmContent || "");
    setEditTerm(link.utmTerm || "");
    setEditUtmId(link.utmId || "");
    setEditSourcePlatform(link.utmSourcePlatform || "");
    setEditCreativeFormat(link.utmCreativeFormat || "");
    setEditMarketingTactic(link.utmMarketingTactic || "");
    const binding = link.bindings?.[0];
    setEditBindingPlatform(
      binding?.platform === "google_ads" ? "google_ads" : "meta",
    );
    setEditCampaignId(binding?.campaignId || "");
    setEditAdsetId(binding?.adsetId || "");
    setEditAdGroupId(binding?.adGroupId || "");
    setEditAdId(binding?.adId || "");
    setEditCreativeId(binding?.creativeId || "");
    setEditPlacement(binding?.placement || "");
    setEditSiteSourceName(binding?.siteSourceName || "");
    setEditRegion(
      link.destinationType === "appstore_ios" ? inferIosRegion(link) : "kr",
    );
    setBindingsEdited(false);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editLink) return;
    setEditSaving(true);
    try {
      const data = {
        name: editName,
        memo: editMemo || undefined,
        utmContent: editContent || undefined,
        utmTerm: editTerm || undefined,
        utmId: editUtmId || undefined,
        utmSourcePlatform: editSourcePlatform || undefined,
        utmCreativeFormat: editCreativeFormat || undefined,
        utmMarketingTactic: editMarketingTactic || undefined,
        ...(editLink.destinationType === "appstore_ios"
          ? { region: editRegion }
          : {}),
        ...(bindingsEdited
          ? {
              platformBindings: [
                {
                  platform: editBindingPlatform,
                  campaignId: editCampaignId || undefined,
                  adsetId:
                    editBindingPlatform === "meta"
                      ? editAdsetId || undefined
                      : undefined,
                  adGroupId:
                    editBindingPlatform === "google_ads"
                      ? editAdGroupId || undefined
                      : undefined,
                  adId: editAdId || undefined,
                  creativeId: editCreativeId || undefined,
                  placement: editPlacement || undefined,
                  siteSourceName: editSiteSourceName || undefined,
                },
              ].filter(
                (binding) =>
                  binding.campaignId ||
                  binding.adsetId ||
                  binding.adGroupId ||
                  binding.adId ||
                  binding.creativeId ||
                  binding.placement ||
                  binding.siteSourceName,
              ),
            }
          : {}),
      };
      const updated = await AdminService.utm.updateLink(editLink.id, data);
      setLinks((prev) =>
        prev.map((l) => (l.id === editLink.id ? { ...l, ...updated } : l)),
      );
      setEditOpen(false);
      toast.success("수정되었습니다.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "수정에 실패했습니다.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (link: UtmLink) => {
    const confirmed = await confirm({
      title: "링크 삭제",
      message: `"${link.name}" 링크를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      confirmText: "삭제",
      severity: "error",
    });
    if (!confirmed) return;

    try {
      await AdminService.utm.deleteLink(link.id);
      toast.success("삭제되었습니다.");
      fetchLinks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "삭제에 실패했습니다.");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <>
      <div style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 className="text-lg font-semibold">UTM 링크 목록</h2>
          <TextField
            style={{ width: 280 }}
            aria-label={"검색 (이름, 캠페인...)"}
          >
            <Input
              placeholder="검색 (이름, 캠페인...)"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              aria-label={"검색 (이름, 캠페인...)"}
            />
          </TextField>
          <Select
            style={{ width: 140 }}
            selectedKey={platformFilter}
            onSelectionChange={(key) =>
              ((e) => {
                setPlatformFilter(e.target.value);
                setPage(0);
              })({
                target: { value: key },
              } as React.ChangeEvent<HTMLInputElement>)
            }
          >
            <Label>{"플랫폼"}</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id={""} textValue={"전체"}>
                  전체
                </ListBox.Item>
                <ListBox.Item id={"meta"} textValue={"Meta"}>
                  Meta
                </ListBox.Item>
                <ListBox.Item id={"google_ads"} textValue={"Google Ads"}>
                  Google Ads
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
          <TextField style={{ width: 180 }}>
            <Label>{"utm_campaign"}</Label>
            <Input
              value={campaignFilter}
              onChange={(e) => {
                setCampaignFilter(e.target.value);
                setPage(0);
              }}
            />
          </TextField>
          <TextField style={{ width: 180 }}>
            <Label>{"utm_content"}</Label>
            <Input
              value={contentFilter}
              onChange={(e) => {
                setContentFilter(e.target.value);
                setPage(0);
              }}
            />
          </TextField>
          <TextField style={{ width: 160 }}>
            <Label>{"utm_term"}</Label>
            <Input
              value={termFilter}
              onChange={(e) => {
                setTermFilter(e.target.value);
                setPage(0);
              }}
            />
          </TextField>
          <TextField style={{ width: 170 }}>
            <Label>{"campaign_id"}</Label>
            <Input
              value={campaignIdFilter}
              onChange={(e) => {
                setCampaignIdFilter(e.target.value);
                setPage(0);
              }}
            />
          </TextField>
          <TextField style={{ width: 150 }}>
            <Label>{"adset_id"}</Label>
            <Input
              value={adsetIdFilter}
              onChange={(e) => {
                setAdsetIdFilter(e.target.value);
                setPage(0);
              }}
            />
          </TextField>
          <TextField style={{ width: 160 }}>
            <Label>{"ad_group_id"}</Label>
            <Input
              value={adGroupIdFilter}
              onChange={(e) => {
                setAdGroupIdFilter(e.target.value);
                setPage(0);
              }}
            />
          </TextField>
          <TextField style={{ width: 140 }}>
            <Label>{"ad_id"}</Label>
            <Input
              value={adIdFilter}
              onChange={(e) => {
                setAdIdFilter(e.target.value);
                setPage(0);
              }}
            />
          </TextField>
          <TextField style={{ width: 160 }}>
            <Label>{"creative_id"}</Label>
            <Input
              value={creativeIdFilter}
              onChange={(e) => {
                setCreativeIdFilter(e.target.value);
                setPage(0);
              }}
            />
          </TextField>
        </div>
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-default p-3 text-sm"
            style={{ marginBottom: 16 }}
          >
            {error}
            <Button
              variant="secondary"
              aria-label="알림 닫기"
              onClick={() => setError(null)}
            >
              닫기
            </Button>
          </div>
        )}
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingBlock: 48,
            }}
          >
            <Spinner aria-label="로딩 중" />
          </div>
        ) : links.length === 0 ? (
          <div style={{ paddingBlock: 32, textAlign: "center" }}>
            <p>생성된 링크가 없습니다</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    <th
                      scope="col"
                      style={{ fontWeight: 600 }}
                      className="px-3 py-2 border-b border-default"
                    >
                      이름
                    </th>
                    <th
                      scope="col"
                      style={{ fontWeight: 600 }}
                      className="px-3 py-2 border-b border-default"
                    >
                      채널
                    </th>
                    <th
                      scope="col"
                      style={{ fontWeight: 600 }}
                      className="px-3 py-2 border-b border-default"
                    >
                      캠페인
                    </th>
                    <th
                      scope="col"
                      style={{ fontWeight: 600 }}
                      className="px-3 py-2 border-b border-default"
                    >
                      상세
                    </th>
                    <th
                      scope="col"
                      style={{ fontWeight: 600 }}
                      className="px-3 py-2 border-b border-default"
                    >
                      URL
                    </th>
                    <th
                      scope="col"
                      style={{ fontWeight: 600 }}
                      className="px-3 py-2 border-b border-default"
                    >
                      바인딩
                    </th>
                    <th
                      scope="col"
                      style={{ fontWeight: 600 }}
                      className="px-3 py-2 border-b border-default"
                    >
                      클릭 수
                    </th>
                    <th
                      scope="col"
                      style={{ fontWeight: 600 }}
                      className="px-3 py-2 border-b border-default"
                    >
                      가입 수
                    </th>
                    <th
                      scope="col"
                      style={{ fontWeight: 600 }}
                      className="px-3 py-2 border-b border-default"
                    >
                      생성일
                    </th>
                    <th
                      scope="col"
                      style={{ fontWeight: 600 }}
                      className="px-3 py-2 border-b border-default"
                    >
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => (
                    <tr key={link.id}>
                      <td className="px-3 py-2 border-b border-default">
                        <p>{link.name}</p>
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        <Chip size="sm">{link.utmSource}</Chip>
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        <p>{link.utmCampaign}</p>
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        <p>
                          {[
                            link.utmContent && `content=${link.utmContent}`,
                            link.utmTerm && `term=${link.utmTerm}`,
                            link.utmId && `id=${link.utmId}`,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "-"}
                        </p>
                        {link.destinationType === "appstore_ios" && (
                          <p style={{ display: "block", marginTop: 4 }}>
                            iOS 지역: {inferIosRegion(link).toUpperCase()}
                          </p>
                        )}
                      </td>
                      <td
                        style={{ minWidth: 260, maxWidth: 360 }}
                        className="px-3 py-2 border-b border-default"
                      >
                        {link.shortUrl ? (
                          <p style={{ wordBreak: "break-all" }}>
                            {link.shortUrl}
                          </p>
                        ) : (
                          <p>추적 URL 없음</p>
                        )}
                        <p
                          style={{
                            display: "block",
                            marginTop: 4,
                            wordBreak: "break-all",
                          }}
                        >
                          도착: {link.destinationUrl}
                        </p>
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        <p>
                          {(link.bindings ?? [])
                            .map(
                              (binding) =>
                                `${binding.platform}:${binding.campaignId ?? binding.adId ?? binding.creativeId ?? "-"}`,
                            )
                            .join(", ") || "-"}
                        </p>
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        <p>{link.clickCount ?? "-"}</p>
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        <p>{link.signupCount ?? "-"}</p>
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        <p>{formatDate(link.createdAt)}</p>
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 4,
                          }}
                        >
                          <Tooltip>
                            <Tooltip.Trigger>
                              <Button
                                onClick={() =>
                                  copyToClipboard(
                                    link.destinationUrl,
                                    "최종 도착 URL",
                                  )
                                }
                                variant={"secondary"}
                                isIconOnly
                                aria-label="추적 URL 복사"
                              >
                                <ContentCopyIcon size={16} />
                              </Button>
                            </Tooltip.Trigger>
                            <Tooltip.Content>
                              {"최종 도착 URL 복사 (클릭 추적 없음)"}
                            </Tooltip.Content>
                          </Tooltip>
                          {link.shortUrl && (
                            <Tooltip>
                              <Tooltip.Trigger>
                                <Button
                                  onClick={() =>
                                    copyToClipboard(link.shortUrl!, "추적 URL")
                                  }
                                  variant={"secondary"}
                                  isIconOnly
                                  aria-label="도착 URL 복사"
                                >
                                  <LinkIcon size={16} />
                                </Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content>
                                {"추적 URL 복사"}
                              </Tooltip.Content>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <Tooltip.Trigger>
                              <Button
                                onClick={() => openEdit(link)}
                                variant={"secondary"}
                                isIconOnly
                                aria-label="수정"
                              >
                                <EditIcon size={16} />
                              </Button>
                            </Tooltip.Trigger>
                            <Tooltip.Content>{"수정"}</Tooltip.Content>
                          </Tooltip>
                          <Tooltip>
                            <Tooltip.Trigger>
                              <Button
                                onClick={() => handleDelete(link)}
                                variant={"secondary"}
                                isIconOnly
                                aria-label="삭제"
                              >
                                <DeleteIcon size={16} />
                              </Button>
                            </Tooltip.Trigger>
                            <Tooltip.Content>{"삭제"}</Tooltip.Content>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 p-3">
              <span>페이지당 20개</span>
              <Button
                variant="secondary"
                isDisabled={page <= 0}
                onPress={() =>
                  ((_, newPage) => setPage(newPage))(null, page - 1)
                }
              >
                이전
              </Button>
              <span>
                {page + 1} / {Math.max(1, Math.ceil(total / 20))}
              </span>
              <Button
                variant="secondary"
                isDisabled={(page + 1) * 20 >= total}
                onPress={() =>
                  ((_, newPage) => setPage(newPage))(null, page + 1)
                }
              >
                다음
              </Button>
            </div>
          </>
        )}
      </div>

      <Modal.Backdrop
        isOpen={editOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) (() => setEditOpen(false))();
        }}
      >
        <Modal.Container>
          <Modal.Dialog className="max-w-3xl">
            <Modal.Heading style={{ fontWeight: 700 }}>링크 수정</Modal.Heading>
            <Modal.Body>
              <TextField style={{ marginBottom: 16, marginTop: 8 }}>
                <Label>{"이름"}</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </TextField>
              <TextField style={{ marginBottom: 16 }}>
                <Label>{"메모"}</Label>
                <TextArea
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                />
              </TextField>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField>
                  <Label>{"utm_content"}</Label>
                  <Input
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                </TextField>
                <TextField>
                  <Label>{"utm_term"}</Label>
                  <Input
                    value={editTerm}
                    onChange={(e) => setEditTerm(e.target.value)}
                  />
                </TextField>
                <TextField>
                  <Label>{"utm_id"}</Label>
                  <Input
                    value={editUtmId}
                    onChange={(e) => setEditUtmId(e.target.value)}
                  />
                </TextField>
                <Select
                  selectedKey={editSourcePlatform}
                  onSelectionChange={(key) =>
                    ((e) => setEditSourcePlatform(e.target.value))({
                      target: { value: key },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                >
                  <Label>{"utm_source_platform"}</Label>
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
                <Select
                  selectedKey={editCreativeFormat}
                  onSelectionChange={(key) =>
                    ((e) => setEditCreativeFormat(e.target.value))({
                      target: { value: key },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                >
                  <Label>{"utm_creative_format"}</Label>
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
                <Select
                  selectedKey={editMarketingTactic}
                  onSelectionChange={(key) =>
                    ((e) => setEditMarketingTactic(e.target.value))({
                      target: { value: key },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                >
                  <Label>{"utm_marketing_tactic"}</Label>
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
              </div>
              {editLink?.destinationType === "appstore_ios" && (
                <Select
                  style={{ marginTop: 16 }}
                  selectedKey={editRegion}
                  onSelectionChange={(key) =>
                    ((e) => setEditRegion(e.target.value as UtmRegion))({
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
              )}
              <p style={{ marginTop: 24, marginBottom: 8 }}>플랫폼 바인딩</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  selectedKey={editBindingPlatform}
                  onSelectionChange={(key) =>
                    ((e) => {
                      setEditBindingPlatform(
                        e.target.value as "meta" | "google_ads",
                      );
                      setBindingsEdited(true);
                    })({
                      target: { value: key },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                >
                  <Label>{"플랫폼"}</Label>
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
                <TextField>
                  <Label>{"campaign_id"}</Label>
                  <Input
                    value={editCampaignId}
                    onChange={(e) => {
                      setEditCampaignId(e.target.value);
                      setBindingsEdited(true);
                    }}
                  />
                </TextField>
                {editBindingPlatform === "meta" ? (
                  <TextField>
                    <Label>{"adset_id"}</Label>
                    <Input
                      value={editAdsetId}
                      onChange={(e) => {
                        setEditAdsetId(e.target.value);
                        setBindingsEdited(true);
                      }}
                    />
                  </TextField>
                ) : (
                  <TextField>
                    <Label>{"ad_group_id"}</Label>
                    <Input
                      value={editAdGroupId}
                      onChange={(e) => {
                        setEditAdGroupId(e.target.value);
                        setBindingsEdited(true);
                      }}
                    />
                  </TextField>
                )}
                <TextField>
                  <Label>{"ad_id"}</Label>
                  <Input
                    value={editAdId}
                    onChange={(e) => {
                      setEditAdId(e.target.value);
                      setBindingsEdited(true);
                    }}
                  />
                </TextField>
                <TextField>
                  <Label>{"creative_id"}</Label>
                  <Input
                    value={editCreativeId}
                    onChange={(e) => {
                      setEditCreativeId(e.target.value);
                      setBindingsEdited(true);
                    }}
                  />
                </TextField>
                <Select
                  selectedKey={editPlacement}
                  onSelectionChange={(key) =>
                    ((e) => {
                      setEditPlacement(e.target.value);
                      setBindingsEdited(true);
                    })({
                      target: { value: key },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                >
                  <Label>{"placement"}</Label>
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
                <Select
                  selectedKey={editSiteSourceName}
                  onSelectionChange={(key) =>
                    ((e) => {
                      setEditSiteSourceName(e.target.value);
                      setBindingsEdited(true);
                    })({
                      target: { value: key },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                >
                  <Label>{"site_source_name"}</Label>
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
              </div>
            </Modal.Body>
            <Modal.Footer style={{ paddingInline: 24, paddingBlock: 16 }}>
              <Button
                onClick={() => setEditOpen(false)}
                variant={"secondary"}
                isDisabled={editSaving}
              >
                취소
              </Button>
              <Button
                onClick={handleEditSave}
                variant={"primary"}
                isDisabled={editSaving}
              >
                {editSaving ? <Spinner aria-label="로딩 중" /> : "저장"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
