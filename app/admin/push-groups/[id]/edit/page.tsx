import GroupFormClient from '../../group-form-client';

export default function EditPushGroupPage({ params }: { params: { id: string } }) {
  return <GroupFormClient groupId={params.id} />;
}
