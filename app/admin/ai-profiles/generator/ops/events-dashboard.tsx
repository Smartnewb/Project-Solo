'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';

const DAY_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 7, label: '7일' },
  { value: 14, label: '14일' },
  { value: 30, label: '30일' },
];

export function EventsDashboard() {
  const [days, setDays] = useState<number>(7);

  const eventsQuery = useQuery({
    queryKey: aiProfileGeneratorKeys.eventCounts(days),
    queryFn: () => aiProfileGenerator.getEventCounts(days),
  });

  const series = eventsQuery.data?.series ?? [];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">이벤트 지표</h2>
        <div className="w-32">
          <Select
            value={String(days)}
            onValueChange={(value) => setDays(Number(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {eventsQuery.isError ? (
        <Alert variant="destructive">
          <AlertDescription>이벤트 카운트를 불러오지 못했습니다.</AlertDescription>
        </Alert>
      ) : null}

      {eventsQuery.isLoading ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          불러오는 중…
        </div>
      ) : series.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          표시할 이벤트가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {series.map((s) => (
            <Card key={s.event}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-800">
                  {s.event}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <BarChart data={s.buckets}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
