import {
  FEE_RATES,
  addDays,
  bucketMonthly,
  bucketWeekly,
  buildScorecard,
  compoundWeeklyGrowth,
  estimateFees,
  exVat,
  feeChannelOf,
  fillDaily,
  formatKrw,
  formatPercent,
  growthRate,
  kstMidnightIso,
  movingAverage,
  weekStart,
  type BucketPoint,
  type DailyPoint,
} from '@/app/admin/sales/growth/lib/metrics';

function makeDays(from: string, to: string, grossOf: (date: string) => number): DailyPoint[] {
  const out: DailyPoint[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const gross = grossOf(d);
    out.push({ date: d, gross, pg: gross, iap: 0, count: gross > 0 ? 1 : 0 });
  }
  return out;
}

function week(key: string, gross: number, days = 7, partial = false): BucketPoint {
  return { key, label: key, gross, count: 1, days, partial };
}

describe('buildScorecard (Sep 1,000/day, Oct 1-16 2,000/day, today 10/17 5,000)', () => {
  const today = '2026-10-17';
  const days = makeDays('2026-08-01', today, (d) => {
    if (d === today) return 5000;
    if (d >= '2026-10-01') return 2000;
    if (d >= '2026-09-01') return 1000;
    return 700;
  });

  it('compares completed days only and keeps today separate', () => {
    const card = buildScorecard(days, today);

    expect(card.completedDays).toBe(16);
    expect(card.mtdGross).toBe(16 * 2000);
    expect(card.lastMonthSamePeriodGross).toBe(16 * 1000);
    expect(card.mtdGrowth).toBeCloseTo(1, 10);
    expect(card.forecastGross).toBeCloseTo(2000 * 31, 6);
    expect(card.lastMonthGross).toBe(30 * 1000);
    expect(card.todayGross).toBe(5000);
  });

  it('uses two non-overlapping 7-day windows ending yesterday', () => {
    const card = buildScorecard(days, today);

    expect(card.last7Gross).toBe(7 * 2000);
    expect(card.prev7Gross).toBe(7 * 2000);
    expect(card.last7Growth).toBe(0);
  });

  it('returns nulls instead of zero growth on the first day of a month', () => {
    const card = buildScorecard(days, '2026-10-01');

    expect(card.completedDays).toBe(0);
    expect(card.mtdGross).toBe(0);
    expect(card.mtdGrowth).toBeNull();
    expect(card.forecastGross).toBeNull();
    expect(card.lastMonthGross).toBe(30 * 1000);
    expect(card.todayGross).toBe(2000);
    expect(card.last7Gross).toBe(7 * 1000);
  });

  it('caps the last-month comparison window at the shorter month length', () => {
    const marchDays = makeDays('2026-02-01', '2026-03-31', () => 100);
    const card = buildScorecard(marchDays, '2026-03-31');

    expect(card.completedDays).toBe(30);
    expect(card.lastMonthSamePeriodGross).toBe(28 * 100);
    expect(card.lastMonthGross).toBe(28 * 100);
  });
});

describe('bucketWeekly', () => {
  it('starts weeks on Monday and flags only the week containing today as partial', () => {
    const today = '2026-10-17';
    const days = makeDays('2026-09-28', today, () => 10);
    const weeks = bucketWeekly(days, today);

    expect(weeks.map((w) => w.key)).toEqual(['2026-09-28', '2026-10-05', '2026-10-12']);
    expect(weeks.map((w) => w.label)).toEqual(['09/28주', '10/05주', '10/12주']);
    expect(weeks.map((w) => w.days)).toEqual([7, 7, 6]);
    expect(weeks.map((w) => w.partial)).toEqual([false, false, true]);
    expect(weeks[2].gross).toBe(60);
  });

  it('keeps a full Monday-to-Sunday week partial while today is its Sunday', () => {
    const today = '2026-10-18';
    const weeks = bucketWeekly(makeDays('2026-10-12', today, () => 1), today);

    expect(weeks).toHaveLength(1);
    expect(weeks[0]).toMatchObject({ key: '2026-10-12', days: 7, partial: true });
  });

  it('does not mark a short leading week as partial', () => {
    const today = '2026-10-17';
    const weeks = bucketWeekly(makeDays('2026-10-01', today, () => 1), today);

    expect(weeks[0]).toMatchObject({ key: '2026-09-28', days: 4, partial: false });
    expect(weekStart('2026-10-01')).toBe('2026-09-28');
  });
});

