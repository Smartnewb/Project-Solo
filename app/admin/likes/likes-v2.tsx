"use client";
import {
	Avatar,
	Button,
	Chip,
	Input,
	Label,
	ListBox,
	Pagination,
	Select,
	Spinner,
	TextField,
	Tooltip,
} from "@heroui/react";
import { Mail, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import type { LikeDetail, AdminLikesParams, LikeStatus } from "@/types/admin";
import { safeToLocaleString } from "@/app/utils/formatters";
import { useLikesList } from "@/app/admin/hooks";
type FilterStatus = LikeStatus | "ALL";
type FilterBoolean = "ALL" | "true" | "false";
type SortBy = "createdAt" | "viewedAt" | "mutualLikeAt";
type SortOrder = "asc" | "desc";
interface Filters {
	status: FilterStatus;
	hasLetter: FilterBoolean;
	isMutualLike: FilterBoolean;
	startDate: Date | null;
	endDate: Date | null;
	sortBy: SortBy;
	sortOrder: SortOrder;
}
const defaultFilters: Filters = {
	status: "ALL",
	hasLetter: "ALL",
	isMutualLike: "ALL",
	startDate: null,
	endDate: null,
	sortBy: "createdAt",
	sortOrder: "desc",
};
function LikesManagementPageContent() {
	const [page, setPage] = useState(1);
	const [searchName, setSearchName] = useState("");
	const [filters, setFilters] = useState<Filters>(defaultFilters);
	// Applied params - only updated on explicit search action
	const [appliedParams, setAppliedParams] = useState<AdminLikesParams>({
		page: 1,
		limit: 20,
		sortBy: "createdAt",
		sortOrder: "desc",
	});
	const { data, isLoading } = useLikesList(appliedParams);
	const likes = data?.items || [];
	const totalItems = data?.meta?.totalItems || 0;
	const itemsPerPage = data?.meta?.itemsPerPage || 20;
	const totalPages = Math.ceil(totalItems / itemsPerPage);
	const buildParams = (currentPage: number): AdminLikesParams => {
		const params: AdminLikesParams = {
			page: currentPage,
			limit: 20,
			sortBy: filters.sortBy,
			sortOrder: filters.sortOrder,
		};
		if (searchName.trim()) params.searchName = searchName.trim();
		if (filters.status !== "ALL") params.status = filters.status;
		if (filters.hasLetter !== "ALL")
			params.hasLetter = filters.hasLetter === "true";
		if (filters.isMutualLike !== "ALL")
			params.isMutualLike = filters.isMutualLike === "true";
		if (filters.startDate)
			params.startDate = filters.startDate.toISOString().split("T")[0];
		if (filters.endDate)
			params.endDate = filters.endDate.toISOString().split("T")[0];
		return params;
	};
	const handleFilterChange = <K extends keyof Filters>(
		field: K,
		value: Filters[K],
	) => {
		setFilters((prev) => ({ ...prev, [field]: value }));
	};
	const handleSearch = () => {
		setPage(1);
		setAppliedParams(buildParams(1));
	};
	const handleReset = () => {
		setSearchName("");
		setFilters(defaultFilters);
		setPage(1);
		setAppliedParams({
			page: 1,
			limit: 20,
			sortBy: "createdAt",
			sortOrder: "desc",
		});
	};
	const handlePageChange = (
		_: React.ChangeEvent<unknown> | null,
		value: number,
	) => {
		setPage(value);
		setAppliedParams(buildParams(value));
	};
	const formatDate = (dateString: string) => {
		return safeToLocaleString(dateString, "ko-KR", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};
	const getStatusChip = (status: LikeStatus) => {
		switch (status) {
			case "PENDING":
				return (
					<Chip size={"sm"} variant={"soft"}>
						<Chip.Label>{"대기중"}</Chip.Label>
					</Chip>
				);
			case "ACCEPTED":
				return (
					<Chip size={"sm"} variant={"soft"}>
						<Chip.Label>{"수락"}</Chip.Label>
					</Chip>
				);
			case "REJECTED":
				return (
					<Chip size={"sm"} variant={"soft"}>
						<Chip.Label>{"거절"}</Chip.Label>
					</Chip>
				);
			default:
				return (
					<Chip size={"sm"} variant={"soft"}>
						<Chip.Label>{status}</Chip.Label>
					</Chip>
				);
		}
	};
	const renderUserCell = (user: LikeDetail["sender"]) => (
		<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
			<Avatar style={{ width: 40, height: 40 }}>
				<Avatar.Image src={user.mainImageUrl || undefined} alt={user.name} />
				<Avatar.Fallback></Avatar.Fallback>
			</Avatar>
			<div>
				<p className={"text-sm text-neutral-700"}>
					{user.name}({user.age})
				</p>
				<span className={"text-sm text-neutral-700"}>{user.university}</span>
			</div>
		</div>
	);
	return (
		<>
			<div>
				<div
					style={{
						marginBottom: 24,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<div>
						<h2 className={"text-lg font-semibold text-neutral-900"}>
							좋아요 관리
						</h2>
						<p style={{ marginTop: 4 }} className={"text-sm text-neutral-700"}>
							시스템 내 모든 좋아요를 조회하고 관리합니다.
						</p>
					</div>
					<p className={"text-sm text-neutral-700"}>
						전체 {totalItems.toLocaleString()}건
					</p>
				</div>
				{/* 필터 영역 */}
				<section style={{ padding: 16, marginBottom: 24 }}>
					<div
						style={{
							display: "flex",
							flexWrap: "wrap",
							gap: 16,
							alignItems: "center",
						}}
					>
						<TextField aria-label={"이름 검색"} className="w-full">
							{
								<span>
									<Search size={18} />
								</span>
							}
							<Input
								placeholder="이름 검색"
								value={searchName}
								onChange={(e) => setSearchName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleSearch();
								}}
								style={{ minWidth: 180 }}
								aria-label={"이름 검색"}
							/>
						</TextField>
						<div style={{ minWidth: 120 }}>
							<Select
								value={filters.status}
								onChange={(key) => {
									const value = String(key ?? "");
									handleFilterChange("status", value as FilterStatus);
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
										<ListBox.Item
											id={"PENDING"}
											textValue={"대기중"}
											key={"PENDING"}
										>
											대기중
										</ListBox.Item>
										<ListBox.Item
											id={"ACCEPTED"}
											textValue={"수락"}
											key={"ACCEPTED"}
										>
											수락
										</ListBox.Item>
										<ListBox.Item
											id={"REJECTED"}
											textValue={"거절"}
											key={"REJECTED"}
										>
											거절
										</ListBox.Item>
									</ListBox>
								</Select.Popover>
							</Select>
						</div>
						<div style={{ minWidth: 100 }}>
							<Select
								value={filters.hasLetter}
								onChange={(key) => {
									const value = String(key ?? "");
									handleFilterChange("hasLetter", value as FilterBoolean);
								}}
								className="w-full"
							>
								<Label>{"편지"}</Label>
								<Select.Trigger>
									<Select.Value />
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										<ListBox.Item id={"ALL"} textValue={"전체"} key={"ALL"}>
											전체
										</ListBox.Item>
										<ListBox.Item id={"true"} textValue={"있음"} key={"true"}>
											있음
										</ListBox.Item>
										<ListBox.Item id={"false"} textValue={"없음"} key={"false"}>
											없음
										</ListBox.Item>
									</ListBox>
								</Select.Popover>
							</Select>
						</div>
						<div style={{ minWidth: 100 }}>
							<Select
								value={filters.isMutualLike}
								onChange={(key) => {
									const value = String(key ?? "");
									handleFilterChange("isMutualLike", value as FilterBoolean);
								}}
								className="w-full"
							>
								<Label>{"상호 좋아요"}</Label>
								<Select.Trigger>
									<Select.Value />
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										<ListBox.Item id={"ALL"} textValue={"전체"} key={"ALL"}>
											전체
										</ListBox.Item>
										<ListBox.Item id={"true"} textValue={"양방향"} key={"true"}>
											양방향
										</ListBox.Item>
										<ListBox.Item
											id={"false"}
											textValue={"단방향"}
											key={"false"}
										>
											단방향
										</ListBox.Item>
									</ListBox>
								</Select.Popover>
							</Select>
						</div>
						<TextField className="w-full">
							<Label>{"시작일"}</Label>
							<Input
								type="date"
								value={
									filters.startDate
										? format(filters.startDate, "yyyy-MM-dd")
										: ""
								}
								onChange={(event) =>
									((value) => handleFilterChange("startDate", value))(
										event.target.value
											? new Date(event.target.value + "T00:00:00")
											: null,
									)
								}
							/>
						</TextField>
						<TextField className="w-full">
							<Label>{"종료일"}</Label>
							<Input
								type="date"
								value={
									filters.endDate ? format(filters.endDate, "yyyy-MM-dd") : ""
								}
								onChange={(event) =>
									((value) => handleFilterChange("endDate", value))(
										event.target.value
											? new Date(event.target.value + "T00:00:00")
											: null,
									)
								}
							/>
						</TextField>
						<div style={{ minWidth: 120 }}>
							<Select
								value={filters.sortBy}
								onChange={(key) => {
									const value = String(key ?? "");
									handleFilterChange("sortBy", value as SortBy);
								}}
								className="w-full"
							>
								<Label>{"정렬기준"}</Label>
								<Select.Trigger>
									<Select.Value />
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										<ListBox.Item
											id={"createdAt"}
											textValue={"발송일"}
											key={"createdAt"}
										>
											발송일
										</ListBox.Item>
										<ListBox.Item
											id={"viewedAt"}
											textValue={"조회일"}
											key={"viewedAt"}
										>
											조회일
										</ListBox.Item>
										<ListBox.Item
											id={"mutualLikeAt"}
											textValue={"상호 좋아요 시간"}
											key={"mutualLikeAt"}
										>
											상호 좋아요 시간
										</ListBox.Item>
									</ListBox>
								</Select.Popover>
							</Select>
						</div>
						<div style={{ minWidth: 100 }}>
							<Select
								value={filters.sortOrder}
								onChange={(key) => {
									const value = String(key ?? "");
									handleFilterChange("sortOrder", value as SortOrder);
								}}
								className="w-full"
							>
								<Label>{"정렬순서"}</Label>
								<Select.Trigger>
									<Select.Value />
									<Select.Indicator />
								</Select.Trigger>
								<Select.Popover>
									<ListBox>
										<ListBox.Item id={"desc"} textValue={"최신순"} key={"desc"}>
											최신순
										</ListBox.Item>
										<ListBox.Item id={"asc"} textValue={"오래된순"} key={"asc"}>
											오래된순
										</ListBox.Item>
									</ListBox>
								</Select.Popover>
							</Select>
						</div>
						<div style={{ display: "flex", gap: 8 }}>
							<Button onClick={handleSearch} variant={"primary"} size={"md"}>
								검색
							</Button>
							<Button onClick={handleReset} variant={"secondary"} size={"md"}>
								{<RefreshCw size={18} />}초기화
							</Button>
						</div>
					</div>
				</section>
				{/* 테이블 */}
				{isLoading ? (
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							gap: 12,
							paddingTop: 64,
							paddingBottom: 64,
						}}
					>
						<Spinner aria-label="불러오는 중" size="sm" />
						<p className={"text-sm text-neutral-700"}>
							좋아요 목록을 불러오는 중입니다.
						</p>
					</div>
				) : likes.length === 0 ? (
					<div
						style={{ textAlign: "center", paddingTop: 64, paddingBottom: 64 }}
					>
						<p className={"text-sm text-neutral-700"}>
							조건에 맞는 좋아요가 없습니다.
						</p>
						<p style={{ marginTop: 4 }} className={"text-sm text-neutral-700"}>
							검색어와 필터를 줄이거나 초기화 후 다시 확인하세요.
						</p>
						<Button
							onClick={handleReset}
							style={{ marginTop: 16 }}
							variant={"secondary"}
							size={"md"}
						>
							{<RefreshCw size={18} />}필터 초기화
						</Button>
					</div>
				) : (
					<>
						<div style={{ marginBottom: 24 }} className={"overflow-x-auto"}>
							<table
								className={
									"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
								}
							>
								<thead>
									<tr>
										<th style={{ minWidth: 200 }} scope="col">
											보낸 사람
										</th>
										<th style={{ minWidth: 200 }} scope="col">
											받은 사람
										</th>
										<th style={{ minWidth: 100 }} scope="col">
											상태
										</th>
										<th style={{ minWidth: 80 }} scope="col">
											편지
										</th>
										<th style={{ minWidth: 100 }} scope="col">
											상호 좋아요
										</th>
										<th style={{ minWidth: 140 }} scope="col">
											발송일
										</th>
										<th style={{ minWidth: 100 }} scope="col">
											조회
										</th>
										<th style={{ minWidth: 80 }} scope="col">
											만료
										</th>
									</tr>
								</thead>
								<tbody>
									{likes.map((like) => (
										<tr key={like.id}>
											<td>{renderUserCell(like.sender)}</td>
											<td>{renderUserCell(like.forwardUser)}</td>
											<td>{getStatusChip(like.status)}</td>
											<td>
												{like.hasLetter && like.letterContent ? (
													<Tooltip>
														<Button
															variant={"tertiary"}
															isIconOnly={true}
															aria-label={"편지 내용 보기"}
															size={"sm"}
														>
															<Mail size={18} />
														</Button>
														<Tooltip.Content>
															{
																<p
																	style={{
																		whiteSpace: "pre-wrap",
																		color: "white",
																	}}
																	className={"text-sm text-neutral-700"}
																>
																	{like.letterContent}
																</p>
															}
														</Tooltip.Content>
													</Tooltip>
												) : (
													<p className={"text-sm text-neutral-700"}>-</p>
												)}
											</td>
											<td>
												{like.isMutualLike ? (
													<Chip size={"sm"} variant={"soft"}>
														<Chip.Label>{"양방향"}</Chip.Label>
													</Chip>
												) : (
													<Chip size={"sm"} variant={"soft"}>
														<Chip.Label>{"단방향"}</Chip.Label>
													</Chip>
												)}
											</td>
											<td>
												<p className={"text-sm text-neutral-700"}>
													{formatDate(like.createdAt)}
												</p>
											</td>
											<td>
												{like.viewedAt ? (
													<Tooltip>
														<Tooltip.Trigger tabIndex={0}>
															<p
																style={{ cursor: "help" }}
																className={"text-sm text-neutral-700"}
															>
																조회됨
															</p>
														</Tooltip.Trigger>
														<Tooltip.Content>
															{formatDate(like.viewedAt)}
														</Tooltip.Content>
													</Tooltip>
												) : (
													<p className={"text-sm text-neutral-700"}>미조회</p>
												)}
											</td>
											<td>
												{like.isMatchExpired ? (
													<Chip size={"sm"} variant={"soft"}>
														<Chip.Label>{"만료"}</Chip.Label>
													</Chip>
												) : (
													<Chip size={"sm"} variant={"soft"}>
														<Chip.Label>{"유효"}</Chip.Label>
													</Chip>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div style={{ display: "flex", justifyContent: "center" }}>
							<Pagination aria-label="페이지 이동">
								<Pagination.Summary>
									{page} / {Math.max(1, totalPages)}
								</Pagination.Summary>
								<Pagination.Content>
									<Pagination.Item>
										<Pagination.Previous
											isDisabled={page <= 1}
											onPress={() => handlePageChange(null, page - 1)}
										>
											이전
										</Pagination.Previous>
									</Pagination.Item>
									<Pagination.Item>
										<Pagination.Next
											isDisabled={page >= totalPages}
											onPress={() => handlePageChange(null, page + 1)}
										>
											다음
										</Pagination.Next>
									</Pagination.Item>
								</Pagination.Content>
							</Pagination>
						</div>
					</>
				)}
			</div>
		</>
	);
}
export default function LikesManagementPageV2() {
	return <LikesManagementPageContent />;
}
