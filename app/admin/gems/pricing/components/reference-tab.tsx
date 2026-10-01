"use client";
import { Button, Alert, Chip, Label, ListBox, Select } from "@heroui/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminLoading } from "@/shared/ui/admin/loading";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import AdminService from "@/app/services/admin";
interface PricingException {
	condition: string;
	cost?: number;
	description: string;
}
interface PricingEntry {
	key: string;
	label: string;
	amount?:
		| {
				kr: number;
				jp: number;
		  }
		| "variable";
	cost?:
		| {
				kr: number;
				jp: number;
		  }
		| "variable";
	exceptions: PricingException[];
}
type Category = "reward" | "refund" | "admin";
const CATEGORY_LABEL: Record<Category, string> = {
	reward: "보상 (지급)",
	refund: "환급 (되돌려줌)",
	admin: "관리자 조작",
};
function EntryRow({
	entry,
}: {
	entry: PricingEntry;
}) {
	const [open, setOpen] = useState(false);
	const val = entry.amount ?? entry.cost;
	const isVariable = val === "variable" || val === undefined;
	return (
		<>
			<tr>
				<td style={{ fontWeight: 500 }}>{entry.label}</td>
				<td>
					<code>{entry.key}</code>
				</td>
				<td>{isVariable ? "가변" : `${(val as any).kr}`}</td>
				<td>{isVariable ? "가변" : `${(val as any).jp}`}</td>
				<td>
					{entry.exceptions.length > 0 && (
						<Button
							onClick={() => setOpen(!open)}
							style={{ cursor: "pointer" }}
							size={"sm"}
							variant="secondary"
							aria-expanded={open}
						>
							{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
							<span>{`${entry.exceptions.length}개 규칙`}</span>
						</Button>
					)}
				</td>
			</tr>
			{entry.exceptions.length > 0 && (
				<tr>
					<td colSpan={5} style={{ paddingTop: 0, paddingBottom: 0 }}>
						<div hidden={!open}>
							<div
								style={{
									marginTop: 12,
									marginBottom: 12,
									paddingLeft: 16,
									paddingRight: 16,
									paddingTop: 12,
									paddingBottom: 12,
									backgroundColor: "#fafafa",
									borderRadius: 8,
								}}
							>
								{entry.exceptions.map((ex) => (
									<p
										key={ex.condition}
										style={{ marginBottom: 4 }}
										className={"text-sm text-neutral-700"}
									>
										<code>{ex.condition}</code>
										{ex.cost !== undefined && ` (${ex.cost})`}— {ex.description}
									</p>
								))}
							</div>
						</div>
					</td>
				</tr>
			)}
		</>
	);
}
export default function ReferenceTab() {
	const [data, setData] = useState<Record<Category, PricingEntry[]> | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [category, setCategory] = useState<Category | "all">("all");
	useEffect(() => {
		AdminService.gemPricing
			.getAll()
			.then((res: any) =>
				setData({
					reward: res.reward ?? [],
					refund: res.refund ?? [],
					admin: res.admin ?? [],
				}),
			)
			.catch((e) =>
				setError(getAdminErrorMessage(e, "가격표를 불러오지 못했습니다")),
			)
			.finally(() => setLoading(false));
	}, []);
	const sections: Category[] =
		category === "all" ? ["reward", "refund", "admin"] : [category];
	if (loading) {
		return <AdminLoading />;
	}
	if (error)
		return (
			<Alert status={"danger"}>
				<Alert.Content>{error}</Alert.Content>
			</Alert>
		);
	if (!data) return null;
	return (
		<div>
			<Alert style={{ marginBottom: 16 }} status={"default"}>
				<Alert.Content>
					보상·환급·관리자 항목은 아직 DB화되지 않아 <b>읽기 전용</b>입니다. 값
					변경은 코드 수정 + 배포가 필요합니다. 소모 가격만 정가 탭에서 즉시
					바꿀 수 있습니다.
				</Alert.Content>
			</Alert>
			<section style={{ padding: 16, marginBottom: 16 }}>
				<div style={{ minWidth: 200 }}>
					<Select
						value={category}
						onChange={(key) => {
							const value = String(key ?? "");
							setCategory(value as Category | "all");
						}}
						className="w-full"
					>
						<Label>{"분류"}</Label>
						<Select.Trigger>
							<Select.Value />
							<Select.Indicator />
						</Select.Trigger>
						<Select.Popover>
							<ListBox>
								<ListBox.Item id={"all"} textValue={"전체"} key={"all"}>
									전체
								</ListBox.Item>
								{(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
									<ListBox.Item
										id={c}
										textValue={String(CATEGORY_LABEL[c])}
										key={c}
									>
										{CATEGORY_LABEL[c]}
									</ListBox.Item>
								))}
							</ListBox>
						</Select.Popover>
					</Select>
				</div>
			</section>
			{sections.map((cat) => (
				<div key={cat} style={{ marginBottom: 24 }}>
					<p style={{ marginBottom: 8 }} className={"text-sm text-neutral-700"}>
						{CATEGORY_LABEL[cat]}· {data[cat].length}개
					</p>
					<div className={"overflow-x-auto"}>
						<table
							className={
								"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
							}
						>
							<thead>
								<tr style={{ backgroundColor: "#f5f5f5" }}>
									<th style={{ fontWeight: 700 }} scope="col">
										기능
									</th>
									<th style={{ fontWeight: 700 }} scope="col">
										key
									</th>
									<th style={{ fontWeight: 700, width: 80 }} scope="col">
										KR
									</th>
									<th style={{ fontWeight: 700, width: 80 }} scope="col">
										JP
									</th>
									<th style={{ fontWeight: 700, width: 150 }} scope="col">
										예외 규칙
									</th>
								</tr>
							</thead>
							<tbody>
								{data[cat].map((entry) => (
									<EntryRow key={entry.key} entry={entry} />
								))}
							</tbody>
						</table>
					</div>
				</div>
			))}
		</div>
	);
}
