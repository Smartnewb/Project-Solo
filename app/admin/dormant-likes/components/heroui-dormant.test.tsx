import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminService from "@/app/services/admin";
import {
	ConfirmDialog,
	ConfirmDialogProvider,
} from "@/shared/ui/admin/confirm-dialog";
import { ToastProvider } from "@/shared/ui/admin/toast/toast-context";
import BulkProcessModal from "./BulkProcessModal";
import PendingLikesModal from "./PendingLikesModal";
import type { DormantUserResponse } from "@/types/admin";
jest.mock("@/components/admin/appearance/UserDetailModal", () => () => null);
const dormant = {
	id: "d1",
	name: "테스트 여성",
	pendingLikeCount: 6,
	gemBalance: 10,
	canProcess: true,
} as DormantUserResponse;
const likes = Array.from({ length: 6 }, (_, i) => ({
	matchLikeId: `l${i}`,
	senderUserId: `u${i}`,
	senderName: `남성 ${i}`,
	senderAge: 23,
	senderUniversity: "테스트 대학",
	daysSinceLiked: 2,
}));
const wrap = (node: React.ReactNode) =>
	render(
		<ToastProvider>
			<ConfirmDialogProvider>
				{node}
				<ConfirmDialog />
			</ConfirmDialogProvider>
		</ToastProvider>,
	);
afterEach(() => jest.restoreAllMocks());
test("bulk processing waits for confirmation; slider keyboard value reaches the API", async () => {
	const user = userEvent.setup();
	const pending = jest
		.spyOn(AdminService.dormantLikes, "getPendingLikes")
		.mockResolvedValue(likes as never);
	const process = jest
		.spyOn(AdminService.dormantLikes, "processLikes")
		.mockResolvedValue({
			viewedCount: 4,
			rejectedCount: 2,
			processedCount: 6,
		} as never);
	wrap(
		<BulkProcessModal
			open
			onClose={jest.fn()}
			onComplete={jest.fn()}
			selectedUsers={[dormant]}
		/>,
	);
	const slider = screen.getByRole("slider", { name: "거절 비율" });
	act(() => slider.focus());
	await user.keyboard("{ArrowRight}");
	await user.click(screen.getByRole("button", { name: "처리하기" }));
	expect(pending).not.toHaveBeenCalled();
	await user.click(
		within(screen.getByRole("dialog", { name: "확인" })).getByRole("button", {
			name: "취소",
		}),
	);
	expect(process).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "처리하기" }));
	await user.click(screen.getByRole("button", { name: "처리", exact: true }));
	await waitFor(() =>
		expect(process).toHaveBeenCalledWith({
			dormantUserId: "d1",
			matchLikeIds: likes.map((x) => x.matchLikeId),
			rejectionRate: 0.3,
		}),
	);
	expect(
		await screen.findByText("모든 처리가 완료되었습니다!"),
	).toBeInTheDocument();
});
test("pending select-all keeps five-item cap; cooldown prevents processing", async () => {
	const user = userEvent.setup();
	jest
		.spyOn(AdminService.dormantLikes, "getPendingLikes")
		.mockResolvedValue(likes as never);
	jest
		.spyOn(AdminService.dormantLikes, "getCooldownStatus")
		.mockResolvedValue({ isOnCooldown: true, remainingMinutes: 10 } as never);
	const process = jest
		.spyOn(AdminService.dormantLikes, "processLikes")
		.mockResolvedValue({} as never);
	wrap(<PendingLikesModal open onClose={jest.fn()} user={dormant} />);
	await screen.findByText("남성 5");
	await user.click(screen.getAllByRole("checkbox")[0]);
	expect(
		screen
			.getAllByRole("checkbox")
			.filter((x) => (x as HTMLInputElement).checked),
	).toHaveLength(6);
	expect(screen.getByRole("button", { name: "처리하기" })).toBeDisabled();
	expect(process).not.toHaveBeenCalled();
});
test("individual processing sends only the five selected likes after confirmation", async () => {
	const user = userEvent.setup();
	jest
		.spyOn(AdminService.dormantLikes, "getPendingLikes")
		.mockResolvedValue(likes as never);
	jest
		.spyOn(AdminService.dormantLikes, "getCooldownStatus")
		.mockResolvedValue({ isOnCooldown: false, remainingMinutes: 0 } as never);
	const process = jest
		.spyOn(AdminService.dormantLikes, "processLikes")
		.mockResolvedValue({ viewedCount: 4, rejectedCount: 1 } as never);
	const onClose = jest.fn();
	wrap(<PendingLikesModal open onClose={onClose} user={dormant} />);
	await screen.findByText("남성 5");
	const boxes = screen.getAllByRole("checkbox");
	await user.click(boxes[0]);
	await user.click(boxes[6]);
	expect(boxes[6]).not.toBeChecked();
	await user.click(screen.getByRole("button", { name: "처리하기" }));
	expect(process).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "처리", exact: true }));
	await waitFor(() =>
		expect(process).toHaveBeenCalledWith({
			dormantUserId: "d1",
			matchLikeIds: ["l0", "l1", "l2", "l3", "l4"],
			rejectionRate: 0.2,
		}),
	);
	expect(onClose).toHaveBeenCalledTimes(1);
});
