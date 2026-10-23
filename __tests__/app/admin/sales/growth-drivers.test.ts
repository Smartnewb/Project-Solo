import {
  buildDriverRows,
  decomposeRevenueChange,
  describeDriver,
  formatSignedPercent,
  type DriverRow,
} from "@/app/admin/sales/growth/components/RevenueDrivers";
import {
  buildCohortRows,
  isCohortMature,
  purchaseCountLabel,
} from "@/app/admin/sales/growth/components/RetentionCohorts";
import type { BucketPoint } from "@/app/admin/sales/growth/lib/metrics";

function bucket(key: string, gross: number, partial = false): BucketPoint {
  return { key, label: `${key.slice(2, 4)}.${key.slice(5, 7)}`, gross, count: 0, days: 30, partial };
}

function row(month: string, gross: number, arppu: number | null, partial = false): DriverRow {
  return { month, label: month, gross, momGrowth: null, arppu, aov: null, payers: null, partial };
}

describe("buildDriverRows", () => {
  it("joins monthly revenue with ARPPU/AOV by YYYY-MM and derives payers = gross / arppu", () => {
    const rows = buildDriverRows(
      [bucket("2026-08-01", 1_100_000), bucket("2026-09-01", 2_200_000), bucket("2026-10-01", 500_000, true)],
      [
        { label: "2026-08", arpu: 1, arppu: 11_000, payingUserRate: 1, aov: 5_500 },
        { label: "2026-09", arpu: 1, arppu: 22_000, payingUserRate: 1, aov: 5_500 },
      ],
    );

    expect(rows.map((r) => r.month)).toEqual(["2026-08", "2026-09", "2026-10"]);
    expect(rows[0].payers).toBe(100);
    expect(rows[1].payers).toBe(100);
    expect(rows[1].momGrowth).toBeCloseTo(1, 6);
    expect(rows[2]).toMatchObject({ partial: true, arppu: null, aov: null, payers: null, momGrowth: null });
  });

  it("keeps the previous month for MoM when trimming to the limit", () => {
    const rows = buildDriverRows([bucket("2026-07-01", 100), bucket("2026-08-01", 150), bucket("2026-09-01", 300)], [], 2);

    expect(rows.map((r) => r.month)).toEqual(["2026-08", "2026-09"]);
    expect(rows[0].momGrowth).toBeCloseTo(0.5, 6);
    expect(rows[1].momGrowth).toBeCloseTo(1, 6);
  });

  it("treats a zero ARPPU as missing instead of dividing by zero", () => {
    const rows = buildDriverRows([bucket("2026-09-01", 1000)], [{ label: "2026-09", arpu: 0, arppu: 0, payingUserRate: 0, aov: 0 }]);
    expect(rows[0]).toMatchObject({ arppu: null, aov: null, payers: null });
  });
});

describe("decomposeRevenueChange", () => {
  it("attributes growth to payers when ARPPU is flat and the log shares sum to 1", () => {
    const d = decomposeRevenueChange(row("2026-08", 1_000_000, 10_000), row("2026-09", 1_500_000, 10_000));

    expect(d.driver).toBe("payers");
    expect(d.revenueGrowth).toBeCloseTo(0.5, 6);
    expect(d.payersGrowth).toBeCloseTo(0.5, 6);
    expect(d.arppuGrowth).toBeCloseTo(0, 6);
    expect((d.payersShare ?? 0) + (d.arppuShare ?? 0)).toBeCloseTo(1, 6);
    expect(d.payersShare).toBeCloseTo(1, 6);
  });

  it("attributes decline to ARPPU when payers are flat and words the drop without a double negative", () => {
    const d = decomposeRevenueChange(row("2026-08", 1_000_000, 10_000), row("2026-09", 800_000, 8_000));

    expect(d.driver).toBe("arppu");
    expect(d.payersGrowth).toBeCloseTo(0, 6);
    expect(d.arppuGrowth).toBeCloseTo(-0.2, 6);
    expect(d.arppuShare).toBeCloseTo(1, 6);
    const text = describeDriver(d, "9월", "8월");
    expect(text).toContain("9월 매출은 8월보다 20.0% 줄었습니다");
    expect(text).toContain("결제자 수가 0.0%");
    expect(text).not.toContain("-0.0%");
  });

  it("reports both when payers and ARPPU move together in the same direction", () => {
    const d = decomposeRevenueChange(row("2026-08", 1_000_000, 10_000), row("2026-09", 1_440_000, 12_000));

    expect(d.driver).toBe("both");
    expect(d.payersGrowth).toBeCloseTo(0.2, 6);
    expect(d.arppuGrowth).toBeCloseTo(0.2, 6);
    expect((d.payersShare ?? 0) + (d.arppuShare ?? 0)).toBeCloseTo(1, 6);
  });

  it("reports offset when payers rise but ARPPU falls", () => {
    const d = decomposeRevenueChange(row("2026-08", 1_000_000, 10_000), row("2026-09", 1_200_000, 8_000));

    expect(d.driver).toBe("offset");
    expect(d.payersGrowth).toBeCloseTo(0.5, 6);
    expect(d.arppuGrowth).toBeCloseTo(-0.2, 6);
    const text = describeDriver(d, "9월", "8월");
    expect(text).toContain("9월 매출은 8월보다 20.0% 늘었습니다");
    expect(text).toContain("반대로");
  });

  it("reports flat below the half-percent threshold", () => {
    const d = decomposeRevenueChange(row("2026-08", 1_000_000, 10_000), row("2026-09", 1_001_000, 10_010));
    expect(d.driver).toBe("flat");
    expect(describeDriver(d, "9월", "8월")).toContain("거의 같습니다");
  });

  it("returns unknown when ARPPU is missing or the previous month had no revenue", () => {
    expect(decomposeRevenueChange(row("2026-08", 1_000_000, null), row("2026-09", 1_200_000, 10_000)).driver).toBe("unknown");
    const noPrev = decomposeRevenueChange(row("2026-08", 0, 10_000), row("2026-09", 1_200_000, 10_000));
    expect(noPrev).toMatchObject({ driver: "unknown", revenueGrowth: null });
    expect(describeDriver(noPrev, "9월", "8월")).toContain("8월 매출이 없어");
  });
});

