"use client";
import { Button, Spinner } from "@heroui/react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { getCurrentWeekInfo } from "../types";
interface WeekSelectorProps {
	year: number;
	week: number;
	weekLabel: string;
	onWeekChange: (year: number, week: number) => void;
	onGenerate: () => void;
	generating: boolean;
}
function getMaxWeeksInYear(year: number): number {
	const dec28 = new Date(year, 11, 28);
	const dayOfYear =
		Math.floor((dec28.getTime() - new Date(year, 0, 1).getTime()) / 86400000) +
		1;
	return Math.ceil(dayOfYear / 7);
}
export default function WeekSelector({
	year,
	week,
	weekLabel,
	onWeekChange,
	onGenerate,
	generating,
}: WeekSelectorProps) {
	const current = getCurrentWeekInfo();
	const isCurrentOrFuture =
		year > current.year || (year === current.year && week >= current.week);
	const handlePrev = () => {
		if (week <= 1) {
			const prevYear = year - 1;
			onWeekChange(prevYear, getMaxWeeksInYear(prevYear));
		} else {
			onWeekChange(year, week - 1);
		}
	};
	const handleNext = () => {
		if (isCurrentOrFuture) return;
		const maxWeeks = getMaxWeeksInYear(year);
		if (week >= maxWeeks) {
			onWeekChange(year + 1, 1);
		} else {
			onWeekChange(year, week + 1);
		}
	};
	return (
		<div
			style={{
				display: "flex",
				flexWrap: "wrap",
				alignItems: "center",
				gap: 16,
			}}
		>
			<Button
				onClick={handlePrev}
				variant={"tertiary"}
				isIconOnly={true}
				aria-label="이전 주"
				size={"sm"}
			>
				<ChevronLeft size={18} />
			</Button>
			<h2
				style={{ minWidth: 140, textAlign: "center" }}
				className={"text-lg font-semibold text-neutral-900"}
			>
				{weekLabel}
			</h2>
			<Button
				onClick={handleNext}
				variant={"tertiary"}
				isDisabled={isCurrentOrFuture}
				isIconOnly={true}
				aria-label="다음 주"
				size={"sm"}
			>
				<ChevronRight size={18} />
			</Button>
			<Button
				onClick={onGenerate}
				style={{ marginLeft: 16, textTransform: "none" }}
				variant={"secondary"}
				isDisabled={generating}
				size={"sm"}
			>
				{generating ? (
					<Spinner aria-label="불러오는 중" size="sm" />
				) : (
					<RefreshCw size={18} />
				)}
				{generating ? "생성 중..." : "리포트 생성"}
			</Button>
		</div>
	);
}
