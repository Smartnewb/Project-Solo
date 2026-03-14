import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { z } from 'zod';
import { useAdminForm } from '@/app/admin/hooks/forms/use-admin-form';

// Mock the toast context
const mockToastError = jest.fn();
const mockToastSuccess = jest.fn();

jest.mock('@/shared/ui/admin/toast/toast-context', () => ({
  useToast: () => ({
    error: mockToastError,
    success: mockToastSuccess,
    warning: jest.fn(),
    info: jest.fn(),
    dismiss: jest.fn(),
    toasts: [],
  }),
}));

const testSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  name: z.string().min(1, '이름을 입력하세요'),
});

type TestFormData = z.infer<typeof testSchema>;

interface TestFormProps {
  onSubmit: (data: TestFormData) => Promise<void>;
  defaultValues?: Partial<TestFormData>;
}

function TestForm({ onSubmit, defaultValues }: TestFormProps) {
  const { register, handleFormSubmit, formState } = useAdminForm<TestFormData>({
    schema: testSchema,
    defaultValues,
  });

  return (
    <form onSubmit={handleFormSubmit(onSubmit)}>
      <input data-testid="email" {...register('email')} />
      <input data-testid="name" {...register('name')} />
      <button type="submit">Submit</button>
      {formState.isSubmitting && <span data-testid="submitting">submitting</span>}
    </form>
  );
}

describe('useAdminForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful submission', () => {
    it('calls the submit handler with validated data when input is valid', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<TestForm onSubmit={handler} />);

      await user.type(screen.getByTestId('email'), 'admin@example.com');
      await user.type(screen.getByTestId('name'), 'Admin User');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(handler).toHaveBeenCalledWith({ email: 'admin@example.com', name: 'Admin User' });
      });
    });

    it('does not show a toast error on successful submission', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<TestForm onSubmit={handler} />);

      await user.type(screen.getByTestId('email'), 'admin@example.com');
      await user.type(screen.getByTestId('name'), 'Admin User');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => expect(handler).toHaveBeenCalled());
      expect(mockToastError).not.toHaveBeenCalled();
    });
  });

  describe('zod schema validation', () => {
    it('shows a toast error when email is invalid and does not call the submit handler', async () => {
      const handler = jest.fn();
      const user = userEvent.setup();
      render(<TestForm onSubmit={handler} />);

      await user.type(screen.getByTestId('email'), 'not-an-email');
      await user.type(screen.getByTestId('name'), 'Admin User');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('유효한 이메일을 입력하세요'));
      expect(handler).not.toHaveBeenCalled();
    });

    it('shows a toast error when a required field is empty', async () => {
      const handler = jest.fn();
      const user = userEvent.setup();
      render(<TestForm onSubmit={handler} />);

      // Leave name empty
      await user.type(screen.getByTestId('email'), 'admin@example.com');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('이름을 입력하세요'));
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('submit handler error handling', () => {
    it('shows a toast error with the error message when submit handler throws an Error', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('서버 오류가 발생했습니다'));
      const user = userEvent.setup();
      render(<TestForm onSubmit={handler} />);

      await user.type(screen.getByTestId('email'), 'admin@example.com');
      await user.type(screen.getByTestId('name'), 'Admin User');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() =>
        expect(mockToastError).toHaveBeenCalledWith('서버 오류가 발생했습니다'),
      );
    });

    it('shows a fallback toast message when submit handler throws a non-Error value', async () => {
      const handler = jest.fn().mockRejectedValue('string error');
      const user = userEvent.setup();
      render(<TestForm onSubmit={handler} />);

      await user.type(screen.getByTestId('email'), 'admin@example.com');
      await user.type(screen.getByTestId('name'), 'Admin User');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() =>
        expect(mockToastError).toHaveBeenCalledWith('오류가 발생했습니다'),
      );
    });
  });

  describe('default values', () => {
    it('pre-fills form fields from defaultValues option', () => {
      render(
        <TestForm
          onSubmit={jest.fn()}
          defaultValues={{ email: 'preset@example.com', name: 'Preset Name' }}
        />,
      );

      expect(screen.getByTestId('email')).toHaveValue('preset@example.com');
      expect(screen.getByTestId('name')).toHaveValue('Preset Name');
    });
  });
});
