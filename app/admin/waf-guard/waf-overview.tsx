"use client";
import { Alert } from "@heroui/react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { WafOverview } from "@/app/services/admin/waf-guard";

// 두 계열 팔레트는 dataviz validate_palette.js 로 확인했다(색각 이상 구분 ΔE 30 이상)
const COUNTED = "#3b82f6";
const BLOCKED = "#d97706";

const RULE_LABEL: Record<string, string> = {
	"scanner-paths": "스캐너 경로",
	"auto-block": "승인 차단 IP",
	"ip-reputation": "AWS 평판 나쁜 IP",
	"known-bad": "알려진 공격 입력",
	common: "일반 공격 패턴",
	sqli: "SQL 주입",
	"body-attacks": "본문 공격",
	"geo-cn": "중국 IP",
	"rate-per-ip": "IP 요청 한도",
	"auth-rate": "로그인 요청 한도",
	"sms-rate": "문자 발송 한도",
};

const hourLabel = (ms: number) =>
	new Intl.DateTimeFormat("ko-KR", {
		timeZone: "Asia/Seoul",
		hour: "2-digit",
		hour12: false,
	}).format(new Date(ms));

function Stat({ label, value }: { label: string; value: number }) {
	return (
		<div
			style={{
				flex: 1,
				minWidth: 160,
				padding: 16,
				border: "1px solid #e5e7eb",
				borderRadius: 6,
			}}
		>
			<div className={"text-xs text-neutral-600"}>{label}</div>
			<div style={{ fontSize: 24, fontWeight: 700 }}>
				{Math.round(value).toLocaleString()}
			</div>
		</div>
	);
}

export function WafOverviewPanel({ data }: { data: WafOverview }) {
	const sum = (k: "allowed" | "counted" | "blocked") =>
		data.hourly.reduce((a, h) => a + h[k], 0);
	const hourly = data.hourly.map((h) => ({
		hour: hourLabel(h.at),
		기록: h.counted,
		차단: h.blocked,
	}));

	return (
		<section style={{ marginBottom: 32 }}>
			{!data.autoBlockEnforced && (
				<Alert style={{ marginBottom: 16 }} status={"warning"}>
					<Alert.Content>
						승인 차단 규칙(auto-block)이 지금 기록 모드입니다. 즉시차단을 눌러도
						목록에만 오르고 실제 요청은 막히지 않습니다.
					</Alert.Content>
				</Alert>
			)}
			<div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
				<Stat label={"24시간 전체 요청"} value={sum("allowed") + sum("blocked")} />
				<Stat label={"WAF 가 막은 요청"} value={sum("blocked")} />
				<Stat label={"규칙에 걸렸지만 기록만 한 요청"} value={sum("counted")} />
				<Stat label={"차단 중인 IP"} value={data.blockedIps} />
			</div>

			<h3 className={"text-sm font-semibold text-neutral-900"}>
				시간별 WAF 규칙에 걸린 요청 (최근 24시간)
			</h3>
			<div style={{ width: "100%", height: 220, marginBottom: 24 }}>
				<ResponsiveContainer>
					<BarChart data={hourly} barCategoryGap={2}>
						<CartesianGrid vertical={false} stroke="#f3f4f6" />
						<XAxis dataKey="hour" tickLine={false} fontSize={11} />
						<YAxis tickLine={false} axisLine={false} fontSize={11} width={48} />
						<Tooltip cursor={{ fill: "#f9fafb" }} />
						<Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
						<Bar dataKey="기록" stackId="w" fill={COUNTED} />
						<Bar dataKey="차단" stackId="w" fill={BLOCKED} radius={[4, 4, 0, 0]} />
					</BarChart>
				</ResponsiveContainer>
			</div>

			<h3 className={"text-sm font-semibold text-neutral-900"}>
				규칙별 (최근 24시간)
			</h3>
			<table
				className={"w-full text-sm text-left [&_td]:p-2 [&_th]:p-2 [&_tr]:border-b"}
				style={{ maxWidth: 640 }}
			>
				<thead>
					<tr style={{ backgroundColor: "#f9fafb" }}>
						{["규칙", "기록", "차단"].map((h) => (
							<th key={h} scope="col" style={{ fontWeight: 600 }}>
								{h}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{data.rules.map((r) => (
						<tr key={r.rule}>
							<td>
								{RULE_LABEL[r.rule] ?? r.rule}{" "}
								<span className={"text-xs text-neutral-500"}>{r.rule}</span>
							</td>
							<td>{Math.round(r.counted).toLocaleString()}</td>
							<td>{Math.round(r.blocked).toLocaleString()}</td>
						</tr>
					))}
				</tbody>
			</table>
		</section>
	);
}
