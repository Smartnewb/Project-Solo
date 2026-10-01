'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Chip, Input, Label, ListBox, Pagination, Select, Spinner, TextField, Tooltip } from '@heroui/react';
import AdminService from '@/app/services/admin';
import type { CareLog } from '@/app/services/admin/care';

const ACTION_LABELS: Record<string, string> = {like: '좋아요', mutual_like: '상호좋아요', open_chat: '채팅방 개설'};

function CareLogsContent() {
	const [logs, setLogs] = useState<CareLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
	const [actionFilter, setActionFilter] = useState<string>('');
	const [searchInput, setSearchInput] = useState('');
	const [searchTerm, setSearchTerm] = useState('');

	const fetchLogs = useCallback(
		async (page: number = 1) => {
			try {
				setLoading(true);
				setError(null);
				const params: {
					page: number;
					limit: number;
					action?: string;
					targetUserId?: string;
				} = {
					page,
					limit: 20,
				};
				if (actionFilter) params.action = actionFilter;
				if (searchTerm) params.targetUserId = searchTerm;
				const data = await AdminService.care.getLogs(params);
				setLogs(data.items);
				setPagination({ page: data.page, limit: data.limit, total: data.total });
			} catch (err: any) {
				setError(
					err.response?.data?.message || '케어 이력을 불러올 수 없습니다.',
				);
			} finally {
				setLoading(false);
			}
		},
		[actionFilter, searchTerm],
	);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);

	// debounce 검색
	useEffect(() => {
		const timer = setTimeout(() => {
			setSearchTerm(searchInput);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchInput]);

  return <section className="space-y-4">
    <h1 className="text-2xl font-bold">케어 이력</h1>
    <div className="grid gap-3 sm:grid-cols-[180px_1fr]"><Select value={actionFilter || 'all'} onChange={key => setActionFilter(key === 'all' ? '' : String(key))}><Label>액션 타입</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox><ListBox.Item id="all" textValue="전체">전체</ListBox.Item>{Object.entries(ACTION_LABELS).map(([action,label]) => <ListBox.Item key={action} id={action} textValue={label}>{label}</ListBox.Item>)}</ListBox></Select.Popover></Select>
      <TextField value={searchInput} onChange={setSearchInput}><Label>대상 유저 ID 검색</Label><Input placeholder="대상 유저 ID 검색..." /></TextField></div>
    {error && <p role="alert" className="text-danger">{error}</p>}
    <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full text-left text-sm"><caption className="sr-only">케어 실행 이력</caption><thead className="bg-gray-50"><tr>{['일시','대상 유저','파트너','액션','편지 내용','실행 어드민'].map(label => <th key={label} scope="col" className="px-3 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>
      {loading ? <tr><td colSpan={6} className="py-8 text-center"><Spinner aria-label="케어 이력 불러오는 중" /></td></tr> : !logs.length ? <tr><td colSpan={6} className="py-8 text-center text-gray-600">케어 이력이 없습니다</td></tr> : logs.map(log => <tr key={log.id} className="border-t border-border hover:bg-gray-50"><td className="px-3 py-3 whitespace-nowrap">{new Date(log.created_at).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</td><td className="px-3 py-3 font-medium">{log.target_name}</td><td className="px-3 py-3 font-medium">{log.partner_name}</td><td className="px-3 py-3"><Chip size="sm">{ACTION_LABELS[log.action] || log.action}</Chip></td><td className="max-w-[200px] px-3 py-3"><Tooltip><Button variant="ghost" size="sm" className="max-w-[200px] justify-start" aria-label={`${log.target_name} 편지 내용`}><span className="truncate">{log.letter_content}</span></Button><Tooltip.Content className="max-w-sm whitespace-pre-wrap">{log.letter_content}</Tooltip.Content></Tooltip></td><td className="px-3 py-3">{log.admin_name}</td></tr>)}
    </tbody></table></div>
    {!loading && logs.length > 0 && <Pagination size="sm" aria-label="케어 이력 페이지"><Pagination.Summary>{(pagination.page-1)*pagination.limit+1}-{Math.min(pagination.page*pagination.limit,pagination.total)} / 총 {pagination.total}건</Pagination.Summary><Pagination.Content><Pagination.Item><Pagination.Previous isDisabled={pagination.page <= 1} onPress={() => fetchLogs(pagination.page-1)}>이전</Pagination.Previous></Pagination.Item><Pagination.Item><Pagination.Next isDisabled={pagination.page*pagination.limit >= pagination.total} onPress={() => fetchLogs(pagination.page+1)}>다음</Pagination.Next></Pagination.Item></Pagination.Content></Pagination>}
  </section>;
}

export default function CareLogsV2() {
	return <CareLogsContent />;
}
