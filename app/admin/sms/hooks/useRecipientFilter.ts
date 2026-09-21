'use client';

import { useState } from 'react';
import { useDebounce } from '@/shared/hooks/use-debounce';
import type { RecipientFilter } from '@/app/services/sms';

export function useRecipientFilter(initial: RecipientFilter = {}) {
	const [filter, setFilter] = useState<RecipientFilter>(initial);
	const debouncedFilter = useDebounce(filter, 300);

	const update = <K extends keyof RecipientFilter>(key: K, value: RecipientFilter[K]) => {
		setFilter((prev) => ({ ...prev, [key]: value }));
	};

	const reset = () => setFilter({});

	return { filter, debouncedFilter, update, reset, setFilter };
}
