import { UserExposureClient } from './user-exposure-client';

export default async function UserExposurePage({
	params,
	searchParams,
}: {
	params: Promise<{ userId: string }>;
	searchParams: Promise<{ userName?: string }>;
}) {
	const { userId } = await params;
	const { userName } = await searchParams;
	return (
		<UserExposureClient
			userId={userId}
			userName={userName}
		/>
	);
}
