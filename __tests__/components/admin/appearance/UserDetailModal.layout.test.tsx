import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserDetailModal, {
  UserDetail,
} from "@/components/admin/appearance/UserDetailModal";
import EditProfileModal from "@/components/admin/appearance/modals/EditProfileModal";

jest.mock("@/shared/ui/admin/confirm-dialog", () => ({
  useConfirm: () => jest.fn(),
}));

jest.mock("@/shared/ui/admin/toast", () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  }),
}));

jest.mock("@tanstack/react-query", () => ({
  useMutation: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
  useQuery: () => ({ data: { data: { history: [] } } }),
}));
jest.mock("@/app/services/admin", () => ({
  __esModule: true,
  default: {
    userAppearance: { getUserGems: jest.fn().mockResolvedValue(null) },
  },
  blacklist: { getHistory: jest.fn() },
}));

const fixture = {
  id: "long-user-id-123456789012345678901234567890",
  name: "사용자 상세 확인",
  age: 23,
  gender: "MALE",
  profileImages: [
    {
      id: "photo",
      order: 0,
      isMain: true,
      url: "https://example.com/profile.jpg",
    },
  ],
  email: "long-address-without-whitespace@example.com",
  createdAt: "2026-10-02T10:00:00Z",
  introduction: "소개".repeat(100),
} as UserDetail;

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.getAnimations = jest.fn(() => []);
});

it("상세 모달은 넓은 dialog와 반응형 한 열 배치를 제공하고 제목에서 액션을 분리한다", async () => {
  const onClose = jest.fn();
  await act(async () => {
    render(
      <UserDetailModal
        open
        onClose={onClose}
        userId={fixture.id}
        userDetail={fixture}
        loading={false}
        error={null}
      />,
    );
  });
  const dialog = screen.getByRole("dialog", { name: "사용자 상세 정보" });
  expect(dialog).toHaveStyle({
    width: "100%",
    maxWidth: "72rem",
    minWidth: "0",
  });
  expect(dialog.parentElement).toHaveClass("w-full");
  expect(
    within(dialog).getByRole("heading", { name: "사용자 상세 정보" }),
  ).not.toContainElement(
    within(dialog).getByRole("button", { name: "계정 정지" }),
  );
  expect(dialog.querySelector(".lg\\:grid-cols-2")).toHaveClass("grid-cols-1");
  expect(within(dialog).getByText(fixture.id)).toHaveStyle({
    wordBreak: "break-all",
  });
  expect(within(dialog).getByRole("img", { name: fixture.name })).toHaveStyle({
    objectFit: "contain",
    width: "100%",
  });
  fireEvent.click(
    within(dialog).getByRole("button", { name: "사용자 상세 닫기" }),
  );
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("프로필 수정 양식은 상세와 별도 적정 너비 및 축소 가능한 입력을 유지한다", () => {
  render(
    <EditProfileModal
      open
      onClose={jest.fn()}
      userId={fixture.id}
      userDetail={fixture}
    />,
  );
  const dialog = screen.getByRole("dialog", { name: /프로필 직접 수정/ });
  expect(dialog).toHaveStyle({
    width: "100%",
    maxWidth: "44rem",
    minWidth: "0",
  });
  expect(within(dialog).getByRole("textbox", { name: /이름/ })).toHaveValue(
    fixture.name,
  );
  expect(dialog.querySelector(".md\\:grid-cols-2")).toHaveClass("grid-cols-1");
});
