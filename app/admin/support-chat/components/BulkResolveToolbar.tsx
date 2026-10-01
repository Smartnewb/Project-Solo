"use client";
import { Button, Modal } from "@heroui/react";

import { useEffect, useRef, useState } from "react";

import supportChatService from "@/app/services/support-chat";
import type { SupportSessionSummary } from "@/app/types/support-chat";

export function useSessionSelection(
  sessions: SupportSessionSummary[],
  scope: string,
) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  useEffect(() => {
    setSelectedIds([]);
  }, [scope]);
  const selected = sessions.filter((session) =>
    selectedIds.includes(session.sessionId),
  );
  const toggle = (id: string) =>
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id],
    );
  return { selected, toggle, setSelectedIds };
}

interface BulkResolveToolbarProps {
  selected: SupportSessionSummary[];
  setSelectedIds: (ids: string[]) => void;
  onSessionUpdated: () => void;
  scope: string;
}

export default function BulkResolveToolbar({
  selected,
  setSelectedIds,
  onSessionUpdated,
  scope,
}: BulkResolveToolbarProps) {
  const [targets, setTargets] = useState<SupportSessionSummary[] | null>(null);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [result, setResult] = useState<{
    failed: number;
    completed: number;
  } | null>(null);

  useEffect(() => {
    setTargets(null);
    setResult(null);
  }, [scope]);

  const resolveSelected = async () => {
    if (!targets?.length || pendingRef.current) return;
    // Freeze the explicitly confirmed IDs. A refresh or checkbox change cannot add targets.
    const confirmed = targets;
    pendingRef.current = true;
    setPending(true);
    const results = await Promise.allSettled(
      confirmed.map(async (session) => {
        const response = await supportChatService.resolveSession(
          session.sessionId,
          { resolutionReason: "solved" },
        );
        if (!response.success)
          throw new Error("해결 완료 처리에 실패했습니다.");
      }),
    );
    const failed = confirmed.filter(
      (_, index) => results[index].status === "rejected",
    );
    setSelectedIds(failed.map((session) => session.sessionId));
    setResult({
      completed: confirmed.length - failed.length,
      failed: failed.length,
    });
    setTargets(null);
    pendingRef.current = false;
    setPending(false);
    onSessionUpdated();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Button
          onClick={() => {
            setTargets([...selected]);
            setResult(null);
          }}
          variant={"primary"}
          isDisabled={!selected.length || pending}
        >
          {pending ? "처리 중…" : `선택 ${selected.length}건 해결 완료`}
        </Button>
        <Button
          onClick={() => setSelectedIds([])}
          variant={"secondary"}
          isDisabled={!selected.length || pending}
        >
          선택 해제
        </Button>
      </div>
      {result && (
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
        >
          {result.completed}건 완료
          {result.failed
            ? `, ${result.failed}건 실패. 실패한 상담만 선택 상태로 남겼습니다. 상태를 확인한 후 다시 처리해주세요.`
            : ". 선택한 상담을 해결 완료했습니다."}
          <Button
            variant="secondary"
            aria-label="알림 닫기"
            onClick={() => setResult(null)}
          >
            닫기
          </Button>
        </div>
      )}
      <Modal.Backdrop
        isOpen={targets !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen)
            (() => {
              if (!pending) setTargets(null);
            })();
        }}
      >
        <Modal.Container>
          <Modal.Dialog style={{ width: '100%', maxWidth: 444, minWidth: 0 }} className="max-w-sm">
            <Modal.Heading>
              선택한 {targets?.length ?? 0}건을 해결 완료할까요?
            </Modal.Heading>
            <Modal.Body>
              <p style={{ marginBottom: 8 }}>
                아래 상담만 완료합니다. 추가 답변 메시지는 보내지 않습니다.
              </p>
              <ul style={{ paddingLeft: 24, margin: 0 }}>
                {targets?.map((session) => (
                  <li key={session.sessionId}>
                    {session.userNickname || session.userId}
                  </li>
                ))}
              </ul>
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => setTargets(null)}
                variant={"secondary"}
                isDisabled={pending}
              >
                취소
              </Button>
              <Button
                onClick={resolveSelected}
                variant={"primary"}
                isDisabled={pending}
              >
                {pending ? "처리 중…" : "해결 완료"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
