"use client";
import { Button, Chip } from "@heroui/react";
import { Eye as ViewIcon, Images as ImagesIcon, MessageCircle as ChatIcon, ArrowRight as ArrowIcon, ExternalLink } from "lucide-react";
import { ReportAvatar } from "./report-avatar";

export interface ReportParty {
    id: string;
    name: string;
    age: number | null;
    gender: "MALE" | "FEMALE" | null;
    profileImageUrl: string;
    country?: "kr" | "jp" | null;
    universityName?: string | null;
}

/** 카드가 쓰는 필드만. 목록/상세 Report 모두 구조적으로 만족한다. */
export interface ReportCardData {
    id: string;
    reporter: ReportParty;
    reported: ReportParty;
    reason: string;
    description: string | null;
    translatedDescription?: string | null;
    evidenceImages: string[];
    severity?: "urgent" | "normal" | null;
    slackDelivered?: boolean;
    reportCount?: number;
    status: "pending" | "reviewing" | "resolved" | "rejected";
    createdAt: string;
    chatRoomId?: string;
    direction?: "kr_to_jp" | "jp_to_kr" | null;
}

export const REPORT_STATUS_CHIP: Record<ReportCardData["status"], { label: string; className: string }> = {
    pending: { label: "대기중", className: "bg-amber-100 text-amber-700" },
    reviewing: { label: "검토중", className: "bg-blue-100 text-blue-700" },
    resolved: { label: "처리완료", className: "bg-green-100 text-green-700" },
    rejected: { label: "반려", className: "bg-gray-100 text-gray-600" },
};

export function getCountryBadge(country?: "kr" | "jp" | null) {
    if (country === "kr") {
        return { flag: "🇰🇷", code: "KR", label: "한국", className: "bg-blue-50 text-blue-700" };
    }
    if (country === "jp") {
        return { flag: "🇯🇵", code: "JP", label: "일본", className: "bg-rose-50 text-rose-700" };
    }
    return null;
}

export function getDirectionBadgeLabel(report: Pick<ReportCardData, "direction" | "reporter" | "reported">): string | null {
    if (report.direction === "kr_to_jp") return "🇰🇷 KR → 🇯🇵 JP";
    if (report.direction === "jp_to_kr") return "🇯🇵 JP → 🇰🇷 KR";
    if (report.reporter.country === "kr" && report.reported.country === "jp") return "🇰🇷 KR → 🇯🇵 JP";
    if (report.reporter.country === "jp" && report.reported.country === "kr") return "🇯🇵 JP → 🇰🇷 KR";
    return null;
}

export function genderText(gender: ReportParty["gender"]) {
    return gender === "MALE" ? "남성" : gender === "FEMALE" ? "여성" : "성별 —";
}

export function partyMeta(party: Pick<ReportParty, "gender" | "age">) {
    return `${genderText(party.gender)}, ${party.age != null ? `${party.age}세` : "나이 —"}`;
}

