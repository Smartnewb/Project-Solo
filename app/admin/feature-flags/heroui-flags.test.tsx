import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminService from "@/app/services/admin";
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

const flag = {
	id: "1",
	name: "html_notice",
	description: "HTML 공지",
	enabled: false,
	allowedRoles: [] as string[],
	country: "kr",
	createdAt: "2026-10-01",
	updatedAt: "2026-10-02",
};
afterEach(() => jest.restoreAllMocks());

test("flag switch invokes exact toggle; edit dialog retains roles and description contract", async () => {
	const user = userEvent.setup();
	jest.spyOn(AdminService.featureFlags, "getAll").mockResolvedValue([flag]);
	const toggle = jest
		.spyOn(AdminService.featureFlags, "toggle")
		.mockResolvedValue({ ...flag, enabled: true });
	const update = jest
		.spyOn(AdminService.featureFlags, "update")
		.mockResolvedValue({
			...flag,
			enabled: true,
			description: "수정 설명",
			allowedRoles: ["admin"],
		});
	render(<FeatureFlagsV2 />);
	await user.click(
		await screen.findByRole("switch", { name: "html_notice 활성화" }),
	);
	await waitFor(() => expect(toggle).toHaveBeenCalledWith("html_notice", true));
	expect(mockConfirm).toHaveBeenCalled();
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	await user.click(
		screen.getByRole("button", { name: "html_notice 설정 수정" }),
	);
	expect(
		await screen.findByRole("dialog", { name: /플래그 수정/ }),
	).toBeInTheDocument();
	await user.clear(screen.getByRole("textbox", { name: "설명" }));
	await user.type(screen.getByRole("textbox", { name: "설명" }), "수정 설명");
	await user.click(screen.getByRole("checkbox", { name: "admin" }));
	await user.click(screen.getByRole("button", { name: "저장" }));
	await waitFor(() =>
		expect(update).toHaveBeenCalledWith("html_notice", {
			enabled: true,
			description: "수정 설명",
			allowedRoles: ["admin"],
		}),
	);
	await waitFor(() =>
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
	);
});

test("failed optimistic toggle rolls back and exposes the error", async () => {
	const user = userEvent.setup();
	jest.spyOn(AdminService.featureFlags, "getAll").mockResolvedValue([flag]);
	jest
		.spyOn(AdminService.featureFlags, "toggle")
		.mockRejectedValue(new Error("failed"));
	render(<FeatureFlagsV2 />);
	await user.click(
		await screen.findByRole("switch", { name: "html_notice 활성화" }),
	);
	expect(
		await screen.findByText('"html_notice" 토글에 실패했습니다.'),
	).toBeInTheDocument();
	expect(
		screen.getByRole("switch", { name: "html_notice 활성화" }),
	).not.toBeChecked();
});
