import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';

export type SuspiciousIpStatus = 'blocked' | 'released' | 'reported' | null;

export interface SuspiciousIp {
  ip: string;
  country: string | null;
  /** WAF 차단 + 인증 실패 + 404 경로 수 */
  failures: number;
  wafBlocked: number;
  wafCounted: number;
  /** 최근 1시간 WAF 기록·차단 (매분 갱신) */
  wafRecent: number;
  rules: string[];
  authFail: number;
  notFound: number;
  sms: number;
  /** 최근 1시간 앱(iOS·Android)에서 정상 응답을 받은 IP. 막으면 실제 사용자가 막힌다 */
  appUser: boolean;
  status: SuspiciousIpStatus;
  reason: string | null;
  detail: string | null;
  blockedAt: number | null;
  decidedBy: string | null;
  /** 차단 목록에 넣을 수 없는 이유(허용 목록·IPv6). 넣을 수 있으면 null */
  refusal: string | null;
}

export interface SuspiciousIpDashboard {
  /** 1분 집계 시각 */
  generatedAt: number;
  /** 24시간 WAF 집계 시각 (15분마다) */
  wafAt: number;
  windows: { waf: string; wafRecent: string; alb: string };
  rows: SuspiciousIp[];
}

export const wafGuard = {
  getIps: () => adminGet<SuspiciousIpDashboard>('/waf-guard/ips'),
  block: (ip: string) =>
    adminPost<{ ip: string; status: 'blocked'; enforced: boolean }>(
      `/waf-guard/ips/${encodeURIComponent(ip)}/block`,
    ),
  unblock: (ip: string) =>
    adminPost<{ ip: string; status: 'released' }>(
      `/waf-guard/ips/${encodeURIComponent(ip)}/unblock`,
    ),
};

export interface WafOverview {
  generatedAt: number;
  /** auto-block 규칙이 Block 이면 true. Count(기록 모드)면 즉시차단해도 실제로 막지 않는다 */
  autoBlockEnforced: boolean;
  blockedIps: number;
  /** 최근 24시간 규칙별 기록(Count)·차단(Block) 요청 수 */
  rules: { rule: string; counted: number; blocked: number }[];
  hourly: { at: number; allowed: number; counted: number; blocked: number }[];
}

export const wafOverview = () => adminGet<WafOverview>('/waf-guard/ips/overview');
