import type { FeatureFlag } from "@/app/services/admin";

const ROLE_LABEL: Record<string, string> = {
	admin: "관리자",
	tester: "테스터",
	user: "일반 유저",
};

export type IssueKind =
	| "leak"
	| "deprecated"
	| "no-description"
	| "stale-default"
	| "needs-korean";

export const ISSUE_LABEL: Record<IssueKind, string> = {
	leak: "꺼짐인데 나가는 중",
	deprecated: "폐기 표기",
	"no-description": "설명 없음",
	"stale-default": '설명은 "기본 OFF"인데 켜짐',
	"needs-korean": "한국어 설명 필요",
};

export const ISSUE_ORDER: IssueKind[] = [
	"leak",
	"deprecated",
	"no-description",
	"stale-default",
	"needs-korean",
];

const hasKorean = (text: string) => /[가-힣]/.test(text);

// 서버 evaluateFlagForUser 와 같은 순서: 지정 유저 → 테스트 계정 → 롤아웃 → enabled+역할
export function audience(flag: FeatureFlag): string[] {
	const result: string[] = [];
	if (flag.allowedUserIds.length > 0) result.push(`지정 유저 ${flag.allowedUserIds.length}명`);
	if (flag.allowTestUsers) result.push("테스트 계정");
	if (flag.rolloutPercentage >= 100) result.push("로그인한 전원 (롤아웃 100%)");
	else if (flag.rolloutPercentage > 0) result.push(`로그인 유저 ${flag.rolloutPercentage}%`);
	if (flag.enabled) {
		result.push(
			flag.allowedRoles.length > 0
				? `${flag.allowedRoles.map((r) => ROLE_LABEL[r] ?? r).join("·")} 역할`
				: "전원",
		);
	}
	return result;
}

// 일반 유저에게 닿는지. 테스트 계정·지정 유저는 끈 뒤에도 QA 용으로 남기므로 제외한다.
export const reachesRealUsers = (flag: FeatureFlag) => flag.enabled || flag.rolloutPercentage > 0;

export const isLeaking = (flag: FeatureFlag) => !flag.enabled && flag.rolloutPercentage > 0;

export const isQaOnly = (flag: FeatureFlag) =>
	!reachesRealUsers(flag) && (flag.allowTestUsers || flag.allowedUserIds.length > 0);

export const reachesEveryone = (flag: FeatureFlag) =>
	flag.rolloutPercentage >= 100 || (flag.enabled && flag.allowedRoles.length === 0);

export function issues(flag: FeatureFlag): IssueKind[] {
	const result: IssueKind[] = [];
	if (isLeaking(flag)) result.push("leak");
	if (/폐기/.test(flag.description)) result.push("deprecated");
	if (!flag.description.trim()) result.push("no-description");
	else if (!hasKorean(flag.description)) result.push("needs-korean");
	if (
		flag.enabled &&
		/기본\s*(off|비활성)|disabled by default|off by default/i.test(flag.description)
	) {
		result.push("stale-default");
	}
	return result;
}

// ponytail: 한국어 이름 칸(label)이 생기기 전까지 설명 앞부분을 제목으로 쓴다.
export function displayTitle(flag: FeatureFlag): string {
	if (!hasKorean(flag.description)) return flag.name;
	const head = flag.description.split(/[.(—:]| - /)[0].trim();
	if (!head) return flag.name;
	return head.length > 36 ? `${head.slice(0, 36)}…` : head;
}

export const hasKoreanDescription = (flag: FeatureFlag) => hasKorean(flag.description);

// ponytail: depends_on 칸이 생기기 전까지 설명 속 다른 플래그 이름으로 부모를 추정한다(오탐 있음).
export function inferParents(flags: FeatureFlag[]): Map<string, FeatureFlag> {
	const parents = new Map<string, FeatureFlag>();
	for (const child of flags) {
		for (const parent of flags) {
			if (parent === child) continue;
			const name = parent.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[-_]/g, "[-_]");
			if (new RegExp(`(^|[^\\w/-])${name}($|[^\\w/-])`).test(child.description)) {
				parents.set(child.name, parent);
			}
		}
	}
	return parents;
}

export function familyKey(name: string): string {
	const parts = name.toLowerCase().split(/[-_]/);
	return parts.slice(0, ["moment", "miho", "community"].includes(parts[0]) ? 1 : 2).join("-");
}

export function matchesQuery(flag: FeatureFlag, query: string): boolean {
	if (!query) return true;
	return `${flag.name} ${flag.description}`.toLowerCase().includes(query.toLowerCase());
}
