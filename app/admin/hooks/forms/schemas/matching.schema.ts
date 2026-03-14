import { z } from 'zod';

export const matchingSearchSchema = z.object({
  searchQuery: z.string().default(''),
});

export type MatchingSearchFormValues = z.infer<typeof matchingSearchSchema>;
