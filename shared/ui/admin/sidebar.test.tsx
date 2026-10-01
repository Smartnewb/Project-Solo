import React from "react";
import "@testing-library/jest-dom";
import { render, screen, within, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminSidebar, NAV_CATEGORIES } from "./sidebar";
let mockPathname = "/admin/meeting";
jest.mock("next/navigation", () => ({ usePathname: () => mockPathname }));
beforeEach(() => {
	window.localStorage.clear();
	mockPathname = "/admin/meeting";
});
test("menu search covers existing routes and favorites remain independent of navigation", async () => {
	const user = userEvent.setup();
	const navigate = jest.fn();
	render(<AdminSidebar onNavigate={navigate} />);
	const search = screen.getByRole("textbox", { name: "메뉴 검색" });
	await user.type(search, "일본 신분증");
	expect(
		screen.getByRole("link", { name: "일본 신분증 심사" }),
	).toHaveAttribute("href", "/admin/jp-identity");
	await user.click(
		screen.getByRole("button", { name: "일본 신분증 심사 즐겨찾기 추가" }),
	);
	expect(navigate).not.toHaveBeenCalled();
	expect(
		JSON.parse(window.localStorage.getItem("admin-sidebar.favorite-hrefs.v1")!),
	).toEqual(["/admin/jp-identity"]);
	await user.click(screen.getByRole("button", { name: "메뉴 검색 지우기" }));
	const favorites = screen.getByRole("region", { name: "즐겨찾기" });
	expect(
		within(favorites).getByRole("link", { name: "일본 신분증 심사" }),
	).toBeInTheDocument();
	await user.click(
		within(favorites).getByRole("button", {
			name: "일본 신분증 심사 즐겨찾기 해제",
		}),
	);
	expect(
		screen.queryByRole("region", { name: "즐겨찾기" }),
	).not.toBeInTheDocument();
	expect(
		NAV_CATEGORIES.flatMap((c) =>
			c.items.flatMap((i) => ("children" in i ? i.children : [i])),
		).map((i) => i.href),
	).toEqual(
		expect.arrayContaining([
			"/admin/jp-identity",
			"/admin/meeting",
			"/admin/access-logs",
			"/admin/policy-documents",
		]),
	);
});
test("active groups open without overwriting stored collapse preferences, then keyboard expands other groups", async () => {
	window.localStorage.setItem("admin-sidebar.category.회원 관리.open", "0");
	window.localStorage.setItem("admin-sidebar.support-chat.open", "0");
	mockPathname = "/admin/support-chat";
	const user = userEvent.setup();
	const subject = render(<AdminSidebar />);
	expect(
		screen.getByRole("link", { name: "상담", exact: true }),
	).toHaveAttribute("aria-current", "page");
	mockPathname = "/admin/meeting";
	subject.rerender(<AdminSidebar />);
	await waitFor(() =>
		expect(
			screen.queryByRole("link", { name: "상담", exact: true }),
		).not.toBeInTheDocument(),
	);
	expect(window.localStorage.getItem("admin-sidebar.support-chat.open")).toBe(
		"0",
	);
	act(() =>
		screen.getByRole("button", { name: "회원 관리", exact: true }).focus(),
	);
	await user.keyboard("{Enter}");
	await user.click(
		screen.getByRole("button", { name: "고객 지원", exact: true }),
	);
	expect(
		screen.getByRole("link", { name: "상담", exact: true }),
	).toBeInTheDocument();
	expect(
		window.localStorage.getItem("admin-sidebar.category.회원 관리.open"),
	).toBe("1");
	expect(window.localStorage.getItem("admin-sidebar.support-chat.open")).toBe(
		"1",
	);
});
test("empty search announces a result and unselected favorites retain keyboard and touch affordances", async () => {
	const user = userEvent.setup();
	render(<AdminSidebar />);
	const star = screen.getByRole("button", { name: "2:2 미팅 즐겨찾기 추가" });
	expect(star).toHaveClass(
		"opacity-0",
		"group-focus-within:opacity-100",
		"[@media(hover:none)]:opacity-100",
	);
	await user.type(
		screen.getByRole("textbox", { name: "메뉴 검색" }),
		"존재하지않는메뉴",
	);
	expect(screen.getByRole("status")).toHaveTextContent(
		"일치하는 메뉴가 없습니다.",
	);
});