function Party({ label, party, badge }: { label: string; party: ReportParty; badge?: React.ReactNode }) {
    const countryBadge = getCountryBadge(party.country);
    return (<div className="flex min-w-0 flex-1 items-center gap-2">
      <ReportAvatar src={party.profileImageUrl}></ReportAvatar>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="flex items-center gap-1 truncate text-sm font-semibold text-gray-900">
          <span className="truncate">{party.name}</span>
          {countryBadge && (<span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${countryBadge.className}`}>
              {countryBadge.flag} {countryBadge.code}
            </span>)}
          {badge}
        </p>
        <p className="text-xs text-gray-500">{partyMeta(party)}</p>
      </div>
    </div>);
}

export function ReportCard({ report, formatDate, onOpen }: {
    report: ReportCardData;
    formatDate: (value: string) => string;
    onOpen: () => void;
}) {
    const urgent = report.severity === "urgent";
    const status = REPORT_STATUS_CHIP[report.status];
    const reason = report.reason || "사유 없음";
    const directionLabel = getDirectionBadgeLabel(report);
    const hasTranslatedDescription = Boolean(
        report.translatedDescription && report.translatedDescription !== report.description
    );
    return (<article className={`flex flex-col rounded-2xl border p-4 shadow-sm transition ${urgent ? "border-red-300 bg-red-50/40" : "border-gray-200 bg-white"}`}>
      <button type="button" onClick={onOpen} className="min-w-0 cursor-pointer text-left" aria-label={`${report.reported.name} 신고 상세 보기`}>
        <div className="mb-2 flex flex-wrap items-center gap-1">
          <Chip size="sm" className={status.className}>{status.label}</Chip>
          {directionLabel && <Chip size="sm" className="bg-indigo-50 text-indigo-700">{directionLabel}</Chip>}
          {urgent && <Chip size="sm" className="bg-red-100 text-red-600">긴급</Chip>}
          {(report.reportCount ?? 0) > 1 && <Chip size="sm" className="bg-orange-100 text-orange-600">누적 {report.reportCount}건</Chip>}
          {report.slackDelivered === false && <span title="슬랙 미전달 — 신고는 접수됐지만 CS 알림 전송에 실패했습니다" className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">알림 실패</span>}
          <span className="ml-auto text-xs text-gray-500">{formatDate(report.createdAt)}</span>
        </div>
        <p className="text-base font-bold leading-snug text-gray-900">{reason}</p>
        {hasTranslatedDescription ? (<div className="mt-1 space-y-1">
            <p className="line-clamp-2 whitespace-pre-wrap text-sm leading-5 text-gray-800">
              <span className="mr-1.5 inline-block rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-700">번역</span>
              {report.translatedDescription}
            </p>
            {report.description && (<p className="line-clamp-1 whitespace-pre-wrap text-xs text-gray-500">
                원문: {report.description}
              </p>)}
          </div>) : (report.description && <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm leading-5 text-gray-600">{report.description}</p>)}
      </button>

      <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
        <Party label="신고자" party={report.reporter}></Party>
        <ArrowIcon size={16} className="shrink-0 text-gray-300" aria-hidden="true"></ArrowIcon>
        <Party label="피신고자" party={report.reported}></Party>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="font-mono">{report.id.slice(0, 8)}</span>
          {report.evidenceImages.length > 0 && <span className="inline-flex items-center gap-1"><ImagesIcon size={13}></ImagesIcon>증거 {report.evidenceImages.length}장</span>}
          {report.chatRoomId && <span className="inline-flex items-center gap-1"><ChatIcon size={13}></ChatIcon>채팅 있음</span>}
        </div>
        <Button size="sm" variant="secondary" onPress={onOpen}><ViewIcon size={14}></ViewIcon>상세 보기</Button>
      </div>
    </article>);
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (<div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="mt-0.5 text-sm text-gray-900">{children}</div>
    </div>);
}

export function UserInfoCard({ title, user, email, phoneNumber, onOpen }: {
    title: string;
    user: ReportParty;
    email?: string;
    phoneNumber?: string;
    onOpen: () => void;
}) {
    const countryBadge = getCountryBadge(user.country);
    const userPageHref = `/admin/users/appearance?userId=${encodeURIComponent(user.id)}${user.country ? `&country=${user.country}` : ""}`;
    return (<section className="min-w-0 rounded-xl border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">{title}</h3>
          {countryBadge && (<Chip size="sm" className={countryBadge.className}>
              {countryBadge.flag} {countryBadge.label}
            </Chip>)}
        </div>
        <div className="flex items-center gap-1">
          {user.id && (<a href={userPageHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
              유저 페이지
              <ExternalLink size={12} aria-hidden="true"></ExternalLink>
            </a>)}
          <Button size="sm" variant="tertiary" onPress={onOpen}>상세 보기</Button>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <ReportAvatar src={user.profileImageUrl}></ReportAvatar>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-2">
          <Field label="이름">{user.name}</Field>
          <Field label="나이/성별">{partyMeta(user)}</Field>
          <Field label="이메일"><span className="break-all">{email || "-"}</span></Field>
          <Field label="전화번호">{phoneNumber || "-"}</Field>
          {user.universityName && <Field label="대학교">{user.universityName}</Field>}
        </div>
      </div>
    </section>);
}
