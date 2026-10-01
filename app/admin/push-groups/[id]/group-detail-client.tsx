'use client';
import { Button, Spinner, Chip } from '@heroui/react';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminService from '@/app/services/admin';
import type { PushTargetGroup, GroupMembers, GroupPreview, Gender, } from '@/app/services/admin';
import { GROUP_TYPE_LABEL, COUNTRY_SCOPE_LABEL, countriesForScope, } from '@/app/services/admin';
import { useToast } from '@/shared/ui/admin/toast';
import { safeToLocaleDateString, maskPhoneNumber } from '@/app/utils/formatters';
const GENDER_LABEL: Record<Gender, string> = {
    MALE: '남',
    FEMALE: '여',
};
export default function GroupDetailClient() {
    const router = useRouter();
    const params = useParams();
    const toast = useToast();
    const id = String(params.id);
    const [group, setGroup] = useState<PushTargetGroup | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [members, setMembers] = useState<GroupMembers | null>(null);
    const [membersLoading, setMembersLoading] = useState(false);
    const [preview, setPreview] = useState<GroupPreview | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(false);
        setMembersLoading(true);
        // ponytail: fire group + members concurrently instead of waterfalling;
        // members() is safe to call unconditionally, backend returns {kr:[],jp:[]} for dynamic groups
        AdminService.pushGroups
            .get(id)
            .then((data) => {
            if (!cancelled)
                setGroup(data);
        })
            .catch(() => {
            if (!cancelled)
                setError(true);
        })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        AdminService.pushGroups
            .members(id)
            .then((data) => {
            if (!cancelled)
                setMembers(data);
        })
            .catch(() => {
            if (!cancelled)
                toast.error('그룹 유저 목록을 불러오지 못했습니다.');
        })
            .finally(() => {
            if (!cancelled)
                setMembersLoading(false);
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);
    const handlePreview = async () => {
        setPreviewLoading(true);
        try {
            const result = await AdminService.pushGroups.preview(id);
            setPreview(result);
        }
        catch (error) {
            toast.error('대상자 수를 확인하지 못했습니다.');
        }
        finally {
            setPreviewLoading(false);
        }
    };
    if (loading) {
        return (<div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 48 }}>
        <Spinner size="sm"></Spinner>
      </div>);
    }
    if (error || !group) {
        return (<div style={{ paddingBlock: 32 }}>
        <p>그룹 정보를 불러오지 못했습니다.</p>
        <Button onPress={() => router.push('/admin/push-groups')} variant="tertiary" style={{ marginTop: 16 }}>
          목록으로
        </Button>
      </div>);
    }
    const countries = countriesForScope(group.countryScope);
    const showKr = countries.includes('kr');
    const showJp = countries.includes('jp');
    return (<div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <h1 className="text-2xl font-bold">
          {group.name}
        </h1>
        <div>
          <Button onPress={() => router.push('/admin/push-groups')} variant="secondary">
            목록
          </Button>
          <Button onPress={() => router.push(`/admin/push-groups/${id}/edit`)} variant="secondary">
            수정
          </Button>
          <Button onPress={() => router.push(`/admin/broadcast-push/new?groupId=${id}`)} variant="primary">
            이 그룹으로 예약발송
          </Button>
        </div>
      </div>

      <section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
        <p style={{ marginBottom: 16 }}>
          기본정보
        </p>
        <div>
          <Row label="그룹명" value={group.name}></Row>
          <Row label="설명" value={group.description ?? '-'}></Row>
          <Row label="국가스코프" value={COUNTRY_SCOPE_LABEL[group.countryScope]}></Row>
          <Row label="타입" value={<Chip size="sm">{GROUP_TYPE_LABEL[group.type]}</Chip>}></Row>
          <Row label="생성일" value={safeToLocaleDateString(group.createdAt)}></Row>
          <Row label="생성자" value={group.createdBy ?? '-'}></Row>
        </div>
      </section>

      {group.type === 'static' ? (<section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
          <p style={{ marginBottom: 16 }}>
            담긴 유저
          </p>
          {membersLoading ? (<div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 16 }}>
              <Spinner size="sm"></Spinner>
            </div>) : (<div>
              {showKr && (<MemberList title="KR" members={members?.kr ?? []}></MemberList>)}
              {showJp && (<MemberList title="JP" members={members?.jp ?? []}></MemberList>)}
            </div>)}
        </section>) : (<section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
          <p style={{ marginBottom: 16 }}>
            필터 조건
          </p>
          <div>
            <Row label="성별" value={group.filterCriteria?.gender ? GENDER_LABEL[group.filterCriteria.gender] : '전체'}></Row>
            <Row label="가입일 범위" value={group.filterCriteria?.signupDateFrom || group.filterCriteria?.signupDateTo
                ? `${safeToLocaleDateString(group.filterCriteria?.signupDateFrom)} ~ ${safeToLocaleDateString(group.filterCriteria?.signupDateTo)}`
                : '제한없음'}></Row>
          </div>
        </section>)}

      <section style={{ padding: 24 }} className="rounded-xl border bg-white p-4">
        <p style={{ marginBottom: 16 }}>
          대상자 수 확인
        </p>
        <Button onPress={handlePreview} isDisabled={previewLoading} variant="secondary">
          {previewLoading ? <Spinner size="sm"></Spinner> : '대상자 수 확인'}
        </Button>
        {preview && (<div style={{ marginTop: 16 }}>
            <p>KR: {preview.kr.toLocaleString()}명</p>
            <p>JP: {preview.jp.toLocaleString()}명</p>
            <p>
              합계: {preview.total.toLocaleString()}명
            </p>
          </div>)}
      </section>
    </div>);
}
function Row({ label, value }: {
    label: string;
    value: React.ReactNode;
}) {
    return (<div style={{ display: 'flex', gap: 16 }}>
      <p style={{ width: 120, flexShrink: 0 }}>
        {label}
      </p>
      <p>{value}</p>
    </div>);
}
function MemberList({ title, members, }: {
    title: string;
    members: {
        id: string;
        name: string;
        phoneNumber: string | null;
    }[];
}) {
    return (<div>
      <p style={{ marginBottom: 8 }}>
        {title} ({members.length}명)
      </p>
      {members.length === 0 ? (<p>
          대상 유저가 없습니다.
        </p>) : (<section className="rounded-xl border bg-white p-4">
          <ul>
            {members.map((member, index) => (<div key={member.id}>
                {index > 0 && <hr></hr>}
                <li>
                  <div><p>{member.name}</p><small>{maskPhoneNumber(member.phoneNumber)}</small></div>
                </li>
              </div>))}
          </ul>
        </section>)}
    </div>);
}
