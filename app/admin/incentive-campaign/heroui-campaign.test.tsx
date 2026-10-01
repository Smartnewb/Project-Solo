import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IncentiveCampaignClient from "./incentive-campaign-client";
import {
	useIncentiveCampaignCalendar,
	useIncentiveCampaignEngagementFlow,
	useIncentiveCampaignEngagementFlowDaily,
} from "@/app/admin/hooks";
jest.mock("@/app/admin/hooks", () => ({
	useIncentiveCampaignCalendar: jest.fn(),
	useIncentiveCampaignEngagementFlow: jest.fn(),
	useIncentiveCampaignEngagementFlowDaily: jest.fn(),
}));
jest.mock("recharts", () => ({
	Bar: () => null,
	BarChart: () => null,
	CartesianGrid: () => null,
	Legend: () => null,
	ResponsiveContainer: () => null,
	Tooltip: () => null,
	XAxis: () => null,
	YAxis: () => null,
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

test("campaign country and selected calendar day preserve query timezone and filters", async () => {
	const user = userEvent.setup();
	const result = {
		data: undefined,
		error: null,
		isLoading: false,
		isFetching: false,
	};
	jest
		.mocked(useIncentiveCampaignCalendar)
		.mockReturnValue({ ...result, data: { days: [] } } as unknown as ReturnType<
			typeof useIncentiveCampaignCalendar
		>);
	jest
		.mocked(useIncentiveCampaignEngagementFlow)
		.mockReturnValue(
			result as unknown as ReturnType<
				typeof useIncentiveCampaignEngagementFlow
			>,
		);
	jest
		.mocked(useIncentiveCampaignEngagementFlowDaily)
		.mockReturnValue(
			result as unknown as ReturnType<
				typeof useIncentiveCampaignEngagementFlowDaily
			>,
		);
	render(<IncentiveCampaignClient />);
	await user.click(screen.getByRole("button", { name: /국가/ }));
	await user.click(await screen.findByRole("option", { name: "JP" }));
	await waitFor(() =>
		expect(useIncentiveCampaignEngagementFlow).toHaveBeenLastCalledWith(
			expect.objectContaining({
				country: "jp",
				timezone: "Asia/Seoul",
				segment: "all",
			}),
		),
	);
	const day = screen.getAllByRole("button", {
		name: /^\d{4}-\d{2}-\d{2} 캠페인 조회$/,
	})[0];
	const date = day.getAttribute("aria-label")!.split(" ")[0];
	await user.click(day);
	expect(day).toHaveAttribute("aria-pressed", "true");
	expect(useIncentiveCampaignEngagementFlowDaily).toHaveBeenLastCalledWith(
		expect.objectContaining({ date, country: "jp", timezone: "Asia/Seoul" }),
	);
});
