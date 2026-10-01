import { Button, Chip } from '@heroui/react';
import type { RegistryRow } from './push-registry-model';
import { describeCategory, formatCategoryName, formatEventChipLabel } from './push-registry-model';
type Props = {
    rows: RegistryRow[];
    onSelectCategory: (category: string) => void;
    onSelectEventType: (eventType: string, category: string) => void;
};
export function PushRegistryGraph({ rows, onSelectCategory, onSelectEventType }: Props) {
    const grouped = rows.reduce<Record<string, RegistryRow[]>>((acc, row) => {
        acc[row.entry.category] = [...(acc[row.entry.category] ?? []), row];
        return acc;
    }, {});
    return (<section style={{ padding: 16, borderRadius: 1 }} className="rounded-xl border bg-white p-4">
			<h2 className="mb-3 text-lg font-semibold">알림 구조도</h2>
			<div style={{ display: 'grid', gap: 16 }}>
				{Object.entries(grouped).map(([category, categoryRows]) => (<div key={category} style={{ border: '1px solid #e5e7eb', borderRadius: 1, overflow: 'hidden' }}>
						<Button onPress={() => onSelectCategory(category)} style={{ display: 'block', padding: 12, textAlign: 'left', width: '100%' }}>
							<p>{formatCategoryName(category)}</p>
							<p>
								{categoryRows.length}개 · {category}
							</p>
							<p style={{ marginTop: 6, minHeight: 42 }}>
								{describeCategory(category)}
							</p>
						</Button>
						<div style={{ paddingInline: 12, paddingBottom: 12 }}>
							{categoryRows.map(row => <Button key={row.eventType} size="sm" variant="secondary" onPress={() => onSelectEventType(row.eventType, category)}>{formatEventChipLabel(row)}</Button>)}
						</div>
					</div>))}
			</div>
		</section>);
}
