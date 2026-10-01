import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RegionFilter from "@/components/admin/common/RegionFilter";
import AdminService from "@/app/services/admin";

let country = "kr";
jest.mock("@/contexts/CountryContext", () => ({
  useCountry: () => ({ country }),
}));
jest.mock("@/app/services/admin", () => ({
  __esModule: true,
  default: { universities: { getClusters: jest.fn() } },
}));

it("국가 전환 후 일본 지역만 선택할 수 있고 모드 전환은 ALL로 초기화한다", async () => {
  const onChange = jest.fn();
  const onClusterModeChange = jest.fn();
  (AdminService.universities.getClusters as jest.Mock)
    .mockResolvedValueOnce([
      {
        id: "kr-cluster",
        name: "서울권",
        regions: [{ code: "SEOUL", name: "서울" }],
      },
    ])
    .mockResolvedValueOnce([
      {
        id: "jp-cluster",
        name: "도쿄권",
        regions: [{ code: "TOKYO", name: "도쿄" }],
      },
    ]);
  const props = {
    value: "ALL",
    onChange,
    onClusterModeChange,
    showClusterToggle: true,
  };
  const { rerender } = render(<RegionFilter {...props} />);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /지역/ })).not.toBeDisabled(),
  );
  country = "jp";
  rerender(<RegionFilter {...props} />);
  await waitFor(() =>
    expect(AdminService.universities.getClusters).toHaveBeenCalledTimes(2),
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /지역/ })).not.toBeDisabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: /지역/ }));
  expect(
    await screen.findByRole("option", { name: "도쿄권" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: "서울권" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("option", { name: "도쿄권" }));
  expect(onChange).toHaveBeenCalledWith("TOKYO");
  fireEvent.click(screen.getByRole("switch", { name: "클러스터 단위" }));
  expect(onClusterModeChange).toHaveBeenCalledWith(false);
  expect(onChange).toHaveBeenLastCalledWith("ALL");
});
