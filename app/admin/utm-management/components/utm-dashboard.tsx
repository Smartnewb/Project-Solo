"use client";
import {
  Button,
  Chip,
  Label,
  ListBox,
  Select,
  Spinner,
  Switch,
} from "@heroui/react";

import { useCallback, useEffect, useMemo, useState } from "react";

import AdminService from "@/app/services/admin";
import type {
  UtmDashboardSurfaces,
  UtmReconciliationResponse,
  UtmReconciliationRow,
} from "@/app/services/admin";

type DatePreset = "오늘" | "7일" | "30일" | "이번달";

const DATE_PRESETS: DatePreset[] = ["오늘", "7일", "30일", "이번달"];

function getDateRange(preset: DatePreset): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const endDate = now.toISOString().split("T")[0];

  if (preset === "오늘") return { startDate: endDate, endDate };
  if (preset === "7일") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { startDate: start.toISOString().split("T")[0], endDate };
  }
  if (preset === "30일") {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { startDate: start.toISOString().split("T")[0], endDate };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startDate: start.toISOString().split("T")[0], endDate };
}

function formatNumber(value: number | null | undefined): string {
  if (value == null) return "-";
  return value.toLocaleString();
}

function formatCurrency(value: number): string {
  return `₩${value.toLocaleString()}`;
}

