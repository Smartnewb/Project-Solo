import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminService from "@/app/services/admin";
import FemaleRetentionV2 from "./female-retention-v2";
import { ToastProvider } from "@/shared/ui/admin/toast/toast-context";
afterEach(() => jest.restoreAllMocks());

test("temporary credentials require explicit confirmation; paging preserves offset", async () => {
	const user = userEvent.setup();
	const list = jest
		.spyOn(AdminService.femaleRetention, "getInactiveUsers")
		.mockImplementation(async (limit, offset) => ({
			data: [
				{
					id: "female-1",
					name: "테스트 유저",
					phoneNumber: "01012345678",
					email: null,
					updatedAt: "2026-10-01",
					inactiveDuration: "P5D",
				},
			],
			total: 41,
			limit,
			offset,
		}));
	const issue = jest
		.spyOn(AdminService.femaleRetention, "issueTemporaryPassword")
		.mockResolvedValue({
			success: true,
			email: "sample@example.test",
			password: "sample-only",
		});
	render(
		<ToastProvider>
			<FemaleRetentionV2 />
		</ToastProvider>,
	);
	await user.click(
		await screen.findByRole("button", { name: /패스워드 발급/ }),
	);
	expect(issue).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "취소" }));
	expect(issue).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: /패스워드 발급/ }));
	await user.click(screen.getByRole("button", { name: "발급", exact: true }));
	await waitFor(() => expect(issue).toHaveBeenCalledWith("female-1"));
	expect(await screen.findByText("sample@example.test")).toBeInTheDocument();
	await user.click(screen.getByRole("button", { name: "다음" }));
	await waitFor(() => expect(list).toHaveBeenLastCalledWith(20, 20));
});
