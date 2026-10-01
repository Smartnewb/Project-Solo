/* eslint-disable react/display-name -- isolated child fixtures; actual HeroUI controls remain real */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MatchingMonitorV2 from "./matching-monitor-v2";
import { useMatchingDashboard } from "./hooks";
const invalidate = jest.fn();
jest.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({ invalidateQueries: invalidate }),
}));
jest.mock("./hooks", () => ({
	useMatchingDashboard: jest.fn(),
	monitorKeys: {
		dashboard: (period: string, country: string) => [
			"admin",
			"matching-monitor",
			"dashboard",
			{ period, country },
		],
	},
}));
jest.mock("./components/HealthScoreBanner", () => () => <div>건강 상태</div>);
jest.mock("./components/KpiCards", () => () => <div>매칭 KPI</div>);
jest.mock("./components/PoolOverview", () => () => null);
jest.mock("./components/BatchPerformance", () => () => null);
jest.mock("./components/FunnelChart", () => () => <div>매칭 퍼널</div>);
jest.mock("./components/PipelineAnalysis", () => () => null);
jest.mock("./components/RegionStats", () => () => null);
jest.mock("./components/GlobalMatching", () => () => null);
jest.mock("./components/ChatEngagement", () => () => null);
jest.mock("./components/PeriodComparison", () => () => null);
jest.mock("./components/MatchDetails", () => () => null);
jest.mock(
	"./components/AtRiskUsers",
	() =>
		({ onUserClick }: { onUserClick: (id: string) => void }) => (
			<button onClick={() => onUserClick("user-123")}>진단 선택</button>
		),
);
jest.mock(
	"./components/UserDiagnosis",
	() =>
		({ initialUserId }: { initialUserId: string }) => (
			<div>진단 {initialUserId}</div>
		),
);

test("monitor controls retain period/country refresh key and tabs own linked panels", async () => {
	const user = userEvent.setup();
	jest.mocked(useMatchingDashboard).mockReturnValue({
		data: {},
		isLoading: false,
		error: null,
		dataUpdatedAt: 0,
	} as unknown as ReturnType<typeof useMatchingDashboard>);
	render(<MatchingMonitorV2 />);
	await user.click(
		screen.getByRole("button", { name: "최근 7일 데이터 보기" }),
	);
	await user.click(screen.getByRole("button", { name: "일본 데이터 보기" }));
	expect(useMatchingDashboard).toHaveBeenLastCalledWith("7d", "JP");
	await user.click(
		screen.getByRole("button", { name: "매칭 모니터 데이터 새로고침" }),
	);
	expect(invalidate).toHaveBeenCalledWith({
		queryKey: [
			"admin",
			"matching-monitor",
			"dashboard",
			{ period: "7d", country: "JP" },
		],
	});
	await user.click(screen.getByRole("tab", { name: "퍼널 & 채팅" }));
	expect(screen.getByRole("tabpanel")).toHaveTextContent("매칭 퍼널");
	await user.click(screen.getByRole("tab", { name: "위험 유저 관리" }));
	await user.click(screen.getByRole("button", { name: "진단 선택" }));
	await waitFor(() =>
		expect(screen.getByRole("tabpanel")).toHaveTextContent("진단 user-123"),
	);
});
