import {selectHeroValue,heroSelectTrigger} from '@/app/admin/content/test-utils/hero-select';
import React from 'react';
import { act, render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

// Mock AdminService
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockGet = jest.fn();
const mockPublish = jest.fn();
const mockPreviewHtml = jest.fn();
type MockPreset = {
  id: string;
  name: string;
  displayName: string;
  imageUrl: string;
  order: number;
};
const mockBackgroundGet = jest.fn<Promise<MockPreset[]>, []>(() => Promise.resolve([]));

jest.mock('@/app/services/admin', () => ({
  __esModule: true,
  default: {
    cardNews: {
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      get: (...args: unknown[]) => mockGet(...args),
      publish: (...args: unknown[]) => mockPublish(...args),
      previewHtml: (...args: unknown[]) => mockPreviewHtml(...args),
      uploadHtmlImage: jest.fn(),
      restoreHtml: jest.fn(),
    },
    backgroundPresets: {
      getActive: () => mockBackgroundGet(),
      upload: jest.fn(),
      delete: jest.fn(),
    },
    sometimeArticles: { uploadImage: jest.fn() },
  },
}));

jest.mock('@/app/admin/hooks', () => ({ useLongformCategories: () => ({data:[{code:'story_relationship',displayName:'연애'},{code:'announcement',displayName:'공지'}]}) }));
jest.mock('@/app/admin/content/components/seo/OgPreviewCard', () => ({OgPreviewCard: () => null}));

// Mock toast
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};
jest.mock('@/shared/ui/admin/toast/toast-context', () => ({
  useToast: () => mockToast,
}));

// Mock confirm
jest.mock('@/shared/ui/admin/confirm-dialog/confirm-dialog-context', () => ({
  useConfirm: () => jest.fn(() => Promise.resolve(true)),
}));

// Mock BackgroundSelector (presentation-only, needs heavy DOM)
jest.mock('@/app/admin/content/components/card-series/BackgroundSelector', () => ({
  __esModule: true,
  default: () => <div data-testid="background-selector" />,
}));

// Mock LongformPreview (uses react-markdown ESM)
jest.mock('@/app/admin/content/components/card-series/LongformPreview', () => ({
  __esModule: true,
  default: ({ readTimeMinutes }: { readTimeMinutes: number }) => (
    <div data-testid="longform-preview">
      <span data-testid="read-time">{readTimeMinutes}분</span>
    </div>
  ),
}));

// Mock MarkdownEditor
jest.mock('@/app/admin/content/components/article/MarkdownEditor', () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea
      data-testid="body-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

// Mock preset modals
jest.mock('@/app/admin/content/components/card-series/PresetUploadModal', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/app/admin/content/components/card-series/PresetEditModal', () => ({
  __esModule: true,
  default: () => null,
}));

import { LongformForm } from '@/app/admin/content/components/forms/LongformForm';

async function setBackgroundForValidation() {
  // our mocked background selector means presets array is empty, so we need to ensure
  // the form has a selectedPresetId. Since init() sets presetId from response
  // (and our mock returns []), we accept that validateBackground will fail for PRESET.
  // We bypass by switching to CUSTOM with a url: we need direct state manipulation.
}

describe('LongformForm', () =>{
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState({}, '', '/');
    mockBackgroundGet.mockResolvedValue([
      { id: 'p1', name: 'p1', displayName: 'Preset 1', imageUrl: 'https://img/p1', order: 0 },
    ]);
  });

  it('renders without the legacy layoutMode selector', async () => {
    render(<LongformForm mode="create" />);
    await waitFor(() => {
      expect(screen.getByText('새 롱폼 아티클 작성')).toBeInTheDocument();
    });
    // LayoutModeSelector would expose these labels
    expect(screen.queryByLabelText('레이아웃 모드')).not.toBeInTheDocument();
    expect(screen.queryByText('이미지 전용')).not.toBeInTheDocument();
  });

  it('shows estimated read time 1분 for ~500 chars and ~4분 for ~2000 chars', async () => {
    render(<LongformForm mode="create" />);
    await waitFor(() => {
      expect(screen.getByTestId('body-editor')).toBeInTheDocument();
    });

    const editor = screen.getByTestId('body-editor') as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: 'a'.repeat(500) } });
    await waitFor(() => {
      expect(screen.getByText(/예상 읽기 시간 1분/)).toBeInTheDocument();
    });

    fireEvent.change(editor, { target: { value: 'a'.repeat(2000) } });
    await waitFor(() => {
      expect(screen.getByText(/예상 읽기 시간 4분/)).toBeInTheDocument();
    });
  });

  it('blocks submit and surfaces zod error when body is empty', async () => {
    render(<LongformForm mode="create" />);
    await waitFor(() => {
      expect(screen.getByText('새 롱폼 아티클 작성')).toBeInTheDocument();
    });

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/^제목/), { target: { value: '제목A' } });
    fireEvent.change(screen.getByLabelText(/설명/), { target: { value: '설명A' } });

    const saveButton = screen.getByRole('button', { name: /저장$/ });
    fireEvent.click(saveButton);

    await waitFor(() => {
      // either the toast error from handleFormSubmit or the schema message is fine
      expect(mockToast.error).toHaveBeenCalled();
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('submits with layoutMode=longform when payload is valid', async () => {
    mockCreate.mockResolvedValue({ id: 'new-id' });

    render(<LongformForm mode="create" />);
    await waitFor(() => {
      expect(screen.getByText('새 롱폼 아티클 작성')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/^제목/), { target: { value: '제목A' } });
    fireEvent.change(screen.getByLabelText(/설명/), { target: { value: '설명A' } });
    fireEvent.change(screen.getByTestId('body-editor'), {
      target: { value: '본문 내용입니다.' },
    });

    await selectHeroValue('카테고리','story_relationship');

    const saveButton = screen.getByRole('button', { name: /저장$/ });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });
    const payload = mockCreate.mock.calls[0][0];
    expect(payload.layoutMode).toBe('longform');
    expect(payload.body).toBe('본문 내용입니다.');
    expect(payload.title).toBe('제목A');
  });
});

