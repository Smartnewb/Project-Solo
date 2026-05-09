'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import AdminService from '@/app/services/admin';
import UniversityTable from './components/UniversityTable';
import UniversityFormDialog from './components/UniversityFormDialog';
import UniversityDetailDialog from './components/UniversityDetailDialog';
import type {
  UniversityItem,
  UniversityListParams,
  RegionMetaItem,
  TypeMetaItem,
  UniversityType,
} from '@/types/admin';

type TabValue = 'all' | 'active' | 'inactive';
type LogoSortValue = 'default' | 'missingFirst';

const PAGE_SIZE = 20;
const BULK_FETCH_SIZE = 100;

function hasLogo(university: UniversityItem) {
  return Boolean(university.logoUrl?.trim());
}

function sortUniversitiesByLogo(items: UniversityItem[], logoSort: LogoSortValue) {
  if (logoSort !== 'missingFirst') return items;

  return [...items].sort((a, b) => {
    const logoDiff = Number(hasLogo(a)) - Number(hasLogo(b));
    if (logoDiff !== 0) return logoDiff;
    return a.name.localeCompare(b.name, 'ko');
  });
}

function UniversitiesPageContent() {

  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [tabValue, setTabValue] = useState<TabValue>('all');
  const [searchName, setSearchName] = useState('');
  const [filterRegion, setFilterRegion] = useState<string>('');
  const [filterType, setFilterType] = useState<UniversityType | ''>('');
  const [logoSort, setLogoSort] = useState<LogoSortValue>('default');

  const [regions, setRegions] = useState<RegionMetaItem[]>([]);
  const [types, setTypes] = useState<TypeMetaItem[]>([]);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editUniversity, setEditUniversity] = useState<UniversityItem | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityItem | null>(null);

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    loadUniversities();
  }, [page, tabValue, searchName, filterRegion, filterType, logoSort]);

  const loadMetadata = async () => {
    try {
      const [regionsData, typesData] = await Promise.all([
        AdminService.universities.meta.getRegions(),
        AdminService.universities.meta.getTypes(),
      ]);
      setRegions(regionsData);
      setTypes(typesData);
    } catch (err: any) {
    }
  };

  const loadUniversities = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params: UniversityListParams = {
        page,
        limit: PAGE_SIZE,
      };

      if (searchName) params.name = searchName;
      if (filterRegion) params.region = filterRegion;
      if (filterType) params.type = filterType;
      if (tabValue !== 'all') {
        params.isActive = tabValue === 'active';
      }

      if (logoSort === 'missingFirst') {
        const firstPage = await AdminService.universities.getList({
          ...params,
          page: 1,
          limit: BULK_FETCH_SIZE,
        });
        const bulkTotalPages = firstPage.meta.totalPages;
        const restPages = bulkTotalPages > 1
          ? await Promise.all(
            Array.from({ length: bulkTotalPages - 1 }, (_, index) =>
              AdminService.universities.getList({
                ...params,
                page: index + 2,
                limit: BULK_FETCH_SIZE,
              }),
            ),
          )
          : [];
        const allItems = [firstPage, ...restPages].flatMap((data) => data.items);
        const sortedItems = sortUniversitiesByLogo(allItems, logoSort);
        const start = (page - 1) * PAGE_SIZE;

        setUniversities(sortedItems.slice(start, start + PAGE_SIZE));
        setTotalPages(Math.max(1, Math.ceil(firstPage.meta.total / PAGE_SIZE)));
        setTotalCount(firstPage.meta.total);
        return;
      }

      const data = await AdminService.universities.getList(params);
      setUniversities(sortUniversitiesByLogo(data.items, logoSort));
      setTotalPages(data.meta.totalPages);
      setTotalCount(data.meta.total);
    } catch (err: any) {
      setError(err.message || '대학 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, tabValue, searchName, filterRegion, filterType, logoSort]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
    setTabValue(newValue);
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    loadUniversities();
  };

  const handleReset = () => {
    setSearchName('');
    setFilterRegion('');
    setFilterType('');
    setLogoSort('default');
    setPage(1);
  };

  const handleAddClick = () => {
    setEditUniversity(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (university: UniversityItem) => {
    setEditUniversity(university);
    setFormDialogOpen(true);
  };

  const handleViewDetail = (university: UniversityItem) => {
    setSelectedUniversity(university);
    setDetailDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 대학을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      await AdminService.universities.delete(id);
      loadUniversities();
    } catch (err: any) {
      alert(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await AdminService.universities.update(id, { isActive });
      loadUniversities();
    } catch (err: any) {
      alert(err.response?.data?.message || '상태 변경에 실패했습니다.');
    }
  };

  const handleFormSubmit = async () => {
    setFormDialogOpen(false);
    loadUniversities();
  };

  const handleFormClose = () => {
    setFormDialogOpen(false);
    setEditUniversity(null);
  };

  const handleDetailClose = () => {
    setDetailDialogOpen(false);
    setSelectedUniversity(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            대학 관리
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            전체 {totalCount}개
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick}>
          대학 등록
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="전체" value="all" />
        <Tab label="활성" value="active" />
        <Tab label="비활성" value="inactive" />
      </Tabs>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <TextField
          label="대학명 검색"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          sx={{ minWidth: 250 }}
          size="small"
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>지역</InputLabel>
          <Select
            value={filterRegion}
            label="지역"
            onChange={(e) => setFilterRegion(e.target.value)}
          >
            <MenuItem value="">전체</MenuItem>
            {regions.map((region) => (
              <MenuItem key={region.code} value={region.code}>
                {region.nameLocal}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>대학 유형</InputLabel>
          <Select
            value={filterType}
            label="대학 유형"
            onChange={(e) => {
              setFilterType(e.target.value as UniversityType | '');
              setPage(1);
            }}
          >
            <MenuItem value="">전체</MenuItem>
            {types.map((type) => (
              <MenuItem key={type.code} value={type.code}>
                {type.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>로고 정렬</InputLabel>
          <Select
            value={logoSort}
            label="로고 정렬"
            onChange={(e) => {
              setLogoSort(e.target.value as LogoSortValue);
              setPage(1);
            }}
          >
            <MenuItem value="default">기본</MenuItem>
            <MenuItem value="missingFirst">로고 없는 순</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch}>
          검색
        </Button>

        <Button variant="outlined" onClick={handleReset}>
          초기화
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : universities.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">등록된 대학이 없습니다.</Typography>
        </Box>
      ) : (
        <UniversityTable
          universities={universities}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          onViewDetail={handleViewDetail}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      <UniversityFormDialog
        open={formDialogOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        editUniversity={editUniversity}
        regions={regions}
        types={types}
      />

      {selectedUniversity && (
        <UniversityDetailDialog
          open={detailDialogOpen}
          onClose={handleDetailClose}
          university={selectedUniversity}
          onRefresh={loadUniversities}
        />
      )}
    </Box>
  );
}

export default function UniversitiesV2() {
  return <UniversitiesPageContent />;
}
