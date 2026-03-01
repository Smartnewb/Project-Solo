'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminService, {
	FcmTokensResponse,
	FcmTokenSummary,
	FcmTokenUserItem,
} from '@/app/services/admin';

export default function FcmTokensPage() {
	const [loading, setLoading] = useState(false);
	const [summary, setSummary] = useState<FcmTokenSummary | null>(null);
	const [items, setItems] = useState<FcmTokenUserItem[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalItems, setTotalItems] = useState(0);
	const [hasTokenFilter, setHasTokenFilter] = useState<string>('all');
	const itemsPerPage = 20;

	const fetchData = useCallback(async (page: number, hasToken?: boolean) => {
		setLoading(true);
		try {
			const data: FcmTokensResponse = await AdminService.fcmTokens.getTokens(
				page,
				itemsPerPage,
				hasToken,
			);
			setSummary(data.summary);
			setItems(data.items);
			setCurrentPage(data.meta.currentPage);
			setTotalItems(data.meta.totalItems);
			setTotalPages(Math.ceil(data.meta.totalItems / data.meta.itemsPerPage));
		} catch (error) {
			console.error('FCM 토큰 데이터 조회 실패:', error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		const hasToken =
			hasTokenFilter === 'all'
				? undefined
				: hasTokenFilter === 'true';
		fetchData(1, hasToken);
	}, [hasTokenFilter, fetchData]);

	const handlePageChange = (page: number) => {
		const hasToken =
			hasTokenFilter === 'all'
				? undefined
				: hasTokenFilter === 'true';
		fetchData(page, hasToken);
	};

	const renderPagination = () => {
		if (totalPages <= 1) return null;
		const maxVisible = 5;
		let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
		const endPage = Math.min(totalPages, startPage + maxVisible - 1);
		if (endPage - startPage + 1 < maxVisible) {
			startPage = Math.max(1, endPage - maxVisible + 1);
		}
		const pages: number[] = [];
		for (let i = startPage; i <= endPage; i++) pages.push(i);

		return (
			<div className="flex items-center justify-between mt-4">
				<span className="text-sm text-gray-500">
					{currentPage} / {totalPages} 페이지 (총 {totalItems.toLocaleString()}명)
				</span>
				<div className="flex gap-1">
					<button
						onClick={() => handlePageChange(1)}
						disabled={currentPage === 1}
						className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						처음
					</button>
					<button
						onClick={() => handlePageChange(currentPage - 1)}
						disabled={currentPage === 1}
						className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						이전
					</button>
					{pages.map((page) => (
						<button
							key={page}
							onClick={() => handlePageChange(page)}
							className={`px-3 py-1 text-sm border rounded ${
								page === currentPage
									? 'bg-blue-600 text-white border-blue-600'
									: 'hover:bg-gray-100'
							}`}
						>
							{page}
						</button>
					))}
					<button
						onClick={() => handlePageChange(currentPage + 1)}
						disabled={currentPage === totalPages}
						className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						다음
					</button>
					<button
						onClick={() => handlePageChange(totalPages)}
						disabled={currentPage === totalPages}
						className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						마지막
					</button>
				</div>
			</div>
		);
	};

	const formatDate = (dateStr: string | null) => {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const getRankColor = (rank: string) => {
		switch (rank) {
			case 'S': return 'bg-purple-100 text-purple-800';
			case 'A': return 'bg-blue-100 text-blue-800';
			case 'B': return 'bg-green-100 text-green-800';
			case 'C': return 'bg-yellow-100 text-yellow-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	};

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">FCM 토큰 현황</h1>

			{/* Summary Cards */}
			{summary && (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
					<div className="bg-white rounded-lg shadow p-4">
						<div className="text-sm text-gray-500">전체 사용자</div>
						<div className="text-2xl font-bold mt-1">
							{summary.totalUsers.toLocaleString()}
						</div>
					</div>
					<div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
						<div className="text-sm text-gray-500">토큰 보유</div>
						<div className="text-2xl font-bold mt-1 text-green-600">
							{summary.withToken.toLocaleString()}
						</div>
					</div>
					<div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
						<div className="text-sm text-gray-500">토큰 미보유</div>
						<div className="text-2xl font-bold mt-1 text-red-600">
							{summary.withoutToken.toLocaleString()}
						</div>
					</div>
					<div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
						<div className="text-sm text-gray-500">iOS</div>
						<div className="text-2xl font-bold mt-1 text-blue-600">
							{summary.iosCount.toLocaleString()}
						</div>
					</div>
					<div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-700">
						<div className="text-sm text-gray-500">Android</div>
						<div className="text-2xl font-bold mt-1 text-green-700">
							{summary.androidCount.toLocaleString()}
						</div>
					</div>
					<div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
						<div className="text-sm text-gray-500">활성 유저 토큰률</div>
						<div className="text-2xl font-bold mt-1 text-purple-600">
							{summary.activeUserTokenRate.toFixed(1)}%
						</div>
					</div>
				</div>
			)}

			{/* Filter */}
			<div className="bg-white rounded-lg shadow p-4 mb-6">
				<div className="flex items-center gap-4">
					<label className="text-sm font-medium text-gray-700">토큰 보유 여부</label>
					<select
						value={hasTokenFilter}
						onChange={(e) => {
							setHasTokenFilter(e.target.value);
							setCurrentPage(1);
						}}
						className="border rounded px-3 py-2 text-sm"
					>
						<option value="all">전체</option>
						<option value="true">토큰 있음</option>
						<option value="false">토큰 없음</option>
					</select>
				</div>
			</div>

			{/* Table */}
			<div className="bg-white rounded-lg shadow overflow-x-auto">
				{loading ? (
					<div className="p-8 text-center text-gray-500">로딩 중...</div>
				) : items.length === 0 ? (
					<div className="p-8 text-center text-gray-500">데이터가 없습니다.</div>
				) : (
					<table className="w-full text-sm">
						<thead className="bg-gray-50 border-b">
							<tr>
								<th className="px-4 py-3 text-left font-medium text-gray-600">이름</th>
								<th className="px-4 py-3 text-left font-medium text-gray-600">이메일</th>
								<th className="px-4 py-3 text-left font-medium text-gray-600">전화번호</th>
								<th className="px-4 py-3 text-left font-medium text-gray-600">프로필</th>
								<th className="px-4 py-3 text-left font-medium text-gray-600">최종 로그인</th>
								<th className="px-4 py-3 text-left font-medium text-gray-600">토큰</th>
								<th className="px-4 py-3 text-center font-medium text-gray-600">토큰 수</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{items.map((user) => (
								<tr key={user.userId} className="hover:bg-gray-50">
									<td className="px-4 py-3 font-medium">{user.name}</td>
									<td className="px-4 py-3 text-gray-600">{user.email || '-'}</td>
									<td className="px-4 py-3 text-gray-600">{user.phoneNumber}</td>
									<td className="px-4 py-3">
										{user.profile ? (
											<div className="flex items-center gap-1.5">
												<span className={`inline-block px-1.5 py-0.5 text-xs font-semibold rounded ${getRankColor(user.profile.rank)}`}>
													{user.profile.rank}
												</span>
												{user.profile.title && (
													<span className="text-gray-700 text-xs">{user.profile.title}</span>
												)}
												<span className="text-gray-400 text-xs">
													{user.profile.gender === 'male' ? 'M' : user.profile.gender === 'female' ? 'F' : ''}
													{user.profile.age ? `/${user.profile.age}` : ''}
												</span>
											</div>
										) : (
											<span className="text-gray-400 text-xs">프로필 없음</span>
										)}
									</td>
									<td className="px-4 py-3 text-gray-600 text-xs">
										{formatDate(user.lastLoginAt)}
									</td>
									<td className="px-4 py-3">
										<div className="flex gap-1 flex-wrap">
											{user.tokens.length > 0 ? (
												user.tokens.map((token, idx) => (
													<span
														key={idx}
														className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
															token.platform === 'ios'
																? 'bg-blue-100 text-blue-700'
																: 'bg-green-100 text-green-700'
														} ${!token.isActive ? 'opacity-50' : ''}`}
													>
														{token.platform === 'ios' ? 'iOS' : 'Android'}
													</span>
												))
											) : (
												<span className="text-gray-400 text-xs">-</span>
											)}
										</div>
									</td>
									<td className="px-4 py-3 text-center text-gray-600">
										{user.tokens.length}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{/* Pagination */}
			{renderPagination()}
		</div>
	);
}
