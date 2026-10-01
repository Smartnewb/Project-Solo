"use client";
import {
	Alert,
	Button,
	Chip,
	Input,
	Label,
	ListBox,
	Select,
	Spinner,
	Tabs,
	TextField,
} from "@heroui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminService from "@/app/services/admin";
import type {
	MeetingRefundFailure,
	MeetingRoomRow,
	MeetingRoomStatus,
} from "@/app/services/admin";
import { meetingErrorMessage } from "./lib/errors";
import {
	ROOM_STATUS_ORDER,
	formatKst,
	genderLabel,
	roomRegionLabel,
	roomStatusColor,
	roomStatusLabel,
	shortId,
} from "./lib/format";
import { RefundFailuresTable } from "./refund-failures-table";
import { RoomDetailDrawer } from "./room-detail-drawer";
type TabValue = "rooms" | "refund-failures";
type StatusFilter = "ALL" | MeetingRoomStatus;
const LIST_COLUMNS = [
	"상태",
	"미팅 시각",
	"호스트",
	"지역",
	"제목 / 장소",
	"생성",
	"방 ID",
];
function matchesSearch(room: MeetingRoomRow, term: string): boolean {
	if (!term) return true;
	const haystack = [
		room.id,
		room.title,
		room.placeName,
		room.placeRegionLabel,
		room.hostRegionCode,
		room.hostUserId,
	]
		.filter(
			(value): value is string => typeof value === "string" && value.length > 0,
		)
		.join(" ")
		.toLowerCase();
	return haystack.includes(term.toLowerCase());
}
export default function MeetingAdminClient() {
	const [tab, setTab] = useState<TabValue>("rooms");
	const [rooms, setRooms] = useState<MeetingRoomRow[]>([]);
	const [roomsLoading, setRoomsLoading] = useState(true);
	const [roomsError, setRoomsError] = useState<string | null>(null);
	const [failures, setFailures] = useState<MeetingRefundFailure[]>([]);
	const [failuresLoading, setFailuresLoading] = useState(true);
	const [failuresError, setFailuresError] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
	const [search, setSearch] = useState("");
	const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
	// 상세에서 처리(환불·취소 등)가 끝나면 방 목록과 환불 실패 목록을 같이 새로 읽는다.
	const [refreshKey, setRefreshKey] = useState(0);
	const fetchRooms = useCallback(async () => {
		setRoomsLoading(true);
		setRoomsError(null);
		try {
			setRooms(await AdminService.meeting.listRooms());
		} catch (fetchError) {
			setRoomsError(
				meetingErrorMessage(fetchError, "미팅 방 목록을 불러오지 못했어요."),
			);
			setRooms([]);
		} finally {
			setRoomsLoading(false);
		}
	}, []);
	const fetchFailures = useCallback(async () => {
		setFailuresLoading(true);
		setFailuresError(null);
		try {
			setFailures(await AdminService.meeting.listRefundFailures());
		} catch (fetchError) {
			setFailuresError(
				meetingErrorMessage(fetchError, "환불 실패 목록을 불러오지 못했어요."),
			);
			setFailures([]);
		} finally {
			setFailuresLoading(false);
		}
	}, []);
	useEffect(() => {
		fetchRooms();
		fetchFailures();
	}, [fetchRooms, fetchFailures, refreshKey]);
	const handleChanged = useCallback(() => {
		setRefreshKey((current) => current + 1);
	}, []);
	const filteredRooms = useMemo(() => {
		const term = search.trim();
		return rooms.filter(
			(room) =>
				(statusFilter === "ALL" || room.status === statusFilter) &&
				matchesSearch(room, term),
		);
	}, [rooms, statusFilter, search]);
	return (
		<div style={{ padding: 24 }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					gap: 16,
					marginBottom: 16,
				}}
			>
				<div>
					<h2 className={"text-lg font-semibold text-neutral-900"}>2:2 미팅</h2>
					<p style={{ marginTop: 4 }} className={"text-sm text-neutral-700"}>
						미팅 방과 보증금을 확인하고 체크인·환불·취소를 처리해요. 시각은 모두
						한국 시간(KST), 금액은 원화예요.
					</p>
				</div>
				<Button
					style={{ flexShrink: 0, whiteSpace: "nowrap" }}
					onClick={handleChanged}
					variant={"secondary"}
					isDisabled={roomsLoading || failuresLoading}
					size={"sm"}
				>
					새로고침
				</Button>
			</div>
			<section>
				<Tabs
					selectedKey={tab}
					onSelectionChange={(key) => setTab(key as TabValue)}
				>
					<Tabs.List aria-label="미팅 관리 분류">
						<Tabs.Tab id={"rooms"}>{"미팅 방"}</Tabs.Tab>
						<Tabs.Tab id={"refund-failures"}>
							{
								<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
									환불 실패
									{failures.length > 0 && (
										<Chip size={"sm"} variant={"soft"}>
											<Chip.Label>{failures.length}</Chip.Label>
										</Chip>
									)}
								</div>
							}
						</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel id="rooms">
						<div>
							<div
								style={{
									display: "flex",
									gap: 12,
									flexWrap: "wrap",
									alignItems: "center",
									padding: 16,
								}}
							>
								<div style={{ minWidth: 160 }}>
									<Select
										value={statusFilter}
										onChange={(key) => {
											const value = String(key ?? "");
											setStatusFilter(value as StatusFilter);
										}}
										className="w-full"
									>
										<Label>{"상태"}</Label>
										<Select.Trigger>
											<Select.Value />
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												<ListBox.Item id={"ALL"} textValue={"전체"} key={"ALL"}>
													전체
												</ListBox.Item>
												{ROOM_STATUS_ORDER.map((status) => (
													<ListBox.Item
														id={status}
														textValue={String(roomStatusLabel(status))}
														key={status}
													>
														{roomStatusLabel(status)}
													</ListBox.Item>
												))}
											</ListBox>
										</Select.Popover>
									</Select>
								</div>
								<TextField className="w-full">
									<Label>{"검색 (방 ID·제목·장소·호스트 ID)"}</Label>
									<Input
										value={search}
										onChange={(event) => setSearch(event.target.value)}
										style={{ minWidth: "100%" }}
									/>
								</TextField>
								<p
									style={{ marginLeft: "auto" }}
									className={"text-sm text-neutral-700"}
								>
									{filteredRooms.length.toLocaleString("ko-KR")}개 / 전체{" "}
									{rooms.length.toLocaleString("ko-KR")}개 (최근 100개)
								</p>
							</div>
							{roomsError && (
								<Alert
									style={{ marginLeft: 16, marginRight: 16, marginBottom: 16 }}
									status={"danger"}
								>
									<Alert.Content>{roomsError}</Alert.Content>
								</Alert>
							)}
							<div className={"overflow-x-auto"}>
								<table
									className={
										"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
									}
								>
									<thead>
										<tr style={{ backgroundColor: "#fafafa" }}>
											{LIST_COLUMNS.map((heading) => (
												<th
													key={heading}
													style={{ fontWeight: 600, whiteSpace: "nowrap" }}
													scope="col"
												>
													{heading}
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{roomsLoading ? (
											<tr>
												<td
													colSpan={LIST_COLUMNS.length}
													style={{ paddingTop: 48, paddingBottom: 48 }}
												>
													<Spinner aria-label="불러오는 중" size="sm" />
												</td>
											</tr>
										) : filteredRooms.length === 0 ? (
											<tr>
												<td
													colSpan={LIST_COLUMNS.length}
													style={{
														paddingTop: 48,
														paddingBottom: 48,
														color: "#525252",
													}}
												>
													미팅 방이 없어요.
												</td>
											</tr>
										) : (
											filteredRooms.map((room) => (
												<tr
													key={room.id}
													style={{ cursor: "pointer" }}
													data-testid={`meeting-room-row-${room.id}`}
												>
													<td>
														<Chip size={"sm"} variant={"soft"}>
															<Chip.Label>
																{roomStatusLabel(room.status)}
															</Chip.Label>
														</Chip>
													</td>
													<td style={{ whiteSpace: "nowrap" }}>
														{formatKst(room.scheduledAt)}
													</td>
													<td>{genderLabel(room.hostGender)}</td>
													<td style={{ whiteSpace: "nowrap" }}>
														{roomRegionLabel(room)}
													</td>
													<td style={{ maxWidth: 320 }}>
														<p className={"text-sm text-neutral-700"}>
															<Button
																variant="ghost"
																onPress={() => setSelectedRoomId(room.id)}
																aria-label={`미팅 방 ${room.title || room.id} 열기`}
															>
																{room.title || "제목 없음"}
															</Button>
														</p>
														<span className={"text-sm text-neutral-700"}>
															{room.placeName || "장소 미정"}
														</span>
													</td>
													<td style={{ whiteSpace: "nowrap" }}>
														{formatKst(room.createdAt)}
													</td>
													<td>
														<span
															style={{ fontFamily: "monospace" }}
															title={room.id}
															className={"text-sm text-neutral-700"}
														>
															{shortId(room.id)}
														</span>
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						</div>
					</Tabs.Panel>
					<Tabs.Panel id="refund-failures">
						<RefundFailuresTable
							items={failures}
							loading={failuresLoading}
							error={failuresError}
							onDismissError={() => setFailuresError(null)}
							onOpenRoom={setSelectedRoomId}
							onChanged={handleChanged}
						/>
					</Tabs.Panel>
				</Tabs>
			</section>
			<RoomDetailDrawer
				roomId={selectedRoomId}
				onClose={() => setSelectedRoomId(null)}
				onChanged={handleChanged}
			/>
		</div>
	);
}
