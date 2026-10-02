import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import TodayMetrics from "./TodayMetrics";

test("renders overview numbers from the real summary shape", () => {
	render(
		<TodayMetrics
			overview={{ totalUsers: 1234, dailySignups: 7 }}
			conversionRate={12.34}
		/>,
	);
	expect(screen.getByText("1,234")).toBeInTheDocument();
	expect(screen.getByText("7")).toBeInTheDocument();
	expect(screen.getByText("12.3")).toBeInTheDocument();
});

test("missing values render a dash, never 0", () => {
	render(<TodayMetrics />);
	expect(screen.getAllByText("—")).toHaveLength(3);
	expect(screen.queryByText("0")).not.toBeInTheDocument();
});
