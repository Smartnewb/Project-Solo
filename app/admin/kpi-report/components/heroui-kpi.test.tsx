import React from "react";
import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WeekSelector from "./WeekSelector";
import KpiCategoryTable from "./KpiCategoryTable";
import { getCurrentWeekInfo } from "../types";

beforeAll(() => {
	HTMLElement.prototype.scrollIntoView = jest.fn();
	global.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
});

test("week navigation preserves year rollover and prevents future generation changes", async () => {
	const user = userEvent.setup();
	const change = jest.fn();
	const generate = jest.fn();
	const { rerender } = render(
		<WeekSelector
			year={2025}
			week={1}
			weekLabel="2025년 1주"
			onWeekChange={change}
			onGenerate={generate}
			generating={false}
		/>,
	);
	await user.click(screen.getByRole("button", { name: "이전 주" }));
	expect(change).toHaveBeenCalledWith(2024, 52);
	await user.click(screen.getByRole("button", { name: "리포트 생성" }));
	expect(generate).toHaveBeenCalledTimes(1);
	const current = getCurrentWeekInfo();
	rerender(
		<WeekSelector
			{...current}
			weekLabel="현재 주"
			onWeekChange={change}
			onGenerate={generate}
			generating
		/>,
	);
	expect(screen.getByRole("button", { name: "다음 주" })).toBeDisabled();
	expect(screen.getByRole("button", { name: /생성 중/ })).toBeDisabled();
});

test("KPI disclosure opens from the keyboard with semantic headers and unchanged values", async () => {
	const user = userEvent.setup();
	render(
		<KpiCategoryTable
			category="acquisition"
			categoryLabel="가입 지표"
			loading={false}
			kpis={[
				{
					name: "signups",
					label: "가입자",
					category: "acquisition",
					currentValue: 1234,
					previousValue: 1000,
					changeRate: 23.4,
					unit: "count",
					status: "good",
				},
			]}
		/>,
	);
	const trigger = screen.getByRole("button", { name: /가입 지표/ });
	expect(trigger).toHaveAttribute("aria-expanded", "false");
	act(() => trigger.focus());
	await user.keyboard("{Enter}");
	expect(trigger).toHaveAttribute("aria-expanded", "true");
	expect(screen.getByRole("columnheader", { name: "금주" })).toHaveAttribute(
		"scope",
		"col",
	);
	expect(screen.getByText("1,234")).toBeInTheDocument();
	expect(screen.getByText("1,000")).toBeInTheDocument();
});
