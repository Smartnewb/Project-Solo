import { useForm, UseFormProps, FieldValues, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema } from 'zod';
import { useToast } from '@/shared/ui/admin/toast/toast-context';

interface UseAdminFormOptions<T extends FieldValues> extends Omit<UseFormProps<T>, 'resolver'> {
  schema: ZodSchema<T>;
}

type UseAdminFormReturn<T extends FieldValues> = UseFormReturn<T> & {
  handleFormSubmit: (
    handler: (data: T) => Promise<void>
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
};

export function useAdminForm<T extends FieldValues>({
  schema,
  ...formOptions
}: UseAdminFormOptions<T>): UseAdminFormReturn<T> {
  const toast = useToast();
  const form = useForm<T>({
    resolver: zodResolver(schema),
    ...formOptions,
  });

  const handleFormSubmit = (handler: (data: T) => Promise<void>) => {
    return form.handleSubmit(
      async (data) => {
        try {
          await handler(data);
        } catch (error) {
          const message = error instanceof Error ? error.message : '오류가 발생했습니다';
          toast.error(message);
        }
      },
      (errors) => {
        const firstError = Object.values(errors)[0];
        if (firstError?.message) {
          toast.error(String(firstError.message));
        }
      }
    );
  };

  return { ...form, handleFormSubmit };
}