describe('bucketMonthly', () => {
  it('labels months as YY.MM and flags only the current month', () => {
    const today = '2026-10-17';
    const months = bucketMonthly(makeDays('2026-08-15', today, () => 1), today);

    expect(months.map((m) => m.label)).toEqual(['26.08', '26.09', '26.10']);
    expect(months.map((m) => m.days)).toEqual([17, 30, 17]);
    expect(months.map((m) => m.partial)).toEqual([false, false, true]);
  });
});

describe('movingAverage', () => {
  const days = makeDays('2026-10-01', '2026-10-05', (d) => Number(d.slice(-1)));

  it('returns null until the window is full, then the trailing mean', () => {
    expect(movingAverage(days, 3)).toEqual([null, null, 2, 3, 4]);
  });

  it('defaults to a 7-day window', () => {
    const week = makeDays('2026-10-01', '2026-10-08', () => 7);
    expect(movingAverage(week)).toEqual([null, null, null, null, null, null, 7, 7]);
  });
});

describe('compoundWeeklyGrowth', () => {
  const growing = (n: number, start = '2026-01-05') =>
    Array.from({ length: n }, (_, i) => week(addDays(start, i * 7), 1000 * Math.pow(1.1, i)));

  it('returns the compound weekly rate across the last complete weeks', () => {
    expect(compoundWeeklyGrowth(growing(12))).toBeCloseTo(0.1, 10);
  });

  it('skips partial and short weeks', () => {
    const weeks = [
      week('2026-01-01', 999_999, 4),
      ...growing(5),
      week('2026-02-09', 1, 6, true),
    ];
    expect(compoundWeeklyGrowth(weeks)).toBeCloseTo(0.1, 10);
  });

  it('only looks at the most recent `count` weeks', () => {
    const weeks = [...Array.from({ length: 8 }, (_, i) => week(addDays('2025-10-06', i * 7), 50)), ...growing(4, '2025-12-01')];
    expect(compoundWeeklyGrowth(weeks, 4)).toBeCloseTo(0.1, 10);
    expect(compoundWeeklyGrowth(weeks, 12)).toBeCloseTo(Math.pow(1000 * 1.1 ** 3 / 50, 1 / 11) - 1, 10);
  });

  it('returns null without two complete weeks or with a zero endpoint', () => {
    expect(compoundWeeklyGrowth(growing(1))).toBeNull();
    expect(compoundWeeklyGrowth([week('2026-01-05', 0), week('2026-01-12', 100)])).toBeNull();
    expect(compoundWeeklyGrowth([week('2026-01-05', 100), week('2026-01-12', 0)])).toBeNull();
  });
});

