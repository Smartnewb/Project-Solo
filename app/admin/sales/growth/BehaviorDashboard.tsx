"use client";

import { PurchaseTriggers } from "./components/PurchaseTriggers";
import { RevenueConcentration } from "./components/RevenueConcentration";
import { ProductMix } from "./components/ProductMix";
import { GemUsage } from "./components/GemUsage";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function BehaviorDashboard() {
  return (
    <div className="space-y-10">
      <Section title="왜 결제하나" description="결제 직전에 쓴 기능, 결제 때 남은 구슬, 가입 후 첫 결제까지 걸린 시간">
        <PurchaseTriggers />
      </Section>
      <Section title="매출 쏠림" description="상위 결제자에게 매출이 얼마나 몰려 있는지와 그 사람들의 특징">
        <RevenueConcentration />
      </Section>
      <Section title="상품 구성" description="월별로 어떤 상품이 팔리고 어떤 상품이 안 팔리는지">
        <ProductMix />
      </Section>
      <Section title="구슬 사용과 수급" description="구슬이 어디에, 몇 시에 쓰이는지와 무료로 풀린 구슬 비중">
        <GemUsage />
      </Section>
      <p className="text-xs text-gray-400">
        기준: 운영 결제 장부(pay_histories)·구슬 거래(gem_transactions), 테스트 계정 제외(팀원 계정은 미제외). 금액은
        부가세 제외(결제액 ÷ 1.1). 기간 표기가 없는 항목은 최근 90일입니다.
      </p>
    </div>
  );
}
