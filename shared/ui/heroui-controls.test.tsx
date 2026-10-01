import React, { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Button } from "./button";
import { Label } from "./label";
import { Switch } from "./switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./select";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import { Calendar } from "./calendar";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import {
	ConfirmDialogProvider,
	useConfirm,
} from "./admin/confirm-dialog/confirm-dialog-context";
import { ConfirmDialog } from "./admin/confirm-dialog/confirm-dialog";
import { ToastProvider, useToast } from "./admin/toast/toast-context";
import { ToastContainer } from "./admin/toast/toast-container";

beforeAll(() => {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: jest.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			addListener: jest.fn(),
			removeListener: jest.fn(),
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			dispatchEvent: jest.fn(),
		})),
	});
	global.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
	HTMLElement.prototype.scrollIntoView = jest.fn();
});

test("HeroUI button and switch preserve disabled and checked business props", async () => {
	const user = userEvent.setup();
	const toggle = jest.fn();
	const press = jest.fn();
	render(
		<>
			<Button disabled onClick={press}>
				저장
			</Button>
			<Switch aria-label="게시" checked={false} onCheckedChange={toggle} />
		</>,
	);
	await user.click(screen.getByRole("button", { name: "저장" }));
	expect(press).not.toHaveBeenCalled();
	await user.click(screen.getByRole("switch", { name: "게시" }));
	expect(toggle).toHaveBeenCalledWith(true);
});

test("select composes a real accessible listbox and changes the caller value", async () => {
	const user = userEvent.setup();
	const change = jest.fn();
	render(
		<Select value="kr" onValueChange={change} aria-label="국가">
			<SelectTrigger>
				<SelectValue placeholder="선택" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="kr">한국</SelectItem>
				<SelectItem value="jp">일본</SelectItem>
			</SelectContent>
		</Select>,
	);
	await user.click(screen.getByRole("button", { name: /국가/ }));
	await user.click(await screen.findByRole("option", { name: "일본" }));
	expect(change).toHaveBeenCalledWith("jp");
});

test("programmatic dialog handles Escape using the controlled open contract", async () => {
	const user = userEvent.setup();
	const change = jest.fn();
	render(
		<Dialog open onOpenChange={change}>
			<DialogContent>
				<DialogTitle>검토</DialogTitle>
				<Button>확인</Button>
			</DialogContent>
		</Dialog>,
	);
	expect(screen.getByRole("dialog", { name: "검토" })).toBeInTheDocument();
	await user.keyboard("{Escape}");
	expect(change).toHaveBeenCalledWith(false);
});

test("tabs expose selected panel and selection changes through value", async () => {
	const user = userEvent.setup();
	function Subject() {
		const [value, setValue] = useState("kr");
		return (
			<Tabs value={value} onValueChange={setValue}>
				<TabsList aria-label="국가">
					<TabsTrigger value="kr">KR</TabsTrigger>
					<TabsTrigger value="jp">JP</TabsTrigger>
				</TabsList>
				<TabsContent value="kr">한국 내용</TabsContent>
				<TabsContent value="jp">일본 내용</TabsContent>
			</Tabs>
		);
	}
	render(<Subject />);
	await user.click(screen.getByRole("tab", { name: "JP" }));
	expect(screen.getByRole("tabpanel")).toHaveTextContent("일본 내용");
});

test("calendar preserves local calendar dates across a DST boundary and disables date ranges", async () => {
	const user = userEvent.setup();
	const change = jest.fn();
	render(
		<Calendar
			selected={new Date(2026, 2, 8)}
			locale={{ code: "en-US" }}
			onSelect={change}
			disabled={{ before: new Date(2026, 2, 7), after: new Date(2026, 2, 9) }}
		/>,
	);
	const ninth = screen.getByRole("button", { name: /Monday, March 9, 2026/ });
	await user.click(ninth);
	const date = change.mock.calls[0][0] as Date;
	expect([
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
		date.getHours(),
	]).toEqual([2026, 2, 9, 0]);
	expect(
		screen.getByRole("button", { name: /Tuesday, March 10, 2026/ }),
	).toHaveAttribute("aria-disabled", "true");
});

test("confirmation resolves cancellation and toast keeps scoped accessible delivery", async () => {
	const user = userEvent.setup();
	const resolved = jest.fn();
	function Subject() {
		const confirm = useConfirm();
		const toast = useToast();
		return (
			<>
				<Button
					onClick={() => {
						void confirm({ message: "삭제하시겠습니까?" }).then(resolved);
					}}
				>
					삭제
				</Button>
				<Button onClick={() => toast.success("저장 완료")}>알림</Button>
			</>
		);
	}
	render(
		<ToastProvider>
			<ConfirmDialogProvider>
				<Subject />
				<ConfirmDialog />
				<ToastContainer />
			</ConfirmDialogProvider>
		</ToastProvider>,
	);
	await user.click(screen.getByRole("button", { name: "삭제" }));
	await user.click(screen.getByRole("button", { name: "취소" }));
	await waitFor(() => expect(resolved).toHaveBeenCalledWith(false));
	await user.click(screen.getByRole("button", { name: "알림" }));
	expect(await screen.findByText("저장 완료")).toBeInTheDocument();
});

test("native popover trigger opens by keyboard without nesting buttons", async () => {
	const user = userEvent.setup();
	render(
		<Popover>
			<PopoverTrigger asChild>
				<button>날짜 열기</button>
			</PopoverTrigger>
			<PopoverContent aria-label="달력">
				<p>날짜 목록</p>
			</PopoverContent>
		</Popover>,
	);
	expect(screen.getAllByRole("button", { name: "날짜 열기" })).toHaveLength(1);
	await user.tab();
	await user.keyboard("{Enter}");
	expect(await screen.findByText("날짜 목록")).toBeInTheDocument();
});

test("uncontrolled dialog keeps a single accessible trigger and restores focus", async () => {
	const user = userEvent.setup();
	render(
		<Dialog>
			<DialogTrigger asChild>
				<Button>상세 보기</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogTitle>상세</DialogTitle>
			</DialogContent>
		</Dialog>,
	);
	const trigger = screen.getByRole("button", { name: "상세 보기" });
	await user.click(trigger);
	expect(screen.getByRole("dialog", { name: "상세" })).toBeInTheDocument();
	await user.keyboard("{Escape}");
	await waitFor(() => expect(trigger).toHaveFocus());
});

test("external switch labels retain a labelable control id", async () => {
	const user = userEvent.setup();
	const change = jest.fn();
	render(
		<>
			<Label htmlFor="public-notice">공개 여부</Label>
			<Switch id="public-notice" checked={false} onCheckedChange={change} />
		</>,
	);
	await user.click(screen.getByText("공개 여부"));
	expect(change).toHaveBeenCalledWith(true);
	expect(screen.getByRole("switch", { name: "공개 여부" })).toHaveAttribute(
		"id",
		"public-notice",
	);
});

test("switch keeps a row click propagation guard", async () => {
	const user = userEvent.setup();
	const rowClick = jest.fn();
	const change = jest.fn();
	render(
		<div onClick={rowClick}>
			<Switch
				aria-label="활성화"
				checked={false}
				onCheckedChange={change}
				onClick={(event) => event.stopPropagation()}
			/>
		</div>,
	);
	await user.click(screen.getByRole("switch", { name: "활성화" }));
	expect(change).toHaveBeenCalledWith(true);
	expect(rowClick).not.toHaveBeenCalled();
});