describe("formatSignedPercent", () => {
  it("drops the sign on negative zero and rounds like formatPercent otherwise", () => {
    expect(formatSignedPercent(-0)).toBe("0.0%");
    expect(formatSignedPercent(-0.0004)).toBe("0.0%");
    expect(formatSignedPercent(0.123)).toBe("+12.3%");
    expect(formatSignedPercent(-0.05)).toBe("-5.0%");
    expect(formatSignedPercent(null)).toBe("—");
  });
});

describe("isCohortMature", () => {
  it("requires the last signup day of the cohort month plus N days to have passed", () => {
    expect(isCohortMature("2026-09", 7, "2026-10-07")).toBe(true);
    expect(isCohortMature("2026-09", 7, "2026-10-06")).toBe(false);
    expect(isCohortMature("2026-09", 30, "2026-10-30")).toBe(true);
    expect(isCohortMature("2026-09", 30, "2026-10-29")).toBe(false);
    expect(isCohortMature("2026-07", 90, "2026-10-29")).toBe(true);
    expect(isCohortMature("2026-07", 90, "2026-10-28")).toBe(false);
  });

  it("handles February and year boundaries", () => {
    expect(isCohortMature("2026-02", 7, "2026-03-07")).toBe(true);
    expect(isCohortMature("2026-02", 7, "2026-03-06")).toBe(false);
    expect(isCohortMature("2025-12", 30, "2026-01-30")).toBe(true);
    expect(isCohortMature("2025-12", 30, "2026-01-29")).toBe(false);
  });
});

describe("buildCohortRows", () => {
  it("masks immature windows as 집계 중 and keeps the last 12 cohorts in order", () => {
    const items = Array.from({ length: 14 }, (_, i) => {
      const m = i + 1;
      const cohort = `2025-${String(m).padStart(2, "0")}`;
      return { cohort: m > 12 ? `2026-${String(m - 12).padStart(2, "0")}` : cohort, userCount: 10 * m, ltv7Days: 7 * m, ltv30Days: 30 * m, ltv90Days: 90 * m };
    }).reverse();

    const rows = buildCohortRows(items, "2026-10-17");

    expect(rows).toHaveLength(12);
    expect(rows[0].cohort).toBe("2025-03");
    expect(rows[11].cohort).toBe("2026-02");
    expect(rows[11].cells[7]).toEqual({ value: 7 * 14, mature: true });
    expect(rows[11].cells[30]).toEqual({ value: 30 * 14, mature: true });
    expect(rows[11].cells[90]).toEqual({ value: 90 * 14, mature: true });
  });

  it("marks the current and recent cohorts as still accumulating", () => {
    const rows = buildCohortRows(
      [
        { cohort: "2026-10", userCount: 5, ltv7Days: 100, ltv30Days: 100, ltv90Days: 100 },
        { cohort: "2026-09", userCount: 5, ltv7Days: 200, ltv30Days: 200, ltv90Days: 200 },
        { cohort: "2026-07", userCount: 5, ltv7Days: 300, ltv30Days: 300, ltv90Days: 300 },
      ],
      "2026-10-17",
    );

    expect(rows.map((r) => r.cohort)).toEqual(["2026-07", "2026-09", "2026-10"]);
    expect(rows[2].cells[7]).toEqual({ value: null, mature: false });
    expect(rows[1].cells[7]).toEqual({ value: 200, mature: true });
    expect(rows[1].cells[30]).toEqual({ value: null, mature: false });
    expect(rows[0].cells[30]).toEqual({ value: 300, mature: true });
    expect(rows[0].cells[90]).toEqual({ value: null, mature: false });
  });

  it("returns an empty list without cohort data", () => {
    expect(buildCohortRows(undefined, "2026-10-17")).toEqual([]);
  });
});

describe("purchaseCountLabel", () => {
  it("renders 6 as the open-ended bucket", () => {
    expect(purchaseCountLabel(1)).toBe("1회");
    expect(purchaseCountLabel(5)).toBe("5회");
    expect(purchaseCountLabel(6)).toBe("6회 이상");
  });
});
