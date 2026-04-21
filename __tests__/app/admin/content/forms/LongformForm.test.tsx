import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
const mockBackgroundGet = jest.fn(() => Promise.resolve([]));

jest.mock('@/app/services/admin', () => ({
  __esModule: true,
  default: {
    cardNews: {
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      get: (...args: unknown[]) => mockGet(...args),
      publish: (...args: unknown[]) => mockPublish(...args),
    },
    backgroundPresets: {
      getActive: () => mockBackgroundGet(),
      upload: jest.fn(),
      delete: jest.fn(),
    },
    sometimeArticles: { uploadImage: jest.fn() },
  },
}));

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

describe('LongformForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    // Open the MUI Select by clicking the displayed control div.
    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.mouseDown(comboboxes[0]);
    const relationshipOption = await screen.findByRole('option', { name: '연애' });
    fireEvent.click(relationshipOption);

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
