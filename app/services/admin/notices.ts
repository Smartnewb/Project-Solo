import { adminGet, adminPost, adminPut, adminDelete } from '@/shared/lib/http/admin-fetch';
import type {
  AdminNoticeItem,
  AdminNoticeListResponse,
  CreateNoticeRequest,
  UpdateNoticeRequest,
  PublishNoticeRequest,
  PublishNoticeResponse,
  PushResendNoticeRequest,
} from '@/types/admin';
import { toStringParams } from './_shared';

const USE_MOCK = process.env.NEXT_PUBLIC_NOTICE_API_MOCK === 'true';
const MOCK_KEY = 'admin_notice_mock';

function readMock(): AdminNoticeItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(MOCK_KEY) || '[]');
  } catch {
    return [];
  }
}
function writeMock(items: AdminNoticeItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOCK_KEY, JSON.stringify(items));
  }
}

export interface NoticeListParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
}

type BackendNoticeListResponse = {
  data?: AdminNoticeItem[] | AdminNoticeListResponse;
  items?: AdminNoticeItem[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalItems?: number;
    totalPages?: number;
  };
};

function normalizeNoticeItem(item: AdminNoticeItem): AdminNoticeItem {
  return {
    ...item,
    url: item.url ?? item.linkUrl ?? null,
    linkUrl: item.linkUrl ?? item.url ?? null,
  };
}

function normalizeNoticeList(
  raw: BackendNoticeListResponse,
  fallback: NoticeListParams = {},
): AdminNoticeListResponse {
  const nested = raw.data && !Array.isArray(raw.data) ? raw.data : undefined;
  const items = Array.isArray(raw.data)
    ? raw.data
    : (nested?.items ?? raw.items ?? []);
  const rawMeta = (nested?.meta ?? raw.meta) as BackendNoticeListResponse['meta'] | undefined;
  const page = rawMeta?.page ?? fallback.page ?? 1;
  const limit = rawMeta?.limit ?? fallback.limit ?? 20;
  const totalItems = rawMeta?.totalItems ?? rawMeta?.total ?? items.length;

  return {
    items: items.map(normalizeNoticeItem),
    meta: {
      page,
      limit,
      totalItems,
      totalPages: rawMeta?.totalPages ?? (limit > 0 ? Math.ceil(totalItems / limit) : 0),
    },
  };
}

