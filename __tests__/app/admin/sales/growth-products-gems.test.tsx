import React from "react";
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import {
  buildProductRows,
  describeMix,
  ProductMix,
  productsForShare,
} from "@/app/admin/sales/growth/components/ProductMix";
import {
  buildFeatureRows,
  describeFreeShare,
  describePeak,
  featureLabel,
  fillHours,
  GemUsage,
  peakHours,
  splitSources,
} from "@/app/admin/sales/growth/components/GemUsage";
import { useGemConsumption, useGemEconomy, useProductSales } from "@/app/admin/sales/growth/hooks";
import { kstToday, monthStart } from "@/app/admin/sales/growth/lib/metrics";

jest.mock("@/app/admin/sales/growth/hooks", () => ({
  BEHAVIOR_WINDOW_DAYS: 90,
  useProductSales: jest.fn(),
  useGemConsumption: jest.fn(),
  useGemEconomy: jest.fn(),
}));
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
  LineChart: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
  Bar: ({ children }: { children: React.ReactNode }) => <g>{children}</g>,
  Line: () => null,
  Cell: () => null,
  CartesianGrid: () => null,
  Legend: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const mockProductSales = useProductSales as jest.Mock;
const mockConsumption = useGemConsumption as jest.Mock;
const mockEconomy = useGemEconomy as jest.Mock;

const THIS_MONTH = monthStart(kstToday());

const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false, error: null });
const failed = (message: string) => ({ data: undefined, isLoading: false, isError: true, error: new Error(message) });

const PRODUCTS = [
  { productName: "구슬 100개", salesCount: 10, totalRevenue: 550_000, uniqueBuyers: 8 },
  { productName: "구슬 30개", salesCount: 20, totalRevenue: 330_000, uniqueBuyers: 15 },
  { productName: "구슬 10개", salesCount: 15, totalRevenue: 110_000, uniqueBuyers: 12 },
  { productName: "구슬 300개", salesCount: 1, totalRevenue: 110_000, uniqueBuyers: 1 },
];

describe("buildProductRows / productsForShare", () => {
  it("매출 순으로 정렬하고 부가세 제외 금액·비중·건당 평균·저판매 표시를 계산한다", () => {
    const rows = buildProductRows(PRODUCTS);
    expect(rows.map((r) => r.productName)).toEqual(["구슬 100개", "구슬 30개", "구슬 10개", "구슬 300개"]);
    expect(rows[0].netOfVat).toBeCloseTo(500_000, 6);
    expect(rows[0].share).toBeCloseTo(0.5, 6);
    expect(rows[0].avgPerSale).toBeCloseTo(50_000, 6);
    expect(rows.map((r) => r.lowSeller)).toEqual([false, false, false, true]);
  });

  it("매출 80%를 만드는 상품 수를 센다", () => {
    const rows = buildProductRows(PRODUCTS);
    expect(productsForShare(rows)).toBe(2);
    expect(productsForShare(rows, 0.5)).toBe(1);
    expect(productsForShare(rows, 1)).toBe(4);
    expect(productsForShare([])).toBe(0);
  });

  it("부동소수 누적으로 80% 경계를 놓치지 않는다", () => {
    const rows = buildProductRows([
      { productName: "A", salesCount: 5, totalRevenue: 800, uniqueBuyers: 5 },
      { productName: "B", salesCount: 5, totalRevenue: 200, uniqueBuyers: 5 },
    ]);
    expect(productsForShare(rows)).toBe(1);
  });

  it("한 줄 요약에 1위 비중·80% 상품 수·저판매 수를 넣는다", () => {
    expect(describeMix(buildProductRows(PRODUCTS))).toBe(
      "1위 '구슬 100개'이 매출의 50.0%를 차지하고, 4개 상품 중 2개가 매출의 80%를 만듭니다. 2건 이하로 팔린 상품 1개는 가격·구성 점검 대상입니다.",
    );
    expect(describeMix([])).toBe("이 달에는 집계된 상품 매출이 없습니다.");
  });
});

