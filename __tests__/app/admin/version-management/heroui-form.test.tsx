import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import VersionPage from "@/app/admin/version-management/version-management-v2";
import versionService from "@/app/services/version";
jest.mock("@/app/services/version", () => ({
  __esModule: true,
  default: { getAllVersionUpdates: jest.fn(), createVersionUpdate: jest.fn() },
}));
jest.mock("@/shared/ui/admin/toast/toast-context", () => ({
  useToast: () => ({ error: jest.fn() }),
}));
const mockConfirm = jest.fn();
jest.mock("@/shared/ui/admin/confirm-dialog", () => ({
  useConfirm: () => mockConfirm,
}));
it("업데이트 스위치의 boolean과 설명을 기존 생성 계약으로 전달한다", async () => {
  mockConfirm.mockResolvedValue(true);
  (versionService.getAllVersionUpdates as jest.Mock).mockResolvedValue([]);
  (versionService.createVersionUpdate as jest.Mock).mockResolvedValue({});
  render(<VersionPage />);
  fireEvent.click(await screen.findByRole("button", { name: /새 버전/ }));
  fireEvent.change(screen.getByRole("textbox", { name: "버전" }), {
    target: { value: "6.5.0" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "설명 1" }), {
    target: { value: "공지 개선" },
  });
  fireEvent.click(screen.getByRole("switch", { name: "활성화" }));
  fireEvent.click(screen.getByRole("button", { name: "생성" }));
  await waitFor(() =>
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("6.5.0") }),
    ),
  );
  await waitFor(() =>
    expect(versionService.createVersionUpdate).toHaveBeenCalledWith({
      version: "6.5.0",
      metadata: { description: ["공지 개선"] },
      shouldUpdate: true,
    }),
  );
});
