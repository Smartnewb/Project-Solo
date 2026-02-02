'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ForceMatchingPage() {
	const router = useRouter();

	useEffect(() => {
		// 매칭 관리 페이지의 강제 매칭 탭(인덱스 9)으로 리다이렉트
		router.replace('/admin/matching-management');
	}, [router]);

	return (
		<div className="flex items-center justify-center min-h-[200px]">
			<p className="text-gray-500">매칭 관리 페이지로 이동 중...</p>
		</div>
	);
}