it('saves HTML through the card-news API without legacy body and keeps the saved revision after publication failure', async () => {
  jest.clearAllMocks();
  window.history.replaceState({}, '', '/admin/content/longform/create?format=html');
  const state = { revision:1, variants:{kr:{safeHtml:'<p>safe</p>',safeCss:''}}, translation:{status:'pending',attempts:0} };
  mockCreate.mockResolvedValue({id:'html-id',noticeHtmlState:state});
  mockUpdate.mockResolvedValue({id:'html-id',noticeHtmlState:{...state,revision:2}});
  mockPreviewHtml.mockResolvedValue({previewDigest:'digest',document:'<p>validated</p>'});
  mockPublish.mockRejectedValue(new Error('publication failed'));
  render(<LongformForm mode="create" />);
  await screen.findByText('HTML 공지 작성');
  fireEvent.change(screen.getByLabelText(/^제목/),{target:{value:'HTML title'}});
  fireEvent.change(screen.getByLabelText(/^설명/),{target:{value:'HTML description'}});
  fireEvent.change(screen.getByLabelText('HTML'),{target:{value:'<p>notice</p>'}});
  fireEvent.click(screen.getByRole('button',{name:'검증 및 미리보기'}));
  await screen.findByTitle('검증된 KR 공지 미리보기');
  fireEvent.click(screen.getByRole('button',{name:'저장 후 발행'}));
  await waitFor(() => expect(mockPublish).toHaveBeenCalled());
  const payload = mockCreate.mock.calls[0][0];
  expect(payload).toMatchObject({categoryCode:'announcement',layoutMode:'longform',hasReward:false,noticeHtmlInput:{html:'<p>notice</p>',css:'',previewDigest:'digest',expectedRevision:0}});
  expect(payload).not.toHaveProperty('body');
  expect(payload).not.toHaveProperty('backgroundImage');
  expect(payload).not.toHaveProperty('sections');
  await waitFor(() => expect(screen.getByRole('button',{name:'저장',exact:true})).not.toBeDisabled());
  expect(screen.getByLabelText('HTML 공지 · JP 자동 번역')).toBeDisabled();
  fireEvent.click(screen.getByRole('button',{name:'저장',exact:true}));
  await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
  expect(mockCreate).toHaveBeenCalledTimes(1);
  expect(mockUpdate.mock.calls[0][1].noticeHtmlInput.expectedRevision).toBe(1);
  expect(mockPush).not.toHaveBeenCalled();
});

it('preserves metadata edited while an HTML save is awaiting its response', async () => {
  jest.clearAllMocks();
  window.history.replaceState({}, '', '/admin/content/longform/create?format=html');
  let complete!: (value: unknown) => void;
  mockCreate.mockReturnValue(new Promise((resolve) => { complete = resolve; }));
  mockPreviewHtml.mockResolvedValue({ previewDigest: 'digest', document: '<p>validated</p>' });
  render(<LongformForm mode="create" />);
  await screen.findByText('HTML 공지 작성');
  fireEvent.change(screen.getByLabelText(/^제목/), { target: { value: 'Submitted title' } });
  fireEvent.change(screen.getByLabelText(/^설명/), { target: { value: 'Description' } });
  fireEvent.change(screen.getByLabelText('HTML'), { target: { value: '<p>notice</p>' } });
  fireEvent.click(screen.getByRole('button', { name: '검증 및 미리보기' }));
  await screen.findByTitle('검증된 KR 공지 미리보기');
  fireEvent.click(screen.getByRole('button', { name: '저장', exact: true }));
  await waitFor(() => expect(mockCreate).toHaveBeenCalled());
  fireEvent.change(screen.getByLabelText(/^제목/), { target: { value: 'New unsaved title' } });
  await act(async () => complete({ id: 'notice', noticeHtmlState: {
    revision: 1, variants: { kr: { safeHtml: '<p>notice</p>', safeCss: '' } },
    translation: { status: 'pending', attempts: 0 },
  } }));
  expect(mockCreate.mock.calls[0][0].title).toBe('Submitted title');
  expect(screen.getByLabelText(/^제목/)).toHaveValue('New unsaved title');
  expect(screen.getByRole('button', { name: '저장', exact: true })).toBeDisabled();
});
