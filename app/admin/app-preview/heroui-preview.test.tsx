import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppPreview from "./page";
test("partner preview opens by keyboard, stays in phone surface, and closes with Escape", async () => {
	const user = userEvent.setup();
	render(<AppPreview />);
	const trigger = screen.getByRole("button", { name: "파트너 상세 보기" });
	act(() => trigger.focus());
	await user.keyboard("{Enter}");
	const modal = await screen.findByRole("dialog", { name: "파트너 상세" });
	expect(
		modal
			.closest('[data-slot="modal-backdrop"]')
			?.parentElement?.closest("section"),
	).toBeTruthy();
	expect(
		screen.getByRole("button", { name: "파트너 상세 닫기" }),
	).toBeInTheDocument();
	await user.keyboard("{Escape}");
	await waitFor(() =>
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
	);
	await waitFor(() => expect(trigger).toHaveFocus());
});
test("chat sends local text with keyboard and keyword chips toggle pressed state", async () => {
	const user = userEvent.setup();
	render(<AppPreview />);
	await user.click(screen.getByRole("button", { name: "채팅방", exact: true }));
	const input = screen.getByRole("textbox", { name: "시연 메시지" });
	await user.type(input, "시연 메시지입니다{Enter}");
	expect(screen.getByText("시연 메시지입니다")).toBeInTheDocument();
	expect(input).toHaveValue("");
	await user.click(screen.getByRole("button", { name: "버튼/칩" }));
	const chip = screen.getByRole("button", { name: "여행", exact: true });
	expect(chip).toHaveAttribute("aria-pressed", "true");
	await user.click(chip);
	expect(chip).toHaveAttribute("aria-pressed", "false");
});
