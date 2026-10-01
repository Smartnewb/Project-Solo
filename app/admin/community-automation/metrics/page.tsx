'use client';
import { Spinner, TextField, Label, Input } from '@heroui/react';
import { useCallback, useEffect, useState } from 'react';
import type { MetricsSummary, QueueDepth } from '@/app/services/admin/community-automation';
import { metrics as metricsApi } from '@/app/services/admin/community-automation';
function StatCard({ label, value, color }: {
    label: string;
    value: number;
    color?: string;
}) {
    return (<div className="rounded-xl border p-4">
			<div className="p-4">
				<p>{label}</p>
				<p>{value}</p>
			</div>
		</div>);
}
export default function MetricsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<MetricsSummary | null>(null);
    const [depth, setDepth] = useState<QueueDepth | null>(null);
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const [from, setFrom] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
    const [to, setTo] = useState(today.toISOString().split('T')[0]);
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [s, d] = await Promise.all([
                metricsApi.summary(from ? `${from}T00:00:00Z` : undefined, to ? `${to}T23:59:59Z` : undefined),
                metricsApi.queueDepth(),
            ]);
            setSummary(s);
            setDepth(d);
        }
        catch (e: unknown) {
            setError(e instanceof Error ? e.message : '불러오기 실패');
        }
        finally {
            setLoading(false);
        }
    }, [from, to]);
    useEffect(() => {
        load();
    }, [load]);
    return (<div>
			<div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
				<TextField className="mb-4"><Label>{"시작일"}</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)}></Input></TextField>
				<TextField className="mb-4"><Label>{"종료일"}</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)}></Input></TextField>
			</div>

			{error && <aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>{error}</aside>}

			{loading ? (<div style={{ display: "flex", paddingBlock: 48 }}>
					<Spinner size="sm"></Spinner>
				</div>) : summary && depth ? (<>
					<h2 className="text-lg font-semibold" style={{ marginBottom: 8 }}>전체 현황</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2" style={{ marginBottom: 24 }}>
						<div className="min-w-0">
							<StatCard label="발화됨" value={summary.totalPublished}></StatCard>
						</div>
						<div className="min-w-0">
							<StatCard label="검수 대기" value={summary.totalPendingReview}></StatCard>
						</div>
						<div className="min-w-0">
							<StatCard label="거절됨" value={summary.totalRejected}></StatCard>
						</div>
						<div className="min-w-0">
							<StatCard label="회수됨" value={summary.totalWithdrawn}></StatCard>
						</div>
					</div>

					<h2 className="text-lg font-semibold" style={{ marginBottom: 8 }}>큐 깊이</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2" style={{ marginBottom: 24 }}>
						<div className="min-w-0">
							<StatCard label="검수 대기" value={depth.pending_review}></StatCard>
						</div>
						<div className="min-w-0">
							<StatCard label="예약됨" value={depth.scheduled}></StatCard>
						</div>
						<div className="min-w-0">
							<StatCard label="초안" value={depth.draft}></StatCard>
						</div>
						<div className="min-w-0">
							<StatCard label="품질 실패" value={depth.quality_failed}></StatCard>
						</div>
					</div>

					<hr style={{ marginBlock: 16 }}></hr>

					<h2 className="text-lg font-semibold" style={{ marginBottom: 8 }}>상태별 콘텐츠 수</h2>
					<div style={{ marginBottom: 24 }}>
						<table className="w-full text-sm">
							<thead className="bg-gray-50 text-left">
								<tr className="border-b">
									<th scope="col" className="border-b px-4 py-3">상태</th>
									<th scope="col" className="border-b px-4 py-3">수량</th>
								</tr>
							</thead>
							<tbody>
								{summary.contentByStatus.map((row) => (<tr key={row.status} className="border-b">
										<td className="border-b px-4 py-3">{row.status}</td>
										<td className="border-b px-4 py-3">{row.count}</td>
									</tr>))}
							</tbody>
						</table>
					</div>

					<h2 className="text-lg font-semibold" style={{ marginBottom: 8 }}>일별 통계</h2>
					<div>
						<table className="w-full text-sm">
							<thead className="bg-gray-50 text-left">
								<tr className="border-b">
									<th scope="col" className="border-b px-4 py-3">날짜</th>
									<th scope="col" className="border-b px-4 py-3">발화됨</th>
									<th scope="col" className="border-b px-4 py-3">거절됨</th>
									<th scope="col" className="border-b px-4 py-3">회수됨</th>
								</tr>
							</thead>
							<tbody>
								{summary.dailyStats.length === 0 ? (<tr className="border-b">
										<td colSpan={4} className="border-b px-4 py-3">데이터 없음</td>
									</tr>) : summary.dailyStats.map((row) => (<tr key={row.date} className="border-b">
										<td className="border-b px-4 py-3">{row.date}</td>
										<td className="border-b px-4 py-3">{row.published}</td>
										<td className="border-b px-4 py-3">{row.rejected}</td>
										<td className="border-b px-4 py-3">{row.withdrawn}</td>
									</tr>))}
							</tbody>
						</table>
					</div>
				</>) : null}
		</div>);
}
