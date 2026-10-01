import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StatusActionDialog } from "@/app/admin/pixel-campus/components/StatusActionDialog";
const mockMutate = jest.fn();
jest.mock("@/app/admin/hooks/use-pixel-campus", () => ({
  useUpdatePixelCampusStatus: () => ({
    mutateAsync: mockMutate,
    isPending: false,
  }),
}));
it("허용된 게시 상태를 선택하고 확인 버튼을 눌러야 변경한다", async () => {
  mockMutate.mockResolvedValue({});
  render(
    <StatusActionDialog
      open
      onClose={jest.fn()}
      episode={
        {
          id: "episode-jp",
          status: "in_review",
          title: "테스트",
          sceneImageUrl: "https://example.test/scene.png",
          situationText: "상황",
          choices: [],
        } as any
      }
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /다음 상태/ }));
  fireEvent.click(await screen.findByRole("option", { name: /게시/ }));
  expect(mockMutate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "변경" }));
  await waitFor(() =>
    expect(mockMutate).toHaveBeenCalledWith({
      id: "episode-jp",
      payload: { status: "published", publishAt: undefined },
    }),
  );
});
