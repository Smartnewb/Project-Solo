import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommerceProductDialog from "./commerce-product-dialog";
import ProviderOperationsDialog from "./provider-operations-dialog";
import type { CommerceCatalogProduct } from "@/types/admin";

beforeAll(() => {
	HTMLElement.prototype.scrollIntoView = jest.fn();
	global.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
});
const product: CommerceCatalogProduct = {
	id: "kr-1",
	product_key: "gems100",
	product_type: "CONSUMABLE",
	is_active: true,
	product_version_id: "v1",
	version: 1,
	display_name: "구슬 100",
	description: "설명",
	status: "DRAFT",
	sort_order: 0,
	ui_metadata: {},
	entitlements: [{ type: "GEM", key: "gem", quantity: 100 }],
};

test("draft form requires both localizations and positive numeric entitlement without submitting early", async () => {
	const user = userEvent.setup();
	const submit = jest.fn();
	render(<CommerceProductDialog open onClose={jest.fn()} onSubmit={submit} />);
	const save = screen.getByRole("button", { name: "Draft 생성" });
	expect(save).toBeDisabled();
	await user.type(
		screen.getByRole("textbox", { name: "안정적인 상품 키" }),
		"gems100",
	);
	await user.type(
		screen.getByRole("textbox", { name: "KR 상품명" }),
		"구슬 100",
	);
	expect(save).toBeDisabled();
	await user.type(
		screen.getByRole("textbox", { name: "JP 상품명" }),
		"ジェム100",
	);
	const quantity = screen.getByRole("spinbutton", { name: "수량" });
	fireEvent.change(quantity, { target: { value: "0" } });
	expect(save).toBeDisabled();
	fireEvent.change(quantity, { target: { value: "100" } });
	await user.click(save);
	expect(submit).toHaveBeenCalledWith(
		expect.objectContaining({
			productKey: "gems100",
			productType: "CONSUMABLE",
			localizations: [
				{ country: "KR", displayName: "구슬 100", description: "" },
				{ country: "JP", displayName: "ジェム100", description: "" },
			],
			entitlements: [{ type: "GEM", key: "gem", quantity: 100 }],
		}),
	);
});

test("provider choice retains country prices and explicit registration callback", async () => {
	const user = userEvent.setup();
	const apple = jest.fn();
	const play = jest.fn();
	render(
		<ProviderOperationsDialog
			open
			product={product}
			counterpart={{ ...product, id: "jp-1", display_name: "ジェム100" }}
			onClose={jest.fn()}
			onRegisterApple={apple}
			onRegisterPlay={play}
			onSync={jest.fn()}
			onPlayState={jest.fn()}
			onAppleScreenshot={jest.fn()}
			onAppleSubmit={jest.fn()}
		/>,
	);
	fireEvent.change(screen.getByRole("spinbutton", { name: "KR 가격(KRW)" }), {
		target: { value: "3000" },
	});
	fireEvent.change(screen.getByRole("spinbutton", { name: "JP 가격(JPY)" }), {
		target: { value: "300" },
	});
	expect(apple).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "Apple IAP 등록" }));
	expect(apple).toHaveBeenCalledWith(
		expect.objectContaining({
			productId: "gems100",
			priceKRW: 3000,
			priceJPY: 300,
			localizations: [
				expect.objectContaining({ locale: "ko" }),
				expect.objectContaining({ locale: "ja" }),
			],
		}),
	);
	await user.click(screen.getByRole("button", { name: "Google Play" }));
	expect(screen.getByRole("switch", { name: /기존/ })).toBeInTheDocument();
	expect(play).not.toHaveBeenCalled();
});
