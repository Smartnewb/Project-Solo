import { DraftEditorClient } from './draft-editor-client';

export default async function DraftEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DraftEditorClient draftId={id} />;
}
