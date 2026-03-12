import { AdminShell } from '@/shared/ui/admin/admin-shell';
import { isAdminShellV2Enabled } from '@/shared/feature-flags';

import LegacyAdminLayout from './legacy-layout';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shellV2 = await isAdminShellV2Enabled();

  if (!shellV2) {
    return <LegacyAdminLayout>{children}</LegacyAdminLayout>;
  }

  return <AdminShell>{children}</AdminShell>;
}
