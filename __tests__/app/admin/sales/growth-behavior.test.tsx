import React from "react";
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import {
  PurchaseTriggers,
  cohortWeekStart,
  cumulativeWithinDays,
  daysBucketLabel,
  formatHours,
  isCohortAccumulating,
  lowBalanceShare,
  sortByConversionRate,
} from "@/app/admin/sales/growth/components/PurchaseTriggers";
import {
  RevenueConcentration,
  buildTierRows,
  featureLabel,
  whaleRiskRead,
} from "@/app/admin/sales/growth/components/RevenueConcentration";
import {
  useFeatureFunnel,
  useFirstPurchase,
  useGemTrigger,
  useWhaleUsers,
} from "@/app/admin/sales/growth/hooks";
import { kstToday } from "@/app/admin/sales/growth/lib/metrics";
import type {
  FeatureFunnelResponse,
  FirstPurchaseResponse,
  GemTriggerResponse,
  RevenueConcentrationItem,
  WhaleUserResponse,
} from "@/app/admin/sales/types";

jest.mock("@/app/admin/sales/growth/hooks", () => ({
  BEHAVIOR_WINDOW_DAYS: 90,
  useFeatureFunnel: jest.fn(),
  useGemTrigger: jest.fn(),
  useFirstPurchase: jest.fn(),
  useWhaleUsers: jest.fn(),
}));

const mockFunnel = useFeatureFunnel as jest.Mock;
const mockGem = useGemTrigger as jest.Mock;
const mockFirst = useFirstPurchase as jest.Mock;
const mockWhales = useWhaleUsers as jest.Mock;

function ok<T>(data: T) {
  return { data, isLoading: false, isError: false, error: null };
}

const LOADING = { data: undefined, isLoading: true, isError: false, error: null };

function failed(message: string) {
  return { data: undefined, isLoading: false, isError: true, error: new Error(message) };
}

const FUNNEL: FeatureFunnelResponse = {
  lastFeatureBeforePurchase: [
    { featureType: "LIKE", featureName: "좋아요", purchaseCount: 60, percentage: 60, avgTimeToPurchase: 1.5 },
    { featureType: "CHAT_OPEN", featureName: "채팅 오픈", purchaseCount: 40, percentage: 40, avgTimeToPurchase: 0.25 },
  ],
  conversionByFeature: [
    { featureType: "LIKE", featureName: "좋아요", usageCount: 1000, purchaseWithin24h: 50, conversionRate: 5 },
    { featureType: "CHAT_OPEN", featureName: "채팅 오픈", usageCount: 200, purchaseWithin24h: 40, conversionRate: 20 },
  ],
  totalPurchases: 100,
};

const GEM: GemTriggerResponse = {
  distribution: [
    { balanceRange: "0-5", purchaseCount: 50, percentage: 50 },
    { balanceRange: "6-10", purchaseCount: 15, percentage: 15 },
    { balanceRange: "11-20", purchaseCount: 15, percentage: 15 },
    { balanceRange: "21-30", purchaseCount: 10, percentage: 10 },
    { balanceRange: "31-50", purchaseCount: 5, percentage: 5 },
    { balanceRange: "51+", purchaseCount: 5, percentage: 5 },
  ],
  averageBalance: 9.4,
  medianBalance: 4,
  modeBalance: 0,
  recommendedThreshold: 10,
  totalPurchases: 100,
};

const TODAY = kstToday();

