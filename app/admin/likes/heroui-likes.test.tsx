import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLikesList } from "@/app/admin/hooks";
import Likes from "./likes-v2";
jest.mock("@/app/admin/hooks", () => ({ useLikesList: jest.fn() }));
test("draft name filter is applied only on search and reset clears it", async () => {
	const hook = jest.mocked(useLikesList);
	hook.mockReturnValue({
		data: { items: [], total: 0, totalPages: 0 },
		isLoading: false,
	} as never);
	const user = userEvent.setup();
	render(<Likes />);
	await user.type(screen.getByRole("textbox", { name: /이름/ }), "테스트");
	expect(hook.mock.calls.at(-1)?.[0]).not.toHaveProperty("searchName");
	await user.click(screen.getByRole("button", { name: "검색" }));
	await waitFor(() =>
		expect(hook.mock.calls.at(-1)?.[0]).toMatchObject({
			page: 1,
			searchName: "테스트",
		}),
	);
	await user.click(screen.getByRole("button", { name: "초기화" }));
	expect(hook.mock.calls.at(-1)?.[0]).not.toHaveProperty("searchName");
});
