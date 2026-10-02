import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import HealthScoreBanner from "./HealthScoreBanner";

const m = (deltaPercent: number | null) => ({
	current: 1,
	previous: 2,
	deltaPercent,
});
const comparison = (matches: number | null) => ({
	previousPeriodFrom: "a",
	previousPeriodTo: "b",
	matchesCreated: m(matches),
	likesSent: m(-10),
	mutualAccepted: m(null),
	chatRoomsOpened: m(5),
});

test("HEALTHY 배너 옆에 전기 대비 급감 경고를 표시한다", () => {
	render(
		<HealthScoreBanner
			data={{ score: 100, grade: "HEALTHY", alerts: [] }}
			periodComparison={comparison(-60)}
		/>,
	);
	expect(screen.getByText("HEALTHY")).toBeInTheDocument();
	expect(screen.getByText(/매칭 생성 전기 대비 -60.0% 급감/)).toBeInTheDocument();
	expect(screen.queryByText(/좋아요 발송/)).not.toBeInTheDocument();
});

test("알 수 없는 grade는 CAUTION으로 대체하지 않는다", () => {
	render(
		<HealthScoreBanner
			data={{ score: 90, grade: "X" as never, alerts: [] }}
		/>,
	);
	expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
});
