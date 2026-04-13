import { NextResponse } from 'next/server';
import { getAdminAccessToken, getSessionMeta } from '@/shared/auth';
import type { ReviewInboxEvidence, ReviewInboxItem, ReviewInboxResponse } from '@/app/admin/review-inbox/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';
const ACTIVE_BUCKET_LIMIT = 5;
const COMPLETED_BUCKET_LIMIT = 20;

type BackendMeta = {
  total?: number;
  totalItems?: number;
};

type BackendReportListResponse<T> = {
  data?: T[];
  meta?: BackendMeta;
};

type SupportSessionSummary = {
  sessionId: string;
  userId: string;
  userNickname?: string;
  status: 'waiting_admin' | 'admin_handling' | 'resolved' | 'bot_handling';
  language: 'ko' | 'ja';
  messageCount: number;
  lastMessage?: string;
  domain?: 'payment' | 'matching' | 'chat' | 'account' | 'other';
  collectedInfo?: Record<string, string>;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  assignedAdminId?: string;
};

type SupportSessionsResponse = {
  sessions: SupportSessionSummary[];
  pagination: {
    total: number;
  };
};

type SupportSessionMessage = {
  senderType: 'user' | 'bot' | 'admin';
};

type SupportSessionDetail = {
  sessionId: string;
  assignedAdminId?: string;
  createdAt: string;
  resolvedAt?: string;
  updatedAt?: string;
  messages: SupportSessionMessage[];
};

type ProfileReport = {
  id: string;
  reporter?: { id?: string; name?: string };
  reported?: { id?: string; name?: string };
  reason?: string;
  description?: string | null;
  evidenceImages?: string[];
  createdAt: string;
  updatedAt?: string;
};

type CommunityReport = {
  id: string;
  reporter?: { id?: string; name?: string };
  reported?: { id?: string; name?: string };
  article?: { id?: string; title?: string; content?: string };
  reason?: string;
  description?: string | null;
  createdAt: string;
  updatedAt?: string;
};

type SessionMeta = Awaited<ReturnType<typeof getSessionMeta>>;

const DOMAIN_LABELS: Record<NonNullable<SupportSessionSummary['domain']>, string> = {
  payment: '결제',
  matching: '매칭',
  chat: '채팅',
  account: '계정',
  other: '기타',
};

const SUPPORT_STATUS_LABELS: Record<SupportSessionSummary['status'], string> = {
  bot_handling: 'AI 응대 중',
  waiting_admin: '어드민 대기',
  admin_handling: '어드민 응대 중',
  resolved: '해결 완료',
};

