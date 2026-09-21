'use client';

import { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import ChangesTab from './components/changes-tab';
import DiscountsTab from './components/discounts-tab';
import PricesTab from './components/prices-tab';
import ReferenceTab from './components/reference-tab';
import RefundPoliciesTab from './components/refund-policies-tab';

const TABS = ['정가', '기간 할인', '환급 정책', '변경 이력', '보상·환급 참고'] as const;

export default function GemPricingPage() {
	const [tab, setTab] = useState(0);
	// 어느 탭에서 뭘 바꾸든 감사 로그는 즉시 최신이어야 한다.
	const [changeSeq, setChangeSeq] = useState(0);
	const bumpChanges = () => setChangeSeq((n) => n + 1);

	return (
		<Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
			<Typography variant="h5" fontWeight={700} gutterBottom>
				구슬 가격 관리
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
				여기서 저장하면 배포 없이 즉시 반영됩니다. 모든 변경은 사유와 함께 감사 로그에 남고 Slack으로
				알림이 갑니다.
			</Typography>

			<Tabs
				value={tab}
				onChange={(_, v) => setTab(v)}
				sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
			>
				{TABS.map((label) => (
					<Tab key={label} label={label} />
				))}
			</Tabs>

			{tab === 0 && <PricesTab onChanged={bumpChanges} />}
			{tab === 1 && <DiscountsTab onChanged={bumpChanges} />}
			{tab === 2 && <RefundPoliciesTab onChanged={bumpChanges} />}
			{tab === 3 && <ChangesTab refreshKey={changeSeq} />}
			{tab === 4 && <ReferenceTab />}
		</Box>
	);
}
