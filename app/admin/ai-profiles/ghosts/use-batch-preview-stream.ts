'use client';

import { useEffect, useRef, useState } from 'react';
import type { BatchPreviewItem } from '@/app/types/ghost-injection';

export interface PreviewStreamState {
	isConnected: boolean;
	completed: number;
	total: number;
	stage?: 'profile' | 'persona' | 'slot-prompt' | 'attach';
	itemsReady: Record<string, BatchPreviewItem>;
	isComplete: boolean;
	error: string | null;
	errorRetryable: boolean;
	elapsedMs: number | null;
}

const initial: PreviewStreamState = {
	isConnected: false,
	completed: 0,
	total: 0,
	itemsReady: {},
	isComplete: false,
	error: null,
	errorRetryable: false,
	elapsedMs: null,
};

export function useBatchPreviewStream(previewId: string | null) {
	const [state, setState] = useState<PreviewStreamState>(initial);
	const sourceRef = useRef<EventSource | null>(null);

	useEffect(() => {
		if (!previewId) {
			setState(initial);
			return;
		}

		const url = `/api/admin-proxy/admin/ghost-injection/batch-preview/${previewId}/stream`;
		const es = new EventSource(url, { withCredentials: true });
		sourceRef.current = es;

		es.addEventListener('open', () => setState((s) => ({ ...s, isConnected: true })));

		es.addEventListener('progress', (ev) => {
			try {
				const data = JSON.parse((ev as MessageEvent).data);
				setState((s) => ({
					...s,
					completed: data.completed ?? s.completed,
					total: data.total ?? s.total,
					stage: data.stage ?? s.stage,
				}));
			} catch {
				/* ignore */
			}
		});

		es.addEventListener('item-ready', (ev) => {
			try {
				const data = JSON.parse((ev as MessageEvent).data);
				if (data?.item?.itemId) {
					setState((s) => ({
						...s,
						itemsReady: { ...s.itemsReady, [data.item.itemId]: data.item },
						completed: data.completed ?? s.completed,
						total: data.total ?? s.total,
					}));
				}
			} catch {
				/* ignore */
			}
		});

		es.addEventListener('complete', (ev) => {
			let elapsed: number | null = null;
			try {
				elapsed = JSON.parse((ev as MessageEvent).data)?.elapsedMs ?? null;
			} catch {
				/* ignore */
			}
			setState((s) => ({ ...s, isComplete: true, elapsedMs: elapsed }));
			es.close();
		});

		es.addEventListener('error', (ev) => {
			let msg = 'SSE connection error';
			let retryable = true;
			try {
				const data = JSON.parse((ev as MessageEvent).data);
				msg = data?.message ?? msg;
				retryable = data?.retryable ?? true;
			} catch {
				/* network error event has no data — treat as retryable */
			}
			setState((s) => ({ ...s, error: msg, errorRetryable: retryable, isComplete: true }));
			es.close();
		});

		return () => {
			es.close();
			sourceRef.current = null;
			setState(initial);
		};
	}, [previewId]);

	return state;
}
