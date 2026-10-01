"use client";
import { Button, Chip, Label, ListBox, Select, Spinner } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminService from "@/app/services/admin";
import { useToast } from "@/shared/ui/admin/toast";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import { useAdminSession } from "@/shared/contexts/admin-session-context";
import type { AdminGemProduct, AppleIapPriceSource } from "@/types/admin";
const SOURCE_LABELS: Record<AppleIapPriceSource, string> = {
	connect_api: "Connect API",
	app_observed: "앱 관측",
	manual: "수동",
};
const SOURCE_COLORS: Record<
	AppleIapPriceSource,
	"success" | "info" | "warning" | "default"
> = {
	connect_api: "success",
	app_observed: "info",
	manual: "warning",
};
const COUNTRY_DISPLAY: Record<
	string,
	{
		flag: string;
		label: string;
		storefront: "KOR" | "JPN";
	}
> = {
	kr: { flag: "🇰🇷", label: "대한민국", storefront: "KOR" },
	jp: { flag: "🇯🇵", label: "日本", storefront: "JPN" },
};
function formatDate(value: string): string {
	try {
		return new Date(value).toLocaleString("ko-KR", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return value;
	}
}
function formatGemProductLabel(product: AdminGemProduct): string {
	const price =
		product.applePrice?.displayPrice ??
		`${product.price.toLocaleString()} ${product.currency}`;
	const sku = product.appleSku ? ` · ${product.appleSku}` : "";
	return `${product.productName} (${product.totalGems}구슬, ${price})${sku}`;
}
export default function IapCatalogClient() {
	const toast = useToast();
	const queryClient = useQueryClient();
	const { session } = useAdminSession();
	const country = session?.selectedCountry ?? "kr";
	const countryDisplay = COUNTRY_DISPLAY[country] ?? COUNTRY_DISPLAY.kr;
	const storefront = countryDisplay.storefront;
	const [selectedProductBySku, setSelectedProductBySku] = useState<
		Record<string, string>
	>({});
	const iapProductsQuery = useQuery({
		queryKey: ["admin", "iap-catalog", "products", country, storefront],
		queryFn: () => AdminService.iapCatalog.getProducts(storefront),
	});
	const pricePointsQuery = useQuery({
		queryKey: ["admin", "iap-catalog", "price-points", country, storefront],
		queryFn: () => AdminService.iapCatalog.getPricePoints(storefront),
	});
	const gemProductsQuery = useQuery({
		queryKey: ["admin", "gem-products", "list", country],
		queryFn: () => AdminService.gemProducts.getList(),
	});
	useEffect(() => {
		const next: Record<string, string> = {};
		for (const product of iapProductsQuery.data ?? []) {
			if (product.mappedGemProductId)
				next[product.sku] = product.mappedGemProductId;
		}
		setSelectedProductBySku(next);
	}, [iapProductsQuery.data]);
	const syncMutation = useMutation({
		mutationFn: () => AdminService.iapCatalog.syncApplePrices(),
		onSuccess: (result) => {
			toast.success(
				`동기화 완료 (상품 ${result.productsSynced ?? 0}개, 가격 ${result.pricePointsSynced ?? result.synced}건${result.failed.length ? `, 실패 ${result.failed.length}건` : ""})`,
			);
			queryClient.invalidateQueries({ queryKey: ["admin", "iap-catalog"] });
		},
		onError: (error: unknown) => {
			toast.error(getAdminErrorMessage(error, "동기화에 실패했습니다."));
		},
	});
	const mapMutation = useMutation({
		mutationFn: ({
			sku,
			productId,
		}: {
			sku: string;
			productId: string;
		}) => AdminService.iapCatalog.mapAppleSkuToGemProduct(productId, sku),
		onSuccess: () => {
			toast.success("Apple SKU 매핑을 저장했습니다.");
			queryClient.invalidateQueries({
				queryKey: ["admin", "iap-catalog", "products"],
			});
			queryClient.invalidateQueries({
				queryKey: ["admin", "gem-products", "list"],
			});
		},
		onError: (error: unknown) => {
			toast.error(
				getAdminErrorMessage(error, "Apple SKU 매핑에 실패했습니다."),
			);
		},
	});
	const gemProducts = useMemo(
		() => gemProductsQuery.data ?? [],
		[gemProductsQuery.data],
	);
	const iapProducts = iapProductsQuery.data ?? [];
	const pricePoints = pricePointsQuery.data ?? [];
	const loading = iapProductsQuery.isLoading || gemProductsQuery.isLoading;
	return (
		<div>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 24,
					gap: 16,
					flexWrap: "wrap",
				}}
			>
				<div>
					<h2 className={"text-lg font-semibold text-neutral-900"}>
						IAP 카탈로그
					</h2>
					<p className={"text-sm text-neutral-700"}>
						{countryDisplay.flag}
						{countryDisplay.label}· App Store Connect 상품과 구슬 상품 매핑
					</p>
				</div>
				<Button
					onClick={() => syncMutation.mutate()}
					variant={"primary"}
					isDisabled={syncMutation.isPending}
					size={"md"}
				>
					{syncMutation.isPending ? (
						<Spinner aria-label="불러오는 중" size="sm" />
					) : (
						"Apple IAP 동기화"
					)}
				</Button>
			</div>
			{(iapProductsQuery.isError || gemProductsQuery.isError) && (
				<p style={{ marginBottom: 16 }} className={"text-sm text-neutral-700"}>
					{getAdminErrorMessage(
						iapProductsQuery.error ?? gemProductsQuery.error,
						"IAP 상품 목록을 불러오지 못했습니다.",
					)}
				</p>
			)}
			{loading ? (
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
			) : (
				<div style={{ marginBottom: 24 }} className={"overflow-x-auto"}>
					<table
						className={
							"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
						}
					>
						<thead>
							<tr>
								<th scope="col">Apple SKU</th>
								<th scope="col">상품명</th>
								<th scope="col">상태</th>
								<th scope="col">가격</th>
								<th scope="col">구슬 상품 매핑</th>
								<th scope="col">액션</th>
							</tr>
						</thead>
						<tbody>
							{iapProducts.length === 0 && (
								<tr>
									<td colSpan={6}>
										<p className={"text-sm text-neutral-700"}>
											동기화된 Apple IAP 상품이 없습니다.
										</p>
									</td>
								</tr>
							)}
							{iapProducts.map((product) => {
								const selectedProductId =
									selectedProductBySku[product.sku] ?? "";
								const unchanged =
									selectedProductId === (product.mappedGemProductId ?? "");
								const isSaving =
									mapMutation.isPending &&
									mapMutation.variables?.sku === product.sku;
								return (
									<tr key={product.sku}>
										<td>
											<p className={"text-sm text-neutral-700"}>
												{product.sku}
											</p>
										</td>
										<td>{product.name}</td>
										<td>
											<Chip size={"sm"} variant={"soft"}>
												<Chip.Label>{product.state}</Chip.Label>
											</Chip>
										</td>
										<td>
											{product.displayPrice ?? (
												<p className={"text-sm text-neutral-700"}>-</p>
											)}
										</td>
										<td style={{ minWidth: 320 }}>
											<div>
												<Select
													value={selectedProductId}
													onChange={(key) => {
														const value = String(key ?? "");
														setSelectedProductBySku((prev) => ({
															...prev,
															[product.sku]: value,
														}));
													}}
													className="w-full"
												>
													<Label>{"구슬 상품"}</Label>
													<Select.Trigger>
														<Select.Value />
														<Select.Indicator />
													</Select.Trigger>
													<Select.Popover>
														<ListBox>
															<ListBox.Item
																id={""}
																textValue={String("")}
																key={""}
															>
																<em>선택하세요</em>
															</ListBox.Item>
															{gemProducts.map((gemProduct) => (
																<ListBox.Item
																	id={gemProduct.id}
																	textValue={String(
																		formatGemProductLabel(gemProduct),
																	)}
																	key={gemProduct.id}
																>
																	{formatGemProductLabel(gemProduct)}
																</ListBox.Item>
															))}
														</ListBox>
													</Select.Popover>
												</Select>
											</div>
											{product.mappedGemProductName && (
												<span className={"text-sm text-neutral-700"}>
													현재 매핑: {product.mappedGemProductName}
												</span>
											)}
										</td>
										<td>
											<Button
												onClick={() =>
													mapMutation.mutate({
														sku: product.sku,
														productId: selectedProductId,
													})
												}
												variant={"secondary"}
												isDisabled={!selectedProductId || unchanged || isSaving}
												size={"sm"}
											>
												{isSaving ? (
													<Spinner aria-label="불러오는 중" size="sm" />
												) : (
													"매핑 저장"
												)}
											</Button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
			{pricePointsQuery.isError && (
				<p style={{ marginBottom: 16 }} className={"text-sm text-neutral-700"}>
					{getAdminErrorMessage(
						pricePointsQuery.error,
						"가격 포인트를 불러오지 못했습니다.",
					)}
				</p>
			)}
			<p style={{ marginBottom: 8 }} className={"text-sm text-neutral-700"}>
				가격 캐시
			</p>
			<div className={"overflow-x-auto"}>
				<table
					className={
						"w-full text-sm text-left [&_td]:p-3 [&_th]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
					}
				>
					<thead>
						<tr>
							<th scope="col">SKU</th>
							<th scope="col">스토어프론트</th>
							<th scope="col">가격</th>
							<th scope="col">통화</th>
							<th scope="col">표시 가격</th>
							<th scope="col">출처</th>
							<th scope="col">동기화 시각</th>
						</tr>
					</thead>
					<tbody>
						{pricePoints.length === 0 && (
							<tr>
								<td colSpan={7}>
									<p className={"text-sm text-neutral-700"}>
										저장된 가격 포인트가 없습니다.
									</p>
								</td>
							</tr>
						)}
						{pricePoints.map((pricePoint) => (
							<tr key={`${pricePoint.sku}-${pricePoint.storefront}`}>
								<td>
									<p className={"text-sm text-neutral-700"}>{pricePoint.sku}</p>
								</td>
								<td>{pricePoint.storefront}</td>
								<td>{pricePoint.price.toLocaleString()}</td>
								<td>{pricePoint.currency}</td>
								<td>{pricePoint.displayPrice}</td>
								<td>
									<Chip size={"sm"} variant={"soft"}>
										<Chip.Label>
											{SOURCE_LABELS[pricePoint.source] ?? pricePoint.source}
										</Chip.Label>
									</Chip>
								</td>
								<td>{formatDate(pricePoint.syncedAt)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
