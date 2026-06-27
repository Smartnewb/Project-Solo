import { Box, Chip, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { RegistryRow } from './push-registry-model';
import { formatAudience, formatPersistence, formatThrottle, formatTrigger } from './push-registry-model';

export function PushRegistryTable({ rows }: { rows: RegistryRow[] }) {
	return (
		<Paper variant="outlined" sx={{ mb: 2, borderRadius: 1, overflowX: 'auto' }}>
			<Table size="small" sx={{ minWidth: 1120 }}>
				<TableHead>
					<TableRow>
						<TableCell>eventType</TableCell>
						<TableCell>trigger</TableCell>
						<TableCell>audience</TableCell>
						<TableCell>template</TableCell>
						<TableCell>route/deepLink</TableCell>
						<TableCell>flags</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{rows.map(({ eventType, entry }) => (
						<TableRow key={eventType}>
							<TableCell>
								<Typography fontWeight={700}>{eventType}</Typography>
								<Typography variant="caption" color="text.secondary">
									{entry.category} · {formatPersistence(entry)}
								</Typography>
								<RequiredFields fields={entry.requiredFields} />
							</TableCell>
							<TableCell>{formatTrigger(entry)}</TableCell>
							<TableCell>{formatAudience(entry)}</TableCell>
							<TableCell>
								<TemplateText locale="ko" title={entry.template.ko.title} body={entry.template.ko.body} />
								<TemplateText locale="ja" title={entry.template.ja.title} body={entry.template.ja.body} />
							</TableCell>
							<TableCell>
								<Typography variant="body2">route: {entry.route}</Typography>
								<Typography variant="body2">deepLink: {entry.deepLink ?? '-'}</Typography>
							</TableCell>
							<TableCell>
								<Typography variant="body2">suppressInRoom: {String(entry.suppressInRoom)}</Typography>
								<Typography variant="body2">skipOnlineCheck: {String(entry.skipOnlineCheck)}</Typography>
								<Typography variant="body2">skipPersist: {String(entry.skipPersist)}</Typography>
								<Typography variant="body2">badge: {entry.badge ?? '-'}</Typography>
								<Typography variant="body2">throttle: {formatThrottle(entry)}</Typography>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</Paper>
	);
}

function RequiredFields({ fields }: { fields: string[] }) {
	return (
		<Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
			<Typography variant="body2">requiredFields:</Typography>
			{fields.length > 0 ? fields.map((field) => <Chip key={field} size="small" label={field} variant="outlined" />) : <Typography variant="body2">-</Typography>}
		</Stack>
	);
}

function TemplateText({ locale, title, body }: { locale: string; title: string; body: string }) {
	return (
		<Box sx={{ mb: 0.75 }}>
			<Typography variant="body2" fontWeight={700}>
				{locale}: {title}
			</Typography>
			<Typography variant="caption" color="text.secondary">
				{body}
			</Typography>
		</Box>
	);
}
