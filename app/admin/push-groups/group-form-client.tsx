'use client';
import { Button, Spinner, Tabs, TextField, Label, Input, TextArea, Description, Select, ListBox } from '@heroui/react';
import { X as CloseIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminService from '@/app/services/admin';
import type { CreateGroupRequest, FilteredUser, CountryScope, GroupType, GroupFilterCriteria, } from '@/app/services/admin';
import { countriesForScope } from '@/app/services/admin';
import { useToast } from '@/shared/ui/admin/toast';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { maskPhoneNumber } from '@/app/utils/formatters';
interface GroupFormClientProps {
    groupId?: string;
}
interface SelectedUser {
    id: string;
    name: string;
    phoneNumber: string | null;
    profileImageUrl?: string | null;
}
type Country = 'kr' | 'jp';
const COUNTRY_SCOPE_OPTIONS: {
    value: CountryScope;
    label: string;
}[] = [
    { value: 'kr', label: 'KR' },
    { value: 'jp', label: 'JP' },
    { value: 'both', label: 'KR+JP' },
];
const GROUP_TYPE_OPTIONS: {
    value: GroupType;
    label: string;
}[] = [
    { value: 'static', label: '정적 (고정 유저 리스트)' },
    { value: 'dynamic', label: '동적 (조건 필터)' },
];
const GENDER_OPTIONS: {
    value: 'ALL' | 'MALE' | 'FEMALE';
    label: string;
}[] = [
    { value: 'ALL', label: '전체' },
    { value: 'MALE', label: '남' },
    { value: 'FEMALE', label: '여' },
];
export default function GroupFormClient({ groupId }: GroupFormClientProps) {
    const router = useRouter();
    const toast = useToast();
    const isEdit = Boolean(groupId);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    // Step 1
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [countryScope, setCountryScope] = useState<CountryScope>('kr');
    // Step 2
    const [type, setType] = useState<GroupType>('static');
    const [initialType, setInitialType] = useState<GroupType | null>(null);
    // Step 2-A static
    const [phoneQuery, setPhoneQuery] = useState('');
    const [nameQuery, setNameQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FilteredUser[]>([]);
    const [searching, setSearching] = useState(false);
    const [activeCountryTab, setActiveCountryTab] = useState<Country>('kr');
    const [selectedByCountry, setSelectedByCountry] = useState<Record<Country, SelectedUser[]>>({
        kr: [],
        jp: [],
    });
    // Step 2-B dynamic
    const [gender, setGender] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
    const [signupDateFrom, setSignupDateFrom] = useState('');
    const [signupDateTo, setSignupDateTo] = useState('');
    useEffect(() => {
        if (countryScope !== 'both') {
            setActiveCountryTab(countryScope);
        }
    }, [countryScope]);
    useEffect(() => {
        if (!groupId)
            return;
        (async () => {
            try {
                // ponytail: fetch group + members concurrently instead of waterfalling;
                // members() is safe to call unconditionally, backend returns {kr:[],jp:[]} for dynamic groups
                const [group, members] = await Promise.all([
                    AdminService.pushGroups.get(groupId),
                    AdminService.pushGroups.members(groupId),
                ]);
                setName(group.name);
                setDescription(group.description ?? '');
                setCountryScope(group.countryScope);
                setType(group.type);
                setInitialType(group.type);
                setActiveCountryTab(group.countryScope === 'jp' ? 'jp' : 'kr');
                if (group.filterCriteria) {
                    setGender(group.filterCriteria.gender ?? 'ALL');
                    setSignupDateFrom(toDateInputValue(group.filterCriteria.signupDateFrom));
                    setSignupDateTo(toDateInputValue(group.filterCriteria.signupDateTo));
                }
                if (group.type === 'static') {
                    setSelectedByCountry({
                        kr: members.kr.map((m) => ({ id: m.id, name: m.name, phoneNumber: m.phoneNumber })),
                        jp: members.jp.map((m) => ({ id: m.id, name: m.name, phoneNumber: m.phoneNumber })),
                    });
                }
            }
            catch (error) {
                toast.error(getAdminErrorMessage(error, '그룹 정보를 불러오지 못했습니다.'));
            }
            finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId]);
    const handleSearch = async () => {
        setSearching(true);
        try {
            const result = await AdminService.pushGroups.filterUsers({
                phoneNumber: phoneQuery.trim() || undefined,
                name: nameQuery.trim() || undefined,
            });
            setSearchResults(result.users);
        }
        catch (error) {
            toast.error(getAdminErrorMessage(error, '유저 검색에 실패했습니다.'));
        }
        finally {
            setSearching(false);
        }
    };
    const handleAddUser = (user: FilteredUser) => {
        const selected: SelectedUser = {
            id: user.id,
            name: user.name,
            phoneNumber: user.phoneNumber,
            profileImageUrl: user.profileImageUrl,
        };
        const c = activeCountryTab;
        setSelectedByCountry((prev) => prev[c].some((u) => u.id === selected.id) ? prev : { ...prev, [c]: [...prev[c], selected] });
    };
    const handleRemoveUser = (country: Country, userId: string) => {
        setSelectedByCountry((prev) => ({
            ...prev,
            [country]: prev[country].filter((u) => u.id !== userId),
        }));
    };
    const scopeCountries = countriesForScope(countryScope);
    const showKrList = scopeCountries.includes('kr');
    const showJpList = scopeCountries.includes('jp');
    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('그룹명을 입력해주세요.');
            return;
        }
        const body: CreateGroupRequest = {
            name: name.trim(),
            description: description.trim() || undefined,
            countryScope,
            type,
        };
        if (type === 'static') {
            const krIds = showKrList ? selectedByCountry.kr.map((u) => u.id) : [];
            const jpIds = showJpList ? selectedByCountry.jp.map((u) => u.id) : [];
            if (krIds.length === 0 && jpIds.length === 0) {
                toast.error('정적 그룹은 최소 1명의 유저가 필요합니다.');
                return;
            }
            body.staticUserIds = {
                ...(krIds.length > 0 ? { kr: krIds } : {}),
                ...(jpIds.length > 0 ? { jp: jpIds } : {}),
            };
        }
        else {
            const filterCriteria: GroupFilterCriteria = {};
            if (gender !== 'ALL')
                filterCriteria.gender = gender;
            if (signupDateFrom)
                filterCriteria.signupDateFrom = new Date(signupDateFrom).toISOString();
            if (signupDateTo)
                filterCriteria.signupDateTo = new Date(signupDateTo).toISOString();
            body.filterCriteria = filterCriteria;
        }
        setSaving(true);
        try {
            if (groupId) {
                await AdminService.pushGroups.update(groupId, body);
                toast.success('그룹을 수정했습니다.');
            }
            else {
                await AdminService.pushGroups.create(body);
                toast.success('그룹을 생성했습니다.');
            }
            router.push('/admin/push-groups');
        }
        catch (error) {
            toast.error(getAdminErrorMessage(error, '그룹 저장에 실패했습니다.'));
        }
        finally {
            setSaving(false);
        }
    };
    const activeSelectedList = selectedByCountry[activeCountryTab];
    if (loading) {
        return (<div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 48 }}>
        <Spinner size="sm"></Spinner>
      </div>);
    }
    return (<div style={{ maxWidth: 960 }}>
      <h1 style={{ marginBottom: 24 }} className="text-2xl font-bold">
        {isEdit ? '푸시 타겟 그룹 수정' : '푸시 타겟 그룹 생성'}
      </h1>

      <section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
        <p style={{ marginBottom: 16 }}>
          1. 기본 정보
        </p>
        <div>
          <TextField isRequired={true} className="mb-4"><Label>{"그룹명"}</Label><Input required value={name} onChange={(e) => setName(e.target.value.slice(0, 100))}></Input><Description>{`${name.length}/100`}</Description></TextField>
          <TextField className="mb-4"><Label>{"설명"}</Label><TextArea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))}></TextArea><Description>{`${description.length}/500`}</Description></TextField>
          <div>
            <label>국가 스코프</label>
            <Select aria-label="국가 범위" value={countryScope} onChange={(key) => {
            const value = String(key ?? "");
            setCountryScope(value as CountryScope);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
              {COUNTRY_SCOPE_OPTIONS.map((opt) => (<ListBox.Item key={opt.value} id={opt.value} textValue={String(opt.label)}>{opt.label}</ListBox.Item>))}
            </ListBox></Select.Popover></Select>
          </div>
        </div>
      </section>

      <section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
        <p style={{ marginBottom: 16 }}>
          2. 타입
        </p>
        <div>
          <Select aria-label="그룹 타입" value={type} onChange={(key) => {
            const value = String(key ?? "");
            setType(value as GroupType);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
            {GROUP_TYPE_OPTIONS.map((opt) => (<ListBox.Item key={opt.value} id={opt.value} textValue={String(opt.label)}>{opt.label}</ListBox.Item>))}
          </ListBox></Select.Popover></Select>
        </div>
        {isEdit && initialType && type !== initialType && (<aside role="alert" className="rounded-lg border p-3" style={{ marginTop: 16 }}>
            타입을 변경하면 기존 대상자/조건 데이터의 의미가 달라집니다. 주의하세요.
          </aside>)}
      </section>

      {type === 'static' ? (<section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
          <p style={{ marginBottom: 16 }}>
            2-A. 정적 대상자
          </p>

          <div style={{ marginBottom: 16 }}>
            <TextField className="mb-4"><Label>{"전화번호"}</Label><Input value={phoneQuery} onChange={(e) => setPhoneQuery(e.target.value)}></Input></TextField>
            <TextField className="mb-4"><Label>{"이름"}</Label><Input value={nameQuery} onChange={(e) => setNameQuery(e.target.value)}></Input></TextField>
            <Button onPress={handleSearch} isDisabled={searching} variant="secondary">
              {searching ? <Spinner size="sm"></Spinner> : '검색'}
            </Button>
          </div>

          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ marginBottom: 8 }}>
                검색 결과
              </p>
              <ul style={{ maxHeight: 360, overflowY: 'auto', border: '1px solid', borderRadius: 1 }}>
                {searchResults.length === 0 && (<li>
                    <div><small>{"검색 결과가 없습니다."}</small></div>
                  </li>)}
                {searchResults.map((user) => (<li key={user.id}>
                    <span>
                      <img src={user.profileImageUrl ?? undefined} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
                    </span>
                    <div><p>{`${user.name} (${user.gender === 'MALE' ? '남' : '여'})`}</p><small>{maskPhoneNumber(user.phoneNumber)}</small></div>
                  {<Button onPress={() => handleAddUser(user)} variant="tertiary">
                        담기
                      </Button>}</li>))}
              </ul>
            </div>

            <hr></hr>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ marginBottom: 8 }}>
                선택된 유저
              </p>
              {countryScope === 'both' && (<Tabs style={{ marginBottom: 8, minHeight: 36 }} selectedKey={activeCountryTab} onSelectionChange={value => setActiveCountryTab(String(value) as Country)}><Tabs.List aria-label="관리 항목">
                  <Tabs.Tab style={{ minHeight: 36 }} id={"kr"}>{`KR 담기 (${selectedByCountry.kr.length})`}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
                  <Tabs.Tab style={{ minHeight: 36 }} id={"jp"}>{`JP 담기 (${selectedByCountry.jp.length})`}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
                </Tabs.List></Tabs>)}
              <ul style={{ maxHeight: 360, overflowY: 'auto', border: '1px solid', borderRadius: 1 }}>
                {activeSelectedList.length === 0 && (<li>
                    <div><small>{"선택된 유저가 없습니다."}</small></div>
                  </li>)}
                {activeSelectedList.map((user) => (<li key={user.id}>
                    <span>
                      <img src={user.profileImageUrl ?? undefined} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
                    </span>
                    <div><p>{user.name}</p><small>{maskPhoneNumber(user.phoneNumber)}</small></div>
                  {<Button aria-label="선택된 유저 제거" onPress={() => handleRemoveUser(activeCountryTab, user.id)} variant="tertiary" isIconOnly={true}>
                        <CloseIcon></CloseIcon>
                      </Button>}</li>))}
              </ul>
            </div>
          </div>
        </section>) : (<section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
          <p style={{ marginBottom: 16 }}>
            2-B. 동적 조건
          </p>
          <div>
            <div>
              <label>성별</label>
              <Select aria-label="성별" value={gender} onChange={(key) => {
                const value = String(key ?? "");
                setGender(value as typeof gender);
            }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                {GENDER_OPTIONS.map((opt) => (<ListBox.Item key={opt.value} id={opt.value} textValue={String(opt.label)}>{opt.label}</ListBox.Item>))}
              </ListBox></Select.Popover></Select>
            </div>
            <div>
              <TextField className="mb-4"><Label>{"가입일 시작"}</Label><Input type="date" value={signupDateFrom} onChange={(e) => setSignupDateFrom(e.target.value)}></Input></TextField>
              <TextField className="mb-4"><Label>{"가입일 종료"}</Label><Input type="date" value={signupDateTo} onChange={(e) => setSignupDateTo(e.target.value)}></Input></TextField>
            </div>
            <aside role="alert" className="rounded-lg border p-3">
              동적 그룹은 저장 후 상세 화면에서 예상 대상자 수를 확인할 수 있습니다. (저장 전 미리보기는 미지원)
            </aside>
          </div>
        </section>)}

      <div>
        <Button onPress={() => router.push('/admin/push-groups')} isDisabled={saving} variant="secondary">
          취소
        </Button>
        <Button onPress={handleSave} isDisabled={saving} variant="primary">
          {saving ? <Spinner size="sm" style={{ color: 'white' }}></Spinner> : '저장'}
        </Button>
      </div>
    </div>);
}
function toDateInputValue(iso?: string): string {
    if (!iso)
        return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime()))
        return '';
    return date.toISOString().slice(0, 10);
}
