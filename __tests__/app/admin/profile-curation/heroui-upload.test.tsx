import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ProfileCuration from "@/app/admin/profile-curation/page";
import AdminService from "@/app/services/admin";
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => "male-jp" }),
}));
jest.mock("@/app/services/admin", () => ({
  __esModule: true,
  default: {
    profileCuration: {
      getReviewUser: jest.fn(),
      uploadPreparedAsset: jest.fn(),
      create: jest.fn(),
    },
  },
}));
it("검토 사진 업로드 없이 발송하지 않고 업로드 후 원본 슬롯과 asset을 전달한다", async () => {
  (AdminService.profileCuration.getReviewUser as jest.Mock).mockResolvedValue({
    gender: "MALE",
    name: "테스트",
    approvedImages: [
      { imageId: "original", slotIndex: 0, url: "https://example.test/photo" },
    ],
  });
  (
    AdminService.profileCuration.uploadPreparedAsset as jest.Mock
  ).mockResolvedValue({ id: "asset-jp" });
  (AdminService.profileCuration.create as jest.Mock).mockResolvedValue({});
  URL.createObjectURL = jest.fn(() => "blob:fixture");
  URL.revokeObjectURL = jest.fn();
  const { container } = render(<ProfileCuration />);
  const submit = await screen.findByRole("button", {
    name: "회원에게 큐레이팅 제안하기",
  });
  fireEvent.click(submit);
  expect(AdminService.profileCuration.create).not.toHaveBeenCalled();
  const picker = screen.getByRole("button", { name: "검토 완료 사진 업로드" });
  const fileInput = container.querySelector(
    "input[type=file]",
  ) as HTMLInputElement;
  const open = jest.spyOn(fileInput, "click");
  fireEvent.click(picker);
  expect(open).toHaveBeenCalledTimes(1);
  open.mockRestore();
  const file = new File(["fixture"], "result.png", { type: "image/png" });
  fireEvent.change(container.querySelector("input[type=file]")!, {
    target: { files: [file] },
  });
  await waitFor(() =>
    expect(
      AdminService.profileCuration.uploadPreparedAsset,
    ).toHaveBeenCalledWith(file),
  );
  await waitFor(() => expect(submit).toBeEnabled());
  fireEvent.click(submit);
  await waitFor(() =>
    expect(AdminService.profileCuration.create).toHaveBeenCalledWith({
      userId: "male-jp",
      expiresAt: expect.any(String),
      items: [
        {
          sourceProfileImageId: "original",
          targetSlotIndex: 0,
          preparedImageAssetId: "asset-jp",
        },
      ],
    }),
  );
});