describe('fillDaily', () => {
  it('zero-fills missing days and ignores rows outside the range', () => {
    const rows = [
      { date: '2026-10-03', revenue: 300, pgRevenue: 100, iapRevenue: 200, count: 2 },
      { date: '2026-10-01', revenue: 100, pgRevenue: 100, iapRevenue: 0, count: 1 },
      { date: '2026-09-30', revenue: 999, pgRevenue: 999, iapRevenue: 0, count: 9 },
    ];
    const filled = fillDaily(rows, '2026-10-01', '2026-10-04');

    expect(filled.map((d) => d.date)).toEqual(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
    expect(filled.map((d) => d.gross)).toEqual([100, 0, 300, 0]);
    expect(filled[2]).toEqual({ date: '2026-10-03', gross: 300, pg: 100, iap: 200, count: 2 });
    expect(filled[1]).toEqual({ date: '2026-10-02', gross: 0, pg: 0, iap: 0, count: 0 });
  });

  it('spans month and year boundaries', () => {
    const filled = fillDaily([], '2025-12-30', '2026-01-02');
    expect(filled.map((d) => d.date)).toEqual(['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02']);
  });
});

describe('kstMidnightIso', () => {
  it('converts a KST calendar day to the UTC instant of its midnight', () => {
    expect(kstMidnightIso('2026-10-17')).toBe('2026-10-16T15:00:00.000Z');
    expect(kstMidnightIso('2026-01-01')).toBe('2025-12-31T15:00:00.000Z');
    expect(kstMidnightIso('2026-03-01')).toBe('2026-02-28T15:00:00.000Z');
  });
});

describe('estimateFees', () => {
  it('maps raw payment methods onto the three fee channels', () => {
    expect(feeChannelOf('APPLE_IAP')).toBe('APPLE_IAP');
    expect(feeChannelOf('apple_iap')).toBe('APPLE_IAP');
    expect(feeChannelOf('GOOGLE_PLAY')).toBe('GOOGLE_PLAY');
    expect(feeChannelOf('PORTONE')).toBe('PG');
    expect(feeChannelOf('KAKAOPAY')).toBe('PG');
    expect(feeChannelOf('UNKNOWN')).toBe('PG');
  });

  it('aggregates by channel in fixed order and applies each channel rate', () => {
    const estimate = estimateFees([
      { method: 'PORTONE', amount: 330_000, count: 3 },
      { method: 'APPLE_IAP', amount: 110_000, count: 1 },
      { method: 'TOSS', amount: 110_000, count: 1 },
      { method: 'GOOGLE_PLAY', amount: 220_000, count: 2 },
    ]);

    expect(estimate.byChannel.map((c) => c.channel)).toEqual(['APPLE_IAP', 'GOOGLE_PLAY', 'PG']);
    expect(estimate.byChannel.map((c) => c.gross)).toEqual([110_000, 220_000, 440_000]);
    expect(estimate.byChannel.map((c) => c.count)).toEqual([1, 2, 4]);
    expect(estimate.byChannel[2].fee).toBeCloseTo(440_000 * FEE_RATES.PG, 6);
    expect(estimate.gross).toBe(770_000);
    expect(estimate.netOfVat).toBeCloseTo(700_000, 6);
    expect(estimate.fee).toBeCloseTo(
      110_000 * FEE_RATES.APPLE_IAP + 220_000 * FEE_RATES.GOOGLE_PLAY + 440_000 * FEE_RATES.PG,
      6,
    );
    expect(estimate.settlement).toBeCloseTo(estimate.gross - estimate.fee, 6);
  });

  it('omits channels with no rows', () => {
    expect(estimateFees([{ method: 'APPLE_IAP', amount: 1000, count: 1 }]).byChannel).toHaveLength(1);
    expect(estimateFees([]).byChannel).toEqual([]);
  });
});

describe('formatting helpers', () => {
  it('formats growth with sign and an em dash for unknown', () => {
    expect(formatPercent(0.1234)).toBe('+12.3%');
    expect(formatPercent(-0.05)).toBe('-5.0%');
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(null)).toBe('—');
    expect(growthRate(10, 0)).toBeNull();
    expect(growthRate(150, 100)).toBeCloseTo(0.5, 10);
  });

  it('shortens won amounts and strips VAT', () => {
    expect(formatKrw(9_999)).toBe('9,999원');
    expect(formatKrw(1_234_567)).toBe('123만원');
    expect(formatKrw(250_000_000)).toBe('2.50억원');
    expect(exVat(1_100_000)).toBeCloseTo(1_000_000, 6);
  });
});
