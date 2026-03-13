import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import AIChatManagementPageLegacy from './ai-chat-legacy';
import AIChatManagementPageV2 from './ai-chat-v2';

export default async function AIChatManagementPagePage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('ai-chat');

  if (shellV2 && mode === 'v2') {
    return <AIChatManagementPageV2 />;
  }

  return <AIChatManagementPageLegacy />;
}
