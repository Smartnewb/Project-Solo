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
import { Region } from '@/components/admin/common/RegionFilter';

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

// 지역 옵션 (클러스터 기반)
const REGION_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: '모든 지역' },
  { value: 'DJN', label: '대전/공주 클러스터' },
  { value: 'SJG', label: '청주/세종 클러스터' },
  { value: 'CAN', label: '천안 클러스터' },
  { value: 'BSN', label: '부산/김해 클러스터' },
  { value: 'ICN', label: '인천/서울/경기 클러스터' },
  { value: 'DGU', label: '대구' }
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

interface AppearanceFilterPanelProps {
  onFilter?: (filters: {
    gender?: Gender;
    appearanceGrade?: AppearanceGrade;
    universityName?: string;
    minAge?: number;
    maxAge?: number;
    searchTerm?: string;
    region?: string;
    isLongTermInactive?: boolean;
    hasPreferences?: boolean;
  }) => void;
}

export default function AppearanceFilterPanel({ onFilter }: AppearanceFilterPanelProps) {
  const [gender, setGender] = useState<Gender | 'all'>('all');
  const [appearanceGrade, setAppearanceGrade] = useState<AppearanceGrade | 'all'>('all');
  const [universityName, setUniversityName] = useState('');
  const [minAge, setMinAge] = useState<number | ''>('');
  const [maxAge, setMaxAge] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [isLongTermInactive, setIsLongTermInactive] = useState<string>('all');
  const [hasPreferences, setHasPreferences] = useState<string>('all');
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

  // 지역 클러스터 변환 함수
  const getClusterRegion = (region: string): string => {
    // 대전/공주 클러스터 → DJN으로 전송 (백엔드에서 DJN+GJJ 처리)
    if (region === 'DJN') return 'DJN';

    // 청주/세종 클러스터 → SJG로 전송 (백엔드에서 SJG+CJU 처리)
    if (region === 'SJG') return 'SJG';

    // 천안 클러스터 → CAN으로 전송
    if (region === 'CAN') return 'CAN';

    // 부산/김해 클러스터 → BSN으로 전송 (백엔드에서 BSN+GHE 처리)
    if (region === 'BSN') return 'BSN';

    // 인천/서울/경기 클러스터 → ICN으로 전송 (백엔드에서 ICN+SEL+KYG 처리)
    if (region === 'ICN') return 'ICN';

    // 대구는 단독
    return region;
  };

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
      if (selectedRegion !== 'all') filters.region = getClusterRegion(selectedRegion);
      if (isLongTermInactive !== 'all') filters.isLongTermInactive = isLongTermInactive === 'true';
      if (hasPreferences !== 'all') filters.hasPreferences = hasPreferences === 'true';

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
    setSelectedRegion('all');
    setIsLongTermInactive('all');
    setHasPreferences('all');

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
              onChange={(e) => setSearchTerm(e.target.value)}
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
            <TextField
              select
              fullWidth
              label="지역"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              {REGION_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
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
