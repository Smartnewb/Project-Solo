// app/admin/style-reference/constants.ts

export const STYLE_KEYWORDS = [
  { code: 'warm',         nameKo: '따뜻한',     category: 'VIBE',       emoji: '🌤️' },
  { code: 'chic',         nameKo: '시크한',     category: 'VIBE',       emoji: '🖤' },
  { code: 'bright',       nameKo: '밝은',       category: 'VIBE',       emoji: '☀️' },
  { code: 'calm',         nameKo: '차분한',     category: 'VIBE',       emoji: '🌊' },
  { code: 'cute',         nameKo: '귀여운',     category: 'VIBE',       emoji: '🐰' },
  { code: 'intellectual', nameKo: '지적인',     category: 'VIBE',       emoji: '📚' },
  { code: 'natural',      nameKo: '자연스러운', category: 'VIBE',       emoji: '🌿' },
  { code: 'artistic',     nameKo: '감성적인',   category: 'VIBE',       emoji: '🎨' },
  { code: 'clean',        nameKo: '깔끔한',     category: 'FASHION',    emoji: '✨' },
  { code: 'casual',       nameKo: '캐주얼한',   category: 'FASHION',    emoji: '👕' },
  { code: 'street',       nameKo: '스트릿',     category: 'FASHION',    emoji: '🧢' },
  { code: 'sporty',       nameKo: '스포티한',   category: 'FASHION',    emoji: '🏃' },
  { code: 'formal',       nameKo: '포멀한',     category: 'FASHION',    emoji: '👔' },
  { code: 'vintage',      nameKo: '빈티지한',   category: 'FASHION',    emoji: '📻' },
  { code: 'warm_tone',    nameKo: '따뜻한 톤',  category: 'COLOR_TONE', emoji: '🍂' },
  { code: 'cool_tone',    nameKo: '차가운 톤',  category: 'COLOR_TONE', emoji: '🌑' },
  { code: 'pastel_tone',  nameKo: '파스텔 톤',  category: 'COLOR_TONE', emoji: '🌸' },
] as const;

export type StyleKeywordCode = (typeof STYLE_KEYWORDS)[number]['code'];

export const CATEGORY_LABELS = {
  VIBE: '분위기',
  FASHION: '패션',
  COLOR_TONE: '컬러톤',
} as const;

export type StyleCategory = keyof typeof CATEGORY_LABELS;

export const GENDER_LABELS = {
  MALE: '남성',
  FEMALE: '여성',
} as const;

export type StyleGender = keyof typeof GENDER_LABELS;

export function getKeywordMeta(code: string) {
  return STYLE_KEYWORDS.find((k) => k.code === code);
}
