import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminService from "@/app/services/admin";
import { ToastProvider } from "@/shared/ui/admin/toast/toast-context";
import { ConfirmDialogProvider } from "@/shared/ui/admin/confirm-dialog/confirm-dialog-context";
import { ConfirmDialog } from "@/shared/ui/admin/confirm-dialog/confirm-dialog";
import KeywordsV2 from "./keywords-v2";

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
afterEach(() => jest.restoreAllMocks());
const item = {
	keyword: "낚시",
	normalizedKeyword: "낚시",
	category: "HOBBY" as const,
	userCount: 12,
	iconUrl: null,
	firstCreatedAt: "2026-10-01",
};
function Subject() {
	return (
		<ToastProvider>
			<ConfirmDialogProvider>
				<KeywordsV2 />
				<ConfirmDialog />
			</ConfirmDialogProvider>
		</ToastProvider>
	);
}

test("keyword inline editing uses real fields/select and keeps name/category payloads", async () => {
	const user = userEvent.setup();
	jest.spyOn(AdminService.keywords, "getAll").mockResolvedValue({
		items: [item],
		total: 101,
		page: 1,
		pageSize: 50,
		hasMore: true,
	});
	const name = jest
		.spyOn(AdminService.keywords, "updateName")
		.mockResolvedValue({ updatedCount: 12 });
	const category = jest
		.spyOn(AdminService.keywords, "updateCategory")
		.mockResolvedValue({ updatedCount: 12 });
	render(<Subject />);
	await user.click(await screen.findByRole("button", { name: "낚시" }));
	const field = screen.getByRole("textbox", { name: "입력" });
	await user.clear(field);
	await user.type(field, "바다 낚시{Enter}");
	await waitFor(() => expect(name).toHaveBeenCalledWith("낚시", "바다 낚시"));
	await user.click(await screen.findByRole("button", { name: "취미" }));
	await user.click(screen.getByRole("button", { name: /키워드 카테고리/ }));
	await user.click(await screen.findByRole("option", { name: "운동" }));
	await user.click(screen.getByRole("button", { name: "저장" }));
	await waitFor(() => expect(category).toHaveBeenCalledWith("낚시", "SPORT"));
});

test("keyword search and pagination retain params; deletion requires confirm", async () => {
	const user = userEvent.setup();
	const list = jest
		.spyOn(AdminService.keywords, "getAll")
		.mockImplementation(async (params) => ({
			items: [item],
			total: 101,
			page: params.page || 1,
			pageSize: 50,
			hasMore: true,
		}));
	const remove = jest
		.spyOn(AdminService.keywords, "delete")
		.mockResolvedValue({ deletedCount: 12 });
	render(<Subject />);
	await user.click(await screen.findByRole("button", { name: "다음" }));
	await waitFor(() =>
		expect(list).toHaveBeenLastCalledWith({ page: 2, pageSize: 50 }),
	);
	await user.type(
		screen.getByRole("textbox", { name: "키워드 검색..." }),
		"낚시",
	);
	await waitFor(() =>
		expect(list).toHaveBeenLastCalledWith({
			page: 1,
			pageSize: 50,
			search: "낚시",
		}),
	);
	await user.click(await screen.findByRole("button", { name: "키워드 삭제" }));
	expect(remove).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "취소" }));
	expect(remove).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "키워드 삭제" }));
	await user.click(screen.getByRole("button", { name: "삭제", exact: true }));
	await waitFor(() => expect(remove).toHaveBeenCalledWith("낚시"));
});
