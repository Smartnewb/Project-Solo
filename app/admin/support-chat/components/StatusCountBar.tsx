"use client";
import { Chip } from "@heroui/react";
import {
  Headset as SupportAgentIcon,
  Clock as PendingIcon,
  Handshake as HandshakeIcon,
  CircleCheck as CheckCircleIcon,
} from "lucide-react";

interface StatusCountBarProps {
  waitingCount: number;
  handlingCount: number;
  resolvedCount: number;
}

const pulseKeyframes = {
  "@keyframes pulse": {
    "0%": { transform: "scale(1)" },
    "50%": { transform: "scale(1.08)" },
    "100%": { transform: "scale(1)" },
  },
};

export default function StatusCountBar({
  waitingCount,
  handlingCount,
  resolvedCount,
}: StatusCountBarProps) {
  return (
    <div
      style={{
        flexWrap: "wrap",
        gap: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <h5
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontWeight: 700,
        }}
      >
        <SupportAgentIcon size={16} />
        Q&A 처리
      </h5>
      <div style={{ display: "flex", gap: 12 }}>
        <Chip size="sm">
          {<PendingIcon size={16} />}
          {`대기 ${waitingCount}`}
        </Chip>
        <Chip size="sm">
          {<HandshakeIcon size={16} />}
          {`응대 ${handlingCount}`}
        </Chip>
        <Chip size="sm">
          {<CheckCircleIcon size={16} />}
          {`해결 ${resolvedCount}`}
        </Chip>
      </div>
    </div>
  );
}
