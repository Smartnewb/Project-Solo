import { z } from 'zod';

const articleStatusValues = ['draft', 'scheduled', 'published', 'archived'] as const;
const articleCategoryValues = ['story', 'interview', 'tips', 'team', 'update', 'safety'] as const;

export const sometimeArticleSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요.')
    .max(200, '제목은 최대 200자까지 입력 가능합니다.'),
  subtitle: z.string().max(300, '부제목은 최대 300자까지 입력 가능합니다.'),
  slug: z.string().min(1, '슬러그를 입력해주세요.'),
  category: z.enum(articleCategoryValues, {
    errorMap: () => ({ message: '카테고리를 선택해주세요.' }),
  }),
  status: z.enum(articleStatusValues),
  excerpt: z.string().max(500, '요약은 최대 500자까지 입력 가능합니다.'),
  content: z.string().min(1, '본문을 입력해주세요.'),
  thumbnailUrl: z.string(),
  coverImageUrl: z.string(),
  authorId: z.string().min(1, '작성자 ID를 입력해주세요.'),
  authorName: z
    .string()
    .min(1, '작성자 이름을 입력해주세요.')
    .max(50, '작성자 이름은 최대 50자까지 입력 가능합니다.'),
  authorRole: z.string().max(50),
  authorAvatar: z.string(),
  metaTitle: z.string().max(60, '메타 타이틀은 최대 60자까지 입력 가능합니다.'),
  metaDescription: z
    .string()
    .max(160, '메타 설명은 최대 160자까지 입력 가능합니다.'),
  ogImage: z.string(),
  keywords: z.string(),
});

export type SometimeArticleFormValues = z.infer<typeof sometimeArticleSchema>;