function coveragePercent(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function formatDashboardError(error: any): string {
  const message =
    error.response?.data?.message ||
    error.message ||
    "데이터를 불러오지 못했습니다.";
  if (
    typeof message === "string" &&
    message.includes("Cannot GET /api/admin/v2/utm/dashboard")
  ) {
    return "백엔드 배포가 아직 새 UTM 성과 API를 로드하지 않았습니다. 잠시 후 다시 시도하세요.";
  }
  return message;
}

export default function UtmDashboard() {
  const [datePreset, setDatePreset] = useState<DatePreset>("7일");
  const [includeExtraMonitored, setIncludeExtraMonitored] = useState(false);
  const [surfaces, setSurfaces] = useState<UtmDashboardSurfaces | null>(null);
  const [reconciliation, setReconciliation] =
    useState<UtmReconciliationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { startDate, endDate } = useMemo(
    () => getDateRange(datePreset),
    [datePreset],
  );
  const rangeLabel = `${startDate} ~ ${endDate}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [surfaceData, reconciliationData] = await Promise.all([
        AdminService.utm.getSurfaces({
          startDate,
          endDate,
          includeExtraMonitored,
        }),
        AdminService.utm.getReconciliation(startDate, endDate),
      ]);
      setSurfaces(surfaceData);
      setReconciliation(reconciliationData);
    } catch (err: any) {
      setError(formatDashboardError(err));
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, includeExtraMonitored]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !surfaces) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", paddingBlock: 80 }}
      >
        <Spinner aria-label="로딩 중" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
        >
          {error}
          {
            <Button onClick={fetchData} variant={"secondary"}>
              다시 불러오기
            </Button>
          }
          <Button
            variant="secondary"
            aria-label="알림 닫기"
            onClick={() => setError(null)}
          >
            닫기
          </Button>
        </div>
      )}
      <div style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h2 className="text-lg font-semibold">
              Meta 오프라인 리드 성과 대시보드
            </h2>
            <p style={{ marginTop: 6 }}>
              {rangeLabel}기준으로 Meta 집행 지표, 웹 UTM 트래픽, 앱 가입
              cohort를 따로 봅니다.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Chip size="sm">{"core monitored 기본"}</Chip>
            <Chip size="sm">{"festival-region 별도"}</Chip>
            <Chip size="sm">{"signup row reconciliation"}</Chip>
          </div>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Select
            style={{ minWidth: 120 }}
            selectedKey={datePreset}
            onSelectionChange={(key) =>
              ((e) => setDatePreset(e.target.value as DatePreset))({
                target: { value: key },
              } as React.ChangeEvent<HTMLInputElement>)
            }
          >
            <Label>{"기간"}</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {DATE_PRESETS.map((preset) => (
                  <ListBox.Item
                    key={preset}
                    id={preset}
                    textValue={String(preset)}
                  >
                    {preset}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          <Switch
            isSelected={includeExtraMonitored}
            onChange={setIncludeExtraMonitored}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Label>festival-region extra monitored 포함</Label>
            </Switch.Content>
          </Switch>
          <p>기본 CAC/signup은 core monitored UTM만 사용합니다.</p>
          {loading && <Spinner aria-label="로딩 중" />}
        </div>
      </div>
      {surfaces && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <HeadlineStat
              label="Core signups"
              value={formatNumber(surfaces.appSignupCohort.coreSignups)}
              helper="headline CAC/signup 기본 분모"
            />
            <HeadlineStat
              label="DB signups"
              value={formatNumber(surfaces.appSignupCohort.dbSignups)}
              helper={includeExtraMonitored ? "extra 포함" : "extra 제외"}
            />
            <HeadlineStat
              label="Revenue"
              value={formatCurrency(surfaces.appSignupCohort.revenue)}
              helper={`${formatNumber(surfaces.appSignupCohort.payments)} payments`}
            />
            <HeadlineStat
              label="Payment event coverage"
              value={`${surfaces.appSignupCohort.coverage.paymentEventId}%`}
              helper="신규 결제 event_id 수집률"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SurfacePanel
              title="Meta delivery/actions"
              subtitle="Meta 지표는 DB cohort와 다른 출처입니다."
              rows={[
                ["Spend", formatNumber(surfaces.metaDeliveryActions.spend)],
                [
                  "Impressions",
                  formatNumber(surfaces.metaDeliveryActions.impressions),
                ],
                [
                  "Link clicks",
                  formatNumber(surfaces.metaDeliveryActions.linkClicks),
                ],
                [
                  "Meta registrations",
                  formatNumber(surfaces.metaDeliveryActions.metaRegistrations),
                ],
                [
                  "Meta purchases",
                  formatNumber(surfaces.metaDeliveryActions.metaPurchases),
                ],
              ]}
              footer={`${surfaces.metaDeliveryActions.source} · ${surfaces.metaDeliveryActions.status}`}
            />
            <SurfacePanel
              title="Web UTM traffic"
              subtitle="방문/리다이렉트와 내부/봇/반복 트래픽을 분리합니다."
              rows={[
                ["Total", formatNumber(surfaces.webUtmTraffic.total)],
                [
                  "Redirect / page visit",
                  `${formatNumber(surfaces.webUtmTraffic.redirect)} / ${formatNumber(surfaces.webUtmTraffic.pageVisit)}`,
                ],
                [
                  "Setup / internal / bot / external",
                  `${formatNumber(surfaces.webUtmTraffic.setup)} / ${formatNumber(surfaces.webUtmTraffic.internal)} / ${formatNumber(surfaces.webUtmTraffic.bot)} / ${formatNumber(surfaces.webUtmTraffic.external)}`,
                ],
                [
                  "Repeat / unique touch",
                  `${formatNumber(surfaces.webUtmTraffic.repeat)} / ${formatNumber(surfaces.webUtmTraffic.uniqueTouch)}`,
                ],
                [
                  "Core / extra monitored",
                  `${formatNumber(surfaces.webUtmTraffic.monitoredCore)} / ${formatNumber(surfaces.webUtmTraffic.extraMonitored)}`,
                ],
              ]}
            />
            <SurfacePanel
              title="App-attributed signup cohort"
              subtitle="DB signup/payment/revenue 기준 cohort입니다."
              rows={[
                [
                  "DB signups",
                  formatNumber(surfaces.appSignupCohort.dbSignups),
                ],
                ["Approved", formatNumber(surfaces.appSignupCohort.approved)],
                [
                  "Purchasers / payments",
                  `${formatNumber(surfaces.appSignupCohort.purchasers)} / ${formatNumber(surfaces.appSignupCohort.payments)}`,
                ],
                ["Revenue", formatCurrency(surfaces.appSignupCohort.revenue)],
                [
                  "Coverage",
                  `attribution ${surfaces.appSignupCohort.coverage.attributionId}% · payment event ${surfaces.appSignupCohort.coverage.paymentEventId}%`,
                ],
              ]}
              footer={`core ${surfaces.appSignupCohort.coreSignups.toLocaleString()} · extra ${surfaces.appSignupCohort.extraSignups.toLocaleString()}`}
            />
          </div>

          <div style={{ padding: 24 }}>
            <h2 className="text-lg font-semibold mb-2">Extra monitored</h2>
            <p style={{ marginBottom: 16 }}>
              festival-region UTM은 기본 headline CAC/signup에서 제외하고,
              토글을 켰을 때만 App cohort 합산에 포함합니다.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Chip size="sm">{`core signups ${surfaces.appSignupCohort.coreSignups.toLocaleString()}`}</Chip>
              <Chip size="sm">{`extra signups ${surfaces.appSignupCohort.extraSignups.toLocaleString()}`}</Chip>
              <Chip size="sm">
                {includeExtraMonitored ? "extra included" : "extra excluded"}
              </Chip>
            </div>
          </div>
        </>
      )}
      {reconciliation && <ReconciliationSection data={reconciliation} />}
    </div>
  );
}

function HeadlineStat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div style={{ padding: 16 }}>
      <p>{label}</p>
      <h5 style={{ marginTop: 4 }}>{value}</h5>
      <p>{helper}</p>
    </div>
  );
}

function SurfacePanel({
  title,
  subtitle,
  rows,
  footer,
}: {
  title: string;
  subtitle: string;
  rows: Array<[string, string]>;
  footer?: string;
}) {
  return (
    <div style={{ padding: 20 }}>
      <p>{title}</p>
      <p>{subtitle}</p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginTop: 16,
        }}
      >
        {rows.map(([label, value]) => (
          <div
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <p>{label}</p>
            <p>{value}</p>
          </div>
        ))}
      </div>
      {footer && <p style={{ display: "block", marginTop: 16 }}>{footer}</p>}
    </div>
  );
}

function ReconciliationSection({ data }: { data: UtmReconciliationResponse }) {
  const coverage = data.coverage;
  return (
    <div style={{ padding: 24 }}>
      <h2 className="text-lg font-semibold mb-2">Reconciliation</h2>
      <p style={{ marginBottom: 16 }}>
        signup row 기준으로 attribution/payment/CAPI coverage를 확인합니다.
        iOS는 Android와 같은 post-install referrer가 없어 payment_event_id와
        CAPI event 수신으로 gap을 별도 확인합니다.
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <CoverageStat label="Total" value={coverage.total.toLocaleString()} />
        <CoverageStat
          label="Attribution"
          value={coveragePercent(coverage.withAttributionId, coverage.total)}
        />
        <CoverageStat
          label="Signup event"
          value={coveragePercent(coverage.withSignupEventId, coverage.total)}
        />
        <CoverageStat
          label="Payment"
          value={coverage.withPayment.toLocaleString()}
        />
        <CoverageStat
          label="Payment event"
          value={coveragePercent(coverage.withPaymentEventId, coverage.total)}
        />
        <CoverageStat
          label="Meta CAPI"
          value={coveragePercent(coverage.withMetaCapiEvent, coverage.total)}
        />
      </div>
      <BreakdownChips title="Platform" rows={data.breakdown.platform} />
      <BreakdownChips title="App version" rows={data.breakdown.appVersion} />
      <BreakdownChips
        title="Pre/Post fix"
        rows={data.breakdown.preFixPostFix}
      />
      <ReconciliationTable rows={data.rows} />
    </div>
  );
}

function CoverageStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p>{label}</p>
      <h2 className="text-lg font-semibold">{value}</h2>
    </div>
  );
}

function BreakdownChips({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ key: string; count: number }>;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <p style={{ minWidth: 80 }}>{title}</p>
      {rows.slice(0, 8).map((row) => (
        <Chip
          key={`${title}-${row.key}`}
          size="sm"
        >{`${row.key}: ${row.count}`}</Chip>
      ))}
    </div>
  );
}

function ReconciliationTable({ rows }: { rows: UtmReconciliationRow[] }) {
  return (
    <div className="overflow-auto" style={{ marginTop: 16, maxHeight: 520 }}>
      <table className="w-full text-sm text-left">
        <thead className="sticky top-0 bg-white">
          <tr>
            <th scope="col" className="px-3 py-2 border-b border-default">
              User
            </th>
            <th scope="col" className="px-3 py-2 border-b border-default">
              Platform
            </th>
            <th scope="col" className="px-3 py-2 border-b border-default">
              App version
            </th>
            <th scope="col" className="px-3 py-2 border-b border-default">
              Pre/Post
            </th>
            <th scope="col" className="px-3 py-2 border-b border-default">
              UTM
            </th>
            <th scope="col" className="px-3 py-2 border-b border-default">
              Signup event
            </th>
            <th scope="col" className="px-3 py-2 border-b border-default">
              Payment event
            </th>
            <th scope="col" className="px-3 py-2 border-b border-default">
              Meta CAPI
            </th>
            <th scope="col" className="px-3 py-2 border-b border-default">
              fbclid/fbc/fbp
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 100).map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-2 border-b border-default">
                {row.userId}
              </td>
              <td className="px-3 py-2 border-b border-default">
                {row.platform}
              </td>
              <td className="px-3 py-2 border-b border-default">
                {row.appVersion}
              </td>
              <td className="px-3 py-2 border-b border-default">
                {row.preFixPostFix}
              </td>
              <td className="px-3 py-2 border-b border-default">
                <p>
                  {row.utmSource ?? "-"}/ {row.utmCampaign ?? "-"}
                </p>
              </td>
              <td className="px-3 py-2 border-b border-default">
                {row.signupEventId ?? "-"}
              </td>
              <td className="px-3 py-2 border-b border-default">
                {row.paymentEventId ?? "-"}
              </td>
              <td className="px-3 py-2 border-b border-default">
                <Chip size="sm">{row.metaCapi.status}</Chip>
                {row.metaCapi.error && (
                  <p style={{ display: "block" }}>{row.metaCapi.error}</p>
                )}
              </td>
              <td className="px-3 py-2 border-b border-default">
                <p>{[row.fbclid, row.fbc, row.fbp].filter(Boolean).length}/3</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