function weekLabel(daysAgo: number): string {
  const start = new Date(`${TODAY}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - daysAgo);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const md = (d: Date) => `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}`;
  return `${md(start)}~${md(end)}`;
}

const FIRST: FirstPurchaseResponse = {
  daysDistribution: [
    { days: 1, userCount: 40, percentage: 40 },
    { days: 3, userCount: 15, percentage: 15 },
    { days: 7, userCount: 10, percentage: 10 },
    { days: 14, userCount: 10, percentage: 10 },
    { days: 30, userCount: 10, percentage: 10 },
    { days: 60, userCount: 5, percentage: 5 },
    { days: 90, userCount: 5, percentage: 5 },
    { days: 91, userCount: 5, percentage: 5 },
  ],
  averageDays: 12.3,
  medianDays: 2,
  featuresUsedBeforeFirst: [],
  cohortConversion: [
    { cohortWeek: weekLabel(3), totalUsers: 100, convertedUsers: 2, conversionRate: 2 },
    { cohortWeek: weekLabel(31), totalUsers: 120, convertedUsers: 12, conversionRate: 10 },
  ],
  totalFirstPurchaseUsers: 100,
};

const WHALES: WhaleUserResponse = {
  revenueConcentration: [
    { percentile: 1, userCount: 2, totalRevenue: 2_200_000, revenueShare: 20, avgRevenuePerUser: 1_100_000 },
    { percentile: 5, userCount: 10, totalRevenue: 4_950_000, revenueShare: 45, avgRevenuePerUser: 495_000 },
    { percentile: 10, userCount: 20, totalRevenue: 6_600_000, revenueShare: 60, avgRevenuePerUser: 330_000 },
    { percentile: 20, userCount: 40, totalRevenue: 8_800_000, revenueShare: 80, avgRevenuePerUser: 220_000 },
    { percentile: 50, userCount: 100, totalRevenue: 11_000_000, revenueShare: 100, avgRevenuePerUser: 110_000 },
  ],
  whaleThreshold: 330_000,
  whaleCount: 10,
  whaleCharacteristics: {
    malePercentage: 90,
    femalePercentage: 10,
    avgAge: 24.3,
    avgPurchaseCount: 7.5,
    avgDaysSinceSignup: 120,
    topFeatures: ["LIKE", "채팅 오픈", "MYSTERY"],
  },
  totalUsers: 200,
  totalRevenue: 11_000_000,
};

beforeEach(() => {
  mockFunnel.mockReset().mockReturnValue(ok(FUNNEL));
  mockGem.mockReset().mockReturnValue(ok(GEM));
  mockFirst.mockReset().mockReturnValue(ok(FIRST));
  mockWhales.mockReset().mockReturnValue(ok(WHALES));
});

describe("PurchaseTriggers", () => {
  it("결제 직전 기능·24시간 결제율·구슬 잔액·첫 결제 일수·코호트를 한 번에 그린다", () => {
    render(<PurchaseTriggers />);

    const last = screen.getByRole("list", { name: "결제 직전 마지막 기능" });
    const items = within(last).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("좋아요");
    expect(items[0]).toHaveTextContent("60.0%");
    expect(items[0]).toHaveTextContent("평균 1.5시간 뒤 결제");
    expect(items[1]).toHaveTextContent("평균 15분 뒤 결제");

    const conversion = screen.getAllByRole("table")[0];
    const rows = within(conversion).getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("채팅 오픈");
    expect(rows[0]).toHaveTextContent("가장 높음");
    expect(rows[0]).toHaveTextContent("20.0%");
    expect(rows[1]).toHaveTextContent("좋아요");
    expect(screen.getByText(/채팅 오픈 뒤 하루 안에 충전하는 비율이/).closest("p")).toHaveTextContent(
      "채팅 오픈 뒤 하루 안에 충전하는 비율이 20.0%로 가장 높습니다.",
    );

    expect(screen.getByText(/구슬 10개 이하일 때 충전합니다/).closest("p")).toHaveTextContent(
      "65.0%가 구슬 10개 이하일 때 충전합니다. 결제자 절반 기준(중앙값) 잔액은 4개입니다.",
    );
    expect(screen.getByRole("list", { name: "결제 시점 구슬 잔액 분포" })).toHaveTextContent("51+개");
    expect(screen.queryByText(/권장|기준 잔액/)).not.toBeInTheDocument();

    expect(screen.getByText(/가입 7일 안에 결제합니다/).closest("p")).toHaveTextContent("첫 결제자의 65.0%가 가입 7일 안에 결제합니다.");
    const days = screen.getByRole("list", { name: "가입 후 첫 결제까지 걸린 일수 분포" });
    expect(within(days).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      expect.stringContaining("당일~1일"),
      expect.stringContaining("2~3일"),
      expect.stringContaining("4~7일"),
      expect.stringContaining("8~14일"),
      expect.stringContaining("15~30일"),
      expect.stringContaining("31~60일"),
      expect.stringContaining("61~90일"),
      expect.stringContaining("90일 초과"),
    ]);

    const cohort = screen.getAllByRole("table")[1];
    const cohortRows = within(cohort).getAllByRole("row").slice(1);
    expect(cohortRows[0]).toHaveTextContent("(집계 중)");
    expect(cohortRows[0]).toHaveTextContent("100명");
    expect(cohortRows[1]).not.toHaveTextContent("(집계 중)");
    expect(cohortRows[1]).toHaveTextContent("10.0%");
  });

  it("쿼리별로 스켈레톤과 한국어 오류를 따로 보여준다", () => {
    mockFunnel.mockReturnValue(LOADING);
    mockGem.mockReturnValue(failed("잔액 조회 실패"));
    render(<PurchaseTriggers />);

    expect(screen.getAllByLabelText("불러오는 중").length).toBeGreaterThan(0);
    expect(screen.getByText("결제 시점 구슬 잔액을 불러오지 못했습니다")).toBeInTheDocument();
    expect(screen.getByText("잔액 조회 실패")).toBeInTheDocument();
    expect(screen.getByText(/가입 7일 안에 결제합니다/).closest("p")).toHaveTextContent("65.0%");
  });
});

describe("RevenueConcentration", () => {
  it("상위 1/5/10/20% 카드·위험 판독·큰손 프로필을 부가세 제외 금액으로 그린다", () => {
    render(<RevenueConcentration />);

    const tiers = within(screen.getByRole("list", { name: "상위 결제자 매출 비중" })).getAllByRole("listitem");
    expect(tiers).toHaveLength(4);
    expect(tiers[0]).toHaveTextContent("상위 1%");
    expect(tiers[0]).toHaveTextContent("20.0%");
    expect(tiers[0]).toHaveTextContent("100만원");
    expect(tiers[1]).toHaveTextContent("큰손 기준");
    expect(tiers[1]).toHaveTextContent("45만원");

    const risk = screen.getByText(/큰손 의존도가 높아 이탈 시 매출 타격이 큽니다/);
    expect(risk).toHaveTextContent("상위 5% 결제자 10명이 매출의 45.0%를 냅니다. 큰손 의존도가 높아 이탈 시 매출 타격이 큽니다.");

    expect(screen.getByText("남 90% · 여 10%")).toBeInTheDocument();
    expect(screen.getByText("24.3세")).toBeInTheDocument();
    expect(screen.getByText("7.5회")).toBeInTheDocument();
    expect(screen.getByText("120일")).toBeInTheDocument();
    expect(screen.getByText("1인 누적 30만원 이상")).toBeInTheDocument();
    expect(screen.getByText("좋아요")).toBeInTheDocument();
    expect(screen.getByText("채팅 오픈")).toBeInTheDocument();
    expect(screen.getByText("MYSTERY")).toBeInTheDocument();
    expect(screen.getByText(/팀원 계정의 결제가 상위권에 섞일 수 있습니다/)).toBeInTheDocument();
  });

  it("불러오기 실패 시 한국어 오류를 보여준다", () => {
    mockWhales.mockReturnValue(failed("네트워크 오류"));
    render(<RevenueConcentration />);
    expect(screen.getByText("상위 결제자 데이터를 불러오지 못했습니다")).toBeInTheDocument();
    expect(screen.getByText("네트워크 오류")).toBeInTheDocument();
  });
});

describe("daysBucketLabel", () => {
  it("maps server bucket upper bounds to plain Korean ranges and 91 to over 90 days", () => {
    expect([1, 3, 7, 14, 30, 60, 90, 91].map(daysBucketLabel)).toEqual([
      "당일~1일",
      "2~3일",
      "4~7일",
      "8~14일",
      "15~30일",
      "31~60일",
      "61~90일",
      "90일 초과",
    ]);
  });

  it("falls back to the raw day count for an unknown bucket", () => {
    expect(daysBucketLabel(45)).toBe("45일");
  });
});

describe("lowBalanceShare", () => {
  it("sums the 0-5 and 6-10 buckets only", () => {
    expect(
      lowBalanceShare([
        { balanceRange: "0-5", purchaseCount: 40, percentage: 40 },
        { balanceRange: "6-10", purchaseCount: 25, percentage: 25.5 },
        { balanceRange: "11-20", purchaseCount: 20, percentage: 20 },
        { balanceRange: "51+", purchaseCount: 15, percentage: 14.5 },
      ]),
    ).toBe(65.5);
  });

  it("returns null without a distribution", () => {
    expect(lowBalanceShare(undefined)).toBeNull();
    expect(lowBalanceShare([])).toBeNull();
  });
});

describe("cumulativeWithinDays", () => {
  const distribution = [
    { days: 1, userCount: 30, percentage: 30 },
    { days: 3, userCount: 20, percentage: 20 },
    { days: 7, userCount: 10, percentage: 10.25 },
    { days: 14, userCount: 10, percentage: 10 },
    { days: 91, userCount: 30, percentage: 29.75 },
  ];

  it("accumulates every bucket whose upper bound is within the window", () => {
    expect(cumulativeWithinDays(distribution, 7)).toBe(60.25);
    expect(cumulativeWithinDays(distribution, 1)).toBe(30);
    expect(cumulativeWithinDays(distribution, 90)).toBe(70.25);
  });

  it("returns null without a distribution", () => {
    expect(cumulativeWithinDays(undefined, 7)).toBeNull();
    expect(cumulativeWithinDays([], 7)).toBeNull();
  });
});

describe("sortByConversionRate", () => {
  it("orders by rate descending and breaks ties by usage", () => {
    const rows = sortByConversionRate([
      { featureType: "LIKE", featureName: "좋아요", usageCount: 100, purchaseWithin24h: 5, conversionRate: 5 },
      { featureType: "CHAT_OPEN", featureName: "채팅 오픈", usageCount: 50, purchaseWithin24h: 10, conversionRate: 20 },
      { featureType: "REMATCHING", featureName: "재매칭", usageCount: 200, purchaseWithin24h: 10, conversionRate: 5 },
    ]);
    expect(rows.map((r) => r.featureType)).toEqual(["CHAT_OPEN", "REMATCHING", "LIKE"]);
  });

  it("returns an empty list without rows", () => {
    expect(sortByConversionRate(undefined)).toEqual([]);
  });
});

describe("formatHours", () => {
  it("switches units at one hour and two days", () => {
    expect(formatHours(0.5)).toBe("30분");
    expect(formatHours(2.25)).toBe("2.3시간");
    expect(formatHours(48)).toBe("2.0일");
    expect(formatHours(-1)).toBe("—");
  });
});

describe("cohortWeekStart / isCohortAccumulating", () => {
  it("resolves MM/DD against today's year and rolls back across a year boundary", () => {
    expect(cohortWeekStart("10/06~10/12", "2026-10-17")).toBe("2026-10-06");
    expect(cohortWeekStart("12/29~01/04", "2026-01-10")).toBe("2025-12-29");
    expect(cohortWeekStart("garbage", "2026-10-17")).toBeNull();
  });

  it("marks weeks younger than the grace period as still accumulating", () => {
    expect(isCohortAccumulating("10/13~10/19", "2026-10-17")).toBe(true);
    expect(isCohortAccumulating("10/06~10/12", "2026-10-17")).toBe(true);
    expect(isCohortAccumulating("09/29~10/05", "2026-10-17")).toBe(false);
    expect(isCohortAccumulating("garbage", "2026-10-17")).toBe(false);
  });
});

function tier(percentile: number, userCount: number, totalRevenue: number, revenueShare: number): RevenueConcentrationItem {
  return { percentile, userCount, totalRevenue, revenueShare, avgRevenuePerUser: totalRevenue / userCount };
}

describe("whaleRiskRead", () => {
  it("flags high dependence when the top 5% exceed 40% of revenue", () => {
    const read = whaleRiskRead([tier(1, 2, 1_000, 20), tier(5, 10, 2_500, 45.2)]);
    expect(read).toMatchObject({ level: "high", share: 45.2, userCount: 10 });
    expect(read.verdict).toBe("큰손 의존도가 높아 이탈 시 매출 타격이 큽니다.");
    expect(read.message).toBe("상위 5% 결제자 10명이 매출의 45.2%를 냅니다. 큰손 의존도가 높아 이탈 시 매출 타격이 큽니다.");
  });

  it("stays neutral at or below the threshold", () => {
    const read = whaleRiskRead([tier(5, 10, 2_000, 40)]);
    expect(read.level).toBe("normal");
    expect(read.verdict).not.toContain("이탈 시");
    expect(read.message).toContain("매출의 40.0%를 냅니다.");
  });

  it("reports unknown when the 5% tier is missing", () => {
    expect(whaleRiskRead(undefined)).toMatchObject({ level: "unknown", share: null, userCount: null });
    expect(whaleRiskRead([tier(1, 1, 100, 10)]).level).toBe("unknown");
  });
});

describe("buildTierRows", () => {
  it("keeps only the 1/5/10/20 tiers in order and converts amounts to VAT-excluded won", () => {
    const rows = buildTierRows([
      tier(50, 100, 11_000, 100),
      tier(20, 40, 8_800, 80),
      tier(1, 2, 2_200, 20),
      tier(10, 20, 6_600, 60),
      tier(5, 10, 4_400, 40),
    ]);
    expect(rows.map((r) => r.percentile)).toEqual([1, 5, 10, 20]);
    expect(rows[0].avgRevenueExVat).toBeCloseTo(1_000, 6);
    expect(rows[0].totalRevenueExVat).toBeCloseTo(2_000, 6);
    expect(rows[3].share).toBe(80);
  });

  it("skips tiers the server did not return", () => {
    expect(buildTierRows([tier(5, 10, 1_100, 50)]).map((r) => r.percentile)).toEqual([5]);
    expect(buildTierRows(undefined)).toEqual([]);
  });
});

describe("featureLabel", () => {
  it("maps known codes to Korean and passes unknown codes through", () => {
    expect(featureLabel("LIKE")).toBe("좋아요");
    expect(featureLabel("CHAT_OPEN")).toBe("채팅 열기");
    expect(featureLabel("PROFILE_BOOST")).toBe("프로필 부스트");
    expect(featureLabel("좋아요")).toBe("좋아요");
    expect(featureLabel("MYSTERY")).toBe("MYSTERY");
  });
});
