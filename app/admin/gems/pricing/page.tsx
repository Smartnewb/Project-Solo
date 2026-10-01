"use client";
import { Tabs } from "@heroui/react";
import { useState } from "react";
import ChangesTab from "./components/changes-tab";
import DiscountsTab from "./components/discounts-tab";
import PricesTab from "./components/prices-tab";
import ReferenceTab from "./components/reference-tab";
import RefundPoliciesTab from "./components/refund-policies-tab";
const TABS = [
	"정가",
	"기간 할인",
	"환급 정책",
	"변경 이력",
	"보상·환급 참고",
] as const;
export default function GemPricingPage() {
	const [tab, setTab] = useState(0);
	// 어느 탭에서 뭘 바꾸든 감사 로그는 즉시 최신이어야 한다.
	const [changeSeq, setChangeSeq] = useState(0);
	const bumpChanges = () => setChangeSeq((n) => n + 1);
	return (
		<div
			style={{
				padding: 24,
				maxWidth: 1400,
				marginLeft: "auto",
				marginRight: "auto",
			}}
		>
			<h1 className={"text-lg font-semibold text-neutral-900"}>
				구슬 가격 관리
			</h1>
			<p style={{ marginBottom: 16 }} className={"text-sm text-neutral-700"}>
				여기서 저장하면 배포 없이 즉시 반영됩니다. 모든 변경은 사유와 함께 감사
				로그에 남고 Slack으로 알림이 갑니다.
			</p>
			<Tabs selectedKey={tab} onSelectionChange={(key) => setTab(Number(key))}>
				<Tabs.List aria-label="구슬 가격 관리" className="flex-wrap">
					{TABS.map((label, index) => (
						<Tabs.Tab key={label} id={index}>
							{label}
						</Tabs.Tab>
					))}
				</Tabs.List>
				<Tabs.Panel id={0} className="pt-6">
					<PricesTab onChanged={bumpChanges} />
				</Tabs.Panel>
				<Tabs.Panel id={1} className="pt-6">
					<DiscountsTab onChanged={bumpChanges} />
				</Tabs.Panel>
				<Tabs.Panel id={2} className="pt-6">
					<RefundPoliciesTab onChanged={bumpChanges} />
				</Tabs.Panel>
				<Tabs.Panel id={3} className="pt-6">
					<ChangesTab refreshKey={changeSeq} />
				</Tabs.Panel>
				<Tabs.Panel id={4} className="pt-6">
					<ReferenceTab />
				</Tabs.Panel>
			</Tabs>
		</div>
	);
}
