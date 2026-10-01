import { Chip } from '@heroui/react';
import type { RegistryRow } from './push-registry-model';
import { describeNotification, formatAudienceKo, formatCategoryName, formatPersistence, formatThrottle, formatTriggerKo, getRequiredFields, toReadableTemplateText, } from './push-registry-model';
export function PushRegistryTable({ rows }: {
    rows: RegistryRow[];
}) {
    return (<>
			<section style={{ marginBottom: 16, borderRadius: 1, overflowX: 'auto' }} className="rounded-xl border bg-white p-4">
				<table style={{ minWidth: 860 }} className="w-full text-sm">
					<thead className="bg-gray-50 text-left">
						<tr className="border-b">
							<th scope="col" style={{ width: '24%' }} className="border-b px-4 py-3">알림</th>
							<th scope="col" style={{ width: '30%' }} className="border-b px-4 py-3">발송 상황 / 대상</th>
							<th scope="col" style={{ width: '30%' }} className="border-b px-4 py-3">메시지 (registry 샘플)</th>
							<th scope="col" style={{ width: '16%' }} className="border-b px-4 py-3">이동 / 운영</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (<tr key={row.eventType} className="border-b">
								<td className="border-b px-4 py-3">
									<NotificationIdentity row={row}></NotificationIdentity>
								</td>
								<td className="border-b px-4 py-3">
									<NotificationSituation row={row}></NotificationSituation>
								</td>
								<td className="border-b px-4 py-3">
									<NotificationTemplates row={row}></NotificationTemplates>
								</td>
								<td className="border-b px-4 py-3">
									<NotificationOperations row={row}></NotificationOperations>
								</td>
							</tr>))}
					</tbody>
				</table>
			</section>
			<div style={{ marginBottom: 16 }}>
				{rows.map((row) => (<section key={row.eventType} style={{ padding: 16, borderRadius: 1 }} className="rounded-xl border bg-white p-4">
						<NotificationIdentity row={row}></NotificationIdentity>
						<div style={{ marginTop: 12 }}>
							<NotificationSituation row={row}></NotificationSituation>
						</div>
						<div style={{ marginTop: 12 }}>
							<NotificationTemplates row={row}></NotificationTemplates>
						</div>
						<div style={{ marginTop: 12 }}>
							<NotificationOperations row={row}></NotificationOperations>
						</div>
					</section>))}
			</div>
		</>);
}
function NotificationIdentity({ row }: {
    row: RegistryRow;
}) {
    return (<>
			<p>{row.eventType}</p>
			<p>
				{formatCategoryName(row.entry.category)} · {row.entry.category}
			</p>
			<RequiredFields fields={getRequiredFields(row.entry)}></RequiredFields>
		</>);
}
function NotificationSituation({ row }: {
    row: RegistryRow;
}) {
    return (<>
			<p>
				{describeNotification(row)}
			</p>
			<p style={{ marginTop: 6 }}>
				{formatAudienceKo(row.entry)}
			</p>
			<p>
				{formatTriggerKo(row.entry)}
			</p>
		</>);
}
function NotificationTemplates({ row }: {
    row: RegistryRow;
}) {
    return (<>
			<TemplateText locale="ko" title={row.entry.template.ko.title} body={row.entry.template.ko.body}></TemplateText>
			<TemplateText locale="ja" title={row.entry.template.ja.title} body={row.entry.template.ja.body}></TemplateText>
		</>);
}
function NotificationOperations({ row }: {
    row: RegistryRow;
}) {
    const { entry } = row;
    return (<>
			<p>화면: {entry.route}</p>
			<p>딥링크: {entry.deepLink ?? '-'}</p>
			<p style={{ marginTop: 6 }}>
				저장: {formatPersistence(entry)}
			</p>
			<p>채팅방 안 억제: {entry.suppressInRoom ? '예' : '아니오'}</p>
			<p>온라인 체크 생략: {entry.skipOnlineCheck ? '예' : '아니오'}</p>
			<p>알림함 저장 생략: {entry.skipPersist ? '예' : '아니오'}</p>
			<p>배지: {entry.badge ?? '-'}</p>
			<p>Throttle: {formatThrottle(entry)}</p>
			<p>
				트리거 타입: {entry.trigger.type === 'cron' ? '크론' : '이벤트'}
			</p>
		</>);
}
function RequiredFields({ fields }: {
    fields: string[];
}) {
    return (<div style={{ marginTop: 4 }}>
			<p>필요 값:</p>
			{fields.length > 0 ? fields.map((field) => <Chip key={field} size="sm">{field}</Chip>) : <p>-</p>}
		</div>);
}
function TemplateText({ locale, title, body }: {
    locale: string;
    title: string;
    body: string;
}) {
    return (<div style={{ marginBottom: 6 }}>
			<p>
				{locale}: {toReadableTemplateText(title)}
			</p>
			<p>
				{toReadableTemplateText(body)}
			</p>
		</div>);
}
