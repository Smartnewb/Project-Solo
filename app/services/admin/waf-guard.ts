import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';

export type SuspiciousIpStatus = 'blocked' | 'released' | 'reported' | null;

export interface SuspiciousIp {
  ip: string;
  country: string | null;
  /** WAF 차단 + 인증 실패 + 404 경로 수 */
  failures: number;
  wafBlocked: number;
  wafCounted: number;
  rules: string[];
  authFail: number;
  notFound: number;
  sms: number;
  status: SuspiciousIpStatus;
  reason: string | null;
  detail: string | null;
  blockedAt: number | null;
  decidedBy: string | null;
  /** 차단 목록에 넣을 수 없는 이유(허용 목록·IPv6). 넣을 수 있으면 null */
  refusal: string | null;
}

export interface SuspiciousIpDashboard {
  generatedAt: number;
  windows: { waf: string; alb: string };
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
