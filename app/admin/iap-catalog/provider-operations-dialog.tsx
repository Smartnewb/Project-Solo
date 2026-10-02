"use client";
import {
	Alert,
	Button,
	Chip,
	Input,
	Label,
	Modal,
	Separator,
	Switch,
	ButtonGroup,
	TextArea,
	TextField,
} from "@heroui/react";
import { useEffect, useMemo, useState, useRef } from "react";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import type {
	CommerceCatalogProduct,
	CommerceProviderMapping,
} from "@/types/admin";
type Provider = "APPLE_IAP" | "GOOGLE_PLAY";
export interface AppleRegistrationValue {
	productId: string;
	referenceName: string;
	appleProductType:
		| "CONSUMABLE"
		| "NON_CONSUMABLE"
		| "NON_RENEWING_SUBSCRIPTION";
	reviewNote: string;
	localizations: Array<{
		locale: "ko" | "ja";
		name: string;
		description: string;
	}>;
	priceKRW: number;
	priceJPY: number;
}
export interface PlayRegistrationValue {
	productId: string;
	purchaseOptionId: string;
	localizations: Array<{
		languageCode: "ko-KR" | "ja-JP";
		title: string;
		description: string;
	}>;
	priceKRW: number;
	priceJPY: number;
	legacyCompatible: boolean;
}
interface ProviderOperationsDialogProps {
	open: boolean;
	product: CommerceCatalogProduct | null;
	counterpart: CommerceCatalogProduct | null;
	busyAction?: string | null;
	onClose: () => void;
	onRegisterApple: (value: AppleRegistrationValue) => void;
	onRegisterPlay: (value: PlayRegistrationValue) => void;
	onSync: (provider: Provider) => void;
	onPlayState: (state: "ACTIVE" | "INACTIVE") => void;
	onAppleScreenshot: (file: File) => void;
	onAppleSubmit: () => void;
}
function mappingFor(
	product: CommerceCatalogProduct | null,
	provider: Provider,
) {
	return (
		product?.provider_mappings?.find(
			(mapping) => mapping.provider === provider,
		) ?? null
	);
}
function priceFor(
	mapping: CommerceProviderMapping | null,
	storefront: "KOR" | "JPN",
) {
	return (
		mapping?.prices?.find((price) => price.storefront === storefront)?.amount ??
		0
	);
}
function appleTypeFor(product: CommerceCatalogProduct) {
	if (product.product_type === "FEATURE_UNLOCK")
		return "NON_CONSUMABLE" as const;
	if (product.product_type === "DURATION_ACCESS")
		return "NON_RENEWING_SUBSCRIPTION" as const;
	return "CONSUMABLE" as const;
}
const DEFAULT_REVIEW_NOTE = "표준 상품 카탈로그의 디지털 상품입니다.";
export default function ProviderOperationsDialog({
	open,
	product,
	counterpart,
	busyAction,
	onClose,
	onRegisterApple,
	onRegisterPlay,
	onSync,
	onPlayState,
	onAppleScreenshot,
	onAppleSubmit,
}: ProviderOperationsDialogProps) {
	const confirm = useConfirm();
	const screenshotInputRef = useRef<HTMLInputElement>(null);
	const [provider, setProvider] = useState<Provider>("APPLE_IAP");
	const appleMapping = mappingFor(product, "APPLE_IAP");
	const playMapping = mappingFor(product, "GOOGLE_PLAY");
	const counterpartApple = mappingFor(counterpart, "APPLE_IAP");
	const counterpartPlay = mappingFor(counterpart, "GOOGLE_PLAY");
	const productKey =
		product?.product_key.replace(/^apple:/, "").replace(/^legacy:/, "") ?? "";
	const [productId, setProductId] = useState(productKey);
	const [purchaseOptionId, setPurchaseOptionId] = useState("standard-buy");
	const [priceKRW, setPriceKRW] = useState(0);
	const [priceJPY, setPriceJPY] = useState(0);
	const [legacyCompatible, setLegacyCompatible] = useState(true);
	const [reviewNote, setReviewNote] = useState(DEFAULT_REVIEW_NOTE);
	// 상품이 바뀌거나 다이얼로그를 다시 열면 이전 상품에서 입력한 값이 남지 않게 초기화한다.
	useEffect(() => {
		if (!open) return;
		setReviewNote(DEFAULT_REVIEW_NOTE);
		setLegacyCompatible(true);
		setPurchaseOptionId("standard-buy");
	}, [open, product?.product_version_id]);
	useEffect(() => {
		if (!open || !product) return;
		const activeMapping = provider === "APPLE_IAP" ? appleMapping : playMapping;
		setProductId(activeMapping?.externalProductId ?? productKey);
		setPurchaseOptionId(activeMapping?.purchaseOptionId ?? "standard-buy");
		const krMapping = provider === "APPLE_IAP" ? appleMapping : playMapping;
		const jpMapping =
			provider === "APPLE_IAP" ? counterpartApple : counterpartPlay;
		setPriceKRW(priceFor(krMapping, "KOR"));
		setPriceJPY(priceFor(jpMapping, "JPN"));
	}, [
		appleMapping,
		counterpartApple,
		counterpartPlay,
		open,
		playMapping,
		product,
		productKey,
		provider,
	]);
	const mapping = provider === "APPLE_IAP" ? appleMapping : playMapping;
	const isDraft = product?.status === "DRAFT";
	const hasCounterpart = Boolean(counterpart);
	const valid =
		hasCounterpart && Boolean(productId.trim()) && priceKRW > 0 && priceJPY > 0;
	const isBusy = Boolean(busyAction);
	const providerLabel = provider === "APPLE_IAP" ? "Apple IAP" : "Google Play";
	const statusColor =
		mapping?.storeState === "APPROVED" || mapping?.storeState === "ACTIVE"
			? "success"
			: "default";
	const display = useMemo(
		() => ({
			kr: product?.display_name ?? "",
			jp: counterpart?.display_name ?? "",
		}),
		[counterpart?.display_name, product?.display_name],
	);
	if (!product) return null;
	return (
		<Modal.Backdrop
			isOpen={open}
			onOpenChange={(isOpen) => {
				if (!isOpen && !isBusy) onClose();
			}}
			isDismissable={!isBusy}
			isKeyboardDismissDisabled={isBusy}
		>
			<Modal.Container size="md" scroll="inside">
				<Modal.Dialog style={{ width: '100%', maxWidth: 900, minWidth: 0 }}>
					<Modal.Header>
						<Modal.Heading>스토어 연결 · {product.product_key}</Modal.Heading>
					</Modal.Header>
					<Modal.Body>
						<ButtonGroup aria-label="스토어 선택" className="flex-wrap">
							<Button
								key={"APPLE_IAP"}
								aria-pressed={provider === "APPLE_IAP"}
								variant={provider === "APPLE_IAP" ? "primary" : "secondary"}
								onPress={() =>
									((key) => setProvider(key as Provider))("APPLE_IAP")
								}
							>
								{"Apple IAP"}
							</Button>
							<Button
								key={"GOOGLE_PLAY"}
								aria-pressed={provider === "GOOGLE_PLAY"}
								variant={provider === "GOOGLE_PLAY" ? "primary" : "secondary"}
								onPress={() =>
									((key) => setProvider(key as Provider))("GOOGLE_PLAY")
								}
							>
								{"Google Play"}
							</Button>
						</ButtonGroup>
						<div className="flex flex-col gap-6">
							<div className="flex flex-wrap items-center gap-2">
								<p className={"text-sm text-neutral-700"}>현재 연결</p>
								{mapping ? (
									<>
										<Chip size={"sm"} variant={"soft"}>
											<Chip.Label>{mapping.externalProductId}</Chip.Label>
										</Chip>
										{mapping.purchaseOptionId && (
											<Chip size={"sm"} variant={"soft"}>
												<Chip.Label>{mapping.purchaseOptionId}</Chip.Label>
											</Chip>
										)}
										<Chip size={"sm"} variant={"soft"}>
											<Chip.Label>{mapping.storeState}</Chip.Label>
										</Chip>
									</>
								) : (
									<Chip size={"sm"} variant={"soft"}>
										<Chip.Label>{"미연결"}</Chip.Label>
									</Chip>
								)}
							</div>
							{!isDraft && !mapping && (
								<Alert status={"warning"}>
									<Alert.Content>
										발행된 버전에는 새 스토어 상품을 연결할 수 없습니다. 새
										Draft를 복제한 뒤 등록하세요.
									</Alert.Content>
								</Alert>
							)}
							{!hasCounterpart && !mapping && (
								<Alert status={"danger"}>
									<Alert.Content>
										JP 대응 상품이 없어 KOR/JPN 동시 등록을 진행할 수 없습니다.
										먼저 KR/JP 상품 쌍을 완성하세요.
									</Alert.Content>
								</Alert>
							)}
							<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4">
								<TextField
									className="w-full"
									isDisabled={Boolean(mapping) || !isDraft}
								>
									<Label>{`${providerLabel} 상품 ID`}</Label>
									<Input
										value={productId}
										onChange={(event) => setProductId(event.target.value)}
									/>
								</TextField>
								{provider === "GOOGLE_PLAY" && (
									<TextField
										className="w-full"
										isDisabled={Boolean(mapping) || !isDraft}
									>
										<Label>{"구매 옵션 ID"}</Label>
										<Input
											value={purchaseOptionId}
											onChange={(event) =>
												setPurchaseOptionId(event.target.value)
											}
										/>
									</TextField>
								)}
							</div>
							<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4">
								<TextField
									className="w-full"
									isDisabled={!isDraft || Boolean(mapping)}
								>
									<Label>{"KR 가격(KRW)"}</Label>
									<Input
										type="number"
										value={priceKRW || ""}
										onChange={(event) =>
											setPriceKRW(Number(event.target.value))
										}
									/>
								</TextField>
								<TextField
									className="w-full"
									isDisabled={!isDraft || Boolean(mapping)}
								>
									<Label>{"JP 가격(JPY)"}</Label>
									<Input
										type="number"
										value={priceJPY || ""}
										onChange={(event) =>
											setPriceJPY(Number(event.target.value))
										}
									/>
								</TextField>
							</div>
							{provider === "GOOGLE_PLAY" ? (
								<Switch
									isSelected={legacyCompatible}
									onChange={(checked) => setLegacyCompatible(checked)}
									isDisabled={!isDraft || Boolean(mapping)}
								>
									<Switch.Content>
										<Switch.Control>
											<Switch.Thumb />
										</Switch.Control>
										<Label>{"기존 Play Billing 상품 조회 방식과 호환"}</Label>
									</Switch.Content>
								</Switch>
							) : (
								<TextField
									className="w-full"
									isDisabled={!isDraft || Boolean(mapping)}
								>
									<Label>{"Apple 심사 메모"}</Label>
									<TextArea
										value={reviewNote}
										onChange={(event) => setReviewNote(event.target.value)}
										rows={4}
									/>
								</TextField>
							)}
							{isDraft && !mapping && (
								<Button
									onClick={async () => {
										const ok = await confirm({
											title: `${providerLabel} 상품 등록`,
											message: `'${product.product_key}' 상품을 ${providerLabel} 스토어에 등록합니다.\nKR ${priceKRW.toLocaleString()}원 / JP ${priceJPY.toLocaleString()}엔 가격으로 실제 스토어에 반영됩니다.`,
											confirmText: "등록",
											severity: "warning",
										});
										if (!ok) return;
										if (provider === "APPLE_IAP") {
											onRegisterApple({
												productId,
												referenceName: product.product_key.slice(0, 64),
												appleProductType: appleTypeFor(product),
												reviewNote,
												localizations: [
													{
														locale: "ko",
														name: display.kr.slice(0, 64),
														description: (
															product.description || display.kr
														).slice(0, 255),
													},
													{
														locale: "ja",
														name: display.jp.slice(0, 64),
														description: (
															counterpart?.description || display.jp
														).slice(0, 255),
													},
												],
												priceKRW,
												priceJPY,
											});
										} else {
											onRegisterPlay({
												productId,
												purchaseOptionId,
												localizations: [
													{
														languageCode: "ko-KR",
														title: display.kr.slice(0, 55),
														description: (
															product.description || display.kr
														).slice(0, 200),
													},
													{
														languageCode: "ja-JP",
														title: display.jp.slice(0, 55),
														description: (
															counterpart?.description || display.jp
														).slice(0, 200),
													},
												],
												priceKRW,
												priceJPY,
												legacyCompatible,
											});
										}
									}}
									variant={"primary"}
									isDisabled={!valid || isBusy}
									size={"md"}
								>
									{isBusy ? `${busyAction} 처리 중…` : `${providerLabel} 등록`}
								</Button>
							)}
							{mapping && (
								<>
									<Separator></Separator>
									<p className={"text-sm text-neutral-700"}>운영 작업</p>
									<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
										<Button
											onClick={() => onSync(provider)}
											variant={"secondary"}
											isDisabled={isBusy}
											size={"md"}
										>
											상태·가격 동기화
										</Button>
										{provider === "GOOGLE_PLAY" &&
											mapping.storeState !== "ACTIVE" && (
												<Button
													onClick={async () => {
														const ok = await confirm({
															title: "구매 옵션 활성화",
															message: `'${product.product_key}' Google Play 구매 옵션을 활성화합니다. 스토어에서 바로 구매 가능해집니다.`,
															confirmText: "활성화",
															severity: "warning",
														});
														if (ok) onPlayState("ACTIVE");
													}}
													variant={"primary"}
													isDisabled={isBusy}
													size={"md"}
												>
													구매 옵션 활성화
												</Button>
											)}
										{provider === "GOOGLE_PLAY" &&
											mapping.storeState === "ACTIVE" && (
												<Button
													onClick={async () => {
														const ok = await confirm({
															title: "구매 옵션 비활성화",
															message: `'${product.product_key}' Google Play 구매 옵션을 비활성화합니다. 스토어에서 더 이상 구매할 수 없게 됩니다.`,
															confirmText: "비활성화",
															severity: "error",
														});
														if (ok) onPlayState("INACTIVE");
													}}
													variant={"secondary"}
													isDisabled={isBusy}
													size={"md"}
												>
													구매 옵션 비활성화
												</Button>
											)}
										{provider === "APPLE_IAP" && (
											<Button
												onPress={() => screenshotInputRef.current?.click()}
												variant={"secondary"}
												isDisabled={isBusy}
												size={"md"}
											>
												심사 스크린샷 업로드
												<input
													hidden
													ref={screenshotInputRef}
													type="file"
													accept="image/png,image/jpeg"
													onChange={(event) => {
														const file = event.target.files?.[0];
														if (file) onAppleScreenshot(file);
														event.target.value = "";
													}}
												/>
											</Button>
										)}
										{provider === "APPLE_IAP" &&
											mapping.storeState === "READY_TO_SUBMIT" && (
												<Button
													onClick={onAppleSubmit}
													variant={"primary"}
													isDisabled={isBusy}
													size={"md"}
												>
													Apple 심사 요청
												</Button>
											)}
									</div>
									{busyAction && (
										<Alert status={"default"}>
											<Alert.Content>
												{busyAction}작업을 처리하고 있습니다.
											</Alert.Content>
										</Alert>
									)}
								</>
							)}
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button
							onClick={onClose}
							variant={"tertiary"}
							isDisabled={isBusy}
							size={"md"}
						>
							닫기
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
