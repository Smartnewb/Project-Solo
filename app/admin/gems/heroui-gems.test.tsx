import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GemsV2 from "./gems-v2";
import { ToastProvider } from "@/shared/ui/admin/toast/toast-context";
const grant = jest.fn();
jest.mock("@/app/admin/hooks", () => ({
	useBulkGrantGems: () => ({ mutate: grant, isPending: false }),
}));
beforeEach(() => grant.mockClear());

test("valid phone and amount reach bulk request only after native-independent confirmation", async () => {
	const user = userEvent.setup();
	render(
		<ToastProvider>
			<GemsV2 />
		</ToastProvider>,
	);
	await user.type(
		screen.getByRole("textbox", { name: "전화번호" }),
		"010-1234-5678",
	);
	await user.type(
		screen.getByRole("textbox", { name: "지급 사유 메시지" }),
		"운영 보상",
	);
	fireEvent.change(
		screen.getByRole("spinbutton", { name: "지급할 구슬 개수" }),
		{ target: { value: "0" } },
	);
	await user.click(
		screen.getByRole("button", { name: "구슬 지급 및 알림 발송" }),
	);
	expect(grant).not.toHaveBeenCalled();
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	fireEvent.change(
		screen.getByRole("spinbutton", { name: "지급할 구슬 개수" }),
		{ target: { value: "10" } },
	);
	await user.click(
		screen.getByRole("button", { name: "구슬 지급 및 알림 발송" }),
	);
	expect(
		await screen.findByRole("dialog", { name: "구슬 지급 확인" }),
	).toBeInTheDocument();
	expect(grant).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "확인", exact: true }));
	await waitFor(() =>
		expect(grant).toHaveBeenCalledWith(
			{
				phoneNumbers: ["010-1234-5678"],
				csvFile: undefined,
				gemAmount: 10,
				message: "운영 보상",
			},
			expect.any(Object),
		),
	);
});

test('CSV selection keeps the browser file picker behind a real HeroUI button', async () => {
 const user = userEvent.setup();
 const { container } = render(<ToastProvider><GemsV2 /></ToastProvider>);
 await user.click(screen.getByRole('radio', { name: 'CSV 파일 업로드' }));
 const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
 const pick = jest.spyOn(input, 'click').mockImplementation(() => {});
 await user.click(screen.getByRole('button', { name: 'CSV 파일 선택' }));
 expect(pick).toHaveBeenCalledTimes(1);
 expect(grant).not.toHaveBeenCalled();
 pick.mockRestore();
});
