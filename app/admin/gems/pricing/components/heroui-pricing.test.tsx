import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminService from "@/app/services/admin";
import RefundPoliciesTab from "./refund-policies-tab";
import PricesTab from "./prices-tab";
const policy = {
	id: 1,
	policyKey: "rejection_days",
	value: 10,
	label: "거절 환급",
	description: "",
	version: 7,
	updatedAt: "2026-10-02",
};
const price = {
	id: 2,
	featureType: "LIKE",
	countryCode: "KR",
	gender: "MALE",
	price: 20,
	isActive: true,
	memo: null,
	version: 3,
	updatedAt: "2026-10-02",
};
afterEach(() => jest.restoreAllMocks());

test("refund edit preserves integer validation, required reason and server requested large-change confirmation", async () => {
	const user = userEvent.setup();
	jest
		.spyOn(AdminService.gemPricing, "listRefundPolicies")
		.mockResolvedValue([policy]);
	const update = jest
		.spyOn(AdminService.gemPricing, "updateRefundPolicy")
		.mockRejectedValueOnce(new Error("confirmLargeChange"))
		.mockResolvedValue(policy);
	render(<RefundPoliciesTab onChanged={jest.fn()} />);
	await user.click(await screen.findByRole("button", { name: "수정" }));
	const save = screen.getByRole("button", { name: "저장" });
	fireEvent.change(screen.getByRole("spinbutton", { name: "새 임계값" }), {
		target: { value: "20.5" },
	});
	await user.type(
		screen.getByRole("textbox", { name: "변경 사유 (필수)" }),
		"운영 정책 변경",
	);
	expect(save).toBeDisabled();
	fireEvent.change(screen.getByRole("spinbutton", { name: "새 임계값" }), {
		target: { value: "21" },
	});
	await user.click(save);
	await screen.findByRole("checkbox", { name: /2배 이상 변경/ });
	expect(save).toBeDisabled();
	await user.click(screen.getByRole("checkbox", { name: /2배 이상 변경/ }));
	await user.click(save);
	await waitFor(() =>
		expect(update).toHaveBeenLastCalledWith("rejection_days", {
			value: 21,
			memo: "운영 정책 변경",
			version: 7,
			confirmLargeChange: true,
		}),
	);
});

test("zero price requires explicit server requested confirmation and passes revision", async () => {
	const user = userEvent.setup();
	jest
		.spyOn(AdminService.gemPricing, "listPrices")
		.mockResolvedValue({ prices: [price], missingFeatureTypes: [] });
	const update = jest
		.spyOn(AdminService.gemPricing, "updatePrice")
		.mockRejectedValueOnce(new Error("confirmFree"))
		.mockResolvedValue(price);
	render(<PricesTab onChanged={jest.fn()} />);
	await user.click(await screen.findByRole("button", { name: "수정" }));
	fireEvent.change(
		screen.getByRole("spinbutton", { name: "새 정가 (구슬 개수)" }),
		{ target: { value: "0" } },
	);
	await user.type(
		screen.getByRole("textbox", { name: "변경 사유 (필수)" }),
		"무료 변경",
	);
	await user.click(screen.getByRole("button", { name: "저장" }));
	const confirm = await screen.findByRole("checkbox", {
		name: "0원 설정을 의도했음을 확인합니다",
	});
	expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
	await user.click(confirm);
	await user.click(screen.getByRole("button", { name: "저장" }));
	await waitFor(() =>
		expect(update).toHaveBeenLastCalledWith(2, {
			price: 0,
			memo: "무료 변경",
			version: 3,
			confirmFree: true,
			confirmLargeChange: undefined,
		}),
	);
});

test('refund conflict blocks saving the stale revision again', async () => {
 const user = userEvent.setup();
 jest.spyOn(AdminService.gemPricing, 'listRefundPolicies').mockResolvedValue([policy]);
 const { AdminApiError } = await import('@/shared/lib/http/admin-fetch');
 const update = jest.spyOn(AdminService.gemPricing, 'updateRefundPolicy').mockRejectedValue(new AdminApiError('다른 관리자가 수정했습니다', 409));
 render(<RefundPoliciesTab onChanged={jest.fn()} />);
 await user.click(await screen.findByRole('button', { name: '수정' }));
 fireEvent.change(screen.getByRole('spinbutton', { name: '새 임계값' }), { target: { value: '12' } });
 await user.type(screen.getByRole('textbox', { name: '변경 사유 (필수)' }), '사유');
 await user.click(screen.getByRole('button', { name: '저장' }));
 await screen.findByText(/다른 관리자가 수정했습니다/);
 expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
 expect(update).toHaveBeenCalledTimes(1);
});
