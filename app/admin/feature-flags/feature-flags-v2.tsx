"use client";
import {
	Alert,
	Button,
	Checkbox,
	Chip,
	Input,
	Label,
	Spinner,
	Switch,
	Tabs,
	TextArea,
	TextField,
} from "@heroui/react";
import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminService from "@/app/services/admin";
import type { FeatureFlag, FeatureFlagChange } from "@/app/services/admin";
import { safeToLocaleDateString } from "@/app/utils/formatters";
import { useAdminSession } from "@/shared/contexts/admin-session-context";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import { useToast } from "@/shared/ui/admin/toast";
import {
	ISSUE_LABEL,
	ISSUE_ORDER,
	audience,
	displayTitle,
	familyKey,
	hasKoreanDescription,
	inferParents,
	isLeaking,
	isQaOnly,
	issues,
	matchesQuery,
	reachesEveryone,
	reachesRealUsers,
} from "./flag-insights";

const AVAILABLE_ROLES = ["admin", "tester", "user"];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const COUNTRY_LABEL: Record<string, string> = { kr: "한국(KR)", jp: "일본(JP)" };

type FilterKey = "all" | "on" | "leak" | "fix" | "week";
type TabKey = "groups" | "fix" | "recent";

const FILTERS: { key: FilterKey; label: string; test: (f: FeatureFlag) => boolean }[] = [
	{ key: "all", label: "전체", test: () => true },
	{ key: "on", label: "유저에게 켜짐", test: reachesRealUsers },
	{ key: "leak", label: "꺼짐인데 나가는 중", test: isLeaking },
	{ key: "fix", label: "정리 필요", test: (f) => issues(f).length > 0 },
	{
		key: "week",
		label: "최근 7일 변경",
		test: (f) => !!f.updatedAt && Date.now() - new Date(f.updatedAt).getTime() <= WEEK_MS,
	},
];

function formatRelativeTime(dateStr: string | null): string {
	if (!dateStr) return "기록 없음";
	const diff = Date.now() - new Date(dateStr).getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return "방금 전";
	if (minutes < 60) return `${minutes}분 전`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}시간 전`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}일 전`;
	return safeToLocaleDateString(dateStr);
}

function StateChip({ flag }: { flag: FeatureFlag }) {
	if (isLeaking(flag)) {
		return (
			<Chip size="sm" variant="soft" className="bg-red-50 text-red-800">
				<Chip.Label>꺼짐 · 일부에게 나감</Chip.Label>
			</Chip>
		);
	}
	if (flag.enabled) {
		return (
			<Chip size="sm" variant="soft" className="bg-green-50 text-green-800">
				<Chip.Label>{reachesEveryone(flag) ? "켜짐 · 전원" : "켜짐 · 일부"}</Chip.Label>
			</Chip>
		);
	}
	return (
		<Chip size="sm" variant="soft">
			<Chip.Label>{isQaOnly(flag) ? "꺼짐 · 테스트만" : "꺼짐"}</Chip.Label>
		</Chip>
	);
}

