import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import SupportChatLegacy from './support-chat-legacy';
import SupportChatV2 from './support-chat-v2';

export default async function SupportChatPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('support-chat');

  if (shellV2 && mode === 'v2') {
    return <SupportChatV2 />;
  }

  return <SupportChatLegacy />;
}
