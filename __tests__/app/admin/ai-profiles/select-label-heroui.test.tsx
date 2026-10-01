import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CandidateFilters } from "@/app/admin/ai-profiles/candidates/candidate-filters";
import { PoolFilterBar } from "@/app/admin/ai-profiles/ghosts/_attach/pool-filter-bar";
it("공유 Select를 사용하는 상태와 페이지 크기 이름을 실제 trigger에 연결한다", () => {
  render(
    <CandidateFilters
      query={{ status: "PENDING", limit: 20, page: 1 }}
      onChange={jest.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: /상태/ })).toHaveAttribute(
    "aria-haspopup",
    "listbox",
  );
  expect(screen.getByRole("button", { name: /페이지 크기/ })).toHaveAttribute(
    "aria-haspopup",
    "listbox",
  );
});
it("동적 facet 이름과 정렬 이름을 실제 trigger에 연결한다", () => {
  render(
    <PoolFilterBar
      value={{ sortBy: "usage_asc" }}
      facets={undefined}
      onChange={jest.fn()}
    />,
  );
  for (const name of [/mood/, /style/, /setting/, /정렬/])
    expect(screen.getByRole("button", { name })).toHaveAttribute(
      "aria-haspopup",
      "listbox",
    );
});
