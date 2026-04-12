import { AdminShell } from '@/shared/ui/admin/admin-shell';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        // 어드민에서는 accent(hover 배경)를 slate 계열로 오버라이드
        // 유저 앱의 핑크(#FD79A8) accent가 어드민 버튼 hover에 적용되는 것을 방지
        '--color-accent': '#f1f5f9',
      } as React.CSSProperties}
    >
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
