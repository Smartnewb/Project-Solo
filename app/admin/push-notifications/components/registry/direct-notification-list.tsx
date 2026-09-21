import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import type { DirectPushNotificationEntry } from '@/app/services/admin/push-notification-registry';
import { toStringArray } from './push-registry-model';

export function DirectNotificationList({
	items,
	filter,
}: {
	items: DirectPushNotificationEntry[];
	filter: string;
}) {
	if (filter === 'registry-only') return null;

	return (
		<Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
			<Typography variant="subtitle1" fontWeight={700} gutterBottom>
				Registry 외부 직접 발송
			</Typography>
			<Stack spacing={1.5}>
				{items.map((item) => (
					<Box key={item.id} sx={{ borderTop: '1px solid #e5e7eb', pt: 1.5 }}>
						<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
							<Typography fontWeight={700}>{item.label}</Typography>
							<Chip size="small" label={item.status} color={item.status === 'active' ? 'success' : 'default'} />
							<Chip size="small" label="read-only" variant="outlined" />
						</Stack>
						<Typography variant="body2" color="text.secondary">
							{item.trigger}
						</Typography>
						<Typography variant="body2">대상: {item.audience}</Typography>
						<Typography variant="body2">ko: {item.template.ko?.title ?? '-'}</Typography>
						<Typography variant="body2">body: {item.template.ko?.body ?? '-'}</Typography>
						<Typography variant="body2">route: {item.route}</Typography>
						<Typography variant="body2">deepLink: {item.deepLink ?? '-'}</Typography>
						<Typography variant="body2">requiredFields: {toStringArray(item.requiredFields).join(', ') || '-'}</Typography>
						<Typography variant="body2">
							persistence: {item.persistence ? `${item.persistence.type}/${item.persistence.subType}` : '-'}
						</Typography>
						<Typography variant="body2">
							throttle: {item.throttle ? `${item.throttle.key} · ${item.throttle.ttlSeconds}s` : '-'}
						</Typography>
						<Typography variant="body2">skipOnlineCheck: {String(item.skipOnlineCheck)}</Typography>
						<Typography variant="body2">skipPersist: {String(item.skipPersist)}</Typography>
						<Typography variant="body2">notes: {toStringArray(item.notes).join(' / ') || '-'}</Typography>
						<Typography variant="caption" color="text.secondary">
							source: {item.source}
						</Typography>
					</Box>
				))}
			</Stack>
		</Paper>
	);
}
