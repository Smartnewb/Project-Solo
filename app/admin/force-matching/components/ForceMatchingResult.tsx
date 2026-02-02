'use client';

import { CreateForceChatRoomResponse } from '../types';

interface ForceMatchingResultProps {
	result: CreateForceChatRoomResponse;
	onClose: () => void;
}

export default function ForceMatchingResult({ result, onClose }: ForceMatchingResultProps) {
	if (!result.success || !result.data) {
		return null;
	}

	const { data } = result;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
				{/* 헤더 */}
				<div className="bg-green-500 text-white px-6 py-4 rounded-t-lg">
					<div className="flex items-center gap-2">
						<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<h3 className="font-semibold text-lg">강제 매칭 완료</h3>
					</div>
				</div>

				{/* 내용 */}
				<div className="p-6 space-y-4">
					{/* 매칭된 유저 정보 */}
					<div className="flex items-center justify-center gap-4">
						<div className="text-center">
							<div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
								<span className="text-blue-600 text-2xl">👨</span>
							</div>
							<p className="font-medium">{data.maleUser.name}</p>
							<p className="text-xs text-gray-500">{data.maleUser.country.toUpperCase()}</p>
						</div>
						<div className="text-pink-500 text-2xl">💕</div>
						<div className="text-center">
							<div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-2">
								<span className="text-pink-600 text-2xl">👩</span>
							</div>
							<p className="font-medium">{data.femaleUser.name}</p>
							<p className="text-xs text-gray-500">{data.femaleUser.country.toUpperCase()}</p>
						</div>
					</div>

					{/* 생성된 정보 */}
					<div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-gray-500">채팅방 ID</span>
							<span className="font-mono text-gray-700">{data.chatRoomId}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-500">매칭 ID</span>
							<span className="font-mono text-gray-700">{data.matchId}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-500">생성 시간</span>
							<span className="text-gray-700">
								{new Date(data.createdAt).toLocaleString('ko-KR')}
							</span>
						</div>
					</div>

					<p className="text-center text-sm text-gray-500">
						채팅방이 생성되었습니다. 두 유저가 채팅을 시작할 수 있습니다.
					</p>
				</div>

				{/* 버튼 */}
				<div className="px-6 py-4 border-t">
					<button
						onClick={onClose}
						className="w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
					>
						확인
					</button>
				</div>
			</div>
		</div>
	);
}
