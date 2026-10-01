import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GhostPreviewCard } from "@/app/admin/ai-profiles/ghosts/ghost-preview-card";
import { BlacklistAddDialog } from "@/app/admin/ai-profiles/schools/blacklist-add-dialog";
import { universities } from "@/app/services/admin";
import { ghostInjection } from "@/app/services/admin/ghost-injection";
import type { BatchPreviewItem } from "@/app/types/ghost-injection";

jest.mock("@/app/services/admin", () => ({
  universities: { getList: jest.fn() },
}));
jest.mock("@/app/services/admin/ghost-injection", () => ({
  ghostInjection: { addBlacklist: jest.fn() },
}));
jest.mock("@/shared/hooks", () => ({ useDebounce: (value: string) => value }));
jest.mock("@/shared/ui/admin/toast", () => ({
  useToast: () => ({ success: jest.fn(), error: jest.fn() }),
}));

it("Disclosure를 열어 프롬프트를 수정하고 기존 slot 저장 계약으로 전달한다", async () => {
  const item: BatchPreviewItem = {
    itemId: "preview-1",
    profile: {
      name: "유저",
      age: 22,
      mbti: "INTJ",
      rank: "A",
      introduction: "",
      keywords: [],
    },
    university: { id: "school-1", name: "학교" },
    department: { id: "dept-1", name: "학과" },
    archetype: { id: null, name: null, traits: [] },
    slotPrompts: [
      {
        slotIndex: 0,
        prompt: "기존 프롬프트",
        generationContext: {
          personaDescriptor: "성격",
          sceneDescriptor: "촬영 장면",
          priorSlotSummaries: [],
        },
      },
    ],
  };
  const onEditSlot = jest.fn();
  render(
    <GhostPreviewCard
      item={item}
      selected={false}
      onToggleSelect={jest.fn()}
      onEditSlot={onEditSlot}
      onRegenerate={jest.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /Slot 1 촬영 장면/ }));
  const editor = await screen.findByRole("textbox");
  fireEvent.change(editor, { target: { value: "새 프롬프트" } });
  fireEvent.click(screen.getByRole("button", { name: "저장" }));
  expect(onEditSlot).toHaveBeenCalledWith(0, "새 프롬프트");
});

it("학교 ComboBox의 서버 검색 결과를 선택해 동일한 차단 요청을 보낸다", async () => {
  (universities.getList as jest.Mock).mockResolvedValue({
    items: [{ id: "school-jp", name: "도쿄대학교" }],
  });
  (ghostInjection.addBlacklist as jest.Mock).mockResolvedValue({});
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <BlacklistAddDialog open onOpenChange={jest.fn()} />
    </QueryClientProvider>,
  );
  const search = await screen.findByRole("combobox", { name: "학교 검색" });
  fireEvent.click(screen.getByRole("button", { name: "Show suggestions" }));
  fireEvent.focus(search);
  fireEvent.change(search, { target: { value: "도쿄" } });
  fireEvent.click(await screen.findByRole("option", { name: "도쿄대학교" }));
  fireEvent.change(
    screen.getByPlaceholderText(
      "변경 사유를 입력해주세요 (감사 로그에 기록됩니다)",
    ),
    { target: { value: "검토 후 학교 정책을 변경합니다" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "추가" }));
  await waitFor(() =>
    expect(ghostInjection.addBlacklist).toHaveBeenCalledWith({
      schoolId: "school-jp",
      schoolName: "도쿄대학교",
      reason: "검토 후 학교 정책을 변경합니다",
    }),
  );
  expect(universities.getList).toHaveBeenCalledWith(
    expect.objectContaining({ name: "도쿄", isActive: true }),
  );
});
