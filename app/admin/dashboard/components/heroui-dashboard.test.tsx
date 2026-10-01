import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminService from "@/app/services/admin";
import UserEngagementStats from "./UserEngagementStats";

beforeAll(() => {
	HTMLElement.prototype.scrollIntoView = jest.fn();
	global.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
});
afterEach(() => jest.restoreAllMocks());

test("engagement period and deleted-user switch preserve request arguments", async () => {
	const user = userEvent.setup();
	const metric = { mean: 2, median: 1 };
	const engagement = { activeUsers: 5, totalUsers: 10, rate: 50 };
	const get = jest
		.spyOn(AdminService.userEngagement, "getStats")
		.mockResolvedValue({
			stats: {
				likesPerUser: metric,
				mutualLikesPerUser: metric,
				chatOpensPerUser: metric,
				likeEngagement: engagement,
				mutualLikeEngagement: engagement,
				chatOpenEngagement: engagement,
			},
			startDate: null,
			endDate: "2026-10-02",
			periodType: "all",
		});
	render(<UserEngagementStats />);
	await screen.findByRole("button", { name: "오늘" });
	expect(get).toHaveBeenLastCalledWith(undefined, undefined, false);
	await user.click(screen.getByRole("button", { name: "오늘" }));
	await waitFor(() =>
		expect(get).toHaveBeenLastCalledWith(
			expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
			expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
			false,
		),
	);
	const dates = get.mock.calls.at(-1)!;
	expect(dates[0]).toBe(dates[1]);
	await user.click(screen.getByRole("switch", { name: "탈퇴자 포함" }));
	await waitFor(() =>
		expect(get).toHaveBeenLastCalledWith(dates[0], dates[1], true),
	);
	expect(screen.getByRole("switch", { name: "탈퇴자 포함" })).toBeChecked();
	expect(screen.getByRole("button", { name: "오늘" })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
});
