import React from "react";
import "@testing-library/jest-dom";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminCountrySelectorModal } from "./admin-country-selector";
const mockChangeCountry = jest.fn();
jest.mock("@/shared/contexts/admin-session-context", () => ({
	useAdminSession: () => ({
		session: { selectedCountry: "kr" },
		changeCountry: mockChangeCountry,
	}),
}));
beforeEach(() => mockChangeCountry.mockReset());
test("country change blocks dismissal while pending and surfaces a retryable error", async () => {
	let reject: (reason: Error) => void = () => {};
	mockChangeCountry.mockImplementation(
		() =>
			new Promise((_, fail) => {
				reject = fail;
			}),
	);
	const close = jest.fn(),
		user = userEvent.setup();
	render(<AdminCountrySelectorModal open onClose={close} />);
	await user.click(screen.getByRole("button", { name: /JP 日本/ }));
	expect(mockChangeCountry).toHaveBeenCalledWith("jp");
	await user.keyboard("{Escape}");
	expect(close).not.toHaveBeenCalled();
	await act(async () => reject(new Error("fixture failure")));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"국가 변경에 실패했습니다",
	);
	expect(screen.getByRole("button", { name: "닫기" })).toBeEnabled();
	await user.click(screen.getByRole("button", { name: "닫기" }));
	expect(close).toHaveBeenCalledTimes(1);
});
test("selecting the current country closes without a request", async () => {
	const close = jest.fn(),
		user = userEvent.setup();
	render(<AdminCountrySelectorModal open onClose={close} />);
	await user.click(screen.getByRole("button", { name: /KR 대한민국/ }));
	expect(close).toHaveBeenCalledTimes(1);
	expect(mockChangeCountry).not.toHaveBeenCalled();
});
