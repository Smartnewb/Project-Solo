"use client";
import {
	Alert,
	Button,
	Card,
	Chip,
	Label,
	Modal,
	Separator,
	Spinner,
	Switch,
	ButtonGroup,
} from "@heroui/react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminService from "@/app/services/admin";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import { useToast } from "@/shared/ui/admin/toast";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import type { CommerceCatalogProduct, CommerceProvider } from "@/types/admin";
import CommerceProductDialog, {
	type CommerceProductFormValue,
} from "./commerce-product-dialog";
import LegacyAppleCatalogClient from "./iap-catalog-client";
import ProviderOperationsDialog, {
	type AppleRegistrationValue,
	type PlayRegistrationValue,
} from "./provider-operations-dialog";
type Region = "KR" | "JP";
const PROVIDER_LABELS: Record<CommerceProvider, string> = {
	APPLE_IAP: "Apple",
	GOOGLE_PLAY: "Play",
	PORTONE: "PortOne",
};
function isStoreReady(product: CommerceCatalogProduct) {
	const mappings = product.provider_mappings ?? [];
	const apple = mappings.find((mapping) => mapping.provider === "APPLE_IAP");
	const play = mappings.find((mapping) => mapping.provider === "GOOGLE_PLAY");
	const web = mappings.find((mapping) => mapping.channel === "WEB");
	return (
		apple?.storeState === "APPROVED" &&
		play?.storeState === "ACTIVE" &&
		Boolean(web?.active)
	);
}
function providerColor(state: string) {
	if (state === "APPROVED" || state === "ACTIVE") return "success" as const;
	if (state === "READY_TO_SUBMIT" || state === "WAITING_FOR_REVIEW")
		return "warning" as const;
	return "default" as const;
}
export default function CommerceCatalogClient() {
	const toast = useToast();
	const confirm = useConfirm();
	const queryClient = useQueryClient();
	const [topTab, setTopTab] = useState<"commerce" | "legacy">("commerce");
	const [region, setRegion] = useState<Region>("KR");
	const [showInactive, setShowInactive] = useState(false);
	const [productDialog, setProductDialog] = useState<
		CommerceCatalogProduct | null | "create"
	>(null);
	const [providerProduct, setProviderProduct] =
		useState<CommerceCatalogProduct | null>(null);
	const [publishOpen, setPublishOpen] = useState(false);
	const [appleSubmitOpen, setAppleSubmitOpen] = useState(false);
	const [busyAction, setBusyAction] = useState<string | null>(null);
	const catalogQuery = useQuery({
		queryKey: ["admin", "commerce-catalog"],
		queryFn: () => AdminService.iapCatalog.getCommerceProducts(),
	});
	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: ["admin", "commerce-catalog"] });
	const withError = (fallback: string) => (error: unknown) => {
		setBusyAction(null);
		toast.error(getAdminErrorMessage(error, fallback));
	};
	const createMutation = useMutation({
		mutationFn: (value: CommerceProductFormValue) =>
			AdminService.iapCatalog.createCommerceProduct(value),
		onSuccess: async () => {
			toast.success("KR/JP 상품 Draft를 생성했습니다.");
			setProductDialog(null);
			await invalidate();
		},
		onError: withError("상품 Draft 생성에 실패했습니다."),
	});
	const updateMutation = useMutation({
		mutationFn: ({
			versionId,
			value,
		}: {
			versionId: string;
			value: CommerceProductFormValue;
		}) =>
			AdminService.iapCatalog.updateCommerceDraft(versionId, {
				localizations: value.localizations,
				entitlements: value.entitlements,
				sortOrder: value.sortOrder,
				uiMetadata: value.uiMetadata,
			}),
		onSuccess: async () => {
			toast.success("KR/JP Draft를 수정했습니다.");
			setProductDialog(null);
			await invalidate();
		},
		onError: withError("Draft 수정에 실패했습니다."),
	});
	const activeMutation = useMutation({
		mutationFn: ({
			productId,
			isActive,
		}: {
			productId: string;
			isActive: boolean;
		}) => AdminService.iapCatalog.setCommerceProductActive(productId, isActive),
		onSuccess: async (result) => {
			toast.success(
				result.isActive ? "상품을 활성화했습니다." : "상품을 비활성화했습니다.",
			);
			await invalidate();
		},
		onError: withError("상품 활성 상태 변경에 실패했습니다."),
	});
	const cloneMutation = useMutation({
		mutationFn: ({
			krProductId,
			jpProductId,
		}: {
			krProductId: string;
			jpProductId: string;
		}) =>
			AdminService.iapCatalog.cloneCommerceVersion(krProductId, jpProductId),
		onSuccess: async () => {
			toast.success("새 KR/JP Draft 버전을 만들었습니다.");
			await invalidate();
		},
		onError: withError("Draft 복제에 실패했습니다."),
	});
	const publishMutation = useMutation({
		mutationFn: (body: {
			krProductVersionIds: string[];
			jpProductVersionIds: string[];
		}) => AdminService.iapCatalog.publishCommerceCatalog(body),
		onSuccess: async (result) => {
			toast.success(
				`카탈로그 발행 완료 · KR v${result.KR.version}, JP v${result.JP.version}`,
			);
			setPublishOpen(false);
			await invalidate();
		},
		onError: withError("카탈로그 발행에 실패했습니다."),
	});
	const providerMutation = useMutation({
		mutationFn: async (task: () => Promise<unknown>) => task(),
		onSuccess: async () => {
			toast.success("스토어 작업을 완료했습니다.");
			setBusyAction(null);
			await invalidate();
		},
		onError: withError("스토어 작업에 실패했습니다."),
	});
	const data = catalogQuery.data;
	const products = data?.[region] ?? [];
	const counterpartRegion: Region = region === "KR" ? "JP" : "KR";
	const krByKey = useMemo(
		() => new Map((data?.KR ?? []).map((item) => [item.product_key, item])),
		[data],
	);
	const jpByKey = useMemo(
		() => new Map((data?.JP ?? []).map((item) => [item.product_key, item])),
		[data],
	);
	const counterpartByKey = useMemo(
		() =>
			new Map(
				(data?.[counterpartRegion] ?? []).map((item) => [
					item.product_key,
					item,
				]),
			),
		[counterpartRegion, data],
	);
	const visibleProducts = products.filter(
		(product) => showInactive || product.is_active,
	);
	const activeKR = (data?.KR ?? []).filter((product) => product.is_active);
	const activeJP = (data?.JP ?? []).filter((product) => product.is_active);
	const readyKR = activeKR.filter(isStoreReady);
	const readyJP = activeJP.filter(isStoreReady);
	const publishReady =
		activeKR.length > 0 &&
		activeJP.length > 0 &&
		activeKR.length === readyKR.length &&
		activeJP.length === readyJP.length;
	const selectedProduct = productDialog === "create" ? null : productDialog;
	const currentProduct = selectedProduct
		? (krByKey.get(selectedProduct.product_key) ?? selectedProduct)
		: null;
	const currentCounterpart = selectedProduct
		? (jpByKey.get(selectedProduct.product_key) ?? null)
		: null;
	const normalizedProviderProduct = providerProduct
		? (krByKey.get(providerProduct.product_key) ?? providerProduct)
		: null;
	const providerCounterpart = providerProduct
		? (jpByKey.get(providerProduct.product_key) ?? null)
		: null;
	const runProvider = (action: string, task: () => Promise<unknown>) => {
		setBusyAction(action);
		providerMutation.mutate(task);
	};
	return (
		<div>
			<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4">
				<div>
					<h2 className={"text-lg font-semibold text-neutral-900"}>
						상품 카탈로그
					</h2>
					<p className={"text-sm text-neutral-700"}>
						비즈니스 상품을 만들고 Apple·Google Play·Web 결제를 연결한 뒤 앱
						카탈로그로 발행합니다.
					</p>
				</div>
				{topTab === "commerce" && (
					<div className="flex flex-wrap items-center gap-2">
						<Button
							onClick={() => catalogQuery.refetch()}
							variant={"secondary"}
							isDisabled={catalogQuery.isFetching}
							size={"md"}
						>
							새로고침
						</Button>
						<Button
							onClick={() => setPublishOpen(true)}
							variant={"secondary"}
							size={"md"}
						>
							발행 검토
						</Button>
						<Button
							onClick={() => setProductDialog("create")}
							variant={"primary"}
							size={"md"}
						>
							상품 Draft 생성
						</Button>
					</div>
				)}
			</div>
			<ButtonGroup aria-label="카탈로그 보기" className="flex-wrap">
				<Button
					key={"commerce"}
					aria-pressed={topTab === "commerce"}
					variant={topTab === "commerce" ? "primary" : "secondary"}
					onPress={() =>
						((key) => setTopTab(key as "commerce" | "legacy"))("commerce")
					}
				>
					{"표준 상품 카탈로그"}
				</Button>
				<Button
					key={"legacy"}
					aria-pressed={topTab === "legacy"}
					variant={topTab === "legacy" ? "primary" : "secondary"}
					onPress={() =>
						((key) => setTopTab(key as "commerce" | "legacy"))("legacy")
					}
				>
					{"Apple 미러·레거시 매핑"}
				</Button>
			</ButtonGroup>
			{topTab === "legacy" ? (
				<LegacyAppleCatalogClient />
			) : (
				<div className="flex flex-col gap-6">
					<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4">
						<Card style={{ flex: 1 }}>
							<Card.Content>
								<span className={"text-sm text-neutral-700"}>KR 상품</span>
								<h2 className={"text-lg font-semibold text-neutral-900"}>
									{data?.KR.length ?? 0}
								</h2>
								<span className={"text-sm text-neutral-700"}>
									발행 준비 {readyKR.length}/{activeKR.length}
								</span>
							</Card.Content>
						</Card>
						<Card style={{ flex: 1 }}>
							<Card.Content>
								<span className={"text-sm text-neutral-700"}>JP 상품</span>
								<h2 className={"text-lg font-semibold text-neutral-900"}>
									{data?.JP.length ?? 0}
								</h2>
								<span className={"text-sm text-neutral-700"}>
									발행 준비 {readyJP.length}/{activeJP.length}
								</span>
							</Card.Content>
						</Card>
						<Card style={{ flex: 1 }}>
							<Card.Content>
								<span className={"text-sm text-neutral-700"}>
									최종 발행 조건
								</span>
								<h2 className={"text-lg font-semibold text-neutral-900"}>
									{publishReady ? "준비 완료" : "스토어 연결 필요"}
								</h2>
								<span className={"text-sm text-neutral-700"}>
									Apple 승인 · Play 활성 · Web 매핑
								</span>
							</Card.Content>
						</Card>
					</div>
					{!publishReady && (
						<Alert status={"default"}>
							<Alert.Content>
								활성 상품 전체가 Apple 승인, Google Play 활성, Web 매핑을 갖춰야
								발행할 수 있습니다. 준비되지 않은 상품은 아래 스토어 연결에서
								확인하세요.
							</Alert.Content>
						</Alert>
					)}
					<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4">
						<ButtonGroup aria-label="카탈로그 국가" className="flex-wrap">
							<Button
								key={"KR"}
								aria-pressed={region === "KR"}
								variant={region === "KR" ? "primary" : "secondary"}
								onPress={() => ((key) => setRegion(key as Region))("KR")}
							>{`KR (${data?.KR.length ?? 0})`}</Button>
							<Button
								key={"JP"}
								aria-pressed={region === "JP"}
								variant={region === "JP" ? "primary" : "secondary"}
								onPress={() => ((key) => setRegion(key as Region))("JP")}
							>{`JP (${data?.JP.length ?? 0})`}</Button>
						</ButtonGroup>
						<Switch
							isSelected={showInactive}
							onChange={(checked) => setShowInactive(checked)}
						>
							<Switch.Content>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
								<Label>{"비활성 상품 포함"}</Label>
							</Switch.Content>
						</Switch>
					</div>
					{catalogQuery.isError && (
						<Alert status={"danger"}>
							<Alert.Content>
								{getAdminErrorMessage(
									catalogQuery.error,
									"상품 카탈로그를 불러오지 못했습니다.",
								)}
							</Alert.Content>
						</Alert>
					)}
					{catalogQuery.isLoading ? (
						<div>
							<Spinner aria-label="불러오는 중" size="sm" />
						</div>
					) : (
						<div className={"overflow-x-auto"}>
							<table
								className={
									"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
								}
							>
								<thead>
									<tr>
										<th scope="col">상품</th>
										<th scope="col">버전</th>
										<th scope="col">지급 혜택</th>
										<th scope="col">스토어 연결</th>
										<th scope="col">노출</th>
										<th scope="col">작업</th>
									</tr>
								</thead>
								<tbody>
									{visibleProducts.map((product) => {
										const counterpart = counterpartByKey.get(
											product.product_key,
										);
										const entitlement = product.entitlements[0];
										return (
											<tr key={product.product_version_id}>
												<td>
													<p className={"text-sm text-neutral-700"}>
														{product.display_name}
													</p>
													<span className={"text-sm text-neutral-700"}>
														{product.product_key}
													</span>
													{!counterpart && (
														<span className={"text-sm text-neutral-700"}>
															{counterpartRegion}대응 상품 없음
														</span>
													)}
												</td>
												<td>
													<div className="flex flex-wrap items-center gap-2">
														<Chip size={"sm"} variant={"soft"}>
															<Chip.Label>{`v${product.version}`}</Chip.Label>
														</Chip>
														<Chip size={"sm"} variant={"soft"}>
															<Chip.Label>{product.status}</Chip.Label>
														</Chip>
													</div>
												</td>
												<td>
													{entitlement ? (
														<p className={"text-sm text-neutral-700"}>
															{entitlement.type}· {entitlement.key}
															{entitlement.quantity
																? ` × ${entitlement.quantity.toLocaleString()}`
																: ""}
														</p>
													) : (
														<Chip size={"sm"} variant={"soft"}>
															<Chip.Label>{"혜택 없음"}</Chip.Label>
														</Chip>
													)}
												</td>
												<td style={{ minWidth: 250 }}>
													<div className="flex flex-wrap items-center gap-4">
														{(product.provider_mappings ?? []).map(
															(mapping) => (
																<Chip
																	key={`${mapping.provider}-${mapping.channel}-${mapping.externalProductId}`}
																	size={"sm"}
																	variant={"soft"}
																>
																	<Chip.Label>{`${PROVIDER_LABELS[mapping.provider]} · ${mapping.channel} · ${mapping.storeState}`}</Chip.Label>
																</Chip>
															),
														)}
														{(product.provider_mappings ?? []).length === 0 && (
															<Chip size={"sm"} variant={"soft"}>
																<Chip.Label>{"미연결"}</Chip.Label>
															</Chip>
														)}
													</div>
												</td>
												<td className="whitespace-nowrap">
													<Chip
														size={"sm"}
														variant={"soft"}
														color={product.is_active ? "success" : "default"}
													>
														<Chip.Label>
															{product.is_active ? "활성" : "비활성"}
														</Chip.Label>
													</Chip>
												</td>
												<td>
													<div className="flex flex-wrap items-center gap-2">
														{product.status === "DRAFT" ? (
															<Button
																onClick={() => setProductDialog(product)}
																variant={"tertiary"}
																size={"sm"}
															>
																편집
															</Button>
														) : (
															<Button
																onClick={() => {
																	const krProduct =
																		region === "KR" ? product : counterpart;
																	const jpProduct =
																		region === "JP" ? product : counterpart;
																	if (krProduct && jpProduct) {
																		cloneMutation.mutate({
																			krProductId: krProduct.id,
																			jpProductId: jpProduct.id,
																		});
																	}
																}}
																variant={"tertiary"}
																isDisabled={
																	!counterpart || cloneMutation.isPending
																}
																size={"sm"}
															>
																새 Draft
															</Button>
														)}
														<Button
															onClick={() => setProviderProduct(product)}
															variant={"secondary"}
															size={"sm"}
														>
															스토어 연결
														</Button>
														<Button
															onClick={async () => {
																const next = !product.is_active;
																const ok = await confirm({
																	title: next ? "상품 활성화" : "상품 비활성화",
																	message: next
																		? `${region} '${product.display_name}' 상품을 활성화합니다.`
																		: `${region} '${product.display_name}' 상품을 비활성화합니다. 다음 카탈로그 발행부터 구매 화면에서 제외됩니다.`,
																	confirmText: next ? "활성화" : "비활성화",
																	severity: next ? "warning" : "error",
																});
																if (!ok) return;
																activeMutation.mutate({
																	productId: product.id,
																	isActive: next,
																});
															}}
															variant={"tertiary"}
															isDisabled={activeMutation.isPending}
															size={"sm"}
														>
															{product.is_active ? "비활성화" : "활성화"}
														</Button>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}
			<CommerceProductDialog
				open={productDialog !== null}
				product={currentProduct}
				counterpart={currentCounterpart}
				loading={createMutation.isPending || updateMutation.isPending}
				onClose={() => setProductDialog(null)}
				onSubmit={(value) => {
					if (currentProduct) {
						updateMutation.mutate({
							versionId: currentProduct.product_version_id,
							value,
						});
					} else {
						createMutation.mutate(value);
					}
				}}
			/>
			<ProviderOperationsDialog
				open={providerProduct !== null}
				product={normalizedProviderProduct}
				counterpart={providerCounterpart}
				busyAction={busyAction}
				onClose={() => setProviderProduct(null)}
				onRegisterApple={(value: AppleRegistrationValue) =>
					normalizedProviderProduct &&
					runProvider("Apple 상품 등록", () =>
						AdminService.iapCatalog.registerAppleProduct(
							normalizedProviderProduct.product_version_id,
							value,
						),
					)
				}
				onRegisterPlay={(value: PlayRegistrationValue) =>
					normalizedProviderProduct &&
					runProvider("Google Play 상품 등록", () =>
						AdminService.iapCatalog.registerGooglePlayProduct(
							normalizedProviderProduct.product_version_id,
							value,
						),
					)
				}
				onSync={(provider) => {
					if (!normalizedProviderProduct) return;
					runProvider(
						`${provider === "APPLE_IAP" ? "Apple" : "Google Play"} 동기화`,
						() =>
							provider === "APPLE_IAP"
								? AdminService.iapCatalog.syncAppleCatalogStatus(
										normalizedProviderProduct.product_version_id,
									)
								: AdminService.iapCatalog.syncGooglePlayStatus(
										normalizedProviderProduct.product_version_id,
									),
					);
				}}
				onPlayState={(state) =>
					normalizedProviderProduct &&
					runProvider(`Google Play ${state}`, () =>
						AdminService.iapCatalog.setGooglePlayState(
							normalizedProviderProduct.product_version_id,
							state,
						),
					)
				}
				onAppleScreenshot={(file) =>
					normalizedProviderProduct &&
					runProvider("Apple 심사 스크린샷 업로드", () =>
						AdminService.iapCatalog.uploadAppleReviewScreenshot(
							normalizedProviderProduct.product_version_id,
							file,
						),
					)
				}
				onAppleSubmit={() => setAppleSubmitOpen(true)}
			/>
			<Modal.Backdrop
				isOpen={appleSubmitOpen}
				onOpenChange={(isOpen) => {
					if (!isOpen) (() => setAppleSubmitOpen(false))?.();
				}}
				isDismissable={true}
			>
				<Modal.Container size="md" scroll="inside">
					<Modal.Dialog style={{ width: '100%', maxWidth: 444, minWidth: 0 }}>
						<Modal.Header>
							<Modal.Heading>Apple IAP 심사 요청</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<p className={"text-sm text-neutral-700"}>
								심사 스크린샷과 상품 메타데이터를 Apple에 제출합니다. 최종 승인
								여부와 일정은 Apple이 결정합니다.
							</p>
						</Modal.Body>
						<Modal.Footer>
							<Button
								onClick={() => setAppleSubmitOpen(false)}
								variant={"tertiary"}
								size={"md"}
							>
								취소
							</Button>
							<Button
								onClick={() => {
									if (!normalizedProviderProduct) return;
									setAppleSubmitOpen(false);
									runProvider("Apple 심사 요청", () =>
										AdminService.iapCatalog.submitAppleReview(
											normalizedProviderProduct.product_version_id,
										),
									);
								}}
								variant={"primary"}
								size={"md"}
							>
								심사 요청
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
			<Modal.Backdrop
				isOpen={publishOpen}
				onOpenChange={(isOpen) => {
					if (!isOpen && !publishMutation.isPending) setPublishOpen(false);
				}}
				isDismissable={!publishMutation.isPending}
				isKeyboardDismissDisabled={publishMutation.isPending}
			>
				<Modal.Container size="md" scroll="inside">
					<Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
						<Modal.Header>
							<Modal.Heading>앱 카탈로그 발행 검토</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<div style={{ paddingTop: 8 }} className="flex flex-col gap-4">
								<Alert
									status={
										(
											{
												error: "danger",
												info: "default",
												warning: "warning",
												success: "success",
												default: "default",
											} as const
										)[publishReady ? "success" : "warning"]
									}
								>
									<Alert.Content>
										{publishReady
											? `KR ${activeKR.length}개, JP ${activeJP.length}개 상품을 immutable snapshot으로 발행합니다.`
											: "활성 상품 중 스토어 연결이 완료되지 않은 상품이 있어 발행할 수 없습니다."}
									</Alert.Content>
								</Alert>
								<Separator></Separator>
								<p className={"text-sm text-neutral-700"}>
									KR 준비: {readyKR.length}/{activeKR.length}
								</p>
								<p className={"text-sm text-neutral-700"}>
									JP 준비: {readyJP.length}/{activeJP.length}
								</p>
								<span className={"text-sm text-neutral-700"}>
									발행하면 이전 카탈로그는 보관되고 구매 화면은 새 버전을
									사용합니다. 결제 당시 가격과 혜택은 별도 스냅샷으로
									보존됩니다.
								</span>
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button
								onClick={() => setPublishOpen(false)}
								variant={"tertiary"}
								isDisabled={publishMutation.isPending}
								size={"md"}
							>
								취소
							</Button>
							<Button
								onClick={() =>
									publishMutation.mutate({
										krProductVersionIds: activeKR.map(
											(product) => product.product_version_id,
										),
										jpProductVersionIds: activeJP.map(
											(product) => product.product_version_id,
										),
									})
								}
								variant={"primary"}
								isDisabled={!publishReady || publishMutation.isPending}
								size={"md"}
							>
								{publishMutation.isPending ? "발행 중…" : "KR/JP 동시 발행"}
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);
}
