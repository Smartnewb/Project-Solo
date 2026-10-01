'use client';

import { Button, Chip } from '@heroui/react';
import type { GhostChatConnectionState } from '@/app/types/ghost-chat';

interface GhostChatStatusBarProps {
  pendingCount:number; activeCount:number; idleCount:number; closedCount:number;
  connectionState:GhostChatConnectionState; lastEventAt:string|null; onReconnect:()=>void;
}
const connectionLabels:Record<GhostChatConnectionState,string>={connected:'실시간 연결됨',connecting:'연결 중',reconnecting:'재연결 중',closed:'연결 종료',error:'연결 오류'};
const connectionColors:Record<GhostChatConnectionState,'success'|'accent'|'warning'|'default'|'danger'>={connected:'success',connecting:'accent',reconnecting:'warning',closed:'default',error:'danger'};

export default function GhostChatStatusBar({pendingCount,activeCount,idleCount,closedCount,connectionState,lastEventAt,onReconnect}:GhostChatStatusBarProps){
  return <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"><div><h1 className="text-lg font-bold">Ghost Chat Control Room</h1><p className="text-xs text-gray-600">마지막 이벤트 {lastEventAt ? new Date(lastEventAt).toLocaleTimeString('ko-KR'):'없음'}</p></div>
    <div className="flex flex-wrap items-center gap-2">{[['대기',pendingCount],['진행',activeCount],['응답 없음',idleCount],['종료',closedCount]].map(([label,value])=><Chip key={label} size="sm" variant="soft">{label} {value}</Chip>)}<span role="status"><Chip size="sm" variant="soft" color={connectionColors[connectionState]}>{connectionLabels[connectionState]}</Chip></span>{connectionState!=='connected' && <Button size="sm" variant="secondary" onPress={onReconnect}>재연결</Button>}</div>
  </header>;
}
