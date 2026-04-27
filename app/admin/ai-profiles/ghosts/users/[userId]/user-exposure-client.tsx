'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { GhostUserExposureContent } from '../ghost-user-exposure-content';

interface UserExposureClientProps {
	userId: string;
	userName?: string;
}

export function UserExposureClient({ userId, userName }: UserExposureClientProps) {
	const router = useRouter();

	return (
		<div className="p-6 max-w-3xl mx-auto">
			<div className="flex items-center gap-3 mb-6">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => router.back()}
					className="h-8 w-8 p-0"
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="text-lg font-semibold">Ghost 노출 이력</h1>
					{userName && <p className="text-sm text-gray-500">{userName}</p>}
				</div>
			</div>

			<GhostUserExposureContent
				userId={userId}
				onGhostSelect={(ghostAccountId) =>
					router.push(`/admin/ai-profiles/ghosts?ghostAccountId=${ghostAccountId}`)
				}
			/>
		</div>
	);
}
