import { Chip } from '@heroui/react';
import type { DirectPushNotificationEntry } from '@/app/services/admin/push-notification-registry';
import { toStringArray } from './push-registry-model';
export function DirectNotificationList({ items, filter, }: {
    items: DirectPushNotificationEntry[];
    filter: string;
}) {
    if (filter === 'registry-only')
        return null;
    return (<section style={{ padding: 16, borderRadius: 1 }} className="rounded-xl border bg-white p-4">
			<p>
				Registry 외부 직접 발송
			</p>
			<div>
				{items.map((item) => (<div key={item.id} style={{ paddingTop: 12 }}>
						<div>
							<p>{item.label}</p>
							<Chip size="sm">{item.status}</Chip>
							<Chip size="sm">{"read-only"}</Chip>
						</div>
						<p>
							{item.trigger}
						</p>
						<p>대상: {item.audience}</p>
						<p>ko: {item.template.ko?.title ?? '-'}</p>
						<p>body: {item.template.ko?.body ?? '-'}</p>
						<p>route: {item.route}</p>
						<p>deepLink: {item.deepLink ?? '-'}</p>
						<p>requiredFields: {toStringArray(item.requiredFields).join(', ') || '-'}</p>
						<p>
							persistence: {item.persistence ? `${item.persistence.type}/${item.persistence.subType}` : '-'}
						</p>
						<p>
							throttle: {item.throttle ? `${item.throttle.key} · ${item.throttle.ttlSeconds}s` : '-'}
						</p>
						<p>skipOnlineCheck: {String(item.skipOnlineCheck)}</p>
						<p>skipPersist: {String(item.skipPersist)}</p>
						<p>notes: {toStringArray(item.notes).join(' / ') || '-'}</p>
						<p>
							source: {item.source}
						</p>
					</div>))}
			</div>
		</section>);
}