export const notices = {
  list: async (params: NoticeListParams = {}): Promise<AdminNoticeListResponse> => {
    if (USE_MOCK) {
      const all = readMock();
      const filtered = all
        .filter((n) => !params.status || n.status === params.status)
        .filter((n) => !params.priority || n.priority === params.priority)
        .filter((n) => !params.search || n.title.includes(params.search));
      const page = params.page ?? 1;
      const limit = params.limit ?? 20;
      return {
        items: filtered.slice((page - 1) * limit, page * limit).map(normalizeNoticeItem),
        meta: {
          page,
          limit,
          totalItems: filtered.length,
          totalPages: Math.ceil(filtered.length / limit) || 1,
        },
      };
    }
    const res = await adminGet<BackendNoticeListResponse>(
      '/admin/v2/content/notices',
      toStringParams(params as Record<string, unknown>),
    );
    return normalizeNoticeList(res, params);
  },

  urgent: async (): Promise<AdminNoticeItem[]> => {
    if (USE_MOCK) {
      const now = new Date();
      return readMock().filter(
        (n) =>
          n.priority === 'high' &&
          n.status === 'published' &&
          (!n.expiresAt || new Date(n.expiresAt) > now),
      );
    }
    const res = await adminGet<{ data: AdminNoticeItem[] }>('/admin/v2/content/notices/urgent');
    return res.data.map(normalizeNoticeItem);
  },

  detail: async (id: string): Promise<AdminNoticeItem> => {
    if (USE_MOCK) {
      const item = readMock().find((n) => n.id === id);
      if (!item) throw new Error('Not found');
      return item;
    }
    const res = await adminGet<{ data: AdminNoticeItem }>(`/admin/v2/content/notices/${id}`);
    return normalizeNoticeItem(res.data);
  },

  create: async (data: CreateNoticeRequest): Promise<AdminNoticeItem> => {
    if (USE_MOCK) {
      const now = new Date().toISOString();
      const item: AdminNoticeItem = {
        ...data,
        url: data.url ?? data.linkUrl ?? null,
        linkUrl: data.linkUrl ?? data.url ?? null,
        id: `mock_${Date.now()}`,
        status: 'draft',
        publishedAt: null,
        pushSentAt: null,
        createdAt: now,
        updatedAt: now,
      };
      writeMock([item, ...readMock()]);
      return item;
    }
    const res = await adminPost<{ data: AdminNoticeItem }>('/admin/v2/content/notices', data);
    return normalizeNoticeItem(res.data);
  },

  update: async (id: string, data: UpdateNoticeRequest): Promise<AdminNoticeItem> => {
    if (USE_MOCK) {
      const all = readMock();
      const idx = all.findIndex((n) => n.id === id);
      if (idx < 0) throw new Error('Not found');
      all[idx] = normalizeNoticeItem({ ...all[idx], ...data, updatedAt: new Date().toISOString() });
      writeMock(all);
      return all[idx];
    }
    const res = await adminPut<{ data: AdminNoticeItem }>(`/admin/v2/content/notices/${id}`, data);
    return normalizeNoticeItem(res.data);
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      writeMock(readMock().filter((n) => n.id !== id));
      return;
    }
    await adminDelete(`/admin/v2/content/notices/${id}`);
  },

  publish: async (id: string, data: PublishNoticeRequest): Promise<PublishNoticeResponse> => {
    if (USE_MOCK) {
      const all = readMock();
      const idx = all.findIndex((n) => n.id === id);
      if (idx < 0) throw new Error('Not found');
      const now = new Date().toISOString();
      all[idx] = normalizeNoticeItem({
        ...all[idx],
        status: 'published',
        publishedAt: now,
        pushSentAt: data.pushEnabled ? now : all[idx].pushSentAt ?? null,
        pushEnabled: data.pushEnabled ?? all[idx].pushEnabled,
      });
      writeMock(all);
      return { success: true, sentCount: data.pushEnabled ? 1000 : undefined };
    }
    const res = await adminPost<{ data: PublishNoticeResponse }>(
      `/admin/v2/content/notices/${id}/publish`,
      data,
    );
    return res.data;
  },

  pushResend: async (
    id: string,
    data: PushResendNoticeRequest,
  ): Promise<PublishNoticeResponse> => {
    if (USE_MOCK) {
      const all = readMock();
      const idx = all.findIndex((n) => n.id === id);
      if (idx < 0) throw new Error('Not found');
      const now = new Date().toISOString();
      all[idx] = normalizeNoticeItem({
        ...all[idx],
        pushSentAt: now,
        pushTitle: data.pushTitle,
        pushMessage: data.pushMessage,
      });
      writeMock(all);
      return { success: true, sentCount: 1000 };
    }
    const res = await adminPost<{ data: PublishNoticeResponse }>(
      `/admin/v2/content/notices/${id}/push`,
      data,
    );
    return res.data;
  },

  archive: async (id: string): Promise<AdminNoticeItem> => {
    if (USE_MOCK) {
      const all = readMock();
      const idx = all.findIndex((n) => n.id === id);
      if (idx < 0) throw new Error('Not found');
      all[idx] = normalizeNoticeItem({
        ...all[idx],
        status: 'archived',
        updatedAt: new Date().toISOString(),
      });
      writeMock(all);
      return all[idx];
    }
    const res = await adminPost<{ data: AdminNoticeItem }>(
      `/admin/v2/content/notices/${id}/archive`,
      {},
    );
    return normalizeNoticeItem(res.data);
  },
};
