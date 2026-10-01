"use client";
import { Alert, Chip, Input, Label, TextField } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { formatDateTimeKR } from "@/app/utils/formatters";
import { AdminLoading } from "@/shared/ui/admin/loading";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import AdminService from "@/app/services/admin";
import type { GemPriceChangeRow } from "@/app/services/admin";
import { FeatureName, ScopeChip } from "./shared";
/** 감사 로그의 before/after 는 임의 JSON 이라 관심 필드만 뽑아 한 줄로 보여준다. */
function summarize(value: unknown): string {
	if (value === null || value === undefined) return "(신규)";
	if (typeof value !== "object") return String(value);
	const v = value as Record<string, unknown>;
	const parts: string[] = [];
	if (v.price !== undefined) parts.push(`정가 ${v.price}`);
	if (v.discountAmount !== undefined) parts.push(`할인 -${v.discountAmount}`);
	if (v.value !== undefined) parts.push(`값 ${v.value}`);
	if (v.isActive !== undefined) parts.push(v.isActive ? "활성" : "비활성");
	if (v.canceledAt) parts.push("취소됨");
	return parts.length > 0 ? parts.join(" · ") : JSON.stringify(v);
}
interface Props {
	/** 다른 탭에서 변경이 일어나면 값이 바뀌어 재조회를 유발한다. */
	refreshKey: number;
}
export default function ChangesTab({ refreshKey }: Props) {
	const [changes, setChanges] = useState<GemPriceChangeRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [featureFilter, setFeatureFilter] = useState("");
	// 입력 중에는 조회하지 않는다 — 타이핑 한 글자마다 API 를 때리지 않기 위해.
	const [debouncedFilter, setDebouncedFilter] = useState("");
	useEffect(() => {
		const timer = setTimeout(
			() => setDebouncedFilter(featureFilter.trim()),
			300,
		);
		return () => clearTimeout(timer);
	}, [featureFilter]);
	const load = useCallback(async () => {
		setLoading(true);
		try {
			setChanges(
				await AdminService.gemPricing.listChanges(debouncedFilter || undefined),
			);
			setError(null);
		} catch (e) {
			setError(getAdminErrorMessage(e, "변경 이력을 불러오지 못했습니다"));
		} finally {
			setLoading(false);
		}
	}, [debouncedFilter]);
	useEffect(() => {
		void load();
	}, [load, refreshKey]);
	return (
		<div>
			{error && (
				<Alert style={{ marginBottom: 16 }} status={"danger"}>
					<Alert.Content>{error}</Alert.Content>
				</Alert>
			)}
			<Alert style={{ marginBottom: 16 }} status={"default"}>
				<Alert.Content>
					오설정을 되돌리는 정상 경로는 배포 롤백이 아니라 여기 남은{" "}
					<b>이전 값</b>으로 다시 저장하는 것입니다.
				</Alert.Content>
			</Alert>
			<section style={{ padding: 16, marginBottom: 16 }}>
				<TextField className="w-full">
					<Label>{"액션으로 필터"}</Label>
					<Input
						placeholder="예: CHAT_START"
						value={featureFilter}
						onChange={(e) => setFeatureFilter(e.target.value.toUpperCase())}
						style={{ minWidth: 280 }}
					/>
				</TextField>
			</section>
			{loading ? (
				<AdminLoading />
			) : (
				<div className={"overflow-x-auto"}>
					<table
						className={
							"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
						}
					>
						<thead>
							<tr style={{ backgroundColor: "#f5f5f5" }}>
								<th style={{ fontWeight: 700, width: 150 }} scope="col">
									시각
								</th>
								<th style={{ fontWeight: 700, width: 90 }} scope="col">
									대상
								</th>
								<th style={{ fontWeight: 700 }} scope="col">
									액션
								</th>
								<th style={{ fontWeight: 700, width: 140 }} scope="col">
									스코프
								</th>
								<th style={{ fontWeight: 700, width: 240 }} scope="col">
									이전 → 이후
								</th>
								<th style={{ fontWeight: 700 }} scope="col">
									사유
								</th>
								<th style={{ fontWeight: 700, width: 140 }} scope="col">
									변경자
								</th>
							</tr>
						</thead>
						<tbody>
							{changes.length === 0 ? (
								<tr>
									<td colSpan={7} style={{ paddingTop: 48, paddingBottom: 48 }}>
										<p className={"text-sm text-neutral-700"}>
											변경 이력이 없습니다
										</p>
									</td>
								</tr>
							) : (
								changes.map((row) => (
									<tr key={row.id}>
										<td>
											<p className={"text-sm text-neutral-700"}>
												{formatDateTimeKR(row.createdAt)}
											</p>
										</td>
										<td>
											<Chip size={"sm"} variant={"soft"}>
												<Chip.Label>
													{row.targetType === "DISCOUNT" ? "할인" : "정가"}
												</Chip.Label>
											</Chip>
										</td>
										<td>
											<FeatureName featureType={row.featureType} />
										</td>
										<td>
											<ScopeChip
												countryCode={row.countryCode}
												gender={row.gender}
											/>
										</td>
										<td>
											<p className={"text-sm text-neutral-700"}>
												{summarize(row.beforeValue)}→{" "}
												<b>{summarize(row.afterValue)}</b>
											</p>
										</td>
										<td>
											<p className={"text-sm text-neutral-700"}>
												{row.memo || "-"}
											</p>
										</td>
										<td>
											<span className={"text-sm text-neutral-700"}>
												{row.changedBy}
											</span>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
