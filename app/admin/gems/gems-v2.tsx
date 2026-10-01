"use client";
import {
	Alert,
	Avatar,
	Button,
	Card,
	Chip,
	Description,
	Input,
	Label,
	Modal,
	Radio,
	RadioGroup,
	Separator,
	Spinner,
	TextArea,
	TextField,
	Tooltip,
} from "@heroui/react";
import { Download, Gem, Phone, Plus, Search, Upload, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Controller } from "react-hook-form";
import { useToast } from "@/shared/ui/admin/toast";
import { useBulkGrantGems } from "@/app/admin/hooks";
import { adminGet } from "@/shared/lib/http/admin-fetch";
import { useAdminForm } from "@/app/admin/hooks/forms";
import {
	gemsFormSchema,
	type GemsFormData,
} from "@/app/admin/hooks/forms/schemas/gems.schema";
import { MAX_GEM_GRANT } from "@/app/admin/constants/gem-limits";
interface UserSearchResult {
	id: string;
	name: string;
	age: number;
	gender: "MALE" | "FEMALE";
	phoneNumber?: string;
	profileImageUrl?: string;
	appearanceGrade?: string;
	university?:
		| string
		| {
				name: string;
		  };
	universityDetails?: {
		name: string;
		department?: string;
	};
}
interface BulkGrantResponse {
	success?: boolean;
	message?: string;
	totalProcessed?: number;
	successCount?: number;
	failedCount?: number;
	errors?: Array<{
		identifier: string;
		reason: string;
	}>;
	pushNotificationResult?: {
		pushSuccessCount: number;
		pushFailureCount: number;
	};
}
function GemsManagementPageContent() {
	const csvInputRef = useRef<HTMLInputElement>(null);
	const toast = useToast();
	const bulkGrantGems = useBulkGrantGems();
	const { control, watch, reset, handleFormSubmit } =
		useAdminForm<GemsFormData>({
			schema: gemsFormSchema,
			defaultValues: {
				gemAmount: 10,
				message: "",
			},
		});
	const watchedMessage = watch("message") ?? "";
	// Non-form state (file upload related)
	const [inputMethod, setInputMethod] = useState<"phoneNumbers" | "csvFile">(
		"phoneNumbers",
	);
	const [phoneNumbersText, setPhoneNumbersText] = useState<string>("");
	const [csvFile, setCsvFile] = useState<File | null>(null);
	const [result, setResult] = useState<BulkGrantResponse | null>(null);
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const [pendingData, setPendingData] = useState<GemsFormData | null>(null);
	const [overLimitDialogOpen, setOverLimitDialogOpen] = useState(false);
	const [overLimitReason, setOverLimitReason] = useState("");
	const [userSearchTerm, setUserSearchTerm] = useState<string>("");
	const [userSearchResults, setUserSearchResults] = useState<
		UserSearchResult[]
	>([]);
	const [userSearchLoading, setUserSearchLoading] = useState(false);
	const [userSearchError, setUserSearchError] = useState<string | null>(null);
	const searchUsers = async () => {
		if (!userSearchTerm.trim()) {
			setUserSearchError("검색어를 입력해주세요.");
			return;
		}
		setUserSearchLoading(true);
		setUserSearchError(null);
		try {
			const isPhone = /^[\d\-]+$/.test(userSearchTerm.trim());
			const response = await adminGet<any>("/admin/v2/users/search", {
				page: "1",
				limit: "20",
				...(isPhone
					? { phoneNumber: userSearchTerm.trim() }
					: { name: userSearchTerm.trim() }),
			});
			let results: UserSearchResult[] = [];
			if (response?.data && Array.isArray(response.data)) {
				results = response.data;
			} else if (response?.items && Array.isArray(response.items)) {
				results = response.items;
			} else if (Array.isArray(response)) {
				results = response;
			}
			setUserSearchResults(results);
			if (results.length === 0) {
				setUserSearchError(`"${userSearchTerm}" 검색 결과가 없습니다.`);
			}
		} catch (err: any) {
			setUserSearchError(
				err.response?.data?.message || "사용자 검색 중 오류가 발생했습니다.",
			);
			setUserSearchResults([]);
		} finally {
			setUserSearchLoading(false);
		}
	};
	const handleAddUserPhone = (user: UserSearchResult) => {
		if (!user.phoneNumber) {
			toast.warning("해당 사용자의 전화번호 정보가 없습니다.");
			return;
		}
		const currentPhones = phoneNumbersText
			.split(/[,\n]/)
			.map((phone) => phone.trim())
			.filter((phone) => phone.length > 0);
		const normalizedNewPhone = user.phoneNumber.replaceAll(/[\s-]/g, "");
		const isDuplicate = currentPhones.some(
			(phone) => phone.replace(/[\s-]/g, "") === normalizedNewPhone,
		);
		if (isDuplicate) {
			toast.warning("이미 추가된 전화번호입니다.");
			return;
		}
		if (phoneNumbersText.trim()) {
			setPhoneNumbersText((prev) => prev + ", " + user.phoneNumber);
		} else {
			setPhoneNumbersText(user.phoneNumber || "");
		}
	};
	const validatePhoneNumber = (phoneNumber: string): boolean => {
		const cleaned = phoneNumber.replace(/[\s-]/g, "");
		const pattern = /^0\d{9,10}$/;
		return pattern.test(cleaned);
	};
	const formatPhoneNumberForDisplay = (value: string): string => {
		const numbers = value.replace(/[^0-9]/g, "");
		if (numbers.length <= 3) {
			return numbers;
		} else if (numbers.length <= 7) {
			return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
		} else if (numbers.length <= 11) {
			return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
		}
		return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
	};
	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
				toast.error("CSV 파일만 업로드할 수 있습니다.");
				return;
			}
			if (file.size > 10 * 1024 * 1024) {
				toast.error("파일 크기는 10MB 이하만 가능합니다.");
				return;
			}
			setCsvFile(file);
		}
	};
	const handleDownloadTemplate = () => {
		const csvContent = "phoneNumber\n010-1234-5678\n010-9876-5432";
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);
		link.setAttribute("href", url);
		link.setAttribute("download", "gem_grant_template.csv");
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};
	const handleSubmitClick = handleFormSubmit(async (data) => {
		if (inputMethod === "phoneNumbers" && !phoneNumbersText.trim()) {
			toast.error("전화번호를 입력해주세요.");
			return;
		}
		if (inputMethod === "csvFile" && !csvFile) {
			toast.error("CSV 파일을 업로드해주세요.");
			return;
		}
		if (inputMethod === "phoneNumbers") {
			const phoneNumberArray = phoneNumbersText
				.split(/[,\n]/)
				.map((phone) => phone.trim())
				.filter((phone) => phone.length > 0);
			const invalidPhones = phoneNumberArray.filter(
				(phone) => !validatePhoneNumber(phone),
			);
			if (invalidPhones.length > 0) {
				toast.error(
					`유효하지 않은 전화번호가 있습니다: ${invalidPhones.join(", ")}`,
				);
				return;
			}
		}
		setPendingData(data);
		setConfirmDialogOpen(true);
	});
	const handleConfirmSubmit = () => {
		if (!pendingData) return;
		setConfirmDialogOpen(false);
		if (pendingData.gemAmount > MAX_GEM_GRANT) {
			setOverLimitReason("");
			setOverLimitDialogOpen(true);
			return;
		}
		executeBulkGrant(pendingData);
	};
	const handleOverLimitConfirm = () => {
		if (!pendingData) return;
		setOverLimitDialogOpen(false);
		const grantData = {
			...pendingData,
			message: pendingData.message
				? `${pendingData.message} [상한 초과 사유: ${overLimitReason}]`
				: `[상한 초과 사유: ${overLimitReason}]`,
		};
		executeBulkGrant(grantData);
	};
	const executeBulkGrant = (data: GemsFormData) => {
		setResult(null);
		let phoneNumbers: string[] | undefined;
		if (inputMethod === "phoneNumbers") {
			phoneNumbers = phoneNumbersText
				.split(/[,\n]/)
				.map((phone) => phone.trim())
				.filter((phone) => phone.length > 0);
		}
		bulkGrantGems.mutate(
			{
				phoneNumbers,
				csvFile: inputMethod === "csvFile" ? csvFile || undefined : undefined,
				gemAmount: data.gemAmount,
				message: data.message,
			},
			{
				onSuccess: (response) => {
					setResult(response);
					if ((response.failedCount ?? 0) === 0) {
						toast.success("구슬 지급이 성공적으로 완료되었습니다!");
					} else {
						toast.warning(
							`구슬 지급이 완료되었습니다. 성공: ${response.successCount ?? 0}명, 실패: ${response.failedCount ?? 0}개`,
						);
					}
				},
				onError: (err: any) => {
					toast.error(
						err.response?.data?.message || "구슬 지급 중 오류가 발생했습니다.",
					);
				},
			},
		);
		setPendingData(null);
	};
	const handleReset = () => {
		setPhoneNumbersText("");
		setCsvFile(null);
		reset({ gemAmount: 10, message: "" });
		setResult(null);
	};
	const getUserCount = () => {
		if (inputMethod === "phoneNumbers") {
			return phoneNumbersText
				.split(/[,\n]/)
				.map((phone) => phone.trim())
				.filter((phone) => phone.length > 0).length;
		} else {
			return csvFile ? "파일" : 0;
		}
	};
	return (
		<div style={{ padding: 24 }}>
			<div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
				<Gem
					style={{ fontSize: 40, marginRight: 16, color: "#7A4AE2" }}
					size={18}
				/>
				<div>
					<h2 className={"text-lg font-semibold text-neutral-900"}>
						구슬 일괄 지급
					</h2>
					<p style={{ marginTop: 4 }} className={"text-sm text-neutral-700"}>
						여러 사용자에게 동일한 양의 구슬을 지급하고 푸시 알림을 발송합니다.
					</p>
				</div>
			</div>
			<section style={{ padding: 24, marginBottom: 24 }}>
				<div style={{ marginBottom: 24 }}>
					<Label>입력 방식 선택</Label>
					<RadioGroup
						aria-label="지급 대상 입력 방법"
						value={inputMethod}
						onChange={(value) =>
							setInputMethod(value as "phoneNumbers" | "csvFile")
						}
					>
						<Radio value={"phoneNumbers"}>
							<Radio.Content>
								<Radio.Control>
									<Radio.Indicator />
								</Radio.Control>
								<Label>{"전화번호 직접 입력"}</Label>
							</Radio.Content>
						</Radio>
						<Radio value={"csvFile"}>
							<Radio.Content>
								<Radio.Control>
									<Radio.Indicator />
								</Radio.Control>
								<Label>{"CSV 파일 업로드"}</Label>
							</Radio.Content>
						</Radio>
					</RadioGroup>
				</div>
				{inputMethod === "phoneNumbers" ? (
					<div style={{ marginBottom: 24 }}>
						<section
							style={{
								padding: 16,
								marginBottom: 24,
								backgroundColor: "#fafafa",
							}}
						>
							<p
								style={{
									marginBottom: 16,
									display: "flex",
									alignItems: "center",
									gap: 8,
								}}
								className={"text-sm text-neutral-700"}
							>
								<Search size={18} />
								사용자 검색으로 추가
							</p>
							<div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
								<TextField
									aria-label={"이름 또는 전화번호로 검색"}
									className="w-full"
								>
									<Input
										value={userSearchTerm}
										onChange={(e) => setUserSearchTerm(e.target.value)}
										placeholder="이름 또는 전화번호로 검색"
										aria-label={"이름 또는 전화번호로 검색"}
									/>
								</TextField>
								<Button
									onClick={searchUsers}
									style={{ minWidth: 80 }}
									variant={"primary"}
									isDisabled={userSearchLoading}
									size={"md"}
								>
									{userSearchLoading ? (
										<Spinner aria-label="불러오는 중" size="sm" />
									) : (
										"검색"
									)}
								</Button>
							</div>
							{userSearchError && (
								<Alert style={{ marginBottom: 16 }} status={"default"}>
									<Alert.Content>{userSearchError}</Alert.Content>
								</Alert>
							)}
							{userSearchResults.length > 0 && (
								<section style={{ maxHeight: 250, overflow: "auto" }}>
									<ul>
										{userSearchResults.map((user) => (
											<li
												key={user.id}
												className="flex items-center gap-3 p-3 border-b"
											>
												<span>
													<Avatar style={{ width: 36, height: 36 }}>
														<Avatar.Image
															src={user.profileImageUrl}
															alt={"프로필"}
														/>
														<Avatar.Fallback>
															<User size={18} />
														</Avatar.Fallback>
													</Avatar>
												</span>
												<span>
													{
														<div
															style={{
																display: "flex",
																alignItems: "center",
																gap: 8,
															}}
														>
															<p className={"text-sm text-neutral-700"}>
																{user.name}({user.age}세,{" "}
																{user.gender === "MALE" ? "남" : "여"})
															</p>
															{user.appearanceGrade && (
																<Chip
																	style={{ height: 18, fontSize: "0.65rem" }}
																	size={"sm"}
																	variant={"soft"}
																>
																	<Chip.Label>
																		{user.appearanceGrade}
																	</Chip.Label>
																</Chip>
															)}
														</div>
													}
													<small className="block text-neutral-600">
														{
															<div
																style={{
																	display: "flex",
																	alignItems: "center",
																	gap: 8,
																	marginTop: 4,
																}}
															>
																{user.phoneNumber && (
																	<div
																		style={{
																			display: "flex",
																			alignItems: "center",
																			gap: 4,
																		}}
																	>
																		<Phone
																			style={{ fontSize: 12, color: "#525252" }}
																			size={18}
																		/>
																		<span
																			className={"text-sm text-neutral-700"}
																		>
																			{user.phoneNumber}
																		</span>
																	</div>
																)}
																<span className={"text-sm text-neutral-700"}>
																	{user.university
																		? typeof user.university === "string"
																			? user.university
																			: user.university.name
																		: user.universityDetails?.name || ""}
																</span>
															</div>
														}
													</small>
												</span>
												<Button
													variant="secondary"
													size="sm"
													isDisabled={!user.phoneNumber}
													onPress={() => handleAddUserPhone(user)}
													aria-label={`${user.name} 선택`}
												>
													선택
												</Button>
											</li>
										))}
									</ul>
								</section>
							)}
						</section>
						<p
							style={{ marginBottom: 8 }}
							className={"text-sm text-neutral-700"}
						>
							전화번호
						</p>
						<TextField aria-label="전화번호" className="w-full">
							<TextArea
								rows={5}
								value={phoneNumbersText}
								onChange={(e) => setPhoneNumbersText(e.target.value)}
								placeholder="010-1234-5678, 010-9876-5432, 010-5555-6666"
								aria-label="전화번호"
							/>
							<Description>
								{
									"전화번호를 쉼표(,) 또는 줄바꿈으로 구분하여 입력하세요. (0으로 시작하는 10~11자리)"
								}
							</Description>
						</TextField>
					</div>
				) : (
					<div style={{ marginBottom: 24 }}>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 16,
								marginBottom: 8,
							}}
						>
							<p className={"text-sm text-neutral-700"}>CSV 파일 업로드</p>
							<Tooltip>
								<Button
									onClick={handleDownloadTemplate}
									variant={"tertiary"}
									size={"sm"}
								>
									{<Download size={18} />}템플릿 다운로드
								</Button>
								<Tooltip.Content>{"CSV 템플릿 다운로드"}</Tooltip.Content>
							</Tooltip>
						</div>
						<Button
							onPress={() => csvInputRef.current?.click()}
							style={{ paddingTop: 16, paddingBottom: 16 }}
							variant={"secondary"}
							size={"md"}
						>
							{<Upload size={18} />}
							{csvFile ? csvFile.name : "CSV 파일 선택"}
							<input
								ref={csvInputRef}
								type="file"
								hidden
								accept=".csv,text/csv"
								onChange={handleFileChange}
							/>
						</Button>
						<span
							style={{ marginTop: 8, display: "block" }}
							className={"text-sm text-neutral-700"}
						>
							phoneNumber 컬럼이 포함된 CSV 파일을 업로드하세요. (최대 10MB)
						</span>
					</div>
				)}
				<Separator style={{ marginTop: 24, marginBottom: 24 }}></Separator>
				<div className={"grid grid-cols-12 gap-4"}>
					<div className={"min-w-0 col-span-12 md:col-span-6"}>
						<p
							style={{ marginBottom: 8 }}
							className={"text-sm text-neutral-700"}
						>
							지급할 구슬 개수
						</p>
						<Controller
							name="gemAmount"
							control={control}
							render={({ field, fieldState }) => (
								<TextField
									aria-label="지급할 구슬 개수"
									className="w-full"
									isInvalid={!!fieldState.error}
								>
									<Input
										{...field}
										onChange={(e) =>
											field.onChange(Number.parseInt(e.target.value) || 0)
										}
										type="number"
										placeholder="10"
										required
										aria-label="지급할 구슬 개수"
										{...{ min: 1 }}
									/>
									<Description>{fieldState.error?.message}</Description>
								</TextField>
							)}
						/>
					</div>
				</div>
				<div style={{ marginTop: 24 }}>
					<p style={{ marginBottom: 8 }} className={"text-sm text-neutral-700"}>
						지급 사유 메시지 (푸시 알림으로 발송됨)
					</p>
					<Controller
						name="message"
						control={control}
						render={({ field, fieldState }) => (
							<TextField
								aria-label="지급 사유 메시지"
								className="w-full"
								isInvalid={!!fieldState.error}
							>
								<TextArea
									{...field}
									rows={3}
									placeholder="이벤트 참여 보상"
									required
									aria-label="지급 사유 메시지"
									{...{ maxLength: 200 }}
								/>
								<Description>
									{fieldState.error?.message ??
										`${watchedMessage.length}/200자 | 이 메시지는 사용자에게 푸시 알림으로 전송됩니다.`}
								</Description>
							</TextField>
						)}
					/>
				</div>
				<div style={{ display: "flex", gap: 16, marginTop: 24 }}>
					<Button
						onClick={handleSubmitClick}
						variant={"primary"}
						isDisabled={bulkGrantGems.isPending}
						size={"md"}
					>
						{bulkGrantGems.isPending ? (
							<Spinner aria-label="불러오는 중" size="sm" />
						) : (
							<Gem size={18} />
						)}
						{bulkGrantGems.isPending ? "처리 중..." : "구슬 지급 및 알림 발송"}
					</Button>
					<Button
						onClick={handleReset}
						variant={"secondary"}
						isDisabled={bulkGrantGems.isPending}
						size={"md"}
					>
						초기화
					</Button>
				</div>
			</section>
			{result && (
				<section style={{ padding: 24 }}>
					<h2
						style={{ marginBottom: 24 }}
						className={"text-lg font-semibold text-neutral-900"}
					>
						처리 결과
					</h2>
					<div
						style={{ marginBottom: 24 }}
						className={"grid grid-cols-12 gap-4"}
					>
						<div className={"min-w-0 col-span-12 md:col-span-4"}>
							<Card>
								<Card.Content>
									<p className={"text-sm text-neutral-700"}>전체 처리</p>
									<h4 className={"text-lg font-semibold text-neutral-900"}>
										{result.totalProcessed ?? 0}개
									</h4>
									<span className={"text-sm text-neutral-700"}>전화번호</span>
								</Card.Content>
							</Card>
						</div>
						<div className={"min-w-0 col-span-12 md:col-span-4"}>
							<Card style={{ borderColor: "#15803d" }}>
								<Card.Content>
									<p className={"text-sm text-neutral-700"}>✓ 성공</p>
									<h4 className={"text-lg font-semibold text-neutral-900"}>
										{result.successCount ?? 0}명
									</h4>
									<span className={"text-sm text-neutral-700"}>
										구슬 지급 완료
									</span>
								</Card.Content>
							</Card>
						</div>
						<div className={"min-w-0 col-span-12 md:col-span-4"}>
							<Card style={{ borderColor: "#dc2626" }}>
								<Card.Content>
									<p className={"text-sm text-neutral-700"}>✗ 실패</p>
									<h4 className={"text-lg font-semibold text-neutral-900"}>
										{result.failedCount ?? 0}개
									</h4>
									<span className={"text-sm text-neutral-700"}>전화번호</span>
								</Card.Content>
							</Card>
						</div>
					</div>
					{result.pushNotificationResult && (
						<Alert style={{ marginBottom: 24 }} status={"default"}>
							<Alert.Content>
								<p
									style={{ marginBottom: 8 }}
									className={"text-sm text-neutral-700"}
								>
									푸시 알림 발송 결과
								</p>
								<p className={"text-sm text-neutral-700"}>
									발송 성공: {result.pushNotificationResult.pushSuccessCount}명
									| 발송 실패: {result.pushNotificationResult.pushFailureCount}
									명
								</p>
								{result.pushNotificationResult.pushFailureCount > 0 && (
									<span
										style={{ display: "block", marginTop: 8 }}
										className={"text-sm text-neutral-700"}
									>
										* 푸시 알림 발송 실패 시에도 구슬 지급은 완료되었습니다.
									</span>
								)}
							</Alert.Content>
						</Alert>
					)}
					{(result.errors ?? []).length > 0 && (
						<div>
							<p
								style={{ marginBottom: 16 }}
								className={"text-sm text-neutral-700"}
							>
								실패 상세 내역
							</p>
							<div className={"overflow-x-auto"}>
								<table
									className={
										"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
									}
								>
									<thead>
										<tr>
											<th scope="col">전화번호</th>
											<th scope="col">실패 사유</th>
										</tr>
									</thead>
									<tbody>
										{(result.errors ?? []).map((error, index) => (
											<tr key={index}>
												<td>{formatPhoneNumberForDisplay(error.identifier)}</td>
												<td>
													<Chip size={"sm"} variant={"soft"}>
														<Chip.Label>
															{error.reason === "Phone number not registered"
																? "등록되지 않은 전화번호"
																: error.reason}
														</Chip.Label>
													</Chip>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</section>
			)}
			{/* 확인 다이얼로그 */}
			<Modal.Backdrop
				isOpen={confirmDialogOpen}
				onOpenChange={(isOpen) => {
					if (!isOpen) (() => setConfirmDialogOpen(false))?.();
				}}
				isDismissable={true}
			>
				<Modal.Container size="md" scroll="inside">
					<Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
						<Modal.Header>
							<Modal.Heading>구슬 지급 확인</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<div>
								다음 내용으로 구슬을 지급하시겠습니까?
								<div
									style={{
										marginTop: 16,
										padding: 16,
										backgroundColor: "#f5f5f5",
										borderRadius: 8,
									}}
								>
									<p className={"text-sm text-neutral-700"}>
										• 대상:{" "}
										{inputMethod === "phoneNumbers"
											? `${getUserCount()}개 전화번호`
											: "CSV 파일"}
									</p>
									<p className={"text-sm text-neutral-700"}>
										• 지급 구슬: {pendingData?.gemAmount ?? 0}개
									</p>
									<p
										style={{ marginTop: 8 }}
										className={"text-sm text-neutral-700"}
									>
										• 푸시 메시지: &quot;{pendingData?.message ?? ""}&quot;
									</p>
								</div>
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button
								onClick={() => setConfirmDialogOpen(false)}
								variant={"tertiary"}
								size={"md"}
							>
								취소
							</Button>
							<Button
								onClick={handleConfirmSubmit}
								variant={"primary"}
								size={"md"}
							>
								확인
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
			<Modal.Backdrop
				isOpen={overLimitDialogOpen}
				onOpenChange={(isOpen) => {
					if (!isOpen) (() => setOverLimitDialogOpen(false))?.();
				}}
				isDismissable={true}
			>
				<Modal.Container size="md" scroll="inside">
					<Modal.Dialog style={{ width: '100%', maxWidth: 444, minWidth: 0 }}>
						<Modal.Header>
							<Modal.Heading>구슬 지급 확인</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<p style={{ marginBottom: 16 }}>
								100개 이상의 구슬을 지급하려고 합니다. 사유를 입력해주세요.
							</p>
							<TextField className="w-full">
								<Label>{"지급 사유"}</Label>
								<TextArea
									value={overLimitReason}
									onChange={(e) => setOverLimitReason(e.target.value)}
									rows={3}
									autoFocus
								/>
							</TextField>
						</Modal.Body>
						<Modal.Footer>
							<Button
								onClick={() => setOverLimitDialogOpen(false)}
								variant={"tertiary"}
								size={"md"}
							>
								취소
							</Button>
							<Button
								onClick={handleOverLimitConfirm}
								variant={"primary"}
								isDisabled={!overLimitReason.trim()}
								size={"md"}
							>
								확인
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);
}
export default function GemsManagementPage() {
	return <GemsManagementPageContent />;
}
