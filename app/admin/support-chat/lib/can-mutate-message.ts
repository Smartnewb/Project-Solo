import type {
  SupportMessage,
  SupportSenderType,
} from "@/app/types/support-chat";

/** 어드민 답변(슬랙에서 보낸 답변 포함)과 AI 답변은 작성자와 상관없이 어느 어드민이든 수정·삭제할 수 있다. */
export function canMutateSupportMessage(
  message: Pick<SupportMessage, "senderType">,
): boolean {
  return isSupportReplySender(message.senderType);
}

export function isSupportReplySender(senderType: SupportSenderType): boolean {
  return senderType === "bot" || senderType === "admin";
}
