'use client';

import { useState, useEffect } from 'react';
import type { RecipientFilter } from '@/app/services/sms';

export function useRecipientFilter(initial: RecipientFilter = {}) {
	const [filter, setFilter] = useState<RecipientFilter>(initial);
	const [debouncedFilter, setDebouncedFilter] = useState<RecipientFilter>(initial);

	useEffect(() => {
		const t = setTimeout(() => setDebouncedFilter(filter), 300);
		return () => clearTimeout(t);
	}, [filter]);

	const update = <K extends keyof RecipientFilter>(key: K, value: RecipientFilter[K]) => {
		setFilter((prev) => ({ ...prev, [key]: value }));
	};

	const reset = () => setFilter({});

	return { filter, debouncedFilter, update, reset, setFilter };
}
