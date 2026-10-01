'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SupportMessage } from '@/app/types/support-chat';

const STORAGE_KEY = 'support-chat:user-read-state:v1';
const CHANGE_EVENT = 'support-chat:user-read-state-changed';
type ReadMarker = { id: string; createdAt: string };
type ReadMap = Record<string, ReadMarker>;
let memory: ReadMap = {};

function load(): ReadMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, marker]) =>
      marker && typeof marker.id === 'string' && typeof marker.createdAt === 'string'
    ));
  } catch {
    return memory;
  }
}

function latestUser(messages: SupportMessage[]) {
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index].senderType === 'user') return messages[index];
  }
  return undefined;
}

function isNewer(message: ReadMarker, seen: ReadMarker) {
  const difference = Date.parse(message.createdAt) - Date.parse(seen.createdAt);
  return difference > 0 || (difference === 0 && message.id !== seen.id);
}

/** Tracks only the latest viewed user reply, independently of admin/bot activity. */
export function useReadState() {
  const [readMap, setReadMap] = useState<ReadMap>({});

  useEffect(() => {
    const sync = () => { memory = load(); setReadMap(memory); };
    const onChange = (event: Event) => {
      memory = (event as CustomEvent<ReadMap>).detail;
      setReadMap(memory);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) sync();
    };
    sync();
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const markRead = useCallback((sessionId: string, messages: SupportMessage[]) => {
    const latest = latestUser(messages);
    if (!latest) return;
    const current = load();
    const seen = current[sessionId];
    if (seen && !isNewer(latest, seen)) return;
    memory = { ...current, [sessionId]: { id: latest.id, createdAt: latest.createdAt } };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    } catch {
      // Keep same-window read state usable when browser storage is unavailable.
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: memory }));
  }, []);

  const isUnread = useCallback((sessionId: string, messages: SupportMessage[]) => {
    const latest = latestUser(messages);
    if (!latest) return false;
    const seen = readMap[sessionId];
    return !seen || isNewer(latest, seen);
  }, [readMap]);

  return { isUnread, markRead };
}
