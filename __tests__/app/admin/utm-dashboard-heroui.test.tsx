import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import UtmDashboard from "@/app/admin/utm-management/components/utm-dashboard";
import AdminService from "@/app/services/admin";
jest.mock("@/app/services/admin", () => ({
  __esModule: true,
  default: { utm: { getSurfaces: jest.fn(), getReconciliation: jest.fn() } },
}));
it("실제 기간 선택과 추가 관측 스위치를 API 필터에 반영한다", async () => {
  const user = userEvent.setup();
  (AdminService.utm.getSurfaces as jest.Mock).mockResolvedValue(null);
  (AdminService.utm.getReconciliation as jest.Mock).mockResolvedValue(null);
  render(<UtmDashboard />);
  await user.click(await screen.findByRole("button", { name: /기간/ }));
  await user.click(screen.getByRole("option", { name: "오늘" }));
  const today = new Date().toISOString().split("T")[0];
  await waitFor(() =>
    expect(AdminService.utm.getSurfaces).toHaveBeenLastCalledWith({
      startDate: today,
      endDate: today,
      includeExtraMonitored: false,
    }),
  );
  await user.click(
    screen.getByRole("switch", {
      name: "festival-region extra monitored 포함",
    }),
  );
  await waitFor(() =>
    expect(AdminService.utm.getSurfaces).toHaveBeenLastCalledWith({
      startDate: today,
      endDate: today,
      includeExtraMonitored: true,
    }),
  );
  expect(AdminService.utm.getReconciliation).toHaveBeenLastCalledWith(
    today,
    today,
  );
});
