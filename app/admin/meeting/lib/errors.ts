import {
	AdminApiError,
	getAdminErrorMessage,
} from "@/shared/lib/http/admin-fetch";

/** 서버 오류 코드 → 운영자 문구 (다음에 할 일까지). */
export const MEETING_ERROR_MESSAGES: Record<string, string> = {
	"MEETING.CONFLICT_CONTACT_RESTRICTED":
		"연락처 공유가 감지된 멤버라 이 환불을 할 수 없어요. 잘못 감지된 거라면 먼저 연락처 제한을 해제하세요.",
};

const STATUS_HINTS: Record<number, string> = {
	400: "요청 값이 올바르지 않아요.",
	403: "권한이 없어요.",
	404: "대상을 찾지 못했어요. 이미 처리됐을 수 있어요.",
	409: "지금 상태에서는 할 수 없어요. 이미 처리 중이거나 처리된 건일 수 있어요.",
};

const SERVER_ERROR_HINT =
	"서버에서 끝까지 처리하지 못했어요. 새로고침해서 방 상태와 환불 실패 목록을 확인하세요.";

/**
 * 미팅 API 오류 문구.
 * - AppException 응답 `{ error: <번역된 문구>, code }` 은 코드별 문구, 없으면 서버 문구.
 * - Nest 기본 예외 `{ statusCode, message }` 는 상태별 한국어 안내 + (4xx 면) 서버 원문.
 * - 5xx 는 일부만 처리됐을 수 있어 새로고침 안내를 붙인다.
 */
export function meetingErrorMessage(error: unknown, fallback: string): string {
	if (!(error instanceof AdminApiError))
		return getAdminErrorMessage(error, fallback);

	const body = (
		error.body && typeof error.body === "object" ? error.body : {}
	) as {
		code?: unknown;
		error?: unknown;
		message?: unknown;
	};
	if (typeof body.code === "string") {
		if (MEETING_ERROR_MESSAGES[body.code])
			return MEETING_ERROR_MESSAGES[body.code];
		if (typeof body.error === "string" && body.error.trim()) return body.error;
	}
	if (error.status >= 500) return `${fallback} ${SERVER_ERROR_HINT}`;

	const hint = STATUS_HINTS[error.status];
	const detail =
		typeof body.message === "string" && body.message.trim()
			? ` (${body.message})`
			: "";
	return hint ? `${fallback} ${hint}${detail}` : `${fallback}${detail}`;
}
