import {
  buildDailyChannelData,
  buildDailyChannelSummary,
} from '@/app/admin/sales/growth/components/DailyChannelTrend';
import {
  FEE_RATES,
  addDays,
  netOfVatAndFee,
  summarizeChannelDay,
  type ChannelDay,
} from '@/app/admin/sales/growth/lib/metrics';

const TODAY = '2026-10-20';

function day(date: string, net: number, count: number): ChannelDay {
  return { date, count, gross: 0, net, netByChannel: { APPLE_IAP: net, GOOGLE_PLAY: 0, PG: 0 } };
}

// 2026-09-22 ~ 2026-10-20 (29 days): earlier 14 days 100/day 1 payment, recent 14 days 200/day 2 payments, today 50.
function makeDays(): ChannelDay[] {
  const out: ChannelDay[] = [];
  for (let i = 0; i < 29; i++) {
    const date = addDays(TODAY, i - 28);
    if (date === TODAY) out.push(day(date, 50, 1));
    else if (i >= 14) out.push(day(date, 200, 2));
    else out.push(day(date, 100, 1));
  }
  return out;
}

describe('netOfVatAndFee / summarizeChannelDay', () => {
  it('removes VAT (1/11) and the channel fee from the customer payment', () => {
    expect(FEE_RATES.PG).toBe(0.0187);
    expect(netOfVatAndFee(11_000, 'PG')).toBeCloseTo(10_000 - 11_000 * 0.0187, 6);
    expect(netOfVatAndFee(11_000, 'APPLE_IAP')).toBeCloseTo(10_000 - 11_000 * 0.1364, 6);
    expect(netOfVatAndFee(11_000, 'GOOGLE_PLAY')).toBeCloseTo(10_000 - 11_000 * 0.15, 6);
  });

  it('groups payment methods into Apple, Google and PG', () => {
    const summary = summarizeChannelDay('2026-10-19', [
      { method: 'APPLE_IAP', amount: 11_000, count: 1 },
      { method: 'GOOGLE_PLAY', amount: 22_000, count: 2 },
      { method: 'PaymentMethodCard', amount: 11_000, count: 1 },
      { method: 'PaymentMethodEasyPay', amount: 11_000, count: 1 },
    ]);
    expect(summary.count).toBe(5);
    expect(summary.gross).toBe(55_000);
    expect(summary.netByChannel.APPLE_IAP).toBeCloseTo(netOfVatAndFee(11_000, 'APPLE_IAP'), 6);
    expect(summary.netByChannel.GOOGLE_PLAY).toBeCloseTo(netOfVatAndFee(22_000, 'GOOGLE_PLAY'), 6);
    expect(summary.netByChannel.PG).toBeCloseTo(netOfVatAndFee(22_000, 'PG'), 6);
    expect(summary.net).toBeCloseTo(
      summary.netByChannel.APPLE_IAP + summary.netByChannel.GOOGLE_PLAY + summary.netByChannel.PG,
      6,
    );
  });
});

describe('buildDailyChannelData', () => {
  const data = buildDailyChannelData(makeDays(), TODAY);

  it('shows the last 14 completed days plus today', () => {
    expect(data).toHaveLength(15);
    expect(data[0].key).toBe('2026-10-06');
    expect(data.at(-1)!.key).toBe(TODAY);
    expect(data.at(-1)!.partial).toBe(true);
    expect(data.filter((d) => d.partial)).toHaveLength(1);
  });

  it('adds a 7-day moving average (not for today) and the same weekday last week', () => {
    expect(data[0].average).toBeCloseTo((100 * 6 + 200) / 7, 6);
    expect(data[0].lastWeek).toBe(100);
    expect(data[13].average).toBe(200);
    expect(data[13].lastWeek).toBe(200);
    expect(data.at(-1)!.average).toBeNull();
    expect(data.at(-1)!.lastWeek).toBe(200);
  });
});

describe('buildDailyChannelSummary', () => {
  it('compares completed days only and excludes today', () => {
    const summary = buildDailyChannelSummary(makeDays(), TODAY);
    expect(summary.last7).toBeCloseTo(0, 6);
    expect(summary.last14).toBeCloseTo(1, 6);
    expect(summary.dailyCount).toBe(2);
    expect(summary.dailyCountGrowth).toBeCloseTo(1, 6);
    expect(summary.perPayment).toBe(100);
    expect(summary.perPaymentGrowth).toBeCloseTo(0, 6);
  });
});
