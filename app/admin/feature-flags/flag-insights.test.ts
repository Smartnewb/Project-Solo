import type { FeatureFlag } from "@/app/services/admin";
import { audience, inferParents, isLeaking, isQaOnly, issues } from "./flag-insights";

const flag = (over: Partial<FeatureFlag>): FeatureFlag => ({
	id: "1",
	name: "x",
	description: "설명",
	enabled: false,
	allowedRoles: [],
	allowedUserIds: [],
	allowTestUsers: false,
	rolloutPercentage: 0,
	country: null,
	createdAt: "",
	updatedAt: "",
	...over,
});

test("받는 사람은 서버 평가 순서대로 지정 유저·테스트 계정·롤아웃·역할을 모두 적는다", () => {
	// given
	const f = flag({ allowedUserIds: ["a", "b"], allowTestUsers: true, rolloutPercentage: 30, enabled: true, allowedRoles: ["admin"] });

	// when
	const result = audience(f);

	// then
	expect(result).toEqual(["지정 유저 2명", "테스트 계정", "로그인 유저 30%", "관리자 역할"]);
});

test("꺼짐인데 롤아웃이 남아 있으면 나가는 중이고, 테스트 계정만 남으면 테스트만으로 본다", () => {
	// given
	const rolledOut = flag({ rolloutPercentage: 100 });
	const qa = flag({ allowTestUsers: true });

	// when
	const verdicts = [isLeaking(rolledOut), isLeaking(qa), isQaOnly(qa)];

	// then
	expect(verdicts).toEqual([true, false, true]);
});

test("켜져 있는데 설명이 기본 OFF 라고 하거나 영어뿐이면 정리 대상으로 잡는다", () => {
	// given
	const f = flag({ enabled: true, description: "Gate. Disabled by default." });

	// when
	const result = issues(f);

	// then
	expect(result).toEqual(["needs-korean", "stale-default"]);
});

test("설명에 단어로 적힌 다른 플래그만 부모로 보고 경로 속 글자는 무시한다", () => {
	// given
	const parent = flag({ name: "persona-twin-mvp" });
	const child = flag({ name: "persona-twin-voice-coach", description: "코치 모드. persona-twin-mvp 와 AND" });
	const moment = flag({ name: "moment" });
	const path = flag({ name: "ai-photo-studio", description: "진입 (/moment/ai-photo-studio)" });

	// when
	const parents = inferParents([parent, child, moment, path]);

	// then
	expect(parents.get(child.name)).toBe(parent);
	expect(parents.has(path.name)).toBe(false);
});
