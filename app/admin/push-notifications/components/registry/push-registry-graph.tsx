import { Box, ButtonBase, Chip, Paper, Stack, Typography } from '@mui/material';
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

	return (
		<Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
			<Typography variant="subtitle1" fontWeight={700} gutterBottom>
				알림 구조도
			</Typography>
			<Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
				{Object.entries(grouped).map(([category, categoryRows]) => (
					<Box
						key={category}
						sx={{
							border: '1px solid #e5e7eb',
							borderRadius: 1,
							overflow: 'hidden',
						}}
					>
						<ButtonBase
							onClick={() => onSelectCategory(category)}
							sx={{
								display: 'block',
								p: 1.5,
								textAlign: 'left',
								width: '100%',
								'&:hover': { bgcolor: '#f7f7f7' },
							}}
						>
							<Typography fontWeight={700}>{formatCategoryName(category)}</Typography>
							<Typography variant="caption" color="text.secondary">
								{categoryRows.length}개 · {category}
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, minHeight: 42 }}>
								{describeCategory(category)}
							</Typography>
						</ButtonBase>
						<Stack spacing={0.75} sx={{ px: 1.5, pb: 1.5 }}>
							{categoryRows.map((row) => (
								<Chip
									key={row.eventType}
									size="small"
									label={formatEventChipLabel(row)}
									onClick={() => onSelectEventType(row.eventType, category)}
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
