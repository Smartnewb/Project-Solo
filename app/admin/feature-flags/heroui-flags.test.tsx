import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminService from "@/app/services/admin";
import type { FeatureFlag } from "@/app/services/admin";
import { AdminSessionContext } from "@/shared/contexts/admin-session-context";
import FeatureFlagsV2 from "./feature-flags-v2";

const mockConfirm = jest.fn().mockResolvedValue(true);
jest.mock("@/shared/ui/admin/confirm-dialog", () => ({
	useConfirm: () => mockConfirm,
}));
jest.mock("@/shared/ui/admin/toast", () => ({
	useToast: () => ({
		success: jest.fn(),
		error: jest.fn(),
		warning: jest.fn(),
		info: jest.fn(),
	}),
}));

const base: FeatureFlag = {
	id: "1",
	name: "html_notice",
	description: "HTML 공지",
	enabled: false,
	allowedRoles: [],
	allowedUserIds: [],
	allowTestUsers: false,
	rolloutPercentage: 0,
	country: "kr",
	createdAt: "2026-10-01",
	updatedAt: "2026-10-02",
};

function renderPage(flags: FeatureFlag[]) {
	jest.spyOn(AdminService.featureFlags, "getAll").mockResolvedValue(flags);
	jest.spyOn(AdminService.featureFlags, "getChanges").mockResolvedValue([]);
	return render(
		<AdminSessionContext.Provider
			value={{
				session: {
					user: { id: "admin-1", email: "a@test.com", roles: ["admin"] },
					selectedCountry: "kr",
					issuedAt: 0,
				},
				isLoading: false,
				error: null,
				changeCountry: jest.fn(),
				logout: jest.fn(),
			}}
		>
			<FeatureFlagsV2 />
		</AdminSessionContext.Provider>,
	);
}

beforeEach(() => mockConfirm.mockClear());
afterEach(() => jest.restoreAllMocks());

test("스위치를 켜면 확인창에 국가를 적고 정확한 토글을 호출한다", async () => {
	// given
	const user = userEvent.setup();
	renderPage([base]);
	const toggle = jest
		.spyOn(AdminService.featureFlags, "toggle")
		.mockResolvedValue({ ...base, enabled: true });

	// when
	await user.click(await screen.findByRole("switch", { name: "html_notice 활성화" }));

	// then
	await waitFor(() => expect(toggle).toHaveBeenCalledWith("html_notice", true));
	expect(mockConfirm.mock.calls[0][0].message).toContain("국가: 한국(KR)");
});

test("꺼져 있어도 롤아웃으로 나가는 플래그는 켜진 스위치로 보이고 누르면 끈다", async () => {
	// given
	const user = userEvent.setup();
	const leaking = { ...base, rolloutPercentage: 100 };
	renderPage([leaking]);
	const toggle = jest
		.spyOn(AdminService.featureFlags, "toggle")
		.mockResolvedValue({ ...leaking, rolloutPercentage: 0 });

	// when
	await user.click(await screen.findByRole("switch", { name: "html_notice 활성화" }));

	// then
	await waitFor(() => expect(toggle).toHaveBeenCalledWith("html_notice", false));
	expect(mockConfirm.mock.calls[0][0].message).toContain("지금 받는 사람: 로그인한 전원 (롤아웃 100%)");
});

test("상세 패널에서 설명과 역할을 저장한다", async () => {
	// given
	const user = userEvent.setup();
	renderPage([base]);
	const update = jest
		.spyOn(AdminService.featureFlags, "update")
		.mockResolvedValue({ ...base, description: "수정 설명", allowedRoles: ["admin"] });
	const textbox = await screen.findByRole("textbox", { name: "설명" });
	await user.clear(textbox);
	await user.type(textbox, "수정 설명");
	await user.click(screen.getByRole("checkbox", { name: "admin" }));

	// when
	await user.click(screen.getByRole("button", { name: "저장" }));

	// then
	await waitFor(() =>
		expect(update).toHaveBeenCalledWith("html_notice", {
			description: "수정 설명",
			allowedRoles: ["admin"],
		}),
	);
});

test("수정일이 없는 플래그가 있어도 화면이 그려지고 최근 변경 탭에서 기록 없음으로 보인다", async () => {
	// given
	const user = userEvent.setup();
	renderPage([base, { ...base, id: "2", name: "no_date", updatedAt: null, createdAt: null }]);
	await screen.findByRole("switch", { name: "html_notice 활성화" });

	// when
	await user.click(screen.getByRole("tab", { name: "최근 변경" }));

	// then
	expect((await screen.findAllByText("기록 없음")).length).toBeGreaterThan(0);
});

test("토글이 실패하면 스위치를 되돌리고 오류를 보여 준다", async () => {
	// given
	const user = userEvent.setup();
	renderPage([base]);
	jest.spyOn(AdminService.featureFlags, "toggle").mockRejectedValue(new Error("failed"));

	// when
	await user.click(await screen.findByRole("switch", { name: "html_notice 활성화" }));

	// then
	expect(await screen.findByText('"html_notice" 토글에 실패했습니다.')).toBeInTheDocument();
	expect(screen.getByRole("switch", { name: "html_notice 활성화" })).not.toBeChecked();
});
