import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import type { RegistryRow } from './push-registry-model';

export function PushRegistryGraph({ rows }: { rows: RegistryRow[] }) {
	const grouped = rows.reduce<Record<string, RegistryRow[]>>((acc, row) => {
		acc[row.entry.category] = [...(acc[row.entry.category] ?? []), row];
		return acc;
	}, {});

	return (
		<Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
			<Typography variant="subtitle1" fontWeight={700} gutterBottom>
				알림 구조도
			</Typography>
			<Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
				{Object.entries(grouped).map(([category, categoryRows]) => (
					<Box key={category} sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 1.5 }}>
						<Typography fontWeight={700}>{category}</Typography>
						<Typography variant="caption" color="text.secondary">
							{categoryRows.length}개
						</Typography>
						<Stack spacing={0.75} sx={{ mt: 1 }}>
							{categoryRows.map((row) => (
								<Chip
									key={row.eventType}
									size="small"
									label={`${row.eventType} · ${row.entry.trigger.type}`}
									variant="outlined"
									sx={{ justifyContent: 'flex-start' }}
								/>
							))}
						</Stack>
					</Box>
				))}
			</Box>
		</Paper>
	);
}
