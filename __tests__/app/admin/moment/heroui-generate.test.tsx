import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import QuestionGeneration from "@/app/admin/moment/components/QuestionGenerationTab";
import AdminService from "@/app/services/admin";
jest.mock("@/app/services/admin", () => ({
  __esModule: true,
  default: { momentQuestions: { generate: jest.fn() } },
}));
it("테마·키워드·커스텀 분배 선택을 기존 생성 요청으로 전달한다", async () => {
  (AdminService.momentQuestions.generate as jest.Mock).mockResolvedValue({
    candidates: [],
    metadata: null,
  });
  render(<QuestionGeneration />);
  expect(screen.getByRole("button", { name: /차원/ })).toHaveAttribute(
    "aria-haspopup",
    "listbox",
  );
  const button = screen.getByRole("button", { name: "질문 생성하기" });
  expect(button).toBeDisabled();
  fireEvent.change(screen.getByRole("textbox", { name: "테마" }), {
    target: { value: "  대학생활  " },
  });
  const keywords = screen.getByRole("textbox", { name: "키워드 추가" });
  fireEvent.change(keywords, { target: { value: "친구" } });
  fireEvent.keyDown(keywords, { key: "Enter" });
  fireEvent.click(screen.getByRole("checkbox", { name: "선택" }));
  fireEvent.click(button);
  await waitFor(() =>
    expect(AdminService.momentQuestions.generate).toHaveBeenCalledWith({
      theme: "대학생활",
      keywords: ["친구"],
      dimension: "auto",
      count: 10,
      distribution: {
        openness: 40,
        conscientiousness: 15,
        extraversion: 15,
        agreeableness: 15,
        neuroticism: 15,
      },
    }),
  );
});
