"use client";

import { useEffect, useRef, useState } from "react";
import supportChatService from "@/app/services/support-chat";
import type {
  SupportMessage,
  SupportSessionSummary,
} from "@/app/types/support-chat";

type Request = { messageCount: number };

export function useSessionMessages(sessions: SupportSessionSummary[]) {
  const [messagesBySession, setMessages] = useState<
    Record<string, SupportMessage[]>
  >({});
  const [errorsBySession, setErrors] = useState<Record<string, string>>({});
  const requests = useRef(new Map<string, Request>());

  useEffect(
    () => () => {
      requests.current.clear();
    },
    [],
  );

  useEffect(() => {
    const ids = new Set(sessions.map((session) => session.sessionId));
    for (const id of requests.current.keys()) {
      if (!ids.has(id)) requests.current.delete(id);
    }
    setMessages((previous) => {
      if (Object.keys(previous).every((id) => ids.has(id))) return previous;
      return Object.fromEntries(
        Object.entries(previous).filter(([id]) => ids.has(id)),
      );
    });
    setErrors((previous) => {
      if (Object.keys(previous).every((id) => ids.has(id))) return previous;
      return Object.fromEntries(
        Object.entries(previous).filter(([id]) => ids.has(id)),
      );
    });

    for (const { sessionId, messageCount } of sessions) {
      if (requests.current.get(sessionId)?.messageCount === messageCount)
        continue;
      const request = { messageCount };
      requests.current.set(sessionId, request);
      setMessages((previous) => {
        if (!(sessionId in previous)) return previous;
        const next = { ...previous };
        delete next[sessionId];
        return next;
      });
      setErrors((previous) => {
        if (!(sessionId in previous)) return previous;
        const next = { ...previous };
        delete next[sessionId];
        return next;
      });
      supportChatService
        .getSessionDetail(sessionId)
        .then((detail) => {
          if (requests.current.get(sessionId) !== request) return;
          if (detail.sessionId !== sessionId)
            throw new Error(
              "Session detail does not match the requested session.",
            );
          setMessages((previous) => ({
            ...previous,
            [sessionId]: detail.messages,
          }));
        })
        .catch((error: unknown) => {
          if (requests.current.get(sessionId) !== request) return;
          requests.current.delete(sessionId);
          setErrors((previous) => ({
            ...previous,
            [sessionId]:
              error instanceof Error
                ? error.message
                : "Failed to load session messages.",
          }));
        });
    }
  }, [sessions]);

  return { messagesBySession, errorsBySession };
}