async function fetchBackendJson<T>(
  token: string,
  sessionMeta: SessionMeta,
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${BACKEND_URL}/${path}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value != null) {
      url.searchParams.set(key, value);
    }
  });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (sessionMeta?.selectedCountry) {
    headers['x-country'] = sessionMeta.selectedCountry;
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`${path} fetch failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function createEvidence(items: Array<ReviewInboxEvidence | null | undefined>): ReviewInboxEvidence[] {
  return items.filter(Boolean).slice(0, 3) as ReviewInboxEvidence[];
}

function createSourceFallbackWarning(sourceLabel: string) {
  return `${sourceLabel} 데이터를 불러오지 못해 일부 항목이 비어 있을 수 있습니다.`;
}

function toReasonLabel(reason?: string | null) {
  return reason?.trim() || '사유 미확인';
}

function getReportTotal<T>(result: PromiseSettledResult<BackendReportListResponse<T>>) {
  if (result.status !== 'fulfilled') {
    return 0;
  }

  return result.value.meta?.total ?? result.value.meta?.totalItems ?? result.value.data?.length ?? 0;
}

function getSupportTotal(result: PromiseSettledResult<SupportSessionsResponse>) {
  if (result.status !== 'fulfilled') {
    return 0;
  }

  return result.value.pagination?.total ?? result.value.sessions?.length ?? 0;
}

function getReportItems<T>(result: PromiseSettledResult<BackendReportListResponse<T>>) {
  if (result.status !== 'fulfilled') {
    return [] as T[];
  }

  return result.value.data ?? [];
}

function getSupportItems(result: PromiseSettledResult<SupportSessionsResponse>) {
  if (result.status !== 'fulfilled') {
    return [] as SupportSessionSummary[];
  }

  return result.value.sessions ?? [];
}

function sortByNewest<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

function sortByLatestCompletion<T extends { createdAt: string; completedAt?: string }>(items: T[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.completedAt ?? right.createdAt).getTime() - new Date(left.completedAt ?? left.createdAt).getTime(),
  );
}

function getCompletedAt(value?: string | null, fallback?: string) {
  return value?.trim() || fallback;
}

function getCompletedProfileStatusLabel(sourceStatus: 'resolved' | 'dismissed') {
  return sourceStatus === 'resolved' ? '처리 완료' : '반려';
}

function getCompletedCommunityStatusLabel(sourceStatus: 'resolved' | 'rejected') {
  return sourceStatus === 'resolved' ? '처리 완료' : '반려';
}

function getSupportHandler(session: SupportSessionSummary, detailResult?: PromiseSettledResult<SupportSessionDetail>) {
  if (detailResult?.status === 'fulfilled') {
    const senderTypes = new Set(detailResult.value.messages?.map((message) => message.senderType) ?? []);
    const hasBot = senderTypes.has('bot');
    const hasAdmin = senderTypes.has('admin') || Boolean(detailResult.value.assignedAdminId || session.assignedAdminId);

    if (hasBot && hasAdmin) {
      return {
        kind: 'ai_assisted' as const,
        label: 'AI 응대 후 어드민 개입',
        why: 'AI가 먼저 응대한 뒤 어드민이 이어서 정리한 1:1 문의입니다.',
      };
    }

    if (hasBot) {
      return {
        kind: 'ai_only' as const,
        label: 'AI가 응대해 정리',
        why: 'AI 응대만으로 해결 완료된 1:1 문의입니다.',
      };
    }

    if (hasAdmin) {
      return {
        kind: 'admin_only' as const,
        label: '어드민이 직접 처리',
        why: '어드민이 직접 마무리한 1:1 문의입니다.',
      };
    }
  }

  return {
    kind: 'unknown' as const,
    label: '처리 주체 확인 불가',
    why: '현재 응대 주체를 구분할 수 없는 완료 이력입니다.',
  };
}

function mapProfileReport(report: ProfileReport, bucket: 'approval' | 'judgment'): ReviewInboxItem {
  const reason = toReasonLabel(report.reason);
  const reportedName = report.reported?.name || '알 수 없는 사용자';

  return {
    id: `profile_report:${report.id}`,
    sourceKind: 'profile_report',
    sourceId: report.id,
    sourceStatus: bucket === 'approval' ? 'pending' : 'reviewing',
    bucket,
    title: `${reportedName} 프로필 신고`,
    source: `프로필 신고 · ${bucket === 'approval' ? '대기중' : '검토중'}`,
    recommendation: bucket === 'approval' ? '원본 화면에서 처리' : '최종 판단 필요',
    why:
      bucket === 'approval'
        ? '접수된 신고라 사람이 승인/반려를 결정해야 합니다.'
        : '이미 검토중 상태로 옮겨져 최종 판단이 남았습니다.',
    summary: report.description?.trim() || `${reason} 사유로 접수된 프로필 신고입니다.`,
    createdAt: report.createdAt,
    evidence: createEvidence([
      { id: `${report.id}-reason`, type: 'text', label: `신고 사유 · ${reason}` },
      report.description
        ? { id: `${report.id}-description`, type: 'text', label: `신고 설명 · ${report.description}` }
        : null,
      report.evidenceImages?.length
        ? { id: `${report.id}-images`, type: 'image', label: `첨부 이미지 ${report.evidenceImages.length}장` }
        : null,
      report.reporter?.name && report.reported?.name
        ? {
            id: `${report.id}-parties`,
            type: 'history',
            label: `신고자 ${report.reporter.name} → 피신고자 ${report.reported.name}`,
          }
        : null,
    ]),
    actions: [
      {
        id: `${report.id}-open`,
        label: '원본 화면 열기',
        tone: 'primary',
        href: `/admin/reports?reportId=${report.id}`,
      },
    ],
  };
}

function mapCompletedProfileReport(report: ProfileReport, sourceStatus: 'resolved' | 'dismissed'): ReviewInboxItem {
  const reason = toReasonLabel(report.reason);
  const reportedName = report.reported?.name || '알 수 없는 사용자';
  const statusLabel = getCompletedProfileStatusLabel(sourceStatus);

  return {
    id: `profile_report:${report.id}`,
    sourceKind: 'profile_report',
    sourceId: report.id,
    sourceStatus,
    bucket: 'done',
    title: `${reportedName} 프로필 신고`,
    source: `프로필 신고 · ${statusLabel}`,
    recommendation: '처리 이력 보기',
    why: `이미 ${statusLabel} 상태로 정리된 프로필 신고입니다.`,
    summary: report.description?.trim() || `${reason} 사유로 접수된 프로필 신고입니다.`,
    createdAt: report.createdAt,
    completedAt: getCompletedAt(report.updatedAt, report.createdAt),
    handlerKind: 'unknown',
    handlerLabel: '처리 주체 확인 불가',
    evidence: createEvidence([
      { id: `${report.id}-status`, type: 'history', label: `처리 결과 · ${statusLabel}` },
      { id: `${report.id}-reason`, type: 'text', label: `신고 사유 · ${reason}` },
      report.reporter?.name && report.reported?.name
        ? {
            id: `${report.id}-parties`,
            type: 'history',
            label: `신고자 ${report.reporter.name} → 피신고자 ${report.reported.name}`,
          }
        : null,
    ]),
    actions: [
      {
        id: `${report.id}-open`,
        label: '원본 화면 열기',
        tone: 'primary',
        href: `/admin/reports?reportId=${report.id}`,
      },
    ],
  };
}

function mapCommunityReport(report: CommunityReport, bucket: 'approval' | 'judgment'): ReviewInboxItem {
  const reason = toReasonLabel(report.reason);

  return {
    id: `community_report:${report.id}`,
    sourceKind: 'community_report',
    sourceId: report.id,
    sourceStatus: bucket === 'approval' ? 'pending' : 'reviewing',
    bucket,
    title: report.article?.title?.trim() || '커뮤니티 신고',
    source: `커뮤니티 신고 · ${bucket === 'approval' ? '대기중' : '검토중'}`,
    recommendation: bucket === 'approval' ? '원본 화면에서 처리' : '최종 판단 필요',
    why:
      bucket === 'approval'
        ? '게시글 신고가 접수되어 조치 여부를 정해야 합니다.'
        : '커뮤니티 신고가 검토중 상태라 최종 판단이 남았습니다.',
    summary:
      report.description?.trim() || report.article?.content?.trim() || `${reason} 사유로 접수된 커뮤니티 신고입니다.`,
    createdAt: report.createdAt,
    evidence: createEvidence([
      { id: `${report.id}-reason`, type: 'text', label: `신고 사유 · ${reason}` },
      report.article?.title
        ? { id: `${report.id}-article`, type: 'history', label: `게시글 제목 · ${report.article.title}` }
        : null,
      report.description
        ? { id: `${report.id}-description`, type: 'text', label: `신고 설명 · ${report.description}` }
        : null,
    ]),
    actions: [
      {
        id: `${report.id}-open`,
        label: '원본 화면 열기',
        tone: 'primary',
        href: '/admin/community?tab=reports',
      },
    ],
  };
}

function mapCompletedCommunityReport(report: CommunityReport, sourceStatus: 'resolved' | 'rejected'): ReviewInboxItem {
  const reason = toReasonLabel(report.reason);
  const statusLabel = getCompletedCommunityStatusLabel(sourceStatus);

  return {
    id: `community_report:${report.id}`,
    sourceKind: 'community_report',
    sourceId: report.id,
    sourceStatus,
    bucket: 'done',
    title: report.article?.title?.trim() || '커뮤니티 신고',
    source: `커뮤니티 신고 · ${statusLabel}`,
    recommendation: '처리 이력 보기',
    why: `이미 ${statusLabel} 상태로 정리된 커뮤니티 신고입니다.`,
    summary: report.description?.trim() || report.article?.content?.trim() || `${reason} 사유로 접수된 커뮤니티 신고입니다.`,
    createdAt: report.createdAt,
    completedAt: getCompletedAt(report.updatedAt, report.createdAt),
    handlerKind: 'unknown',
    handlerLabel: '처리 주체 확인 불가',
    evidence: createEvidence([
      { id: `${report.id}-status`, type: 'history', label: `처리 결과 · ${statusLabel}` },
      { id: `${report.id}-reason`, type: 'text', label: `신고 사유 · ${reason}` },
      report.article?.title
        ? { id: `${report.id}-article`, type: 'history', label: `게시글 제목 · ${report.article.title}` }
        : null,
    ]),
    actions: [
      {
        id: `${report.id}-open`,
        label: '원본 화면 열기',
        tone: 'primary',
        href: '/admin/community?tab=reports',
      },
    ],
  };
}

function mapSupportSession(session: SupportSessionSummary): ReviewInboxItem {
  const collectedInfo = Object.entries(session.collectedInfo || {});
  const domainLabel = session.domain ? DOMAIN_LABELS[session.domain] : null;

  return {
    id: `support_chat:${session.sessionId}`,
    sourceKind: 'support_chat',
    sourceId: session.sessionId,
    sourceStatus: session.status,
    bucket: 'judgment',
    title: `${session.userNickname || session.userId.substring(0, 8)} 문의 세션`,
    source: `고객지원 · ${SUPPORT_STATUS_LABELS[session.status]}`,
    recommendation: session.status === 'waiting_admin' ? '세션 열기' : '처리 계속',
    why:
      session.status === 'waiting_admin'
        ? 'AI 응대 이후 어드민 인수가 필요합니다.'
        : '이미 어드민이 응대 중이며 후속 판단이 남았습니다.',
    summary: session.lastMessage || '최근 메시지가 없어 직접 확인이 필요합니다.',
    createdAt: session.createdAt,
    evidence: createEvidence([
      domainLabel ? { id: `${session.sessionId}-domain`, type: 'history', label: `도메인 · ${domainLabel}` } : null,
      session.lastMessage
        ? { id: `${session.sessionId}-last-message`, type: 'text', label: `최근 메시지 · ${session.lastMessage}` }
        : null,
      collectedInfo[0]
        ? {
            id: `${session.sessionId}-info`,
            type: 'history',
            label: `수집 정보 · ${collectedInfo[0][0]}: ${collectedInfo[0][1]}`,
          }
        : null,
    ]),
    actions: [
      {
        id: `${session.sessionId}-open`,
        label: '세션 열기',
        tone: 'primary',
        href: `/admin/support-chat?session=${session.sessionId}`,
      },
    ],
  };
}

function mapCompletedSupportSession(
  session: SupportSessionSummary,
  detailResult?: PromiseSettledResult<SupportSessionDetail>,
): ReviewInboxItem {
  const collectedInfo = Object.entries(session.collectedInfo || {});
  const domainLabel = session.domain ? DOMAIN_LABELS[session.domain] : null;
  const handler = getSupportHandler(session, detailResult);
  const detail = detailResult?.status === 'fulfilled' ? detailResult.value : null;
  const completedAt = getCompletedAt(session.resolvedAt ?? detail?.resolvedAt, session.updatedAt ?? detail?.updatedAt ?? session.createdAt);

  return {
    id: `support_chat:${session.sessionId}`,
    sourceKind: 'support_chat',
    sourceId: session.sessionId,
    sourceStatus: session.status,
    bucket: 'done',
    title: `${session.userNickname || session.userId.substring(0, 8)} 문의 세션`,
    source: '1:1 문의 · 해결 완료',
    recommendation: '세션 다시 보기',
    why: handler.why,
    summary: session.lastMessage || '해결 완료된 1:1 문의 세션입니다.',
    createdAt: session.createdAt,
    completedAt,
    handlerKind: handler.kind,
    handlerLabel: handler.label,
    evidence: createEvidence([
      domainLabel ? { id: `${session.sessionId}-domain`, type: 'history', label: `도메인 · ${domainLabel}` } : null,
      { id: `${session.sessionId}-status`, type: 'history', label: '처리 결과 · 해결 완료' },
      { id: `${session.sessionId}-handler`, type: 'history', label: `처리 방식 · ${handler.label}` },
      session.lastMessage
        ? { id: `${session.sessionId}-last-message`, type: 'text', label: `최근 메시지 · ${session.lastMessage}` }
        : null,
      collectedInfo[0]
        ? {
            id: `${session.sessionId}-info`,
            type: 'history',
            label: `수집 정보 · ${collectedInfo[0][0]}: ${collectedInfo[0][1]}`,
          }
        : null,
    ]),
    actions: [
      {
        id: `${session.sessionId}-open`,
        label: '세션 다시 보기',
        tone: 'primary',
        href: `/admin/support-chat?session=${session.sessionId}`,
      },
    ],
  };
}

function buildReviewInboxResponse(payload: {
  profilePending: PromiseSettledResult<BackendReportListResponse<ProfileReport>>;
  profileReviewing: PromiseSettledResult<BackendReportListResponse<ProfileReport>>;
  profileResolved: PromiseSettledResult<BackendReportListResponse<ProfileReport>>;
  profileDismissed: PromiseSettledResult<BackendReportListResponse<ProfileReport>>;
  communityPending: PromiseSettledResult<BackendReportListResponse<CommunityReport>>;
  communityReviewing: PromiseSettledResult<BackendReportListResponse<CommunityReport>>;
  communityResolved: PromiseSettledResult<BackendReportListResponse<CommunityReport>>;
  communityRejected: PromiseSettledResult<BackendReportListResponse<CommunityReport>>;
  supportWaiting: PromiseSettledResult<SupportSessionsResponse>;
  supportHandling: PromiseSettledResult<SupportSessionsResponse>;
  supportResolved: PromiseSettledResult<SupportSessionsResponse>;
  supportResolvedDetails: Map<string, PromiseSettledResult<SupportSessionDetail>>;
}): ReviewInboxResponse {
  const approvalItems = sortByNewest([
    ...getReportItems(payload.profilePending).map((item) => mapProfileReport(item, 'approval')),
    ...getReportItems(payload.communityPending).map((item) => mapCommunityReport(item, 'approval')),
  ]).slice(0, ACTIVE_BUCKET_LIMIT);

  const judgmentItems = sortByNewest([
    ...getReportItems(payload.profileReviewing).map((item) => mapProfileReport(item, 'judgment')),
    ...getReportItems(payload.communityReviewing).map((item) => mapCommunityReport(item, 'judgment')),
    ...getSupportItems(payload.supportWaiting).map(mapSupportSession),
    ...getSupportItems(payload.supportHandling).map(mapSupportSession),
  ]).slice(0, ACTIVE_BUCKET_LIMIT);

  const doneItems = sortByLatestCompletion([
    ...getReportItems(payload.profileResolved).map((item) => mapCompletedProfileReport(item, 'resolved')),
    ...getReportItems(payload.profileDismissed).map((item) => mapCompletedProfileReport(item, 'dismissed')),
    ...getReportItems(payload.communityResolved).map((item) => mapCompletedCommunityReport(item, 'resolved')),
    ...getReportItems(payload.communityRejected).map((item) => mapCompletedCommunityReport(item, 'rejected')),
    ...getSupportItems(payload.supportResolved).map((item) =>
      mapCompletedSupportSession(item, payload.supportResolvedDetails.get(item.sessionId)),
    ),
  ]).slice(0, COMPLETED_BUCKET_LIMIT);

  const summary = {
    approval: getReportTotal(payload.profilePending) + getReportTotal(payload.communityPending),
    judgment:
      getReportTotal(payload.profileReviewing) +
      getReportTotal(payload.communityReviewing) +
      getSupportTotal(payload.supportWaiting) +
      getSupportTotal(payload.supportHandling),
    done:
      getReportTotal(payload.profileResolved) +
      getReportTotal(payload.profileDismissed) +
      getReportTotal(payload.communityResolved) +
      getReportTotal(payload.communityRejected) +
      getSupportTotal(payload.supportResolved),
  };

  const doneBreakdown = {
    profile_report: getReportTotal(payload.profileResolved) + getReportTotal(payload.profileDismissed),
    community_report: getReportTotal(payload.communityResolved) + getReportTotal(payload.communityRejected),
    support_chat: getSupportTotal(payload.supportResolved),
  };

  const warnings = [
    payload.profilePending.status === 'rejected' ? createSourceFallbackWarning('프로필 신고(대기중)') : null,
    payload.profileReviewing.status === 'rejected' ? createSourceFallbackWarning('프로필 신고(검토중)') : null,
    payload.communityPending.status === 'rejected' ? createSourceFallbackWarning('커뮤니티 신고(대기중)') : null,
    payload.communityReviewing.status === 'rejected' ? createSourceFallbackWarning('커뮤니티 신고(검토중)') : null,
    payload.supportWaiting.status === 'rejected' ? createSourceFallbackWarning('고객지원(어드민 대기)') : null,
    payload.supportHandling.status === 'rejected' ? createSourceFallbackWarning('고객지원(어드민 응대 중)') : null,
    payload.profileResolved.status === 'rejected' ? createSourceFallbackWarning('프로필 신고 완료 집계') : null,
    payload.profileDismissed.status === 'rejected' ? createSourceFallbackWarning('프로필 신고 반려 집계') : null,
    payload.communityResolved.status === 'rejected' ? createSourceFallbackWarning('커뮤니티 신고 완료 집계') : null,
    payload.communityRejected.status === 'rejected' ? createSourceFallbackWarning('커뮤니티 신고 반려 집계') : null,
    payload.supportResolved.status === 'rejected' ? createSourceFallbackWarning('고객지원 완료 집계') : null,
  ].filter(Boolean) as string[];

  return {
    summary,
    doneBreakdown,
    buckets: {
      approval: {
        total: summary.approval,
        items: approvalItems,
      },
      judgment: {
        total: summary.judgment,
        items: judgmentItems,
      },
      done: {
        total: summary.done,
        items: doneItems,
      },
    },
    generatedAt: new Date().toISOString(),
    warnings,
  };
}

export async function GET(_request: Request) {
  const token = await getAdminAccessToken();
  const sessionMeta = await getSessionMeta();

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const [
    profilePending,
    profileReviewing,
    profileResolved,
    profileDismissed,
    communityPending,
    communityReviewing,
    communityResolved,
    communityRejected,
    supportWaiting,
    supportHandling,
    supportResolved,
  ] = await Promise.allSettled([
    fetchBackendJson<BackendReportListResponse<ProfileReport>>(token, sessionMeta, 'admin/v2/reports', {
      type: 'profile',
      page: '1',
      limit: String(ACTIVE_BUCKET_LIMIT),
      status: 'PENDING',
    }),
    fetchBackendJson<BackendReportListResponse<ProfileReport>>(token, sessionMeta, 'admin/v2/reports', {
      type: 'profile',
      page: '1',
      limit: String(ACTIVE_BUCKET_LIMIT),
      status: 'REVIEWING',
    }),
    fetchBackendJson<BackendReportListResponse<ProfileReport>>(token, sessionMeta, 'admin/v2/reports', {
      type: 'profile',
      page: '1',
      limit: String(COMPLETED_BUCKET_LIMIT),
      status: 'RESOLVED',
    }),
    fetchBackendJson<BackendReportListResponse<ProfileReport>>(token, sessionMeta, 'admin/v2/reports', {
      type: 'profile',
      page: '1',
      limit: String(COMPLETED_BUCKET_LIMIT),
      status: 'DISMISSED',
    }),
    fetchBackendJson<BackendReportListResponse<CommunityReport>>(token, sessionMeta, 'admin/v2/community/reports', {
      page: '1',
      limit: String(ACTIVE_BUCKET_LIMIT),
      status: 'pending',
    }),
    fetchBackendJson<BackendReportListResponse<CommunityReport>>(token, sessionMeta, 'admin/v2/community/reports', {
      page: '1',
      limit: String(ACTIVE_BUCKET_LIMIT),
      status: 'reviewing',
    }),
    fetchBackendJson<BackendReportListResponse<CommunityReport>>(token, sessionMeta, 'admin/v2/community/reports', {
      page: '1',
      limit: String(COMPLETED_BUCKET_LIMIT),
      status: 'resolved',
    }),
    fetchBackendJson<BackendReportListResponse<CommunityReport>>(token, sessionMeta, 'admin/v2/community/reports', {
      page: '1',
      limit: String(COMPLETED_BUCKET_LIMIT),
      status: 'rejected',
    }),
    fetchBackendJson<SupportSessionsResponse>(token, sessionMeta, 'support-chat/admin/sessions', {
      status: 'waiting_admin',
      page: '1',
      limit: String(ACTIVE_BUCKET_LIMIT),
    }),
    fetchBackendJson<SupportSessionsResponse>(token, sessionMeta, 'support-chat/admin/sessions', {
      status: 'admin_handling',
      page: '1',
      limit: String(ACTIVE_BUCKET_LIMIT),
    }),
    fetchBackendJson<SupportSessionsResponse>(token, sessionMeta, 'support-chat/admin/sessions', {
      status: 'resolved',
      page: '1',
      limit: String(COMPLETED_BUCKET_LIMIT),
    }),
  ]);

  const supportResolvedDetails = new Map<string, PromiseSettledResult<SupportSessionDetail>>();

  if (supportResolved.status === 'fulfilled') {
    const resolvedSessions = getSupportItems(supportResolved);
    const detailResults = await Promise.allSettled(
      resolvedSessions.map((session) =>
        fetchBackendJson<SupportSessionDetail>(token, sessionMeta, `support-chat/admin/sessions/${session.sessionId}`, {}),
      ),
    );

    resolvedSessions.forEach((session, index) => {
      supportResolvedDetails.set(session.sessionId, detailResults[index]);
    });
  }

  return NextResponse.json(
    buildReviewInboxResponse({
      profilePending,
      profileReviewing,
      profileResolved,
      profileDismissed,
      communityPending,
      communityReviewing,
      communityResolved,
      communityRejected,
      supportWaiting,
      supportHandling,
      supportResolved,
      supportResolvedDetails,
    }),
  );
}
