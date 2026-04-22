import { DraftEditorClient } from './draft-editor-client';

export default function DraftEditorPage({
  params,
}: {
  params: { id: string };
}) {
  return <DraftEditorClient draftId={params.id} />;
}
