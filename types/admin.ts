export interface BackgroundPreset {
  id: string;
  name: string;
  displayName: string;
  imageUrl: string;
  thumbnailUrl?: string;
  order: number;
}

export interface BackgroundImage {
  type: 'PRESET' | 'CUSTOM';
  preset?: BackgroundPreset;
  presetName?: string;
  customUrl?: string;
  url?: string;
}

export interface Category {
  id: string;
  displayName: string;
  code: string;
  emojiUrl: string;
}

export interface CardSection {
  id?: string;
  order: number;
  title: string;
  content: string;
  imageUrl?: string;
}

export interface AdminCardNewsItem {
  id: string;
  title: string;
  description?: string;
  postType: string;
  category: Category;
  backgroundImage?: BackgroundImage;
  hasReward: boolean;
  sections?: CardSection[];
  readCount: number;
  pushNotificationMessage?: string;
  pushSentAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCardNewsListResponse {
  items: AdminCardNewsItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateCardNewsRequest {
  title: string;
  description?: string;
  categoryCode: string;
  backgroundImage?: {
    type: 'PRESET' | 'CUSTOM';
    presetId?: string;
    customUrl?: string;
  };
  hasReward: boolean;
  sections: Array<{
    order: number;
    title: string;
    content: string;
    imageUrl?: string;
  }>;
  pushNotificationMessage?: string;
}

export interface UpdateCardNewsRequest {
  title?: string;
  description?: string;
  backgroundImage?: {
    type: 'PRESET' | 'CUSTOM';
    presetId?: string;
    customUrl?: string;
  };
  hasReward?: boolean;
  sections?: Array<{
    order: number;
    title: string;
    content: string;
    imageUrl?: string;
  }>;
  pushNotificationMessage?: string;
}

export interface PublishCardNewsResponse {
  success: boolean;
  sentCount: number;
  message: string;
}

export interface UploadImageResponse {
  url: string;
  message?: string;
}

export interface CreatePresetRequest {
  name: string;
  displayName: string;
  imageUrl: string;
  thumbnailUrl?: string;
  order?: number;
}

export interface UploadAndCreatePresetRequest {
  name: string;
  displayName: string;
  order?: number;
}

export interface BackgroundPresetsResponse {
  data: BackgroundPreset[];
}
