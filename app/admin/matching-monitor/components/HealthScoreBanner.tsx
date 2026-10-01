"use client";
import { Alert, Chip } from "@heroui/react";
import type { HealthScore } from "../types";
const gradeConfig: Record<
	HealthScore["grade"],
	{
		color: string;
		bg: string;
		label: string;
		border: string;
	}
> = {
	HEALTHY: {
		color: "#16a34a",
		bg: "#f0fdf4",
		label: "HEALTHY",
		border: "#bbf7d0",
	},
	CAUTION: {
		color: "#ca8a04",
		bg: "#fefce8",
		label: "CAUTION",
		border: "#fef08a",
	},
	CRITICAL: {
		color: "#dc2626",
		bg: "#fef2f2",
		label: "CRITICAL",
		border: "#fecaca",
	},
};
const FALLBACK_GRADE = gradeConfig.CAUTION;
export default function HealthScoreBanner({
	data,
}: {
	data: HealthScore;
}) {
	const config = gradeConfig[data.grade] || FALLBACK_GRADE;
	return (
		<div
			style={{
				padding: 24,
				borderRadius: 24,
				border: `2px solid ${config.border}`,
				backgroundColor: config.bg,
				display: "flex",
				flexDirection: "row",
				flexWrap: "wrap",
				alignItems: "center",
				gap: 24,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 16,
					minWidth: 200,
				}}
			>
				<div
					style={{
						width: 72,
						height: 72,
						borderRadius: "50%",
						border: `4px solid ${config.color}`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<h4 className={"text-lg font-semibold text-neutral-900"}>
						{data.score}
					</h4>
				</div>
				<div>
					<p className={"text-sm text-neutral-700"}>Health Score</p>
					<Chip
						style={{
							backgroundColor: config.color,
							color: "#fff",
							fontWeight: 700,
						}}
						size={"sm"}
						variant={"soft"}
					>
						<Chip.Label>{config.label}</Chip.Label>
					</Chip>
				</div>
			</div>
			{data.alerts.length > 0 && (
				<div
					style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}
				>
					{data.alerts.map((alert, i) => (
						<Alert
							key={i}
							style={{ paddingTop: 4, paddingBottom: 4 }}
							status={
								alert.level === "critical"
									? "danger"
									: alert.level === "warn"
										? "warning"
										: "default"
							}
						>
							<Alert.Content>{alert.message}</Alert.Content>
						</Alert>
					))}
				</div>
			)}
		</div>
	);
}
