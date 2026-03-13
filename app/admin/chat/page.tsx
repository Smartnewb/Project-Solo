import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import ChatLegacy from './chat-legacy';
import ChatV2 from './chat-v2';

export default async function ChatPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('chat');

  if (shellV2 && mode === 'v2') {
    return <ChatV2 />;
  }

  return <ChatLegacy />;
}