export default function FeatureFlagsV2() {
	const confirm = useConfirm();
	const toast = useToast();
	const { session } = useAdminSession();
	const countryLabel = COUNTRY_LABEL[session?.selectedCountry ?? ""] ?? session?.selectedCountry ?? "";

	const [flags, setFlags] = useState<FeatureFlag[]>([]);
	const [changes, setChanges] = useState<FeatureFlagChange[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [togglingFlags, setTogglingFlags] = useState<Set<string>>(new Set());
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState<FilterKey>("all");
	const [tab, setTab] = useState<TabKey>("groups");
	const [selectedName, setSelectedName] = useState<string | null>(null);
	const [draftDescription, setDraftDescription] = useState("");
	const [draftRoles, setDraftRoles] = useState<string[]>([]);
	const [saving, setSaving] = useState(false);

	const fetchFlags = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			setFlags(await AdminService.featureFlags.getAll());
		} catch (err: any) {
			setError(err.response?.data?.message || err.message || "플래그 목록을 불러오지 못했습니다.");
		} finally {
			setLoading(false);
		}
		// 변경 이력은 보조 정보라 실패해도 목록은 보여 준다.
		AdminService.featureFlags
			.getChanges()
			.then(setChanges)
			.catch(() => setChanges(null));
	}, []);

	useEffect(() => {
		fetchFlags();
	}, [fetchFlags]);

	const parents = useMemo(() => inferParents(flags), [flags]);
	const visible = useMemo(() => {
		const test = FILTERS.find((f) => f.key === filter)?.test ?? (() => true);
		return flags.filter((f) => matchesQuery(f, query) && test(f));
	}, [flags, filter, query]);
	const selected = flags.find((f) => f.name === selectedName) ?? visible[0] ?? null;
	const fixCount = useMemo(() => flags.filter((f) => issues(f).length > 0).length, [flags]);

	useEffect(() => {
		if (!selected) return;
		setDraftDescription(selected.description);
		setDraftRoles([...selected.allowedRoles]);
	}, [selected?.name, selected?.updatedAt]);

	const replaceFlag = (updated: FeatureFlag) =>
		setFlags((prev) => prev.map((f) => (f.name === updated.name ? updated : f)));

	const handleToggle = async (flag: FeatureFlag) => {
		const turningOff = reachesRealUsers(flag);
		const newEnabled = !turningOff;
		const keepsQa = flag.allowTestUsers || flag.allowedUserIds.length > 0;
		const who = audience(flag);
		const message = turningOff
			? [
					`국가: ${countryLabel}`,
					`지금 받는 사람: ${who.join(", ")}`,
					"끄면 일반 유저 경로(켜짐·롤아웃)가 모두 꺼집니다.",
					keepsQa ? "테스트 계정·지정 유저는 계속 봅니다." : "",
					"변경 즉시 서비스에 반영됩니다.",
				]
			: [
					`국가: ${countryLabel}`,
					`켜면 받는 사람: ${flag.allowedRoles.length > 0 ? `${flag.allowedRoles.join(", ")} 역할` : "전원"}`,
					"변경 즉시 서비스에 반영됩니다.",
				];
		const ok = await confirm({
			title: `"${displayTitle(flag)}" ${turningOff ? "끄기" : "켜기"}`,
			message: `${flag.name}\n${message.filter(Boolean).join("\n")}`,
			confirmText: turningOff ? "끄기" : "켜기",
			severity: "warning",
		});
		if (!ok) return;
		replaceFlag({
			...flag,
			enabled: newEnabled,
			rolloutPercentage: newEnabled ? flag.rolloutPercentage : 0,
		});
		setTogglingFlags((prev) => new Set(prev).add(flag.name));
		try {
			replaceFlag(await AdminService.featureFlags.toggle(flag.name, newEnabled));
			AdminService.featureFlags.getChanges().then(setChanges).catch(() => undefined);
		} catch {
			replaceFlag(flag);
			const failure = `"${flag.name}" 토글에 실패했습니다.`;
			setError(failure);
			toast.error(failure);
		} finally {
			setTogglingFlags((prev) => {
				const next = new Set(prev);
				next.delete(flag.name);
				return next;
			});
		}
	};

	const handleSave = async () => {
		if (!selected) return;
		setSaving(true);
		try {
			replaceFlag(
				await AdminService.featureFlags.update(selected.name, {
					description: draftDescription,
					allowedRoles: draftRoles,
				}),
			);
			toast.success("저장했습니다.");
			AdminService.featureFlags.getChanges().then(setChanges).catch(() => undefined);
		} catch (err: any) {
			const failure = err.response?.data?.message || "수정에 실패했습니다.";
			setError(failure);
			toast.error(failure);
		} finally {
			setSaving(false);
		}
	};

	const renderRow = (flag: FeatureFlag) => {
		const dot = isLeaking(flag)
			? "bg-red-600"
			: reachesRealUsers(flag)
				? "bg-[var(--color-primary)]"
				: "bg-neutral-300";
		return (
			<Button
				key={flag.name}
				variant="ghost"
				onPress={() => setSelectedName(flag.name)}
				aria-label={`${flag.name} 상세 보기`}
				className={`flex h-auto w-full items-start justify-start gap-3 rounded-none border-b border-neutral-100 px-4 py-3 text-left ${selected?.name === flag.name ? "bg-violet-50" : ""}`}
			>
				<span className={`mt-1.5 h-2.5 w-2.5 flex-none rounded-full ${dot}`} aria-hidden />
				<span className="min-w-0 flex-1">
					<span className="block font-semibold text-neutral-900">{displayTitle(flag)}</span>
					{!hasKoreanDescription(flag) && flag.description && (
						<span className="block text-xs italic text-neutral-500">{flag.description}</span>
					)}
					<span className="block font-mono text-xs text-neutral-500">{flag.name}</span>
					<span className="mt-1 flex flex-wrap gap-1">
						<StateChip flag={flag} />
						{issues(flag)
							.filter((i) => i !== "leak")
							.map((i) => (
								<Chip key={i} size="sm" variant="soft" className="bg-orange-50 text-orange-800">
									<Chip.Label>{ISSUE_LABEL[i]}</Chip.Label>
								</Chip>
							))}
					</span>
				</span>
				<span className="whitespace-nowrap font-mono text-xs text-neutral-500">
					{formatRelativeTime(flag.updatedAt)}
				</span>
			</Button>
		);
	};

	const empty = (text: string) => <p className="p-10 text-center text-sm text-neutral-500">{text}</p>;
	const noMatch = () => empty(query ? `"${query}" 와 맞는 기능이 없습니다` : "해당하는 기능이 없습니다");

	const renderGroups = () => {
		if (visible.length === 0) return noMatch();
		const visibleNames = new Set(visible.map((f) => f.name));
		const families = new Map<string, FeatureFlag[]>();
		for (const flag of visible.filter((f) => !parents.has(f.name))) {
			const key = familyKey(flag.name);
			families.set(key, [...(families.get(key) ?? []), flag]);
		}
		return [...families.entries()]
			.sort((a, b) => b[1].length - a[1].length)
			.map(([key, group]) => (
				<div key={key}>
					{group.length > 1 && (
						<div className="sticky top-0 z-10 border-b border-neutral-100 bg-neutral-50 px-4 py-2 text-xs font-bold">
							{key} 계열 · {group.length}
						</div>
					)}
					{group.map((flag) => (
						<div key={flag.name}>
							{renderRow(flag)}
							{flags
								.filter((c) => parents.get(c.name) === flag && visibleNames.has(c.name))
								.map((child) => (
									<div key={child.name} className="ml-6 border-l-2 border-neutral-200 pl-2">
										{renderRow(child)}
										{!reachesRealUsers(flag) && reachesRealUsers(child) && (
											<p className="px-4 pb-2 text-xs text-red-700">부모 &quot;{flag.name}&quot; 가 꺼져 있음</p>
										)}
									</div>
								))}
						</div>
					))}
				</div>
			));
	};

	const renderFix = () => {
		const seen = new Set<string>();
		const sections = ISSUE_ORDER.map((kind) => {
			const group = visible.filter((f) => !seen.has(f.name) && issues(f).includes(kind));
			for (const f of group) seen.add(f.name);
			if (group.length === 0) return null;
			return (
				<div key={kind}>
					<div className="sticky top-0 z-10 border-b border-neutral-100 bg-neutral-50 px-4 py-2 text-xs font-bold">
						{ISSUE_LABEL[kind]} · {group.length}
					</div>
					{group.map(renderRow)}
				</div>
			);
		}).filter(Boolean);
		return sections.length > 0 ? sections : empty("정리할 플래그가 없습니다");
	};

	const renderRecent = () => {
		const visibleNames = new Set(visible.map((f) => f.name));
		const logged = (changes ?? []).filter((c) => visibleNames.has(c.flagName));
		return (
			<>
				{logged.map((change) => {
					const before = change.diff?.before?.enabled;
					const after = change.diff?.after?.enabled;
					const flag = flags.find((f) => f.name === change.flagName);
					return (
						<Button
							key={change.id}
							variant="ghost"
							onPress={() => setSelectedName(change.flagName)}
							className="flex h-auto w-full items-start justify-start gap-3 rounded-none border-b border-neutral-100 px-4 py-3 text-left"
						>
							<span className="w-16 flex-none text-xs text-neutral-500">{formatRelativeTime(change.createdAt)}</span>
							<span className="min-w-0 flex-1">
								<span className="block font-semibold">{flag ? displayTitle(flag) : change.flagName}</span>
								<span className="block font-mono text-xs text-neutral-500">{change.flagName}</span>
								<span className="block text-xs text-neutral-700">
									{change.adminName ?? change.adminUserId} ·{" "}
									{before !== after && typeof after === "boolean"
										? `${before ? "켜짐" : "꺼짐"} → ${after ? "켜짐" : "꺼짐"}`
										: "설명·범위 수정"}
								</span>
							</span>
						</Button>
					);
				})}
				<div className="border-b border-neutral-100 bg-neutral-50 px-4 py-2 text-xs font-bold">
					{changes === null ? "변경 기록을 불러오지 못해 수정일 순으로 보여 줍니다" : "수정일 순 (기록이 쌓이기 전 변경 포함)"}
				</div>
				{visible.length === 0
					? noMatch()
					: [...visible].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")).map(renderRow)}
			</>
		);
	};

	const renderDetail = (flag: FeatureFlag) => {
		const who = audience(flag);
		const parent = parents.get(flag.name);
		const kids = flags.filter((c) => parents.get(c.name) === flag);
		return (
			<aside className="sticky top-0 self-start rounded-xl border border-neutral-200 p-4">
				<div className="flex items-center justify-between">
					<StateChip flag={flag} />
					<Switch
						isSelected={reachesRealUsers(flag)}
						isDisabled={togglingFlags.has(flag.name)}
						onChange={() => handleToggle(flag)}
						aria-label={`${flag.name} 활성화`}
					>
						<Switch.Content>
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
						</Switch.Content>
					</Switch>
				</div>
				<h2 className="mt-2 text-base font-bold">{displayTitle(flag)}</h2>
				<p className="font-mono text-xs text-neutral-500">{flag.name}</p>

				<p className="mb-1 mt-4 text-xs text-neutral-500">지금 실제로 받는 사람</p>
				<div className={`rounded-lg p-3 text-sm ${isLeaking(flag) ? "bg-red-50 text-red-900" : "bg-neutral-50"}`}>
					{who.length > 0 ? who.map((w) => <p key={w}>· {w}</p>) : <p>아무도 받지 않습니다</p>}
					{isLeaking(flag) && (
						<p className="mt-1 font-semibold">스위치는 꺼져 있지만 위 사람들에게는 켜져 있습니다.</p>
					)}
				</div>

				{parent && (
					<>
						<p className="mb-1 mt-4 text-xs text-neutral-500">함께 켜야 하는 부모 (설명에서 추정)</p>
						<Button
							variant="ghost"
							onPress={() => setSelectedName(parent.name)}
							className="flex h-auto w-full justify-between px-0 text-left"
						>
							<span>
								<span className="block text-sm font-semibold">{displayTitle(parent)}</span>
								<span className="block font-mono text-xs text-neutral-500">{parent.name}</span>
							</span>
							<StateChip flag={parent} />
						</Button>
					</>
				)}
				{kids.length > 0 && (
					<>
						<p className="mb-1 mt-4 text-xs text-neutral-500">이 기능에 기대는 기능 {kids.length}개</p>
						{kids.map((k) => (
							<p key={k.name} className="font-mono text-xs">{k.name}</p>
						))}
					</>
				)}

				<TextField className="mt-4 w-full">
					<Label>설명</Label>
					<TextArea
						rows={4}
						value={draftDescription}
						onChange={(e) => setDraftDescription(e.target.value)}
						placeholder="켜면 누가 무엇을 보게 되나 한 문장으로"
						aria-label="설명"
					/>
				</TextField>

				<p className="mb-1 mt-4 text-xs text-neutral-500">켜졌을 때 볼 수 있는 역할 (아무것도 고르지 않으면 전원)</p>
				<div className="flex gap-3">
					{AVAILABLE_ROLES.map((role) => (
						<Checkbox
							key={role}
							isSelected={draftRoles.includes(role)}
							onChange={() =>
								setDraftRoles((prev) =>
									prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
								)
							}
						>
							<Checkbox.Content>
								<Checkbox.Control>
									<Checkbox.Indicator />
								</Checkbox.Control>
								<Label>{role}</Label>
							</Checkbox.Content>
						</Checkbox>
					))}
				</div>

				<p className="mt-4 text-xs text-neutral-500">마지막 변경 {formatRelativeTime(flag.updatedAt)}</p>
				<div className="mt-3 flex justify-end gap-2">
					<Button
						variant="secondary"
						isDisabled={saving}
						onPress={() => {
							setDraftDescription(flag.description);
							setDraftRoles([...flag.allowedRoles]);
						}}
					>
						되돌리기
					</Button>
					<Button variant="primary" isDisabled={saving} onPress={handleSave}>
						{saving ? <Spinner aria-label="저장 중" size="sm" /> : "저장"}
					</Button>
				</div>
			</aside>
		);
	};

	return (
		<div>
			<div className="mb-4 flex items-center gap-4">
				<h1 className="whitespace-nowrap text-xl font-bold text-neutral-900">기능 스위치</h1>
				<TextField className="w-full">
					<Label className="sr-only">기능 검색</Label>
					<div className="relative">
						<Search size={16} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400" />
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="기능 이름·설명으로 찾기 (예: 결제, 미호, 여성, 사진)"
							className="h-11 w-full pl-9"
						/>
					</div>
				</TextField>
				<Button onPress={fetchFlags} variant="secondary" isDisabled={loading} size="sm">
					새로고침
				</Button>
			</div>

			{error && (
				<Alert className="mb-4" status="danger">
					<Alert.Content>{error}</Alert.Content>
				</Alert>
			)}

			{loading ? (
				<div className="flex justify-center py-20">
					<Spinner aria-label="불러오는 중" size="sm" />
				</div>
			) : flags.length === 0 ? (
				empty("등록된 플래그가 없습니다")
			) : (
				<>
					<div className="mb-5 grid grid-cols-5 gap-3">
						{FILTERS.map(({ key, label, test }) => {
							const count = flags.filter(test).length;
							const alert = key === "leak" && count > 0;
							const active = filter === key;
							return (
								<button
									key={key}
									type="button"
									aria-pressed={active}
									onClick={() => setFilter(key)}
									className={`flex w-full flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-colors ${
										active
											? "border-neutral-900 bg-neutral-900 text-white"
											: alert
												? "border-red-200 bg-red-50 hover:border-red-300"
												: "border-neutral-200 bg-white hover:border-neutral-400"
									}`}
								>
									<span className={`text-xs ${active ? "text-neutral-300" : alert ? "text-red-700" : "text-neutral-500"}`}>
										{label}
									</span>
									<span className={`text-2xl font-bold tabular-nums ${!active && alert ? "text-red-700" : ""}`}>
										{count}
									</span>
								</button>
							);
						})}
					</div>

					<Tabs selectedKey={tab} onSelectionChange={(key) => setTab(key as TabKey)}>
						<Tabs.List aria-label="기능 스위치 보기">
							<Tabs.Tab id="groups">묶음별 전체</Tabs.Tab>
							<Tabs.Tab id="fix">정리함 {fixCount > 0 ? fixCount : ""}</Tabs.Tab>
							<Tabs.Tab id="recent">최근 변경</Tabs.Tab>
						</Tabs.List>
						{(["groups", "fix", "recent"] as TabKey[]).map((key) => (
							<Tabs.Panel key={key} id={key} className="pt-3">
								<div className="grid grid-cols-[1fr_340px] gap-4">
									<div className="max-h-[640px] overflow-auto rounded-xl border border-neutral-200">
										{key === "groups" ? renderGroups() : key === "fix" ? renderFix() : renderRecent()}
									</div>
									{selected ? renderDetail(selected) : empty("왼쪽에서 기능을 고르세요")}
								</div>
							</Tabs.Panel>
						))}
					</Tabs>
				</>
			)}
		</div>
	);
}
