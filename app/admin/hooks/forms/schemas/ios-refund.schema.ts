import { z } from 'zod';

export const iosRefundFilterSchema = z.object({
  filterStatus: z.string().default('ALL'),
  searchTerm: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
});

export type IosRefundFilterFormValues = z.infer<typeof iosRefundFilterSchema>;
