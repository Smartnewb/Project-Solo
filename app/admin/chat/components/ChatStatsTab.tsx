'use client';

import { useState, useEffect } from 'react';
import { Button, Card, TextField, Input, Label, Spinner } from '@heroui/react';
import { RefreshCw, MessagesSquare, MessageSquare, Timer, TrendingUp, User } from 'lucide-react';
import chatService, { type ChatStatsResponse, type DatePreset, type ChatStatsParams } from '@/app/services/chat';

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: '7일', value: '7days' }, { label: '14일', value: '14days' },
  { label: '30일', value: '30days' }, { label: '전체', value: 'all' },
];

function StatCard({ title, value, subtitle, icon }: { title: string; value: string | number; subtitle?: string; icon: React.ReactNode }) {
  return <Card className="h-full border shadow-none"><Card.Content className="space-y-2 p-4">
    <div className="flex items-center gap-2"><span className="text-[var(--accent)]" aria-hidden="true">{icon}</span><h3 className="text-sm text-gray-600">{title}</h3></div>
    <p className="text-2xl font-bold tabular-nums">{value}</p>
    {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
  </Card.Content></Card>;
}

function formatMinutes(minutes: number) {
  const rounded = Math.round(minutes);
  return minutes < 60 ? `${minutes.toFixed(1)}분` : `${Math.floor(rounded / 60)}시간 ${rounded % 60}분`;
}

export default function ChatStatsTab() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<ChatStatsResponse | null>(null);
  // Keep calendar dates as entered; converting local midnight to UTC changes the day in KR/JP.
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('30days');

  const fetchStats = async (params: ChatStatsParams) => {
    setLoading(true);
    setError('');
    try { setStats(await chatService.getChatStats(params)); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : '채팅 통계를 불러오는데 실패했습니다.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void fetchStats({ preset: '30days' }); }, []);

  const customRange = !!startDate && !!endDate;
  const reversedRange = customRange && startDate > endDate;
  const queryCurrent = () => void fetchStats(customRange ? { startDate, endDate } : { preset: selectedPreset });
  const maxCount = Math.max(0, ...(stats?.hourlyDistribution.map(item => item.count) ?? []));

  return <div className="space-y-6">
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-red-200 p-3"><p>{error}</p><Button variant="secondary" onPress={queryCurrent} isDisabled={loading || reversedRange}>재시도</Button></div>}
    <section className="space-y-3 rounded-xl border bg-white p-4" aria-label="통계 조회 기간">
      <div className="flex flex-wrap items-end gap-3">
        <TextField isDisabled={loading}><Label>시작 날짜</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></TextField>
        <TextField isDisabled={loading} isInvalid={reversedRange}><Label>종료 날짜</Label><Input type="date" min={startDate || undefined} value={endDate} onChange={e => setEndDate(e.target.value)} /></TextField>
        <Button onPress={queryCurrent} isDisabled={loading || !customRange || reversedRange}><RefreshCw size={16} />조회</Button>
        <div className="flex gap-1" role="group" aria-label="기간 바로 선택">
          {DATE_PRESETS.map(preset => <Button key={preset.value} size="sm" variant={selectedPreset === preset.value && !startDate && !endDate ? 'primary' : 'secondary'} aria-pressed={selectedPreset === preset.value && !startDate && !endDate} isDisabled={loading} onPress={() => {
            setSelectedPreset(preset.value); setStartDate(''); setEndDate(''); void fetchStats({ preset: preset.value });
          }}>{preset.label}</Button>)}
        </div>
      </div>
      {reversedRange && <p role="alert" className="text-sm text-red-700">종료 날짜는 시작 날짜 이후여야 합니다.</p>}
      {stats && <p className="text-sm text-gray-600">조회 기간: {stats.startDate} ~ {stats.endDate}</p>}
    </section>
    {loading ? <div role="status" aria-label="채팅 통계 불러오는 중" className="flex justify-center py-8"><Spinner /></div> : stats && <>
      <section className="space-y-3"><h2 className="text-lg font-semibold">요약 통계</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="전체 채팅방" value={stats.summary.totalRooms.toLocaleString()} subtitle={`활성: ${stats.summary.activeRooms.toLocaleString()}개`} icon={<MessagesSquare size={20} />} />
        <StatCard title="전체 메시지" value={stats.summary.totalMessages.toLocaleString()} subtitle={`평균 ${stats.summary.avgMessagesPerRoom}개/방`} icon={<MessageSquare size={20} />} />
        <StatCard title="응답률" value={`${stats.summary.responseRate}%`} subtitle="양방향 대화 비율" icon={<TrendingUp size={20} />} />
        <StatCard title="평균 첫 응답 시간" value={formatMinutes(stats.summary.avgFirstResponseTimeMinutes)} subtitle="첫 메시지 후 응답까지" icon={<Timer size={20} />} />
      </div></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold">성별 분석</h2><div className="grid gap-3 sm:grid-cols-3">
        <StatCard title="남성 첫 메시지 비율" value={`${stats.summary.maleFirstMessageRate}%`} icon={<User size={20} />} />
        <StatCard title="여성 첫 메시지 비율" value={`${stats.summary.femaleFirstMessageRate}%`} icon={<User size={20} />} />
        <StatCard title="24시간 내 대화 비율" value={`${stats.summary.conversationWithin24hRate}%`} subtitle="채팅방 생성 후 24시간 내" icon={<Timer size={20} />} />
      </div></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold">시간대별 메시지 분포</h2>
        <figure className="rounded-xl border bg-white p-4"><div className="flex items-end gap-2 overflow-x-auto" aria-hidden="true">
          {stats.hourlyDistribution.map(item => <div key={item.hour} className="flex min-w-7 flex-1 flex-col items-center text-xs">
            <div className="flex h-36 w-full flex-col items-center justify-end gap-1"><span>{item.count}</span><div className="w-5 rounded-t bg-[var(--accent)]" style={{ height: maxCount ? `${item.count / maxCount * 110}px` : 0 }} /></div><span className="mt-1">{item.hour}</span>
          </div>)}
        </div><figcaption className="mt-3 text-center text-sm text-gray-600">시간 (0~23시)</figcaption>
          <table className="sr-only"><caption>시간대별 메시지 수</caption><thead><tr><th scope="col">시간</th><th scope="col">메시지 수</th></tr></thead><tbody>{stats.hourlyDistribution.map(item => <tr key={item.hour}><th scope="row">{item.hour}시</th><td>{item.count}</td></tr>)}</tbody></table>
        </figure>
      </section>
      <section className="space-y-3"><h2 className="text-lg font-semibold">메시지 길이 분포</h2><dl className="grid grid-cols-2 gap-3 rounded-xl border bg-white p-4 sm:grid-cols-3 xl:grid-cols-6">
        {stats.messageLengthDistribution.map(item => <div key={item.range} className="space-y-1 text-center"><dt className="text-sm">{item.range}자</dt><dd className="text-xl font-semibold">{item.percentage}%</dd><dd className="text-sm text-gray-600">{item.count.toLocaleString()}개</dd></div>)}
      </dl></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold">일별 트렌드</h2><div className="max-h-80 overflow-auto rounded-xl border bg-white">
        <table className="w-full text-sm"><caption className="sr-only">날짜별 메시지와 새 채팅방 수</caption><thead className="sticky top-0 bg-gray-50"><tr>{['날짜', '메시지 수', '새 채팅방'].map((title, index) => <th key={title} scope="col" className={`border-b p-3 ${index ? 'text-right' : 'text-left'}`}>{title}</th>)}</tr></thead>
          <tbody>{stats.dailyTrend.slice().reverse().map(item => <tr key={item.date} className="border-b last:border-0"><th scope="row" className="p-3 text-left font-normal">{item.date}</th><td className="p-3 text-right tabular-nums">{item.messageCount.toLocaleString()}</td><td className="p-3 text-right tabular-nums">{item.newRoomCount.toLocaleString()}</td></tr>)}</tbody>
        </table>
      </div></section>
    </>}
  </div>;
}
