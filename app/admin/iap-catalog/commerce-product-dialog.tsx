"use client";
import {
	Button,
	Description,
	Input,
	Label,
	ListBox,
	Modal,
	Select,
	TextArea,
	TextField,
} from "@heroui/react";
import { useEffect, useState } from "react";
import type {
	CommerceCatalogProduct,
	CommerceEntitlement,
	CommerceProductType,
	CreateCommerceProductRequest,
} from "@/types/admin";
export type CommerceProductFormValue = CreateCommerceProductRequest;
interface CommerceProductDialogProps {
	open: boolean;
	product?: CommerceCatalogProduct | null;
	counterpart?: CommerceCatalogProduct | null;
	loading?: boolean;
	onClose: () => void;
	onSubmit: (value: CommerceProductFormValue) => void;
}
const INITIAL_FORM: CommerceProductFormValue = {
	productKey: "",
	productType: "CONSUMABLE",
	localizations: [
		{ country: "KR", displayName: "", description: "" },
		{ country: "JP", displayName: "", description: "" },
	],
	entitlements: [{ type: "GEM", key: "gem", quantity: 1 }],
	sortOrder: 0,
	uiMetadata: {},
};
const PRODUCT_TYPE_LABELS: Record<CommerceProductType, string> = {
	CONSUMABLE: "소모성 상품",
	BUNDLE: "복합 번들",
	DURATION_ACCESS: "기간제 권한",
	FEATURE_UNLOCK: "영구 기능 해제",
};
const ENTITLEMENT_LABELS: Record<CommerceEntitlement["type"], string> = {
	GEM: "구슬",
	TICKET: "티켓",
	DURATION_ACCESS: "기간제 권한",
	FEATURE_UNLOCK: "기능 해제",
};
export default function CommerceProductDialog({
	open,
	product,
	counterpart,
	loading,
	onClose,
	onSubmit,
}: CommerceProductDialogProps) {
	const [form, setForm] = useState<CommerceProductFormValue>(INITIAL_FORM);
	useEffect(() => {
		if (!open) return;
		if (!product) {
			setForm(INITIAL_FORM);
			return;
		}
		const kr = product;
		const jp = counterpart;
		setForm({
			productKey: product.product_key,
			productType: product.product_type,
			localizations: [
				{
					country: "KR",
					displayName: kr?.display_name ?? product.display_name,
					description: kr?.description ?? "",
				},
				{
					country: "JP",
					displayName: jp?.display_name ?? counterpart?.display_name ?? "",
					description: jp?.description ?? "",
				},
			],
			entitlements: product.entitlements.map((item) => ({
				type: item.type,
				key: item.key,
				quantity: item.quantity ?? undefined,
				durationSeconds: item.durationSeconds ?? undefined,
				metadata: item.metadata,
			})),
			sortOrder: product.sort_order,
			uiMetadata: product.ui_metadata,
		});
	}, [counterpart, open, product]);
	const entitlement = form.entitlements[0] ?? INITIAL_FORM.entitlements[0];
	const kr = form.localizations[0];
	const jp = form.localizations[1];
	const valid =
		form.productKey.length >= 3 &&
		Boolean(kr?.displayName.trim()) &&
		Boolean(jp?.displayName.trim()) &&
		Boolean(entitlement?.key.trim()) &&
		(entitlement.type === "DURATION_ACCESS"
			? (entitlement.durationSeconds ?? 0) > 0
			: entitlement.type === "FEATURE_UNLOCK" ||
				(entitlement.quantity ?? 0) > 0);
	const updateLocalization = (
		index: number,
		key: "displayName" | "description",
		value: string,
	) => {
		setForm((current) => ({
			...current,
			localizations: current.localizations.map((item, itemIndex) =>
				itemIndex === index ? { ...item, [key]: value } : item,
			),
		}));
	};
	const updateEntitlement = (
		patch: Partial<CommerceProductFormValue["entitlements"][number]>,
	) => {
		setForm((current) => ({
			...current,
			entitlements: [{ ...current.entitlements[0], ...patch }],
		}));
	};
	return (
		<Modal.Backdrop
			isOpen={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) (loading ? undefined : onClose)?.();
			}}
			isDismissable={loading ? undefined : onClose !== undefined}
		>
			<Modal.Container size="md" scroll="inside">
				<Modal.Dialog>
					<Modal.Header>
						<Modal.Heading>
							{product ? "상품 Draft 편집" : "표준 상품 Draft 생성"}
						</Modal.Heading>
					</Modal.Header>
					<Modal.Body>
						<div style={{ paddingTop: 8 }} className="flex flex-col gap-6">
							<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4">
								<TextField className="w-full" isDisabled={Boolean(product)}>
									<Label>{"안정적인 상품 키"}</Label>
									<Input
										value={form.productKey}
										onChange={(event) =>
											setForm((current) => ({
												...current,
												productKey: event.target.value,
											}))
										}
									/>
									<Description>
										{"생성 후 변경할 수 없습니다. 예: gem_std_150"}
									</Description>
								</TextField>
								<div>
									<Select
										value={form.productType}
										onChange={(key) => {
											const value = String(key ?? "");
											setForm((current) => ({
												...current,
												productType: value as CommerceProductType,
											}));
										}}
										isDisabled={Boolean(product)}
										className="w-full"
									>
										<Label>{"상품 유형"}</Label>
										<Select.Trigger>
											<Select.Value />
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{Object.entries(PRODUCT_TYPE_LABELS).map(
													([value, label]) => (
														<ListBox.Item
															id={value}
															textValue={String(label)}
															key={value}
														>
															{label}
														</ListBox.Item>
													),
												)}
											</ListBox>
										</Select.Popover>
									</Select>
								</div>
							</div>
							<p className={"text-sm text-neutral-700"}>국가별 표시 정보</p>
							<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4">
								<div className="flex flex-col gap-4">
									<TextField className="w-full">
										<Label>{"KR 상품명"}</Label>
										<Input
											value={kr?.displayName ?? ""}
											onChange={(event) =>
												updateLocalization(0, "displayName", event.target.value)
											}
										/>
									</TextField>
									<TextField className="w-full">
										<Label>{"KR 설명"}</Label>
										<TextArea
											value={kr?.description ?? ""}
											onChange={(event) =>
												updateLocalization(0, "description", event.target.value)
											}
											rows={4}
										/>
									</TextField>
								</div>
								<div className="flex flex-col gap-4">
									<TextField className="w-full">
										<Label>{"JP 상품명"}</Label>
										<Input
											value={jp?.displayName ?? ""}
											onChange={(event) =>
												updateLocalization(1, "displayName", event.target.value)
											}
										/>
									</TextField>
									<TextField className="w-full">
										<Label>{"JP 설명"}</Label>
										<TextArea
											value={jp?.description ?? ""}
											onChange={(event) =>
												updateLocalization(1, "description", event.target.value)
											}
											rows={4}
										/>
									</TextField>
								</div>
							</div>
							<p className={"text-sm text-neutral-700"}>지급 혜택</p>
							<div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4">
								<div>
									<Select
										value={entitlement.type}
										onChange={(key) => {
											const value = String(key ?? "");
											updateEntitlement({
												type: value as CommerceEntitlement["type"],
												quantity: value === "FEATURE_UNLOCK" ? undefined : 1,
												durationSeconds:
													value === "DURATION_ACCESS" ? 86400 : undefined,
											});
										}}
										className="w-full"
									>
										<Label>{"혜택 유형"}</Label>
										<Select.Trigger>
											<Select.Value />
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												{Object.entries(ENTITLEMENT_LABELS).map(
													([value, label]) => (
														<ListBox.Item
															id={value}
															textValue={String(label)}
															key={value}
														>
															{label}
														</ListBox.Item>
													),
												)}
											</ListBox>
										</Select.Popover>
									</Select>
								</div>
								<TextField className="w-full">
									<Label>{"혜택 키"}</Label>
									<Input
										value={entitlement.key}
										onChange={(event) =>
											updateEntitlement({ key: event.target.value })
										}
									/>
								</TextField>
								{entitlement.type === "DURATION_ACCESS" ? (
									<TextField className="w-full">
										<Label>{"기간(초)"}</Label>
										<Input
											type="number"
											value={entitlement.durationSeconds ?? ""}
											onChange={(event) =>
												updateEntitlement({
													durationSeconds: Number(event.target.value),
												})
											}
										/>
									</TextField>
								) : entitlement.type !== "FEATURE_UNLOCK" ? (
									<TextField className="w-full">
										<Label>{"수량"}</Label>
										<Input
											type="number"
											value={entitlement.quantity ?? ""}
											onChange={(event) =>
												updateEntitlement({
													quantity: Number(event.target.value),
												})
											}
										/>
									</TextField>
								) : null}
							</div>
							<TextField className="w-full">
								<Label>{"정렬 순서"}</Label>
								<Input
									type="number"
									value={form.sortOrder}
									style={{ maxWidth: 220 }}
									onChange={(event) =>
										setForm((current) => ({
											...current,
											sortOrder: Number(event.target.value),
										}))
									}
								/>
							</TextField>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button
							onClick={onClose}
							variant={"tertiary"}
							isDisabled={loading}
							size={"md"}
						>
							취소
						</Button>
						<Button
							onClick={() => onSubmit(form)}
							variant={"primary"}
							isDisabled={!valid || loading}
							size={"md"}
						>
							{loading ? "저장 중…" : product ? "Draft 저장" : "Draft 생성"}
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
