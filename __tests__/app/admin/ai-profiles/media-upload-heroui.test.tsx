import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MediaUploadDialog } from "@/app/admin/ai-profiles/generator/[id]/media-upload-dialog";
import { aiProfileGenerator } from "@/app/services/admin/ai-profile-generator";
jest.mock("@/app/services/admin/ai-profile-generator", () => ({
  aiProfileGenerator: { uploadMedia: jest.fn() },
}));
jest.mock("@/shared/ui/admin/toast", () => ({
  useToast: () => ({ success: jest.fn() }),
}));
jest.mock("@/app/admin/ai-profiles/generator/_shared-error", () => ({
  useAiProfileErrorHandler: () => jest.fn(),
}));
it("파일 선택 버튼·파일명·유효성 및 pending 비활성화를 보존한다", async () => {
  const user = userEvent.setup();
  const close = jest.fn();
  let finish!: (value: unknown) => void;
  (aiProfileGenerator.uploadMedia as jest.Mock).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  URL.createObjectURL = jest.fn(() => "blob:preview");
  URL.revokeObjectURL = jest.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const { container } = render(
    <QueryClientProvider client={client}>
      <MediaUploadDialog
        open
        onOpenChange={close}
        draftId="draft-fixture"
        version={27}
      />
    </QueryClientProvider>,
  );
  const input = container.ownerDocument.querySelector(
    "input[type=file]",
  ) as HTMLInputElement;
  expect(input).toHaveAttribute("hidden");
  const picker = screen.getByRole("button", { name: "이미지 파일 선택" });
  const clicked = jest.spyOn(input, "click");
  await user.click(picker);
  expect(clicked).toHaveBeenCalledTimes(1);
  clicked.mockRestore();
  fireEvent.change(input, {
    target: {
      files: [new File(["bad"], "script.txt", { type: "text/plain" })],
    },
  });
  expect(
    screen.getByText("JPEG, PNG, WebP 형식만 업로드할 수 있습니다."),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "업로드" })).toBeDisabled();
  const tooBig = new File(["large"], "large.png", { type: "image/png" });
  Object.defineProperty(tooBig, "size", { value: 10 * 1024 * 1024 + 1 });
  fireEvent.change(input, { target: { files: [tooBig] } });
  expect(
    screen.getByText("파일 크기는 10MB 이하여야 합니다."),
  ).toBeInTheDocument();
  expect(aiProfileGenerator.uploadMedia).not.toHaveBeenCalled();
  const file = new File(["valid"], "selected.webp", { type: "image/webp" });
  fireEvent.change(input, { target: { files: [file] } });
  expect(screen.getByRole("status")).toHaveTextContent("selected.webp");
  await user.click(screen.getByRole("button", { name: "업로드" }));
  await waitFor(() =>
    expect(aiProfileGenerator.uploadMedia).toHaveBeenCalledWith(
      "draft-fixture",
      {
        file,
        expectedVersion: 27,
        slot: "representative",
        prompt: undefined,
        tags: undefined,
      },
    ),
  );
  expect(picker).toBeDisabled();
  expect(input).toBeDisabled();
  expect(screen.getByRole("button", { name: "업로드 중…" })).toBeDisabled();
  await act(async () => finish({}));
  await waitFor(() => expect(close).toHaveBeenCalledWith(false));
  client.clear();
});
