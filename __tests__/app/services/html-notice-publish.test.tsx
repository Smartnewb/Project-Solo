import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PublishDialog } from '@/app/admin/content/components/PublishDialog';

const mockGet = jest.fn();
const mockPublish = jest.fn();
const mockError = jest.fn();
const mockSuccess = jest.fn();

jest.mock('@/app/services/admin/content', () => ({ cardNews: { get: (...args: unknown[]) => mockGet(...args) } }));
jest.mock('@/app/admin/hooks', () => ({
  usePublishCardNews: () => ({ mutateAsync: mockPublish, isPending: false }),
  useUpdateSometimeArticle: () => ({ mutateAsync: jest.fn(), isPending: false }),
  usePublishNotice: () => ({ mutateAsync: jest.fn(), isPending: false }),
  usePublishVideo: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
jest.mock('@/shared/ui/admin/toast/toast-context', () => ({
  useToast: () => ({ error: mockError, success: mockSuccess }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue({ id: 'notice', noticeHtmlState: { revision: 7 } });
  mockPublish.mockResolvedValue({ success: true, sentCount: 0, message: '국가별 게시본 준비 후 알림을 발송합니다.' });
});

it('목록에서 열어도 최신 HTML 리비전으로 발행하고 비동기 응답을 표시한다', async () => {
  // given
  render(<PublishDialog open type="longform" item={{ id: 'notice', title: '공지' }} onClose={jest.fn()} />);
  fireEvent.change(screen.getByLabelText('푸시 알림 메시지'), { target: { value: '공지 확인' } });
  // when
  fireEvent.click(screen.getByRole('button', { name: '발행' }));
  // then
  await waitFor(() => expect(mockPublish).toHaveBeenCalledWith({
    id: 'notice', data: { expectedRevision: 7, pushNotificationMessage: '공지 확인' },
  }));
  expect(mockGet).toHaveBeenCalledWith('notice');
  expect(mockSuccess).toHaveBeenCalledWith('국가별 게시본 준비 후 알림을 발송합니다.');
});

it('HTML 공지에서 푸시를 끄면 사용자의 선택과 다르게 알림을 보내지 않는다', async () => {
  // given
  render(<PublishDialog open type="longform" item={{ id: 'notice', title: '공지' }} onClose={jest.fn()} />);
  fireEvent.click(screen.getByRole('checkbox', { name: '푸시 알림 함께 발송' }));
  // when
  fireEvent.click(screen.getByRole('button', { name: '발행' }));
  // then
  await waitFor(() => expect(mockError).toHaveBeenCalledWith('HTML 공지는 현재 푸시 알림과 함께 발행됩니다. 푸시 알림을 켜주세요.'));
  expect(mockPublish).not.toHaveBeenCalled();
});
