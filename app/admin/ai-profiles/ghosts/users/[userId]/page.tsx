import { UserExposureClient } from './user-exposure-client';

export default function UserExposurePage({
	params,
	searchParams,
}: {
	params: { userId: string };
	searchParams: { userName?: string };
}) {
	return (
		<UserExposureClient
			userId={params.userId}
			userName={searchParams.userName}
		/>
	);
}
