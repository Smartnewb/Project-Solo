'use client';
import { Chip } from '@heroui/react';
import { LEGACY_CATEGORY_LABELS, NEW_CATEGORY_OPTIONS, NOTICE_CATEGORY_LABEL, } from '../constants';
const NEW_LABELS: Record<string, string> = {
    ...Object.fromEntries(NEW_CATEGORY_OPTIONS.map((o) => [o.code, o.label])),
    notice: NOTICE_CATEGORY_LABEL,
};
export function CategoryBadge({ code }: {
    code: string;
}) {
    const isNew = code in NEW_LABELS;
    const label = NEW_LABELS[code] || LEGACY_CATEGORY_LABELS[code] || code;
    return <span className="inline-flex gap-1"><Chip size="sm">{label}</Chip>{!isNew && <Chip size="sm" variant="soft">레거시</Chip>}</span>;
}
