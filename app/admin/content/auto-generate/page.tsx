'use client';
import { Button, Spinner, TextField, Label, Input } from '@heroui/react';
import { ArrowLeft as ArrowBackIcon } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGenerate, usePreview, useQueueStats, useJobStatus, } from '@/app/admin/hooks/use-card-news-generation';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { getApiErrorMessage } from '@/app/utils/errors';
const STAT_KEYS = ['waiting', 'active', 'completed', 'failed'] as const;
export default function AutoGeneratePage() {
    const router = useRouter();
    const toast = useToast();
    const [topic, setTopic] = useState('');
    const [jobId, setJobId] = useState<string | null>(null);
    const stats = useQueueStats();
    const job = useJobStatus(jobId);
    const generate = useGenerate();
    const preview = usePreview();
    const handlePreview = async () => {
        try {
            const r = await preview.mutateAsync(topic);
            toast.success(`프리뷰 생성: ${r.topic}`);
        }
        catch (e) {
            toast.error(getApiErrorMessage(e, '프리뷰 실패'));
        }
    };
    const handleGenerate = async () => {
        try {
            const r = await generate.mutateAsync(topic);
            setJobId(r.jobId);
            toast.success(`Job 시작: ${r.jobId}`);
        }
        catch (e) {
            toast.error(getApiErrorMessage(e, '생성 실패'));
        }
    };
    return (<div style={{ padding: 24, maxWidth: 1200, marginInline: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Button onPress={() => router.push('/admin/content')} variant="tertiary" style={{ marginRight: 16 }}>{<ArrowBackIcon></ArrowBackIcon>}
          목록으로
        </Button>
        <h1 className="text-2xl font-bold">
          카드뉴스 자동 생성
        </h1>
      </div>

      <div style={{ display: 'grid', gap: 24, marginBottom: 24 }}>
        <section style={{ padding: 16 }} className="rounded-xl border bg-white p-4">
          <h2 style={{ marginBottom: 16 }} className="text-lg font-semibold">
            큐 상태
          </h2>
          {stats.isLoading ? (<Spinner size="sm"></Spinner>) : stats.data ? (<div style={{ display: 'grid', gap: 8 }}>
              {STAT_KEYS.map((k) => (<div key={k} className="rounded-xl border p-4">
                  <div style={{ padding: 12 }} className="p-4">
                    <p>
                      {k}
                    </p>
                    <h1 className="text-2xl font-bold">{stats.data?.[k] ?? 0}</h1>
                  </div>
                </div>))}
            </div>) : (<aside role="alert" className="rounded-lg border p-3">큐 상태 없음</aside>)}
          <p style={{ display: 'block', marginTop: 8 }}>
            5초 주기 폴링
          </p>
        </section>

        <section style={{ padding: 16 }} className="rounded-xl border bg-white p-4">
          <h2 style={{ marginBottom: 16 }} className="text-lg font-semibold">
            Job 진행
          </h2>
          {jobId ? (<div>
              <p>
                {jobId}
              </p>
              <p>
                state: <strong>{job.data?.state ?? '...'}</strong>
              </p>
              <div style={{ marginBlock: 8 }}>
                <progress value={Math.min(100, Math.max(0, job.data?.progress ?? 0))} aria-label="처리 중"></progress>
                <p>{job.data?.progress ?? 0}%</p>
              </div>
              {job.data?.failedReason && (<aside role="alert" className="rounded-lg border p-3" style={{ marginTop: 8 }}>
                  {job.data.failedReason}
                </aside>)}
            </div>) : (<p>
              아직 시작된 작업이 없습니다.
            </p>)}
        </section>
      </div>

      <section style={{ padding: 16 }} className="rounded-xl border bg-white p-4">
        <h2 style={{ marginBottom: 16 }} className="text-lg font-semibold">
          토픽 입력
        </h2>
        <TextField className="mb-4"><Label>{"토픽"}</Label><Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="예: 봄철 연애 팁"></Input></TextField>
        <div style={{ display: 'flex', gap: 16 }}>
          <Button onPress={handlePreview} isDisabled={!topic || preview.isPending} variant="secondary">
            {preview.isPending ? '프리뷰 중...' : '프리뷰'}
          </Button>
          <Button onPress={handleGenerate} isDisabled={!topic || generate.isPending} variant="primary">
            {generate.isPending ? '생성 중...' : '생성 시작'}
          </Button>
        </div>
      </section>
    </div>);
}
