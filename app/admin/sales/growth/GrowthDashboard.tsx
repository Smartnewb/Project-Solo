"use client";

import { Scorecard } from "./components/Scorecard";
import { GrowthTrend } from "./components/GrowthTrend";
import { RevenueDrivers } from "./components/RevenueDrivers";
import { RetentionCohorts } from "./components/RetentionCohorts";
import { ChannelFees } from "./components/ChannelFees";

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

export function GrowthDashboard() {
  return (
    <div className="space-y-10">
      <Scorecard />
      <Section title="성장 추이" description="일별·주별·월별 매출 흐름과 성장률">
        <GrowthTrend />
      </Section>
      <Section title="매출 분해" description="매출이 결제자 수 때문에 움직였는지, 1인당 결제액 때문에 움직였는지">
        <RevenueDrivers />
      </Section>
      <Section title="재구매와 가입 코호트" description="한 번 결제한 사람이 다시 결제하는지, 가입 월별로 얼마를 쓰는지">
        <RetentionCohorts />
      </Section>
      <Section title="결제 채널과 수수료" description="채널별 비중과 실제로 남는 돈(예상 정산액)">
        <ChannelFees />
      </Section>
      <p className="text-xs text-gray-400">
        기준: 운영 결제 장부(pay_histories), KST 결제일, 부가세 제외 = 결제액 ÷ 1.1, 환불된 결제는 결제일에서 제외,
        테스트·가짜 계정 제외(팀원 계정은 미제외). 슬랙 공식 매출과 소폭 차이가 날 수 있습니다.
      </p>
    </div>
  );
}
