// community.test.js
import { screen, render, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import CommunityPage from '../app/community/page';
import { AuthProvider } from '../contexts/AuthContext';

// AuthContext 모킹
jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: jest.fn().mockReturnValue({
    user: { id: 'test-user-id' },
    isLoading: false
  })
}));

describe('Community Page', () => {
  beforeEach(() => {
    // API 호출 감시
    global.fetch = jest.fn();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('디바운싱이 올바르게 작동하는지 테스트', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <CommunityPage />
        </AuthProvider>
      );
    });

    const textarea = screen.getByPlaceholderText('무슨 생각을 하고 계신가요?');
    const apiCalls = [];

    // API 호출 추적
    global.fetch = jest.fn().mockImplementation((...args) => {
      apiCalls.push(args);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });

    // 빠르게 타이핑 시뮬레이션
    await act(async () => {
      userEvent.type(textarea, 'Hello', { delay: 10 });
    });

    // 모든 타이핑 이벤트가 발생한 후 300ms 대기
    await waitFor(() => {
      // 타이핑 중간에 API 호출이 발생하지 않아야 함
      expect(apiCalls.length).toBeLessThanOrEqual(1);
    }, { timeout: 500 });
  });

  test('게시글 생성 시 올바른 UUID 형식 사용 확인', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <CommunityPage />
        </AuthProvider>
      );
    });

    const textarea = screen.getByPlaceholderText('무슨 생각을 하고 계신가요?');
    const submitButton = screen.getByText('게시하기');

    // UUID 추적을 위한 모킹
    const insertMock = jest.fn().mockResolvedValue({ error: null });
    jest.spyOn(global.console, 'log').mockImplementation((message, ...args) => {
      if (typeof message === 'string' && message.includes('게시글 작성 시도')) {
        // UUID 형식 검증
        const post = args[0];
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(post.userId).toMatch(uuidRegex);
      }
    });

    // 게시글 작성 및 제출
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Test post content' } });
      fireEvent.click(submitButton);
    });

    // UUID 로그가 출력되었는지 확인
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching('게시글 작성 시도'),
        expect.anything()
      );
    });
  });
});
