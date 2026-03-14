import { z } from 'zod';

export const articleBlindSchema = z.object({
  blindReason: z.string().default(''),
});

export type ArticleBlindFormValues = z.infer<typeof articleBlindSchema>;

export const commentBlindSchema = z.object({
  blindReason: z.string().default(''),
});

export type CommentBlindFormValues = z.infer<typeof commentBlindSchema>;
