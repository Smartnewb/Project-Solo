import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';

export type CardNewsTopic = string;

export interface QueueStats {
	waiting: number;
	active: number;
	completed: number;
	failed: number;
	delayed?: number;
	paused?: number;
}

export interface JobStatus {
	id: string;
	state: string;
	progress: number;
	data?: unknown;
	returnvalue?: unknown;
	failedReason?: string;
}

export const cardNewsGeneration = {
	generate: (topic: CardNewsTopic) =>
		adminPost<{ jobId: string; message: string }>(
			'/admin/card-news-generation/generate',
			{ topic },
		),

	generateBatch: () =>
		adminPost<{ jobIds: string[]; message: string }>(
			'/admin/card-news-generation/generate/batch',
			{},
		),

	status: (jobId: string) =>
		adminGet<JobStatus>(`/admin/card-news-generation/status/${jobId}`),

	preview: (topic: CardNewsTopic) =>
		adminPost<{ topic: string; dataset: unknown }>(
			'/admin/card-news-generation/preview',
			{ topic },
		),

	queueStats: () =>
		adminGet<QueueStats>('/admin/card-news-generation/queue-stats'),
};
