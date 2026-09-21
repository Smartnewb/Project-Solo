import { z } from 'zod';

export const matchingSearchSchema = z.object({
  searchQuery: z.string(),
});

export type MatchingSearchFormValues = z.infer<typeof matchingSearchSchema>;
