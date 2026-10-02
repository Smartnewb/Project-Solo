"use client";
import { useState } from "react";
import { User as UserIcon } from "lucide-react";

// The reports API (solo-nestjs-api admin/v2/reports) does not return a profile image
// field, so the URL is usually empty. Show a neutral icon instead of a broken <img>.
export function ReportAvatar({ src }: { src?: string | null }) {
    const [failed, setFailed] = useState(false);
    if (!src || failed) {
        return (<span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400" role="img" aria-label="프로필 이미지 없음">
        <UserIcon size={18} aria-hidden="true"></UserIcon>
      </span>);
    }
    return <img src={src} alt="프로필" loading="lazy" onError={() => setFailed(true)} className="h-9 w-9 shrink-0 rounded-full object-cover"></img>;
}
