"use client";
import { useState } from "react";
import { Chip, Tabs } from "@heroui/react";
import { Globe, MessageSquareText } from "lucide-react";
import ReviewDashboard from "./components/ReviewDashboard";
import ReviewList from "./components/ReviewList";
import PublicReviewManagement from "./components/PublicReviewManagement";
export default function AppReviewsV2() {
	const [activeTab, setActiveTab] = useState(0);
	const [filterFromChart, setFilterFromChart] = useState<{
		rating?: number;
		store?: "APP_STORE" | "PLAY_STORE";
	} | null>(null);
	function handleChartClick(filter: {
		rating?: number;
		store?: "APP_STORE" | "PLAY_STORE";
	}) {
		setFilterFromChart(filter);
		setActiveTab(1);
	}
	return (
		<Tabs
			selectedKey={activeTab}
			onSelectionChange={(key) => {
				const next = Number(key);
				if (next === 0) setFilterFromChart(null);
				setActiveTab(next);
			}}
			className="min-w-0 space-y-5"
		>
			<header className="space-y-4 border-b border-gray-200 pb-4">
				<div className="flex items-center gap-3">
					<MessageSquareText size={22} />
					<div>
						<h1 className="text-xl font-semibold">앱 리뷰 관리</h1>
						<p className="text-sm text-muted">
							App Store, Play Store 리뷰를 한눈에 관리합니다
						</p>
					</div>
				</div>
				<Tabs.List aria-label="앱 리뷰 탭">
					<Tabs.Tab id={0}>리뷰 대시보드</Tabs.Tab>
					<Tabs.Tab id={1}>
						리뷰 목록
						{filterFromChart && activeTab === 1 && (
							<Chip size="sm">필터 적용됨</Chip>
						)}
					</Tabs.Tab>
					<Tabs.Tab id={2}>
						<Globe size={16} />
						외부 공개 관리
					</Tabs.Tab>
				</Tabs.List>
			</header>
			<Tabs.Panel id={0}>
				<ReviewDashboard onChartClick={handleChartClick} />
			</Tabs.Panel>
			<Tabs.Panel id={1}>
				<ReviewList
					initialFilter={filterFromChart}
					onFilterClear={() => setFilterFromChart(null)}
				/>
			</Tabs.Panel>
			<Tabs.Panel id={2}>
				<PublicReviewManagement />
			</Tabs.Panel>
		</Tabs>
	);
}
