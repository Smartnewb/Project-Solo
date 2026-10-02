import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DepartmentCsvUpload from "@/app/admin/universities/components/DepartmentCsvUpload";
import AdminService from "@/app/services/admin";
const mockConfirm = jest.fn();
jest.mock("@/shared/ui/admin/confirm-dialog", () => ({
  useConfirm: () => mockConfirm,
}));
jest.mock("@/app/services/admin", () => ({
  __esModule: true,
  default: { universities: { departments: { uploadCsv: jest.fn() } } },
}));
it("CSV 교체 확인을 취소하면 업로드하지 않고 확인 후 기존 학교 ID와 파일을 전달한다", async () => {
  mockConfirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  (
    AdminService.universities.departments.uploadCsv as jest.Mock
  ).mockResolvedValue({
    totalRows: 1,
    successCount: 1,
    errorCount: 0,
    errors: [],
  });
  const { container } = render(
    <DepartmentCsvUpload
      open
      onClose={jest.fn()}
      universityId="school-jp"
      universityName="도쿄"
      onSuccess={jest.fn()}
    />,
  );
  const file = new File(["name\n학과"], "departments.csv", {
    type: "text/csv",
  });
  fireEvent.change(container.ownerDocument.querySelector("input[type=file]")!, {
    target: { files: [file] },
  });
  fireEvent.click(screen.getByRole("button", { name: "업로드" }));
  await waitFor(() => expect(mockConfirm).toHaveBeenCalledTimes(1));
  expect(
    AdminService.universities.departments.uploadCsv,
  ).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "업로드" }));
  await waitFor(() =>
    expect(
      AdminService.universities.departments.uploadCsv,
    ).toHaveBeenCalledWith("school-jp", file),
  );
});
