"use client";
import UnclassifiedUsersPanel from "@/components/admin/appearance/UnclassifiedUsersPanel";

export default function UnapprovedUsersPage() {
  return (
    <div>
      <div className={"text-lg font-semibold text-neutral-900"}>
        미승인 유저
      </div>
      <UnclassifiedUsersPanel
        title="등급 미분류 미승인 유저"
        description="아직 등급이 정리되지 않은 유저를 한 화면에서 확인하고, 등급 설정과 승인 처리를 진행합니다."
        initialViewMode="table"
      />
    </div>
  );
}
