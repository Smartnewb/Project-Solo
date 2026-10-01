"use client";
import { Label, Switch } from "@heroui/react";

import { useState } from "react";

interface IncludeDeletedFilterProps {
  value: boolean;
  onChange: (includeDeleted: boolean) => void;
  disabled?: boolean;
  size?: "small" | "medium";
  label?: string;
  labelPlacement?: "start" | "end" | "top" | "bottom";
  sx?: any;
}

export default function IncludeDeletedFilter({
  value,
  onChange,
  disabled = false,
  size = "medium",
  label,
  labelPlacement = "start",
  sx = {},
}: IncludeDeletedFilterProps) {
  const displayLabel = label ?? (value ? "탈퇴자 포함" : "탈퇴자 미포함");

  return (
    <div style={sx}>
      <div className="flex items-center gap-2">
        <Switch isSelected={value} isDisabled={disabled} onChange={onChange}>
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Label>{displayLabel}</Label>
          </Switch.Content>
        </Switch>
      </div>
    </div>
  );
}

// 탈퇴자 포함 여부 상태 관리 훅
export function useIncludeDeletedFilter(initialValue: boolean = false) {
  const [includeDeleted, setIncludeDeleted] = useState<boolean>(initialValue);

  const getIncludeDeletedParam = (): boolean => {
    return includeDeleted;
  };

  return {
    includeDeleted,
    setIncludeDeleted,
    getIncludeDeletedParam,
  };
}

// 탈퇴자 포함 여부 라벨 반환 함수
export function getIncludeDeletedLabel(includeDeleted: boolean): string {
  return includeDeleted ? "탈퇴자 포함" : "탈퇴자 미포함";
}
