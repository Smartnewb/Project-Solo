'use client';
import { Spinner, Chip, Button } from '@heroui/react';
import { CircleCheck as CheckCircleIcon, FileText as DescriptionOutlinedIcon, CheckCheck as DoneAllIcon, Gavel as GavelIcon, History as HistoryOutlinedIcon, Image as ImageOutlinedIcon, UserRound as PersonOutlineIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState, type JSX } from 'react';
import { getReviewInbox } from '@/app/services/review-inbox';
import type { ReviewInboxAction, ReviewInboxBucket, ReviewInboxEvidenceType, ReviewInboxResponse, ReviewInboxSourceKind, } from './types';
const reviewInboxBucketLabels: Record<ReviewInboxBucket, string> = {
    approval: '사람 승인 필요',
    judgment: '직접 판단 필요',
    done: '완료 이력',
};
const reviewInboxBucketDescriptions: Record<ReviewInboxBucket, string> = {
    approval: '명확한 건 → 원본 화면에서 처리',
    judgment: '맥락 확인 필요 → 직접 판단',
    done: '완료 상태 항목 확인',
};
const reviewInboxSourceKindLabels: Record<ReviewInboxSourceKind, string> = {
    profile_report: '프로필 신고',
    community_report: '커뮤니티 신고',
    support_chat: '1:1 문의',
};
const bucketTone = {
    approval: {
        color: '#ef4444',
        light: '#fef2f2',
        border: '#fecaca',
        icon: <PersonOutlineIcon></PersonOutlineIcon>,
    },
    judgment: {
        color: '#f59e0b',
        light: '#fffbeb',
        border: '#fde68a',
        icon: <GavelIcon></GavelIcon>,
    },
    done: {
        color: '#10b981',
        light: '#ecfdf5',
        border: '#a7f3d0',
        icon: <DoneAllIcon></DoneAllIcon>,
    },
} satisfies Record<ReviewInboxBucket, {
    color: string;
    light: string;
    border: string;
    icon: JSX.Element;
}>;
const evidenceTone = {
    image: {
        icon: <ImageOutlinedIcon style={{ fontSize: 16 }}></ImageOutlinedIcon>,
        color: '#7c3aed',
        bg: '#f3e8ff',
    },
    text: {
        icon: <DescriptionOutlinedIcon style={{ fontSize: 16 }}></DescriptionOutlinedIcon>,
        color: '#c2410c',
        bg: '#fff7ed',
    },
    history: {
        icon: <HistoryOutlinedIcon style={{ fontSize: 16 }}></HistoryOutlinedIcon>,
        color: '#475569',
        bg: '#f1f5f9',
    },
} satisfies Record<ReviewInboxEvidenceType, {
    icon: JSX.Element;
    color: string;
    bg: string;
}>;
function formatDateTime(value?: string) {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed.toLocaleString('ko-KR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}
function formatShortId(value?: string) {
    if (!value) {
        return null;
    }
    return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}
function getActionButtonProps(action: ReviewInboxAction) {
    if (action.tone === 'danger') {
        return {
            variant: 'outlined' as const,
            color: 'error' as const,
        };
    }
    if (action.tone === 'neutral') {
        return {
            variant: 'outlined' as const,
            color: 'inherit' as const,
        };
    }
    return {
        variant: 'contained' as const,
        color: 'primary' as const,
    };
}
function getInitialSelectedIds(data: ReviewInboxResponse | null) {
    return {
        approval: data?.buckets.approval.items[0]?.id ?? null,
        judgment: data?.buckets.judgment.items[0]?.id ?? null,
        done: data?.buckets.done.items[0]?.id ?? null,
    } satisfies Record<ReviewInboxBucket, string | null>;
}
export default function ReviewInboxV2() {
    const [activeBucket, setActiveBucket] = useState<ReviewInboxBucket>('approval');
    const [data, setData] = useState<ReviewInboxResponse | null>(null);
    const [selectedIds, setSelectedIds] = useState<Record<ReviewInboxBucket, string | null>>({
        approval: null,
        judgment: null,
        done: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getReviewInbox();
                if (cancelled)
                    return;
                setData(response);
                setSelectedIds(getInitialSelectedIds(response));
            }
            catch (loadError) {
                if (cancelled)
                    return;
                setError(loadError instanceof Error ? loadError.message : '검토 인박스를 불러오지 못했습니다.');
            }
            finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);
    useEffect(() => {
        if (!data)
            return;
        if (activeBucket === 'approval' && data.summary.approval === 0 && data.summary.judgment > 0) {
            setActiveBucket('judgment');
        }
    }, [activeBucket, data]);
    const counts = useMemo(() => data?.summary ?? {
        approval: 0,
        judgment: 0,
        done: 0,
    }, [data]);
    const doneBreakdown = useMemo(() => data?.doneBreakdown ?? {
        profile_report: 0,
        community_report: 0,
        support_chat: 0,
    }, [data]);
    const activeItems = data?.buckets[activeBucket].items ?? [];
    const selectedItem = activeItems.find((item) => item.id === selectedIds[activeBucket]) ?? activeItems[0] ?? null;
    const handleSelectItem = (bucket: ReviewInboxBucket, id: string) => {
        setSelectedIds((current) => ({
            ...current,
            [bucket]: id,
        }));
    };
    const pendingCount = counts.approval + counts.judgment;
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="text-2xl font-bold">검토 인박스</h1>
        <p style={{ marginTop: 6 }}>
          사람이 확인할 건과 이미 완료된 이력을 함께 보되, 처리 주체는 확인 가능한 범위까지만 표시합니다.
        </p>
      </div>

      {error && (<aside role="alert" className="rounded-lg border p-3">
          {error}
        </aside>)}

      {data?.warnings?.length ? (<aside role="alert" className="rounded-lg border p-3">
          {data.warnings[0]}
        </aside>) : null}

      {loading && !data ? (<div className="rounded-xl border p-4" style={{ borderRadius: 3 }}>
          <div className="p-4" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Spinner size="sm"></Spinner>
            <p>
              검토 인박스를 불러오는 중입니다.
            </p>
          </div>
        </div>) : null}

      {data ? (<>
          <div className="rounded-xl border p-4" style={{ border: '1px solid #ddd6fe', backgroundColor: '#f5f3ff' }}>
            <div className="p-4" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20 }}>
              <div style={{ width: 42, height: 42, borderRadius: 2, backgroundColor: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DoneAllIcon></DoneAllIcon>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: '#1f2937' }}>
                  <span style={{ fontWeight: 700, color: '#111827' }}>
                    지금 사람이 확인할 건은 {pendingCount}건
                  </span>{' '}
                  이고, 완료 상태로 정리된 이력은 {counts.done}건입니다.
                </p>
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <Chip size="sm">{`프로필 신고 ${doneBreakdown.profile_report}건`}</Chip>
                  <Chip size="sm">{`커뮤니티 신고 ${doneBreakdown.community_report}건`}</Chip>
                  <Chip size="sm">{`1:1 문의 ${doneBreakdown.support_chat}건`}</Chip>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            {(['approval', 'judgment', 'done'] as ReviewInboxBucket[]).map((bucket) => {
                const tone = bucketTone[bucket];
                const isActive = activeBucket === bucket;
                return (<Button key={bucket} type="button" onPress={() => setActiveBucket(bucket)} aria-pressed={isActive} aria-label={`${reviewInboxBucketLabels[bucket]} ${counts[bucket]}건 보기`} style={{ border: `1px solid ${isActive ? tone.color : '#e5e7eb'}`, borderRadius: 3, backgroundColor: isActive ? tone.light : '#fff', boxShadow: isActive ? `0 0 0 3px ${tone.light}` : 'none', paddingInline: 18, paddingBlock: 16, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease' }} variant="secondary">
                  <div style={{ color: tone.color }}>
                    {tone.icon}
                    <p style={{ fontWeight: 600 }}>
                      {reviewInboxBucketLabels[bucket]}
                    </p>
                  </div>
                  <p style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1, marginTop: 8, color: tone.color }}>
                    {counts[bucket]}
                  </p>
                  <p>
                    {reviewInboxBucketDescriptions[bucket]}
                  </p>
                </Button>);
            })}
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <div className="rounded-xl border p-4" style={{ borderRadius: 3 }}>
              <div className="p-4" style={{ padding: 0 }}>
                <div style={{ paddingInline: 20, paddingBlock: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 className="text-lg font-semibold" style={{ fontWeight: 600 }}>
                    {reviewInboxBucketLabels[activeBucket]}
                  </h2>
                  <Chip size="sm">{`${counts[activeBucket]}건`}</Chip>
                </div>
                <hr></hr>

                {activeItems.length === 0 ? (<div style={{ paddingInline: 24, paddingBlock: 40, textAlign: 'center', color: "#6b7280" }}>
                    <CheckCircleIcon style={{ fontSize: 44, color: bucketTone[activeBucket].color, marginBottom: 12 }}></CheckCircleIcon>
                    <p style={{ fontWeight: 600, color: "#111827" }}>
                      {activeBucket === 'done' ? '완료 이력으로 표시할 최근 항목이 없습니다.' : '현재 남아 있는 예외가 없습니다.'}
                    </p>
                    <p style={{ marginTop: 8 }}>
                      {activeBucket === 'done'
                    ? '처리 완료된 건이 생기면 여기서 유형과 처리 방식을 함께 확인할 수 있습니다.'
                    : '새로운 예외가 생기면 이 리스트에만 다시 쌓입니다.'}
                    </p>
                  </div>) : (<div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activeItems.map((item) => {
                    const isSelected = selectedItem?.id === item.id;
                    const tone = bucketTone[item.bucket];
                    const createdAtLabel = formatDateTime(item.createdAt);
                    const sourceIdLabel = formatShortId(item.sourceId);
                    return (<Button key={item.id} type="button" onPress={() => handleSelectItem(item.bucket, item.id)} aria-pressed={isSelected} aria-label={`${item.title} ${sourceIdLabel ? `ID ${sourceIdLabel}` : ''} 상세 보기`} className="h-auto whitespace-normal" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', border: `1px solid ${isSelected ? tone.color : '#e5e7eb'}`, backgroundColor: isSelected ? tone.light : '#fff', borderRadius: 2.5, padding: 16, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease' }} variant="secondary">
                          <div style={{ width: 6, alignSelf: 'stretch', borderRadius: 999, backgroundColor: tone.color, flexShrink: 0 }}></div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontWeight: 700, color: "#111827" }}>
                              {item.title}
                            </p>
                            <p style={{ display: 'block', marginTop: 4 }}>
                              {item.source}
                            </p>
                            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                              <Chip size="sm">{reviewInboxSourceKindLabels[item.sourceKind]}</Chip>
                              <Chip size="sm">{item.sourceStatus}</Chip>
                              {createdAtLabel ? <Chip size="sm">{`접수 ${createdAtLabel}`}</Chip> : null}
                              {sourceIdLabel ? <Chip size="sm">{`ID ${sourceIdLabel}`}</Chip> : null}
                              {item.handlerLabel ? (<Chip size="sm">{item.handlerLabel}</Chip>) : null}
                            </div>
                            <p style={{ display: 'block', marginTop: 8, color: isSelected ? tone.color : '#6b7280' }}>
                              왜 지금 검토가 필요한가: {item.why}
                            </p>
                          </div>

                          <Chip size="sm">{item.recommendation}</Chip>
                        </Button>);
                })}
                  </div>)}
              </div>
            </div>

            {selectedItem && (<div className="rounded-xl border p-4" style={{ borderRadius: 3, alignSelf: 'start' }}>
                <div className="p-4" style={{ padding: 20 }}>
                  <div>
                    <div>
                      <div>
                        <h2 className="text-lg font-semibold" style={{ fontWeight: 700 }}>
                          {selectedItem.title}
                        </h2>
                        <Chip size="sm">{selectedItem.recommendation}</Chip>
                        <Chip size="sm">{reviewInboxSourceKindLabels[selectedItem.sourceKind]}</Chip>
                        {selectedItem.handlerLabel ? (<Chip size="sm">{selectedItem.handlerLabel}</Chip>) : null}
                      </div>
                      <p style={{ display: 'block', marginTop: 6 }}>
                        {selectedItem.source}
                      </p>
                      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {formatDateTime(selectedItem.createdAt) ? (<Chip size="sm">{`접수 ${formatDateTime(selectedItem.createdAt)}`}</Chip>) : null}
                        {formatShortId(selectedItem.sourceId) ? (<Chip size="sm">{`원본 ID ${formatShortId(selectedItem.sourceId)}`}</Chip>) : null}
                        <Chip size="sm">{`상태 ${selectedItem.sourceStatus}`}</Chip>
                      </div>
                      {formatDateTime(selectedItem.completedAt) ? (<p style={{ display: 'block', marginTop: 4 }}>
                          완료 시각 · {formatDateTime(selectedItem.completedAt)}
                        </p>) : null}
                    </div>

                    <div style={{ border: '1px solid #ddd6fe', backgroundColor: '#faf5ff', borderRadius: 2.5, padding: 16 }}>
                      <p style={{ color: '#7c3aed', fontWeight: 700, lineHeight: 1.2 }}>
                        {selectedItem.bucket === 'done' ? '어떻게 정리되었는가' : '왜 지금 검토가 필요한가'}
                      </p>
                      <p style={{ marginTop: 6, fontWeight: 700, color: "#111827" }}>
                        {selectedItem.why}
                      </p>
                      <p style={{ marginTop: 10, lineHeight: 1.6 }}>
                        {selectedItem.summary}
                      </p>
                    </div>

                    <div>
                      <p style={{ fontWeight: 700, marginBottom: 10 }}>
                        근거 자료
                      </p>
                      <div style={{ padding: 0, margin: 0 }}>
                        {selectedItem.evidence.map((entry) => {
                    const tone = evidenceTone[entry.type];
                    return (<div key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, border: '1px solid #e5e7eb', borderRadius: 2, paddingInline: 10, paddingBlock: 8 }}>
                              <div style={{ width: 24, height: 24, borderRadius: 1.5, backgroundColor: tone.bg, color: tone.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {tone.icon}
                              </div>
                              <p>
                                {entry.label}
                              </p>
                            </div>);
                })}
                      </div>
                    </div>

                    <div>
                      {selectedItem.actions.map((action) => (<a key={action.id} href={action.href} {...getActionButtonProps(action)} className="inline-flex items-center gap-2 rounded-lg border p-2">
                          {action.label}
                        </a>))}
                    </div>
                  </div>
                </div>
              </div>)}
          </div>
        </>) : null}
    </div>);
}
