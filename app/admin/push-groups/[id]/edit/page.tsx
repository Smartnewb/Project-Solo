import GroupFormClient from '../../group-form-client';

export default async function EditPushGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GroupFormClient groupId={id} />;
}
