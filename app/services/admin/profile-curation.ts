import { adminGet, adminPost, adminUpload } from '@/shared/lib/http/admin-fetch';

type Envelope<T> = { data: T } | T;

function unwrap<T>(response: Envelope<T>): T {
  return response != null && typeof response === 'object' && 'data' in response
    ? (response as { data: T }).data
    : response as T;
}

export type ProfileCurationReviewImage = {
  imageId: string;
  url: string;
  slotIndex: number;
};

export type ProfileCurationReviewUser = {
  userId: string;
  profileId: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  approvedImages: ProfileCurationReviewImage[];
};

type ProfileCurationAsset = { id: string; s3Url: string };

export const profileCuration = {
  async getReviewUser(userId: string): Promise<ProfileCurationReviewUser> {
    return unwrap(await adminGet<Envelope<ProfileCurationReviewUser>>(`/admin/v2/profile-review/users/${userId}`));
  },

  async uploadPreparedAsset(file: File): Promise<ProfileCurationAsset> {
    const formData = new FormData();
    formData.append('file', file);
    return unwrap(await adminUpload<Envelope<ProfileCurationAsset>>('/admin/v2/profile-curation/assets', formData));
  },

  async create(input: {
    userId: string;
    expiresAt: string;
    items: Array<{
      sourceProfileImageId: string;
      targetSlotIndex: number;
      preparedImageAssetId: string;
    }>;
  }) {
    return unwrap(await adminPost<Envelope<unknown>>('/admin/v2/profile-curation/requests', input));
  },
};
