import { redirect } from 'next/navigation';

export default function PushNotificationCatalogPage() {
	redirect('/admin/push-notifications?tab=registry&view=graph');
}
