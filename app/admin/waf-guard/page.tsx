"use client";
import { Alert, Button, Spinner } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import {
	type SuspiciousIp,
	type SuspiciousIpDashboard,
	wafGuard,
} from "@/app/services/admin/waf-guard";

// 한국·일본 통신사 IP 는 여러 유저가 함께 쓴다(CGNAT). ALB 로그만 본 IP 는 국가를 모른다.
const SHARED_IP_COUNTRIES = new Set(["KR", "JP"]);

function formatKst(ms: number): string {
	return new Intl.DateTimeFormat("sv-SE", {
		timeZone: "Asia/Seoul",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(new Date(ms));
}

function breakdown(row: SuspiciousIp): string {
	return [
		row.wafBlocked && `WAF 차단 ${row.wafBlocked}`,
		row.authFail && `인증 실패 ${row.authFail}`,
		row.notFound && `없는 경로 ${row.notFound}곳`,
		row.sms && `문자 요청 ${row.sms}`,
		row.wafCounted && `WAF 기록 ${row.wafCounted}`,
	]
		.filter(Boolean)
		.join(" · ");
}

const STATUS_LABEL: Record<NonNullable<SuspiciousIp["status"]>, string> = {
	blocked: "차단 중",
	released: "해제됨",
	reported: "Slack 보고됨",
};

export default function WafGuardPage() {
	const [data, setData] = useState<SuspiciousIpDashboard | null>(null);
	const [loading, setLoading] = useState(true);
	const [busyIp, setBusyIp] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			setData(await wafGuard.getIps());
		} catch (e) {
			setError(getAdminErrorMessage(e, "의심 IP 목록을 불러오지 못했습니다."));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const act = async (row: SuspiciousIp, action: "block" | "unblock") => {
		if (action === "block") {
			const shared = !row.country || SHARED_IP_COUNTRIES.has(row.country);
			const warning = shared
				? "\n\n한국·일본 통신사 IP 는 여러 유저가 함께 쓸 수 있습니다. 막으면 정상 유저도 막힙니다."
				: "";
			if (!window.confirm(`${row.ip} 의 모든 요청을 해제할 때까지 막습니다.${warning}`))
				return;
		}
		setBusyIp(row.ip);
		setError(null);
		try {
			if (action === "block") await wafGuard.block(row.ip);
			else await wafGuard.unblock(row.ip);
			await load();
		} catch (e) {
			setError(getAdminErrorMessage(e, "처리하지 못했습니다."));
		} finally {
			setBusyIp(null);
		}
	};

	const rows = data?.rows ?? [];
	const max = Math.max(1, ...rows.map((r) => r.failures));

	return (
		<div style={{ padding: 24 }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
				}}
			>
				<div>
					<h2 className={"text-lg font-semibold text-neutral-900"}>
						의심 IP 차단
					</h2>
					<p
						style={{ marginTop: 4, marginBottom: 24 }}
						className={"text-sm text-neutral-700"}
					>
						WAF 는 최근 24시간, 인증 실패·없는 경로는 최근 1시간 기준입니다.
						차단하면 Slack #sometime-incidents 에도 남고, 해제할 때까지
						유지됩니다.
						{data && ` · ${formatKst(data.generatedAt)} 기준`}
					</p>
				</div>
				<Button
					onClick={load}
					variant={"secondary"}
					isDisabled={loading}
					size={"md"}
				>
					새로고침
				</Button>
			</div>
			{error && (
				<Alert style={{ marginBottom: 16 }} status={"danger"}>
					<Alert.Content>{error}</Alert.Content>
				</Alert>
			)}
			<div className={"overflow-x-auto"}>
				<table
					className={
						"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_tr]:border-b"
					}
				>
					<thead>
						<tr style={{ backgroundColor: "#f9fafb" }}>
							{["공격 의심 IP", "실패 횟수 & 비중", "근거", "즉시 대응"].map(
								(heading) => (
									<th key={heading} style={{ fontWeight: 600 }} scope="col">
										{heading}
									</th>
								),
							)}
						</tr>
					</thead>
					<tbody>
						{loading && !data ? (
							<tr>
								<td colSpan={4} style={{ paddingTop: 40, paddingBottom: 40 }}>
									<Spinner aria-label="불러오는 중" size="sm" />
								</td>
							</tr>
						) : rows.length === 0 ? (
							<tr>
								<td
									colSpan={4}
									style={{ paddingTop: 40, paddingBottom: 40, color: "#525252" }}
								>
									의심 IP 가 없습니다.
								</td>
							</tr>
						) : (
							rows.map((row) => (
								<tr key={row.ip}>
									<td style={{ whiteSpace: "nowrap" }}>
										<div
											style={{ fontFamily: "monospace", fontWeight: 600 }}
										>
											{row.ip}
										</div>
										<div className={"text-xs text-neutral-600"}>
											{row.country ?? "국가 미상"}
											{row.status && ` · ${STATUS_LABEL[row.status]}`}
											{row.status === "blocked" &&
												row.blockedAt &&
												` (${formatKst(row.blockedAt)}${row.decidedBy ? `, ${row.decidedBy}` : ""})`}
										</div>
									</td>
									<td style={{ minWidth: 280 }}>
										<div
											style={{ display: "flex", alignItems: "center", gap: 12 }}
										>
											<span style={{ fontWeight: 700, minWidth: 48 }}>
												{row.failures.toLocaleString()}회
											</span>
											<div
												style={{
													flex: 1,
													height: 8,
													borderRadius: 4,
													backgroundColor: "#f3f4f6",
												}}
											>
												<div
													style={{
														width: `${(row.failures / max) * 100}%`,
														height: "100%",
														borderRadius: 4,
														backgroundColor: "#f59e0b",
													}}
												/>
											</div>
										</div>
										<div className={"text-xs text-neutral-600"}>
											{breakdown(row)}
										</div>
									</td>
									<td className={"text-xs text-neutral-700"}>
										{[row.rules.join(", "), row.detail]
											.filter(Boolean)
											.join(" · ") || "-"}
									</td>
									<td style={{ whiteSpace: "nowrap" }}>
										{row.status === "blocked" ? (
											<Button
												onClick={() => act(row, "unblock")}
												variant={"secondary"}
												isDisabled={busyIp !== null}
												size={"sm"}
											>
												해제
											</Button>
										) : row.refusal ? (
											<span className={"text-xs text-neutral-600"}>
												{row.refusal}라 막을 수 없음
											</span>
										) : (
											<Button
												onClick={() => act(row, "block")}
												variant={"danger"}
												isDisabled={busyIp !== null}
												size={"sm"}
											>
												즉시차단
											</Button>
										)}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
