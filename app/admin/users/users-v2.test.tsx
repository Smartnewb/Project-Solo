import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminService from "@/app/services/admin";
import { adminGet } from "@/shared/lib/http/admin-fetch";
import { ToastProvider } from "@/shared/ui/admin/toast/toast-context";
import { ConfirmDialogProvider } from "@/shared/ui/admin/confirm-dialog/confirm-dialog-context";
import { ConfirmDialog } from "@/shared/ui/admin/confirm-dialog/confirm-dialog";
import UsersV2 from "./users-v2";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/shared/lib/http/admin-fetch", () => ({
	...jest.requireActual("@/shared/lib/http/admin-fetch"),
	adminGet: jest.fn(),
}));
jest.mock("@/app/admin/ai-profiles/ghosts/ghost-user-exposure-sheet", () => ({
	GhostUserExposureSheet: () => null,
}));

beforeAll(() => {
	HTMLElement.prototype.scrollIntoView = jest.fn();
	global.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: jest.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			addListener: jest.fn(),
			removeListener: jest.fn(),
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			dispatchEvent: jest.fn(),
		})),
	});
});
afterEach(() => jest.clearAllMocks());

const base = {
	email: "a@test.com",
	gender: "MALE",
	createdAt: "2026-10-01T00:00:00Z",
	age: 24,
	instagramId: null,
};
const rows = [
	{ ...base, id: "u1", userId: "u1", name: "홍길동", rank: "A", isSuspended: false },
	{ ...base, id: "u2", userId: "u2", name: "김정지", rank: null, isSuspended: true },
];

function Subject() {
	return (
		<ToastProvider>
			<ConfirmDialogProvider>
				<UsersV2 />
				<ConfirmDialog />
			</ConfirmDialogProvider>
		</ToastProvider>
	);
}

test("block/unblock buttons are enabled from isSuspended and grade change confirms then patches rank", async () => {
	const user = userEvent.setup();
	(adminGet as jest.Mock).mockResolvedValue({
		data: rows,
		meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
	});
	const grade = jest
		.spyOn(AdminService.userAppearance, "setUserAppearanceGrade")
		.mockResolvedValue(undefined);
	render(<Subject />);

	await screen.findByText("홍길동");
	expect(screen.queryByText(/미구현/)).not.toBeInTheDocument();
	expect(screen.getByRole("button", { name: "차단" })).toBeEnabled();
	expect(screen.getByRole("button", { name: "차단해제" })).toBeEnabled();

	const selects = screen.getAllByRole("button", { name: /필터/ });
	// 목록 필터 3개 다음부터가 행별 등급 Select 이다.
	await user.click(selects[3]);
	await user.click(await screen.findByRole("option", { name: "S급" }));
	await user.click(await screen.findByRole("button", { name: "변경" }));
	await waitFor(() => expect(grade).toHaveBeenCalledWith("u1", "S"));
});
