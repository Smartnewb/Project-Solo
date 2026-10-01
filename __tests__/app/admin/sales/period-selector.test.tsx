import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PeriodSelector } from "@/app/admin/sales/components/PeriodSelector";

jest.mock("@/app/services/sales", () => ({ salesService: {} }));

it("시작일과 범위 종료일을 로컬 날짜로 전달하고 전체 기간으로 초기화한다", async () => {
  const onDateRangeChange = jest.fn();
  const now = new Date();
  const day = (value: number) =>
    screen.getByRole("button", {
      name: new RegExp(
        `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${value}일`,
      ),
    });
  render(<PeriodSelector onDateRangeChange={onDateRangeChange} />);
  fireEvent.click(screen.getByRole("button", { name: "시작일 지정" }));
  fireEvent.click(
    await screen.findByRole("button", {
      name: new RegExp(`${now.getFullYear()}년 ${now.getMonth() + 1}월 5일`),
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "확인" }));
  fireEvent.click(screen.getByRole("button", { name: "종료일 지정" }));
  fireEvent.click(day(5));
  fireEvent.click(day(8));
  await waitFor(() =>
    expect(onDateRangeChange).toHaveBeenCalledWith({
      startDate: new Date(now.getFullYear(), now.getMonth(), 5),
      endDate: new Date(now.getFullYear(), now.getMonth(), 8),
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "확인" }));
  fireEvent.click(screen.getByRole("button", { name: "전체 기간" }));
  expect(onDateRangeChange).toHaveBeenLastCalledWith({
    startDate: undefined,
    endDate: undefined,
  });
});
