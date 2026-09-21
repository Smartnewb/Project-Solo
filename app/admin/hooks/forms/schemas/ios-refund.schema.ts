import { z } from 'zod';

export const iosRefundFilterSchema = z.object({
  filterStatus: z.string(),
  searchTerm: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export type IosRefundFilterFormValues = z.infer<typeof iosRefundFilterSchema>;
