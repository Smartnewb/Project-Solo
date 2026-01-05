export type Big5Dimension = 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';

export type DimensionOrAuto = Big5Dimension | 'auto';

export interface DimensionDistribution {
  openness?: number;
  conscientiousness?: number;
  extraversion?: number;
  agreeableness?: number;
  neuroticism?: number;
}

export interface QuestionOption {
  text: string;
  order: number;
}

export interface QuestionOptionWithId extends QuestionOption {
  id: string;
}

export interface QuestionCandidate {
  tempId: string;
  text: string;
  dimension: Big5Dimension;
  options: QuestionOption[];
}

export interface GenerateQuestionsRequest {
  theme: string;
  keywords: string[];
  dimension: DimensionOrAuto;
  count: number;
  distribution?: DimensionDistribution;
}

export interface GenerateQuestionsMetadata {
  model: string;
  outputTokens: number;
  cost: number;
  processingTimeMs: number;
  distribution?: Array<{ dimension: Big5Dimension; count: number }>;
}

export interface GenerateQuestionsResponse {
  candidates: QuestionCandidate[];
  generatedAt: string;
  metadata: GenerateQuestionsMetadata;
}

export interface BulkCreateQuestionItem {
  text: string;
  dimension: Big5Dimension;
  type: string;
  options: QuestionOption[];
}

export interface BulkCreateQuestionsRequest {
  questions: BulkCreateQuestionItem[];
  metadata?: {
    theme?: string;
    keywords?: string[];
  };
}

export interface CreatedQuestion {
  id: string;
  orderIndex: number;
  createdAt: string;
}

export interface BulkCreateFailure {
  index: number;
  reason: string;
}

export interface BulkCreateQuestionsResponse {
  success: boolean;
  created: number;
  failed: number;
  questions: CreatedQuestion[];
  failures?: BulkCreateFailure[];
}

export interface TranslationStatus {
  kr: boolean;
  jp: boolean;
}

export interface QuestionListItem {
  id: string;
  text: string;
  dimension: Big5Dimension;
  type: string;
  orderIndex: number;
  isActive: boolean;
  optionCount: number;
  translationStatus: TranslationStatus;
  createdAt: string;
  metadata?: {
    theme?: string;
    keywords?: string[];
  };
}

export interface QuestionListPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QuestionListResponse {
  questions: QuestionListItem[];
  pagination: QuestionListPagination;
}

export interface GetQuestionsParams {
  dimension?: Big5Dimension;
  schema?: 'public' | 'kr' | 'jp';
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  translationStatus?: 'kr_only' | 'kr_jp' | 'all';
}

export interface JpTranslation {
  text: string;
  options: Array<{ text: string; order: number }>;
}

export interface QuestionDetail {
  id: string;
  text: string;
  dimension: Big5Dimension;
  type: string;
  orderIndex: number;
  isActive: boolean;
  options: QuestionOptionWithId[];
  translations?: {
    jp?: JpTranslation;
  };
  metadata?: {
    theme?: string;
    keywords?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateQuestionRequest {
  text?: string;
  dimension?: Big5Dimension;
  options?: QuestionOption[];
  metadata?: {
    theme?: string;
    keywords?: string[];
  };
}

export interface TranslateQuestionsRequest {
  questionIds: string[];
  targetSchema: 'jp' | 'kr';
  preview?: boolean;
}

export interface TranslationPreviewItem {
  sourceId: string;
  source: {
    text: string;
    options: string[];
  };
  translated: {
    text: string;
    options: string[];
  };
}

export interface TranslatePreviewMetadata {
  model: string;
  estimatedCost: number;
  estimatedOutputTokens: number;
  estimatedTimeMs: number;
}

export interface TranslatePreviewResponse {
  translations: TranslationPreviewItem[];
  metadata: TranslatePreviewMetadata;
}

export interface TranslateResultItem {
  sourceId: string;
  targetId: string;
  status: 'success' | 'failed';
  error?: string;
}

export interface TranslateExecuteMetadata {
  model: string;
  actualCost: number;
  actualOutputTokens: number;
  processingTimeMs: number;
}

export interface TranslateExecuteResponse {
  success: boolean;
  translated: number;
  failed: number;
  results: TranslateResultItem[];
  metadata: TranslateExecuteMetadata;
}

export type TranslateQuestionsResponse = TranslatePreviewResponse | TranslateExecuteResponse;

export function isTranslatePreviewResponse(response: TranslateQuestionsResponse): response is TranslatePreviewResponse {
  return 'translations' in response;
}

export function isTranslateExecuteResponse(response: TranslateQuestionsResponse): response is TranslateExecuteResponse {
  return 'results' in response;
}
