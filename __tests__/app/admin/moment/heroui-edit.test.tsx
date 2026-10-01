import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import QuestionEditDialog from "@/app/admin/moment/components/QuestionEditDialog";
it("빈 질문을 막고 순서를 유지하며 다듬은 질문·선택지를 저장한다", async () => {
  const save = jest.fn().mockResolvedValue({});
  render(
    <QuestionEditDialog
      open
      onClose={jest.fn()}
      processing={false}
      onSave={save}
      question={
        {
          id: "question-jp",
          text: "원문",
          options: [
            { id: "2", order: 2, text: "선택2" },
            { id: "1", order: 1, text: "선택1" },
          ],
        } as any
      }
    />,
  );
  const text = screen.getByRole("textbox", { name: "질문 텍스트" });
  fireEvent.change(text, { target: { value: "  " } });
  fireEvent.click(screen.getByRole("button", { name: "저장" }));
  expect(save).not.toHaveBeenCalled();
  fireEvent.change(text, { target: { value: "  수정 질문  " } });
  fireEvent.change(screen.getByRole("textbox", { name: "선택지 1" }), {
    target: { value: "  수정 선택  " },
  });
  fireEvent.click(screen.getByRole("button", { name: "저장" }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith("question-jp", {
      text: "수정 질문",
      options: [
        { order: 1, text: "수정 선택" },
        { order: 2, text: "선택2" },
      ],
    }),
  );
});
