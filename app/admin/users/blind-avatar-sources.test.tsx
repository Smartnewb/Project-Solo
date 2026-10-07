import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { adminGet } from "@/shared/lib/http/admin-fetch";
import { BlindAvatarSources } from "./blind-avatar-sources";

jest.mock("@/shared/lib/http/admin-fetch", () => ({
	...jest.requireActual("@/shared/lib/http/admin-fetch"),
	adminGet: jest.fn(),
}));

const mockedAdminGet = adminGet as jest.MockedFunction<typeof adminGet>;

describe("BlindAvatarSources", () => {
	beforeEach(() => mockedAdminGet.mockReset());

	it("원본 보기를 누르기 전에는 원본을 조회하지 않는다", () => {
		// given
		render(<BlindAvatarSources userId="u1" />);

		// when
		const button = screen.getByRole("button", { name: "원본 보기" });

		// then
		expect(button).toBeInTheDocument();
		expect(mockedAdminGet).not.toHaveBeenCalled();
	});

	it("원본 보기를 누르면 보관된 원본과 삭제된 원본을 구분해 보여준다", async () => {
		// given
		mockedAdminGet.mockResolvedValue({
			data: [
				{ jobId: "j1", slotIndex: 0, status: "applied", sourceType: "TRANSIENT_UPLOAD", sourceImageUrl: "https://signed/a.jpg", sourceDeletedAt: null, generatedImageUrl: "https://cdn/g.png", failureReason: null, createdAt: "2026-10-07T00:00:00Z" },
				{ jobId: "j2", slotIndex: 1, status: "applied", sourceType: "TRANSIENT_UPLOAD", sourceImageUrl: null, sourceDeletedAt: "2026-10-01T00:00:00Z", generatedImageUrl: null, failureReason: null, createdAt: "2026-10-01T00:00:00Z" },
			],
		});
		render(<BlindAvatarSources userId="u1" />);

		// when
		await userEvent.click(screen.getByRole("button", { name: "원본 보기" }));

		// then
		expect(await screen.findByAltText("블라인드 생성 원본")).toHaveAttribute("src", "https://signed/a.jpg");
		expect(screen.getByText("원본 삭제됨 (보관 정책 이전)")).toBeInTheDocument();
		expect(mockedAdminGet).toHaveBeenCalledWith("/admin/v2/users/u1/blind-avatar-sources");
	});
});
