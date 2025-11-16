'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  InputAdornment,
  IconButton,
  Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import { AppearanceGrade, Gender } from '@/app/admin/users/appearance/types';
import RegionFilter, { Region, useRegionFilter } from '@/components/admin/common/RegionFilter';

// 등급 옵션
const GRADE_OPTIONS: { value: AppearanceGrade | 'all'; label: string }[] = [
  { value: 'all', label: '모든 등급' },
  { value: 'S', label: 'S등급' },
  { value: 'A', label: 'A등급' },
  { value: 'B', label: 'B등급' },
  { value: 'C', label: 'C등급' },
  { value: 'UNKNOWN', label: '미분류' } // 백엔드 API에서 사용하는 값과 일치
];

// 성별 옵션
const GENDER_OPTIONS: { value: Gender | 'all'; label: string }[] = [
  { value: 'all', label: '모든 성별' },
  { value: 'MALE', label: '남성' },
  { value: 'FEMALE', label: '여성' }
];



// 장기 미접속자 옵션
const LONG_TERM_INACTIVE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: '모든 사용자' },
  { value: 'true', label: '장기 미접속자만' },
  { value: 'false', label: '정상 사용자만' }
];

// 프로필 정보 입력 여부 옵션
const HAS_PREFERENCES_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: '모든 사용자' },
  { value: 'true', label: '프로필 입력 완료' },
  { value: 'false', label: '프로필 미입력' }
];

// 탈퇴자 포함 여부 옵션
const INCLUDE_DELETED_OPTIONS: { value: string; label: string }[] = [
  { value: 'false', label: '활성 사용자만' },
  { value: 'true', label: '탈퇴자 포함' }
];

interface AppearanceFilterPanelProps {
  onFilter?: (filters: {
    gender?: Gender;
    appearanceGrade?: AppearanceGrade;
    universityName?: string;
    minAge?: number;
    maxAge?: number;
    searchTerm?: string;
    region?: string;
    useCluster?: boolean;
    isLongTermInactive?: boolean;
    hasPreferences?: boolean;
    includeDeleted?: boolean;
  }) => void;
}

export default function AppearanceFilterPanel({ onFilter }: AppearanceFilterPanelProps) {
  const [gender, setGender] = useState<Gender | 'all'>('all');
  const [appearanceGrade, setAppearanceGrade] = useState<AppearanceGrade | 'all'>('all');
  const [universityName, setUniversityName] = useState('');
  const [minAge, setMinAge] = useState<number | ''>('');
  const [maxAge, setMaxAge] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLongTermInactive, setIsLongTermInactive] = useState<string>('all');
  const [hasPreferences, setHasPreferences] = useState<string>('all');
  const [includeDeleted, setIncludeDeleted] = useState<string>('false');
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    }
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleSearchTermChange = (value: string) => {
    const numbersOnly = value.replace(/[^0-9]/g, '');
    if (numbersOnly.length > 0 && value.replace(/[^0-9-]/g, '') === value) {
      setSearchTerm(formatPhoneNumber(value));
    } else {
      setSearchTerm(value);
    }
  };

  // 지역 필터 훅 사용
  const {
    region,
    useCluster,
    setRegion,
    setUseCluster,
    getRegionParam,
    getUseClusterParam
  } = useRegionFilter();

  // 필터 적용
  const applyFilter = () => {
    if (onFilter) {
      const filters: any = {};

      if (gender !== 'all') filters.gender = gender;
      if (appearanceGrade !== 'all') filters.appearanceGrade = appearanceGrade;
      if (universityName) filters.universityName = universityName;
      if (minAge !== '') filters.minAge = minAge;
      if (maxAge !== '') filters.maxAge = maxAge;
      if (searchTerm) filters.searchTerm = searchTerm;

      // 지역 필터 적용
      const regionParam = getRegionParam();
      if (regionParam) filters.region = regionParam;
      filters.useCluster = getUseClusterParam();

      if (isLongTermInactive !== 'all') filters.isLongTermInactive = isLongTermInactive === 'true';
      if (hasPreferences !== 'all') filters.hasPreferences = hasPreferences === 'true';
      filters.includeDeleted = includeDeleted === 'true';

      onFilter(filters);
    }
  };

  // 필터 초기화
  const resetFilter = () => {
    setGender('all');
    setAppearanceGrade('all');
    setUniversityName('');
    setMinAge('');
    setMaxAge('');
    setSearchTerm('');
    setRegion('ALL'); // 지역 필터 초기화
    setIsLongTermInactive('all');
    setHasPreferences('all');
    setIncludeDeleted('false');

    if (onFilter) {
      onFilter({});
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">사용자 필터</Typography>
          <Button
            startIcon={<FilterListIcon />}
            onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
          >
            {isAdvancedFilterOpen ? '간단한 필터' : '고급 필터'}
          </Button>
        </Box>

        <Grid container spacing={2}>
          {/* 기본 필터 */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="검색어"
              placeholder="이름, 인스타그램, 전화번호로 검색"
              value={searchTerm}
              onChange={(e) => handleSearchTermChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyFilter();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="외모 등급"
              value={appearanceGrade}
              onChange={(e) => setAppearanceGrade(e.target.value as AppearanceGrade | 'all')}
            >
              {GRADE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="휴먼유저"
              value={isLongTermInactive}
              onChange={(e) => setIsLongTermInactive(e.target.value)}
            >
              {LONG_TERM_INACTIVE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="프로필 정보"
              value={hasPreferences}
              onChange={(e) => setHasPreferences(e.target.value)}
            >
              {HAS_PREFERENCES_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="성별"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender | 'all')}
            >
              {GENDER_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <RegionFilter
              value={region}
              onChange={setRegion}
              useCluster={useCluster}
              onClusterModeChange={setUseCluster}
              showClusterToggle={false}
              size="small"
              fullWidth
            />
          </Grid>

          {/* 고급 필터 */}
          {isAdvancedFilterOpen && (
            <>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="대학교"
                  placeholder="대학교 이름"
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="최소 나이"
                  type="number"
                  value={minAge}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Number(e.target.value);
                    setMinAge(value);
                  }}
                  InputProps={{ inputProps: { min: 18 } }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="최대 나이"
                  type="number"
                  value={maxAge}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Number(e.target.value);
                    setMaxAge(value);
                  }}
                  InputProps={{ inputProps: { min: 18 } }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="탈퇴자 포함 여부"
                  value={includeDeleted}
                  onChange={(e) => setIncludeDeleted(e.target.value)}
                >
                  {INCLUDE_DELETED_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </>
          )}
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={resetFilter}
            sx={{ mr: 1 }}
          >
            초기화
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={applyFilter}
          >
            필터 적용
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
