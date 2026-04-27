import { GhostExposuresClient } from './ghost-exposures-client';

export const metadata = {
	title: 'Ghost 노출 관리',
};

export default function GhostExposuresPage() {
	return (
		<div className="p-6 h-full flex flex-col">
			<div className="mb-4">
				<h1 className="text-xl font-semibold text-gray-900">Ghost 노출 관리</h1>
				<p className="text-sm text-gray-500 mt-1">
					Ghost별 노출 이력을 조회하고 활성/비활성 상태를 관리합니다
				</p>
			</div>
			<div className="flex-1 overflow-hidden">
				<GhostExposuresClient />
			</div>
		</div>
	);
}
