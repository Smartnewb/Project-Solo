import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import UniversityForm from "@/app/admin/universities/components/UniversityFormDialog";
import AdminService from "@/app/services/admin";
jest.mock("@/app/services/admin", () => ({
  __esModule: true,
  default: {
    universities: { meta: { getFoundations: jest.fn() }, create: jest.fn() },
  },
}));
jest.mock("@/shared/ui/admin/toast/toast-context", () => ({
  useToast: () => ({ error: jest.fn() }),
}));
it("지역 선택과 활성 스위치를 기존 대학 생성 계약으로 보존한다", async () => {
  (
    AdminService.universities.meta.getFoundations as jest.Mock
  ).mockResolvedValue([]);
  (AdminService.universities.create as jest.Mock).mockResolvedValue({});
  render(
    <UniversityForm
      open
      onClose={jest.fn()}
      onSubmit={jest.fn()}
      editUniversity={null}
      regions={[{ code: "TOKYO", name: "Tokyo", nameLocal: "도쿄" }] as any}
      types={[{ code: "UNIVERSITY", name: "대학교" }] as any}
    />,
  );
  fireEvent.change(await screen.findByRole("textbox", { name: "대학명" }), {
    target: { value: "도쿄대학교" },
  });
  fireEvent.click(screen.getByRole("button", { name: /지역/ }));
  fireEvent.click(await screen.findByRole("option", { name: /도쿄/ }));
  fireEvent.click(screen.getByRole("switch", { name: "활성화" }));
  fireEvent.click(screen.getByRole("button", { name: "등록" }));
  await waitFor(() =>
    expect(AdminService.universities.create).toHaveBeenCalledWith({
      name: "도쿄대학교",
      region: "TOKYO",
      type: "UNIVERSITY",
      isActive: false,
    }),
  );
});
