import { Paper, Typography } from '@mui/material';

export function PushRegistrySummaryCard({
	label,
	value,
	helper,
}: {
	label: string;
	value: string;
	helper?: string;
}) {
	return (
		<Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
			<Typography variant="body2" color="text.secondary">
				{label}
			</Typography>
			<Typography variant="h6" fontWeight={700}>
				{value}
			</Typography>
			{helper ? (
				<Typography variant="caption" color="text.secondary">
					{helper}
				</Typography>
			) : null}
		</Paper>
	);
}