describe("gem helpers", () => {
  it("기능 코드를 한국어로 바꾸고 모르는 코드는 그대로 둔다", () => {
    expect(featureLabel("LIKE")).toBe("좋아요");
    expect(featureLabel("SIGNUP_BONUS")).toBe("가입 보너스");
    expect(featureLabel("SOMETHING_NEW")).toBe("SOMETHING_NEW");
  });

  it("사용처 비중과 회당 구슬을 계산하고 0 사용은 뺀다", () => {
    const rows = buildFeatureRows([
      { featureType: "LIKE", usageCount: 100, totalGemsConsumed: 300, uniqueUsers: 40 },
      { featureType: "CHAT_OPEN", usageCount: 20, totalGemsConsumed: 700, uniqueUsers: 15 },
      { featureType: "REMATCHING", usageCount: 0, totalGemsConsumed: 0, uniqueUsers: 0 },
    ]);
    expect(rows.map((r) => r.label)).toEqual(["채팅 열기", "좋아요"]);
    expect(rows[0].share).toBeCloseTo(0.7, 6);
    expect(rows[0].gemsPerUse).toBeCloseTo(35, 6);
    expect(rows[1].gemsPerUse).toBeCloseTo(3, 6);
  });

  it("24시간을 채우고 상위 3개 시간대를 시간 순으로 돌려준다", () => {
    const hours = fillHours([
      { hour: 22, usageCount: 50, totalGemsConsumed: 100 },
      { hour: 9, usageCount: 10, totalGemsConsumed: 20 },
      { hour: 21, usageCount: 40, totalGemsConsumed: 80 },
      { hour: 23, usageCount: 30, totalGemsConsumed: 60 },
      { hour: 3, usageCount: 30, totalGemsConsumed: 60 },
    ]);
    expect(hours).toHaveLength(24);
    expect(hours[0]).toEqual({ hour: 0, uses: 0, gems: 0 });
    expect(peakHours(hours)).toEqual([3, 21, 22]);
    expect(describePeak(hours)).toBe(
      "3시·21시·22시에 사용이 가장 많고, 이 3시간대가 전체 사용의 75.0%를 차지합니다. 푸시·프로모션은 이 직전에 보내는 게 유리합니다.",
    );
    expect(describePeak(fillHours([]))).toBe("최근 90일 동안 집계된 구슬 사용이 없습니다.");
  });

  it("무료로 풀린 구슬 비중은 결제 외 지급 ÷ 전체 지급이다", () => {
    const split = splitSources([
      { source: "PAYMENT", charged: 600, consumed: 0 },
      { source: "SIGNUP_BONUS", charged: 250, consumed: 0 },
      { source: "ADMIN_GRANT", charged: 100, consumed: 0 },
      { source: "EVENT_REWARD", charged: 50, consumed: 0 },
      { source: "LIKE", charged: 0, consumed: 900 },
    ]);
    expect(split.totalCharged).toBe(1000);
    expect(split.purchased).toBe(600);
    expect(split.free).toBe(400);
    expect(split.freeShare).toBeCloseTo(0.4, 6);
    expect(split.rows.map((r) => [r.label, r.purchase])).toEqual([
      ["결제(구매)", true],
      ["가입 보너스", false],
      ["관리자 지급", false],
      ["이벤트 보상", false],
    ]);
    expect(describeFreeShare(split)).toMatch(/^지급된 구슬의 40\.0%가 결제 없이 풀렸습니다\./);
    expect(describeFreeShare(splitSources([{ source: "PURCHASE", charged: 10, consumed: 0 }]))).toMatch(/0\.0%만/);
    expect(describeFreeShare(splitSources([]))).toBe("최근 90일 동안 지급된 구슬이 없습니다.");
  });
});

describe("<ProductMix />", () => {
  beforeEach(() => {
    mockProductSales.mockReset();
  });

  it("이번 달 상품을 매출 순으로 표에 그리고 저판매 상품을 표시한다", () => {
    mockProductSales.mockImplementation((month: string) =>
      ok(
        month === THIS_MONTH
          ? { products: PRODUCTS, totalRevenue: 1_100_000, totalSalesCount: 46, totalUniqueBuyers: 30 }
          : { products: [], totalRevenue: 0, totalSalesCount: 0, totalUniqueBuyers: 0 },
      ),
    );
    render(<ProductMix />);
    expect(mockProductSales).toHaveBeenCalledWith(THIS_MONTH);

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("구슬 100개");
    expect(rows[1]).toHaveTextContent("10건");
    expect(rows[1]).toHaveTextContent("8명");
    expect(rows[1]).toHaveTextContent("50만원");
    expect(rows[1]).toHaveTextContent("50.0%");
    expect(rows[1]).toHaveTextContent("50,000원");
    expect(rows[4]).toHaveTextContent("구슬 300개");
    expect(rows[4]).toHaveTextContent("거의 안 팔림");
    expect(rows.at(-1)).toHaveTextContent("46건");
    expect(rows.at(-1)).toHaveTextContent("30명");
    expect(rows.at(-1)).toHaveTextContent("100만원");
    expect(screen.getByText(/4개 상품 중 2개가 매출의 80%를 만듭니다/)).toBeInTheDocument();
  });

  it("불러오기 실패 시 한국어 오류를 보여준다", () => {
    mockProductSales.mockImplementation(() => failed("네트워크 오류"));
    render(<ProductMix />);
    expect(screen.getByText("상품별 판매 현황을 불러오지 못했습니다")).toBeInTheDocument();
    expect(screen.getByText("네트워크 오류")).toBeInTheDocument();
  });
});

