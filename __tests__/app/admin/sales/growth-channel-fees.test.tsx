import React from "react";
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import { ChannelFees } from "@/app/admin/sales/growth/components/ChannelFees";
import { useMethodBreakdown } from "@/app/admin/sales/growth/hooks";
import { addMonths, kstToday, monthStart } from "@/app/admin/sales/growth/lib/metrics";

jest.mock("@/app/admin/sales/growth/hooks", () => ({ useMethodBreakdown: jest.fn() }));
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
  Pie: ({ children }: { children: React.ReactNode }) => <g>{children}</g>,
  Cell: () => null,
  Tooltip: () => null,
}));

const mockBreakdown = useMethodBreakdown as jest.Mock;

const THIS_MONTH = monthStart(kstToday());
const LAST_MONTH = addMonths(THIS_MONTH, -1);

const CURRENT = {
  byMethod: [
    { method: "APPLE_IAP", amount: 1_000_000, count: 10 },
    { method: "GOOGLE_PLAY", amount: 500_000, count: 5 },
    { method: "CARD", amount: 300_000, count: 3 },
    { method: "UNKNOWN", amount: 100_000, count: 1 },
  ],
  byProduct: [
    { productName: "구슬 30개", amount: 1_100_000, count: 11 },
    { productName: "구슬 10개", amount: 550_000, count: 5 },
    { productName: "구슬 5개", amount: 250_000, count: 3 },
  ],
};

const PREVIOUS = {
  byMethod: [{ method: "CARD", amount: 1_000_000, count: 10 }],
  byProduct: [],
};

const EXPECTED_FEE = Math.round(1_000_000 * 0.1364 + 500_000 * 0.15 + (300_000 + 100_000) * 0.0187);

beforeEach(() => {
  mockBreakdown.mockReset();
  mockBreakdown.mockImplementation((month: string) => ({
    data: month === THIS_MONTH ? CURRENT : month === LAST_MONTH ? PREVIOUS : { byMethod: [], byProduct: [] },
    isLoading: false,
    isError: false,
    error: null,
  }));
});

it("고정 결제수단 내역으로 채널별 예상 수수료 합계를 계산한다", () => {
  render(<ChannelFees />);
  expect(mockBreakdown).toHaveBeenCalledWith(THIS_MONTH);
  expect(mockBreakdown).toHaveBeenCalledWith(LAST_MONTH);

  const table = screen.getByRole("table");
  const total = within(table).getAllByRole("row").at(-1)!;
  expect(EXPECTED_FEE).toBe(218_880);
  expect(total).toHaveTextContent("합계");
  expect(total).toHaveTextContent("19건");
  expect(total).toHaveTextContent("1,900,000원");
  expect(total).toHaveTextContent("−218,880원");
  expect(total).toHaveTextContent("1,681,120원");
  expect(total).toHaveTextContent("평균 11.52%");

  expect(within(table).getByText("애플")).toBeInTheDocument();
  expect(within(table).getByText("구글")).toBeInTheDocument();
  const pgRow = within(table).getByText("PG(카드 등)").closest("tr")!;
  expect(pgRow).toHaveTextContent("4건");
  expect(pgRow).toHaveTextContent("400,000원");
  expect(pgRow).toHaveTextContent("−7,480원");

  const flow = screen.getByRole("list", { name: "돈 흐름" });
  expect(within(flow).getByText("예상 정산액").closest("li")).toHaveTextContent("168만원");
  expect(screen.getByRole("list", { name: "매출 상위 상품" })).toHaveTextContent("구슬 30개");
  expect(screen.getByText(/애플 13.6%, 구글 15%, PG 1.87%/)).toBeInTheDocument();
});

it("전월 대비 평균 수수료율 변화를 보여준다", () => {
  render(<ChannelFees />);
  expect(screen.getByText("+9.65%p")).toBeInTheDocument();
});

it("불러오기 실패 시 한국어 오류를 보여준다", () => {
  mockBreakdown.mockImplementation(() => ({
    data: undefined,
    isLoading: false,
    isError: true,
    error: new Error("네트워크 오류"),
  }));
  render(<ChannelFees />);
  expect(screen.getByText("결제 채널 내역을 불러오지 못했습니다")).toBeInTheDocument();
  expect(screen.getByText("네트워크 오류")).toBeInTheDocument();
});
