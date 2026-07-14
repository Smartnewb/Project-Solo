'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  FormLabel,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Paper,
  IconButton,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useRouter } from 'next/navigation';
import AdminService from '@/app/services/admin';
import type {
  CreateGroupRequest,
  FilteredUser,
  CountryScope,
  GroupType,
  GroupFilterCriteria,
} from '@/app/services/admin';
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

const COUNTRY_SCOPE_OPTIONS: { value: CountryScope; label: string }[] = [
  { value: 'kr', label: 'KR' },
  { value: 'jp', label: 'JP' },
  { value: 'both', label: 'KR+JP' },
];

const GROUP_TYPE_OPTIONS: { value: GroupType; label: string }[] = [
  { value: 'static', label: '정적 (고정 유저 리스트)' },
  { value: 'dynamic', label: '동적 (조건 필터)' },
];

const GENDER_OPTIONS: { value: 'ALL' | 'MALE' | 'FEMALE'; label: string }[] = [
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
    if (!groupId) return;

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
      } catch (error) {
        toast.error(getAdminErrorMessage(error, '그룹 정보를 불러오지 못했습니다.'));
      } finally {
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
    } catch (error) {
      toast.error(getAdminErrorMessage(error, '유저 검색에 실패했습니다.'));
    } finally {
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
    setSelectedByCountry((prev) =>
      prev[c].some((u) => u.id === selected.id) ? prev : { ...prev, [c]: [...prev[c], selected] },
    );
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
    } else {
      const filterCriteria: GroupFilterCriteria = {};
      if (gender !== 'ALL') filterCriteria.gender = gender;
      if (signupDateFrom) filterCriteria.signupDateFrom = new Date(signupDateFrom).toISOString();
      if (signupDateTo) filterCriteria.signupDateTo = new Date(signupDateTo).toISOString();
      body.filterCriteria = filterCriteria;
    }

    setSaving(true);
    try {
      if (groupId) {
        await AdminService.pushGroups.update(groupId, body);
        toast.success('그룹을 수정했습니다.');
      } else {
        await AdminService.pushGroups.create(body);
        toast.success('그룹을 생성했습니다.');
      }
      router.push('/admin/push-groups');
    } catch (error) {
      toast.error(getAdminErrorMessage(error, '그룹 저장에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const activeSelectedList = selectedByCountry[activeCountryTab];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        {isEdit ? '푸시 타겟 그룹 수정' : '푸시 타겟 그룹 생성'}
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          1. 기본 정보
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="그룹명"
            required
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 100))}
            helperText={`${name.length}/100`}
            fullWidth
          />
          <TextField
            label="설명"
            multiline
            minRows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            helperText={`${description.length}/500`}
            fullWidth
          />
          <FormControl>
            <FormLabel>국가 스코프</FormLabel>
            <RadioGroup
              row
              value={countryScope}
              onChange={(e) => setCountryScope(e.target.value as CountryScope)}
            >
              {COUNTRY_SCOPE_OPTIONS.map((opt) => (
                <FormControlLabel key={opt.value} value={opt.value} control={<Radio />} label={opt.label} />
              ))}
            </RadioGroup>
          </FormControl>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          2. 타입
        </Typography>
        <FormControl>
          <RadioGroup row value={type} onChange={(e) => setType(e.target.value as GroupType)}>
            {GROUP_TYPE_OPTIONS.map((opt) => (
              <FormControlLabel key={opt.value} value={opt.value} control={<Radio />} label={opt.label} />
            ))}
          </RadioGroup>
        </FormControl>
        {isEdit && initialType && type !== initialType && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            타입을 변경하면 기존 대상자/조건 데이터의 의미가 달라집니다. 주의하세요.
          </Alert>
        )}
      </Paper>

      {type === 'static' ? (
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            2-A. 정적 대상자
          </Typography>

          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="전화번호"
              size="small"
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value)}
            />
            <TextField
              label="이름"
              size="small"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
            />
            <Button variant="outlined" onClick={handleSearch} disabled={searching}>
              {searching ? <CircularProgress size={20} /> : '검색'}
            </Button>
          </Stack>

          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                검색 결과
              </Typography>
              <List dense sx={{ maxHeight: 360, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                {searchResults.length === 0 && (
                  <ListItem>
                    <ListItemText secondary="검색 결과가 없습니다." />
                  </ListItem>
                )}
                {searchResults.map((user) => (
                  <ListItem
                    key={user.id}
                    secondaryAction={
                      <Button size="small" onClick={() => handleAddUser(user)}>
                        담기
                      </Button>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar src={user.profileImageUrl ?? undefined}>{user.name?.[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${user.name} (${user.gender === 'MALE' ? '남' : '여'})`}
                      secondary={maskPhoneNumber(user.phoneNumber)}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Divider orientation="vertical" flexItem />

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                선택된 유저
              </Typography>
              {countryScope === 'both' && (
                <Tabs
                  value={activeCountryTab}
                  onChange={(_, value) => setActiveCountryTab(value)}
                  sx={{ mb: 1, minHeight: 36 }}
                >
                  <Tab value="kr" label={`KR 담기 (${selectedByCountry.kr.length})`} sx={{ minHeight: 36 }} />
                  <Tab value="jp" label={`JP 담기 (${selectedByCountry.jp.length})`} sx={{ minHeight: 36 }} />
                </Tabs>
              )}
              <List dense sx={{ maxHeight: 360, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                {activeSelectedList.length === 0 && (
                  <ListItem>
                    <ListItemText secondary="선택된 유저가 없습니다." />
                  </ListItem>
                )}
                {activeSelectedList.map((user) => (
                  <ListItem
                    key={user.id}
                    secondaryAction={
                      <IconButton size="small" onClick={() => handleRemoveUser(activeCountryTab, user.id)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar src={user.profileImageUrl ?? undefined}>{user.name?.[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={user.name} secondary={maskPhoneNumber(user.phoneNumber)} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            2-B. 동적 조건
          </Typography>
          <Stack spacing={2}>
            <FormControl>
              <FormLabel>성별</FormLabel>
              <RadioGroup row value={gender} onChange={(e) => setGender(e.target.value as typeof gender)}>
                {GENDER_OPTIONS.map((opt) => (
                  <FormControlLabel key={opt.value} value={opt.value} control={<Radio />} label={opt.label} />
                ))}
              </RadioGroup>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <TextField
                label="가입일 시작"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={signupDateFrom}
                onChange={(e) => setSignupDateFrom(e.target.value)}
              />
              <TextField
                label="가입일 종료"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={signupDateTo}
                onChange={(e) => setSignupDateTo(e.target.value)}
              />
            </Stack>
            <Alert severity="info">
              동적 그룹은 저장 후 상세 화면에서 예상 대상자 수를 확인할 수 있습니다. (저장 전 미리보기는 미지원)
            </Alert>
          </Stack>
        </Paper>
      )}

      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button variant="outlined" onClick={() => router.push('/admin/push-groups')} disabled={saving}>
          취소
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : '저장'}
        </Button>
      </Stack>
    </Box>
  );
}

function toDateInputValue(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}
