import React from "react";
import "@testing-library/jest-dom";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminService from "@/app/services/admin";
import { ToastProvider } from "@/shared/ui/admin/toast/toast-context";
import ReviewList from "./ReviewList";
import ReviewDashboard from "./ReviewDashboard";
import PublicReviewManagement from "./PublicReviewManagement";

jest.mock("recharts", () => {
	const Empty = () => null;
	return {
		ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
			<div>{children}</div>
		),
		BarChart: Empty,
		Bar: Empty,
		XAxis: Empty,
		YAxis: Empty,
		CartesianGrid: Empty,
		Tooltip: Empty,
		PieChart: Empty,
		Pie: Empty,
		Cell: Empty,
		Legend: Empty,
	};
});

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

const review = {
	pk: "review-1",
	store: "APP_STORE" as const,
	reviewId: "r1",
	rating: 5,
	title: "사용 후기",
	body: "후기 본문",
	author: "유저",
	appVersion: "6.4.0",
	language: "ko",
	createdAt: "2026-10-01T00:00:00Z",
	collectedAt: "2026-10-02T00:00:00Z",
	isFeatured: false,
};

test("real store, rating and date controls retain API filters and cursor; publication remains explicit", async () => {
	const user = userEvent.setup();
	const list = jest
		.spyOn(AdminService.appReviews, "getList")
		.mockImplementation(async (params) => ({
			items: [params?.cursor ? { ...review, pk: "review-2" } : review],
			nextCursor: params?.cursor ? null : "next",
			totalScannedCount: 1,
		}));
	const featured = jest
		.spyOn(AdminService.appReviews, "toggleFeatured")
		.mockResolvedValue({ isFeatured: true });
	render(
		<ToastProvider>
			<ReviewList />
		</ToastProvider>,
	);
	await screen.findByText("사용 후기");
	await user.click(
		screen.getByRole("button", { name: "App Store", exact: true }),
	);
	await waitFor(() =>
		expect(list).toHaveBeenLastCalledWith({ limit: 20, store: "APP_STORE" }),
	);
	await user.click(screen.getByRole("button", { name: /별점/ }));
	await user.click(await screen.findByRole("option", { name: /5점/ }));
	await waitFor(() =>
		expect(list).toHaveBeenLastCalledWith({
			limit: 20,
			store: "APP_STORE",
			rating: 5,
		}),
	);
	fireEvent.change(screen.getByLabelText("시작일"), {
		target: { value: "2026-10-01" },
	});
	await waitFor(() =>
		expect(list).toHaveBeenLastCalledWith({
			limit: 20,
			store: "APP_STORE",
			rating: 5,
			startDate: "2026-10-01",
		}),
	);
	await user.click(await screen.findByRole("button", { name: /더 보기/ }));
	await waitFor(() =>
		expect(list).toHaveBeenLastCalledWith({
			limit: 20,
			store: "APP_STORE",
			rating: 5,
			startDate: "2026-10-01",
			cursor: "next",
		}),
	);
	expect(featured).not.toHaveBeenCalled();
	await user.click(screen.getAllByRole("button", { name: "비공개" })[0]);
	await waitFor(() => expect(featured).toHaveBeenCalledWith("review-1"));
	expect(
		await screen.findByRole("button", { name: "공개 중" }),
	).toBeInTheDocument();
});

test("dashboard store and rating actions are keyboard reachable and preserve chart filter payloads", async () => {
	const user = userEvent.setup();
	jest.spyOn(AdminService.appReviews, "getStats").mockResolvedValue({
		totalCount: 2,
		averageRating: 4.5,
		byStore: [
			{ store: "APP_STORE", count: 1, averageRating: 5 },
			{ store: "PLAY_STORE", count: 1, averageRating: 4 },
		],
		ratingDistribution: [
			{ rating: 5, count: 1 },
			{ rating: 4, count: 1 },
		],
		lastCollectedAt: "2026-10-02T00:00:00Z",
	});
	const filter = jest.fn();
	render(<ReviewDashboard onChartClick={filter} />);
	const store = await screen.findByRole("button", {
		name: "App Store 리뷰 보기",
	});
	act(() => store.focus());
	await user.keyboard("{Enter}");
	expect(filter).toHaveBeenLastCalledWith({ store: "APP_STORE" });
	await user.click(screen.getByRole("button", { name: "5점 · 1건" }));
	expect(filter).toHaveBeenLastCalledWith({ rating: 5 });
});

test("public review source buttons retain endpoint type without publishing", async () => {
	const user = userEvent.setup();
	const list = jest
		.spyOn(AdminService.publicReviews, "getList")
		.mockResolvedValue({ items: [] });
	render(<PublicReviewManagement />);
	await user.click(
		await screen.findByRole("button", { name: "스토어 + 인기글" }),
	);
	await waitFor(() =>
		expect(list).toHaveBeenLastCalledWith({ type: "app", limit: 100 }),
	);
	await user.click(await screen.findByRole("button", { name: "인앱 리뷰" }));
	await waitFor(() =>
		expect(list).toHaveBeenLastCalledWith({ type: "inapp", limit: 100 }),
	);
});