describe("<GemUsage />", () => {
  beforeEach(() => {
    mockConsumption.mockReset();
    mockEconomy.mockReset();
  });

  it("사용처·피크 시간·무료 비중을 서버 원시 필드만으로 그린다", () => {
    mockConsumption.mockReturnValue(
      ok({
        byFeature: [
          { featureType: "LIKE", usageCount: 100, totalGemsConsumed: 300, uniqueUsers: 40 },
          { featureType: "CHAT_OPEN", usageCount: 20, totalGemsConsumed: 700, uniqueUsers: 15 },
        ],
        byHour: [
          { hour: 22, usageCount: 50, totalGemsConsumed: 100 },
          { hour: 21, usageCount: 40, totalGemsConsumed: 80 },
          { hour: 9, usageCount: 10, totalGemsConsumed: 20 },
        ],
        totalGemsConsumed: 1000,
        totalUsageCount: 120,
      }),
    );
    mockEconomy.mockReturnValue(
      ok({
        dailyBalance: [{ date: "2026-10-01", totalCharged: 100, totalConsumed: 50, netFlow: 50, ratio: 2 }],
        summary: {
          totalCharged: 1000,
          totalConsumed: 800,
          overallRatio: 1.25,
          avgDailyCharge: 11.11,
          avgDailyConsume: 8.89,
          healthStatus: "inflation",
        },
        bySource: [
          { source: "PAYMENT", charged: 400, consumed: 0 },
          { source: "SIGNUP_BONUS", charged: 600, consumed: 0 },
        ],
      }),
    );
    render(<GemUsage />);

    const usage = screen.getByRole("list", { name: "구슬 사용처" });
    const items = within(usage).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("채팅 열기");
    expect(items[0]).toHaveTextContent("700개");
    expect(items[0]).toHaveTextContent("70.0%");
    expect(items[0]).toHaveTextContent("회당 35.0개");
    expect(items[1]).toHaveTextContent("좋아요");

    expect(screen.getByText(/9시·21시·22시에 사용이 가장 많고/)).toBeInTheDocument();

    const summary = screen.getByLabelText("구슬 수급 요약");
    expect(summary).toHaveTextContent("1.25배");
    expect(screen.queryByText(/inflation|healthy|deflation/)).not.toBeInTheDocument();

    const freeCard = screen.getByText("무료로 풀린 구슬 비중").closest("div")!;
    expect(freeCard).toHaveTextContent("60.0%");
    expect(screen.getByText(/절반 넘게 무료로 쓰이면/)).toBeInTheDocument();
    const table = screen.getByRole("table");
    const paymentRow = within(table).getByText("결제(구매)").closest("tr")!;
    expect(paymentRow).toHaveTextContent("결제");
    expect(paymentRow).toHaveTextContent("400개");
    const bonusRow = within(table).getByText("가입 보너스").closest("tr")!;
    expect(bonusRow).toHaveTextContent("무료 지급");
    expect(bonusRow).toHaveTextContent("60.0%");
  });

  it("쿼리별로 따로 실패를 보여준다", () => {
    mockConsumption.mockReturnValue(failed("사용 내역 오류"));
    mockEconomy.mockReturnValue(failed("수급 오류"));
    render(<GemUsage />);
    expect(screen.getByText("구슬 사용 내역을 불러오지 못했습니다")).toBeInTheDocument();
    expect(screen.getByText("사용 내역 오류")).toBeInTheDocument();
    expect(screen.getByText("구슬 수급 내역을 불러오지 못했습니다")).toBeInTheDocument();
    expect(screen.getByText("수급 오류")).toBeInTheDocument();
  });
});
