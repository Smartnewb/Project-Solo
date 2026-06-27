import { Box, Chip, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { RegistryRow } from './push-registry-model';
import {
	describeNotification,
	formatAudienceKo,
	formatCategoryName,
	formatPersistence,
	formatThrottle,
	formatTriggerKo,
	toReadableTemplateText,
} from './push-registry-model';

export function PushRegistryTable({ rows }: { rows: RegistryRow[] }) {
	return (
		<>
			<Paper variant="outlined" sx={{ mb: 2, borderRadius: 1, overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
				<Table size="small" sx={{ minWidth: 860, tableLayout: 'fixed' }}>
					<TableHead>
						<TableRow>
							<TableCell sx={{ width: '24%' }}>알림</TableCell>
							<TableCell sx={{ width: '30%' }}>발송 상황 / 대상</TableCell>
							<TableCell sx={{ width: '30%' }}>메시지</TableCell>
							<TableCell sx={{ width: '16%' }}>이동 / 운영</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{rows.map((row) => (
							<TableRow key={row.eventType}>
								<TableCell>
									<NotificationIdentity row={row} />
								</TableCell>
								<TableCell>
									<NotificationSituation row={row} />
								</TableCell>
								<TableCell>
									<NotificationTemplates row={row} />
								</TableCell>
								<TableCell>
									<NotificationOperations row={row} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Paper>
			<Stack spacing={1.5} sx={{ mb: 2, display: { xs: 'flex', md: 'none' } }}>
				{rows.map((row) => (
					<Paper key={row.eventType} variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
						<NotificationIdentity row={row} />
						<Box sx={{ mt: 1.5 }}>
							<NotificationSituation row={row} />
						</Box>
						<Box sx={{ mt: 1.5 }}>
							<NotificationTemplates row={row} />
						</Box>
						<Box sx={{ mt: 1.5 }}>
							<NotificationOperations row={row} />
						</Box>
					</Paper>
				))}
			</Stack>
		</>
	);
}

function NotificationIdentity({ row }: { row: RegistryRow }) {
	return (
		<>
			<Typography fontWeight={700}>{row.eventType}</Typography>
			<Typography variant="caption" color="text.secondary">
				{formatCategoryName(row.entry.category)} · {row.entry.category}
			</Typography>
			<RequiredFields fields={row.entry.requiredFields} />
		</>
	);
}

function NotificationSituation({ row }: { row: RegistryRow }) {
	return (
		<>
			<Typography variant="body2" fontWeight={700}>
				{describeNotification(row)}
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
				{formatAudienceKo(row.entry)}
			</Typography>
			<Typography variant="caption" color="text.secondary">
				{formatTriggerKo(row.entry)}
			</Typography>
		</>
	);
}

function NotificationTemplates({ row }: { row: RegistryRow }) {
	return (
		<>
			<TemplateText locale="ko" title={row.entry.template.ko.title} body={row.entry.template.ko.body} />
			<TemplateText locale="ja" title={row.entry.template.ja.title} body={row.entry.template.ja.body} />
		</>
	);
}

function NotificationOperations({ row }: { row: RegistryRow }) {
	const { entry } = row;
	return (
		<>
			<Typography variant="body2">화면: {entry.route}</Typography>
			<Typography variant="body2">딥링크: {entry.deepLink ?? '-'}</Typography>
			<Typography variant="body2" sx={{ mt: 0.75 }}>
				저장: {formatPersistence(entry)}
			</Typography>
			<Typography variant="body2">채팅방 안 억제: {entry.suppressInRoom ? '예' : '아니오'}</Typography>
			<Typography variant="body2">온라인 체크 생략: {entry.skipOnlineCheck ? '예' : '아니오'}</Typography>
			<Typography variant="body2">알림함 저장 생략: {entry.skipPersist ? '예' : '아니오'}</Typography>
			<Typography variant="body2">배지: {entry.badge ?? '-'}</Typography>
			<Typography variant="body2">Throttle: {formatThrottle(entry)}</Typography>
			<Typography variant="caption" color="text.secondary">
				트리거 타입: {entry.trigger.type === 'cron' ? '크론' : '이벤트'}
			</Typography>
		</>
	);
}

function RequiredFields({ fields }: { fields: string[] }) {
	return (
		<Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
			<Typography variant="body2">필요 값:</Typography>
			{fields.length > 0 ? fields.map((field) => <Chip key={field} size="small" label={field} variant="outlined" />) : <Typography variant="body2">-</Typography>}
		</Stack>
	);
}

function TemplateText({ locale, title, body }: { locale: string; title: string; body: string }) {
	return (
		<Box sx={{ mb: 0.75 }}>
			<Typography variant="body2" fontWeight={700}>
				{locale}: {toReadableTemplateText(title)}
			</Typography>
			<Typography variant="caption" color="text.secondary">
				{toReadableTemplateText(body)}
			</Typography>
		</Box>
	);
}
