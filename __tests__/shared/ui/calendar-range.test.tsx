import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { Calendar } from "@/shared/ui/calendar";

const date = (day: number) => new Date(2026, 9, day);
const cell = (day: number) =>
  screen.getByRole("button", { name: new RegExp(`October ${day}, 2026`) });

it("실제 범위 달력이 시작·종료 날짜를 로컬 Date로 전달한다", () => {
  const onSelect = jest.fn();
  render(
    <Calendar
      mode="range"
      selected={{ from: date(1), to: date(3) }}
      onSelect={onSelect}
      locale={{ code: "en-US" }}
    />,
  );
  fireEvent.click(cell(5));
  fireEvent.click(cell(8));
  expect(onSelect).toHaveBeenLastCalledWith({ from: date(5), to: date(8) });
});

it("범위 달력의 비활성 날짜는 선택할 수 없다", () => {
  const onSelect = jest.fn();
  render(
    <Calendar
      mode="range"
      selected={{ from: date(1) }}
      onSelect={onSelect}
      disabled={{ before: date(6) }}
      locale={{ code: "en-US" }}
    />,
  );
  expect(cell(5)).toHaveAttribute("aria-disabled", "true");
  fireEvent.click(cell(5));
  expect(onSelect).not.toHaveBeenCalled();
  fireEvent.click(cell(8));
  fireEvent.click(cell(10));
  expect(onSelect).toHaveBeenLastCalledWith({ from: date(8), to: date(10) });
});

it("기존 단일 날짜 선택 계약을 유지한다", () => {
  const onSelect = jest.fn();
  render(
    <Calendar
      mode="single"
      selected={date(1)}
      onSelect={onSelect}
      locale={{ code: "en-US" }}
    />,
  );
  fireEvent.click(cell(5));
  expect(onSelect).toHaveBeenCalledWith(date(5));
});
