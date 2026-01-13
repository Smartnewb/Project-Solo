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

export default function UniversitiesPage() {
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
  }, [page, tabValue, searchName, filterRegion, filterType]);

  const loadMetadata = async () => {
    try {
      const [regionsData, typesData] = await Promise.all([
        AdminService.universities.meta.getRegions(),
        AdminService.universities.meta.getTypes(),
      ]);
      setRegions(regionsData);
      setTypes(typesData);
    } catch (err: any) {
      console.error('메타데이터 로드 실패:', err);
    }
  };

  const loadUniversities = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params: UniversityListParams = {
        page,
        limit: 20,
      };

      if (searchName) params.name = searchName;
      if (filterRegion) params.region = filterRegion;
      if (filterType) params.type = filterType;
      if (tabValue !== 'all') {
        params.isActive = tabValue === 'active';
      }

      const data = await AdminService.universities.getList(params);
      setUniversities(data.items);
      setTotalPages(data.meta.totalPages);
      setTotalCount(data.meta.total);
    } catch (err: any) {
      setError(err.message || '대학 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, tabValue, searchName, filterRegion, filterType]);

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
            onChange={(e) => setFilterType(e.target.value as UniversityType | '')}
          >
            <MenuItem value="">전체</MenuItem>
            {types.map((type) => (
              <MenuItem key={type.code} value={type.code}>
                {type.name}
              </MenuItem>
            ))}
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
