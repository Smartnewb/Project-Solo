"use client";
import {
	Alert,
	Button,
	Input,
	Label,
	ListBox,
	Select,
	Spinner,
	TextField,
} from "@heroui/react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import AdminService from "@/app/services/admin";
import type {
	AdminAccessLogItem,
	AdminAccessLogListParams,
	AdminAccessLogMethod,
} from "@/app/services/admin";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
const LIMIT = 50;
const METHODS: AdminAccessLogMethod[] = [
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE",
];
interface Filters {
	adminUserId: string;
	targetUserId: string;
	method: "" | AdminAccessLogMethod;
	pathContains: string;
	from: string;
	to: string;
}
const EMPTY_FILTERS: Filters = {
	adminUserId: "",
	targetUserId: "",
	method: "",
	pathContains: "",
	from: "",
	to: "",
};
function formatKst(value: string): string {
	return new Intl.DateTimeFormat("sv-SE", {
		timeZone: "Asia/Seoul",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).format(new Date(value));
}
function adminLabel(log: AdminAccessLogItem): string {
	if (log.adminName && log.adminEmail)
		return `${log.adminName} (${log.adminEmail})`;
	return log.adminName ?? log.adminEmail ?? log.adminUserId;
}
export default function AccessLogsPage() {
	const [draftFilters, setDraftFilters] = useState<Filters>(EMPTY_FILTERS);
	const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
	const [items, setItems] = useState<AdminAccessLogItem[]>([]);
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const fetchLogs = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const params: AdminAccessLogListParams = {
				page,
				limit: LIMIT,
				adminUserId: filters.adminUserId.trim() || undefined,
				targetUserId: filters.targetUserId.trim() || undefined,
				method: filters.method || undefined,
				pathContains: filters.pathContains.trim() || undefined,
				from: filters.from || undefined,
				to: filters.to || undefined,
			};
			const data = await AdminService.accessLogs.getList(params);
			setItems(data.items);
			setTotal(data.total);
		} catch (fetchError) {
			setError(
				getAdminErrorMessage(
					fetchError,
					"개인정보 접속기록을 불러오지 못했습니다.",
				),
			);
			setItems([]);
			setTotal(0);
		} finally {
			setLoading(false);
		}
	}, [filters, page]);
	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);
	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		setPage(1);
		setFilters(draftFilters);
	};
	const totalPages = Math.max(1, Math.ceil(total / LIMIT));
	return (
		<div style={{ padding: 24 }}>
			<h2 className={"text-lg font-semibold text-neutral-900"}>
				개인정보 접속기록
			</h2>
			<p
				style={{ marginTop: 4, marginBottom: 24 }}
				className={"text-sm text-neutral-700"}
			>
				관리자가 회원 개인정보를 조회·수정한 기록입니다. 2년 보관되며 월 1회
				이상 점검해야 합니다.
			</p>
			<form onSubmit={handleSubmit} style={{ padding: 16, marginBottom: 16 }}>
				<div
					style={{
						display: "flex",
						gap: 12,
						flexWrap: "wrap",
						alignItems: "center",
					}}
				>
					<TextField className="w-full">
						<Label>{"관리자 user id"}</Label>
						<Input
							value={draftFilters.adminUserId}
							onChange={(event) =>
								setDraftFilters((current) => ({
									...current,
									adminUserId: event.target.value,
								}))
							}
						/>
					</TextField>
					<TextField className="w-full">
						<Label>{"대상 회원 id"}</Label>
						<Input
							value={draftFilters.targetUserId}
							onChange={(event) =>
								setDraftFilters((current) => ({
									...current,
									targetUserId: event.target.value,
								}))
							}
						/>
					</TextField>
					<div style={{ minWidth: 120 }}>
						<Select
							value={draftFilters.method}
							onChange={(key) => {
								const value = String(key ?? "");
								setDraftFilters((current) => ({
									...current,
									method: value as Filters["method"],
								}));
							}}
							className="w-full"
						>
							<Label>{"메서드"}</Label>
							<Select.Trigger>
								<Select.Value />
								<Select.Indicator />
							</Select.Trigger>
							<Select.Popover>
								<ListBox>
									<ListBox.Item id={""} textValue={"전체"} key={""}>
										전체
									</ListBox.Item>
									{METHODS.map((method) => (
										<ListBox.Item
											id={method}
											textValue={String(method)}
											key={method}
										>
											{method}
										</ListBox.Item>
									))}
								</ListBox>
							</Select.Popover>
						</Select>
					</div>
					<TextField className="w-full">
						<Label>{"경로 포함"}</Label>
						<Input
							value={draftFilters.pathContains}
							onChange={(event) =>
								setDraftFilters((current) => ({
									...current,
									pathContains: event.target.value,
								}))
							}
						/>
					</TextField>
					<TextField className="w-full">
						<Label>{"시작일"}</Label>
						<Input
							type="date"
							value={draftFilters.from}
							onChange={(event) =>
								setDraftFilters((current) => ({
									...current,
									from: event.target.value,
								}))
							}
						/>
					</TextField>
					<TextField className="w-full">
						<Label>{"종료일"}</Label>
						<Input
							type="date"
							value={draftFilters.to}
							onChange={(event) =>
								setDraftFilters((current) => ({
									...current,
									to: event.target.value,
								}))
							}
						/>
					</TextField>
					<Button type="submit" variant={"primary"} size={"md"}>
						조회
					</Button>
				</div>
			</form>
			{error && (
				<Alert style={{ marginBottom: 16 }} status={"danger"}>
					<Alert.Content>{error}</Alert.Content>
				</Alert>
			)}
			<div className={"overflow-x-auto"}>
				<table
					className={
						"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
					}
				>
					<thead>
						<tr style={{ backgroundColor: "#f9fafb" }}>
							{[
								"시각",
								"관리자",
								"메서드",
								"경로",
								"대상 회원 id",
								"결과",
								"IP",
							].map((heading) => (
								<th key={heading} style={{ fontWeight: 600 }} scope="col">
									{heading}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={7} style={{ paddingTop: 40, paddingBottom: 40 }}>
									<Spinner aria-label="불러오는 중" size="sm" />
								</td>
							</tr>
						) : items.length === 0 ? (
							<tr>
								<td
									colSpan={7}
									style={{
										paddingTop: 40,
										paddingBottom: 40,
										color: "#525252",
									}}
								>
									접속기록이 없습니다.
								</td>
							</tr>
						) : (
							items.map((log) => (
								<tr key={log.id}>
									<td style={{ whiteSpace: "nowrap" }}>
										{formatKst(log.createdAt)}
									</td>
									<td>{adminLabel(log)}</td>
									<td>{log.method}</td>
									<td style={{ maxWidth: 440, wordBreak: "break-all" }}>
										{log.route ?? log.path}
									</td>
									<td>{log.targetUserId ?? "-"}</td>
									<td>{log.statusCode ?? "-"}</td>
									<td>{log.ip ?? "-"}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginTop: 16,
				}}
			>
				<p className={"text-sm text-neutral-700"}>
					총 {total.toLocaleString()}건 · {page}/{totalPages}페이지
				</p>
				<div style={{ display: "flex", gap: 8 }}>
					<Button
						onClick={() => setPage((current) => current - 1)}
						variant={"secondary"}
						isDisabled={loading || page <= 1}
						size={"md"}
					>
						이전
					</Button>
					<Button
						onClick={() => setPage((current) => current + 1)}
						variant={"secondary"}
						isDisabled={loading || page >= totalPages}
						size={"md"}
					>
						다음
					</Button>
				</div>
			</div>
		</div>
	);
}
