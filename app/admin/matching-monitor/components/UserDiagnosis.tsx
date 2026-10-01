"use client";
import {
	Alert,
	Button,
	Card,
	Chip,
	Input,
	Spinner,
	TextField,
} from "@heroui/react";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { safeFormat } from "@/app/utils/formatters";
import { useUserDiagnosis } from "../hooks";
import type { UserDiagnosisResponse } from "../types";
export default function UserDiagnosis({
	initialUserId,
}: {
	initialUserId?: string;
}) {
	const [inputId, setInputId] = useState(initialUserId || "");
	const [searchId, setSearchId] = useState(initialUserId || "");
	useEffect(() => {
		if (initialUserId) {
			setInputId(initialUserId);
			setSearchId(initialUserId);
		}
	}, [initialUserId]);
	const { data, isLoading, error } = useUserDiagnosis(searchId);
	const handleSearch = () => {
		if (inputId.trim()) {
			setSearchId(inputId.trim());
		}
	};
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
			<Card>
				<Card.Content>
					<p className={"text-sm text-neutral-700"}>유저 매칭 진단</p>
					<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
						<TextField className="w-full" aria-label={"유저 ID 입력"}>
							<Input
								placeholder="유저 ID 입력"
								value={inputId}
								onChange={(e) => setInputId(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSearch()}
								style={{ flex: 1, maxWidth: 400 }}
								aria-label={"유저 ID 입력"}
							/>
						</TextField>
						<Button
							onClick={handleSearch}
							variant={"primary"}
							isDisabled={!inputId.trim()}
							size={"md"}
						>
							{<Search size={18} />}진단
						</Button>
					</div>
				</Card.Content>
			</Card>
			{isLoading && (
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						paddingTop: 32,
						paddingBottom: 32,
					}}
				>
					<Spinner aria-label="불러오는 중" size="sm" />
				</div>
			)}
			{error && (
				<Alert status={"danger"}>
					<Alert.Content>
						진단 조회 실패: {(error as Error).message}
					</Alert.Content>
				</Alert>
			)}
			{data && <DiagnosisResult data={data} />}
		</div>
	);
}
function DiagnosisResult({
	data,
}: {
	data: UserDiagnosisResponse;
}) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
			<div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
				<Card style={{ flex: 1, minWidth: 200 }}>
					<Card.Content style={{ textAlign: "center" }}>
						<span className={"text-sm text-neutral-700"}>
							30일 내 실패 횟수
						</span>
						<h4 className={"text-lg font-semibold text-neutral-900"}>
							{data.totalFailures30d}
						</h4>
						<span className={"text-sm text-neutral-700"}>
							{data.consecutiveFailureDays}일 연속
						</span>
					</Card.Content>
				</Card>
				<Card style={{ flex: 1, minWidth: 200 }}>
					<Card.Content style={{ textAlign: "center" }}>
						<span className={"text-sm text-neutral-700"}>이성 적격 유저</span>
						<h4 className={"text-lg font-semibold text-neutral-900"}>
							{data.poolVisibility.eligibleOpponents.toLocaleString()}
						</h4>
					</Card.Content>
				</Card>
				<Card style={{ flex: 1, minWidth: 200 }}>
					<Card.Content style={{ textAlign: "center" }}>
						<span className={"text-sm text-neutral-700"}>히스토리 제외</span>
						<h4 className={"text-lg font-semibold text-neutral-900"}>
							{data.poolVisibility.excludedByHistory.toLocaleString()}
						</h4>
					</Card.Content>
				</Card>
				<Card style={{ flex: 1, minWidth: 200 }}>
					<Card.Content style={{ textAlign: "center" }}>
						<span className={"text-sm text-neutral-700"}>
							실질 매칭 가능 풀
						</span>
						<h4 className={"text-lg font-semibold text-neutral-900"}>
							{data.poolVisibility.netEligible.toLocaleString()}
						</h4>
					</Card.Content>
				</Card>
			</div>
			{data.dominantFailureReason && (
				<Alert status={"warning"}>
					<Alert.Content>
						주요 실패 사유: <strong>{data.dominantFailureReason}</strong>
					</Alert.Content>
				</Alert>
			)}
			<Card>
				<Card.Content>
					<p className={"text-sm text-neutral-700"}>
						최근 실패 이력 ({data.failureHistory.length}건)
					</p>
					<div style={{ maxHeight: 500 }} className={"overflow-x-auto"}>
						<table
							className={
								"w-full text-sm text-left [&_td]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
							}
						>
							<thead>
								<tr>
									<th scope="col">시각</th>
									<th scope="col">유형</th>
									<th scope="col">사유</th>
									<th scope="col">파이프라인</th>
									<th scope="col">릴랙스</th>
									<th scope="col">필터 전</th>
									<th scope="col">필터 후</th>
									<th scope="col">지역 풀</th>
								</tr>
							</thead>
							<tbody>
								{data.failureHistory.map((item, i) => (
									<tr key={i}>
										<td>
											<span className={"text-sm text-neutral-700"}>
												{safeFormat(item.failedAt, "MM/dd HH:mm")}
											</span>
										</td>
										<td>
											<Chip size={"sm"} variant={"soft"}>
												<Chip.Label>{item.matchType}</Chip.Label>
											</Chip>
										</td>
										<td>
											<p
												style={{
													maxWidth: 180,
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												}}
												title={item.failureReason}
												className={"text-sm text-neutral-700"}
											>
												{item.failureReason}
											</p>
										</td>
										<td>
											<span className={"text-sm text-neutral-700"}>
												{item.pipelineStep}
											</span>
										</td>
										<td>{item.maxRelaxationLevel ?? "-"}</td>
										<td>
											{item.candidatesBeforeFilter?.toLocaleString() ?? "-"}
										</td>
										<td>
											{item.candidatesAfterFilter?.toLocaleString() ?? "-"}
										</td>
										<td>{item.poolInRegion?.toLocaleString() ?? "-"}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Card.Content>
			</Card>
		</div>
	);
}
