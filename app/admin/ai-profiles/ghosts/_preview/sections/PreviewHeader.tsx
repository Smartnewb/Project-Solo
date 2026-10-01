import { Button } from "@heroui/react";
import { Flag, Gem } from "lucide-react";

export function PreviewHeader() {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <Button
        className="text-slate-700"
        aria-label="back"
        isDisabled={true}
        variant={"secondary"}
        size={"md"}
      >
        ←
      </Button>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-full bg-[#ffd1da] px-3 py-1.5 text-xs">
          <Gem className="h-3.5 w-3.5 text-[#7A4AE2]" />
          <span className="text-[9px] font-medium text-[#7A4AE2]">내 구슬</span>
          <span className="text-[13px] font-extrabold text-[#7A4AE2]">0개</span>
        </div>
        <Button
          aria-label="report"
          isDisabled={true}
          variant={"secondary"}
          size={"md"}
        >
          <Flag className="h-5 w-5 text-slate-400" />
        </Button>
      </div>
    </div>
  );
}
