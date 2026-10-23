import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AdminService from "@/app/services/admin";
import GenderEditModal from "./GenderEditModal";

jest.mock("@/app/services/admin", () => ({
  __esModule: true,
  default: {
    userAppearance: {
      getGenderCorrectionPreview: jest.fn(),
      correctUserGender: jest.fn(),
    },
  },
}));

const api = AdminService.userAppearance as jest.Mocked<typeof AdminService.userAppearance>;

function renderModal(onSuccess = jest.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <GenderEditModal open onClose={jest.fn()} userId="u-1" userName="차정근" onSuccess={onSuccess} />
    </QueryClientProvider>,
  );
  return onSuccess;
}

test("여성으로 가입한 유저를 확인 후 남성으로 정정하고 내린 카드 수를 알려 준다", async () => {
  // given
  const user = userEvent.setup();
  api.getGenderCorrectionPreview.mockResolvedValue({
    gender: "FEMALE",
    pendingMatches: 23,
    openMatches: 0,
    inChatMatches: 1,
  });
  api.correctUserGender.mockResolvedValue({ userId: "u-1", before: "FEMALE", after: "MALE", rejectedMatches: 23 });
  const onSuccess = renderModal();
  await screen.findByText("여성 → 남성");
  await user.click(screen.getByRole("checkbox"));

  // when
  await user.click(screen.getByRole("button", { name: "남성으로 정정" }));

  // then
  expect(api.correctUserGender).toHaveBeenCalledWith("u-1", "MALE");
  expect(onSuccess).toHaveBeenCalledWith({ gender: "MALE", rejectedMatches: 23 });
});

test("확인 체크 전에는 정정 버튼을 눌러도 바꾸지 않는다", async () => {
  // given
  const user = userEvent.setup();
  api.correctUserGender.mockClear();
  api.getGenderCorrectionPreview.mockResolvedValue({
    gender: "FEMALE",
    pendingMatches: 23,
    openMatches: 0,
    inChatMatches: 1,
  });

  renderModal();
  const button = await screen.findByRole("button", { name: "남성으로 정정" });

  // when
  await user.click(button);

  // then
  expect(api.correctUserGender).not.toHaveBeenCalled();
});
