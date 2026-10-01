import React from "react";
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DemographicsAnalytics from "./DemographicsAnalytics";
import PageAnalytics from "./PageAnalytics";
jest.mock("react-chartjs-2", () => ({
	Pie: () => null,
	Bar: () => null,
	Line: () => null,
}));
jest.mock("@/app/utils/chartConfig", () => ({}));
test("demographic tabs expose the selected table and preserve supplied totals", async () => {
	const user = userEvent.setup();
	render(
		<DemographicsAnalytics
			startDate={null}
			endDate={null}
			demographics={{
				countries: [{ country: "대한민국", users: 12 }],
				languages: [{ language: "한국어", users: 10 }],
				cities: [{ city: "서울", users: 8 }],
				period: { startDate: "2026-10-01", endDate: "2026-10-02" },
			}}
		/>,
	);
	expect(
		within(screen.getByRole("tabpanel", { name: "국가" })).getByText(
			"대한민국",
		),
	).toBeInTheDocument();
	await user.click(screen.getByRole("tab", { name: "언어" }));
	const panel = screen.getByRole("tabpanel", { name: "언어" });
	expect(within(panel).getByText("한국어")).toBeInTheDocument();
	expect(within(panel).getByText("10")).toBeInTheDocument();
	await user.click(screen.getByRole("tab", { name: "도시" }));
	expect(
		within(screen.getByRole("tabpanel", { name: "도시" })).getByText("서울"),
	).toBeInTheDocument();
});
test("page count selector changes value while the supplied page metrics stay intact", async () => {
	const user = userEvent.setup();
	render(
		<PageAnalytics
			startDate={null}
			endDate={null}
			topPages={[{ path: "/home", pageViews: 20 }]}
			overview={{
				activeUsers: 5,
				sessions: 10,
				pageViews: 20,
				bounceRate: 0,
				averageSessionDuration: 30,
			}}
			topPagesDetailed={null}
		/>,
	);
	const select = screen.getByRole("button", { name: /표시 개수/ });
	await user.click(select);
	await user.click(screen.getByRole("option", { name: "5개" }));
	expect(select).toHaveTextContent("5개");
	expect(screen.getByText("/home")).toBeInTheDocument();
	expect(screen.getAllByText("20").length).toBeGreaterThan(0);
});
