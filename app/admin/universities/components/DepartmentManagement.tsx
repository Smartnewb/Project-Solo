import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AdminService from '@/app/services/admin';
import DepartmentCsvUpload from './DepartmentCsvUpload';
import type {
  UniversityDetail,
  DepartmentItem,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
} from '@/types/admin';

interface DepartmentManagementProps {
  university: UniversityDetail;
  onChanged: () => void;
}

interface FormData {
  name: string;
  code: string;
  nameEn: string;
  displayOrder: number;
  isActive: boolean;
}

export default function DepartmentManagement({ university, onChanged }: DepartmentManagementProps) {
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [csvUploadOpen, setCsvUploadOpen] = useState(false);
  const [editDepartment, setEditDepartment] = useState<DepartmentItem | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    nameEn: '',
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    loadDepartments();
  }, [university.id]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await AdminService.universities.departments.getList(university.id, {
        limit: 200,
        sortBy: 'displayOrder',
        sortOrder: 'asc',
      });
      setDepartments(data.items);
    } catch (err) {
      console.error('학과 목록 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditDepartment(null);
    setFormData({
      name: '',
      code: '',
      nameEn: '',
      displayOrder: departments.length,
      isActive: true,
    });
    setFormDialogOpen(true);
  };

  const handleEdit = (department: DepartmentItem) => {
    setEditDepartment(department);
    setFormData({
      name: department.name,
      code: department.code || '',
      nameEn: department.nameEn || '',
      displayOrder: department.displayOrder,
      isActive: department.isActive,
    });
    setFormDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 학과를 삭제하시겠습니까?')) return;

    try {
      await AdminService.universities.departments.delete(university.id, id);
      loadDepartments();
      onChanged();
    } catch (err: any) {
      alert(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      alert('학과명을 입력해주세요.');
      return;
    }

    try {
      if (editDepartment) {
        const updateData: UpdateDepartmentRequest = {};
        if (formData.name !== editDepartment.name) updateData.name = formData.name;
        if (formData.code !== (editDepartment.code || ''))
          updateData.code = formData.code || undefined;
        if (formData.nameEn !== (editDepartment.nameEn || ''))
          updateData.nameEn = formData.nameEn || undefined;
        if (formData.displayOrder !== editDepartment.displayOrder)
          updateData.displayOrder = formData.displayOrder;
        if (formData.isActive !== editDepartment.isActive) updateData.isActive = formData.isActive;

        await AdminService.universities.departments.update(
          university.id,
          editDepartment.id,
          updateData
        );
      } else {
        const createData: CreateDepartmentRequest = {
          name: formData.name,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
        };
        if (formData.code) createData.code = formData.code;
        if (formData.nameEn) createData.nameEn = formData.nameEn;

        await AdminService.universities.departments.create(university.id, createData);
      }

      setFormDialogOpen(false);
      loadDepartments();
      onChanged();
    } catch (err: any) {
      alert(err.response?.data?.message || '저장에 실패했습니다.');
    }
  };

  const handleCsvUploadSuccess = () => {
    setCsvUploadOpen(false);
    loadDepartments();
    onChanged();
  };

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Chip label={`총 ${departments.length}개`} size="small" />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            size="small"
            onClick={() => setCsvUploadOpen(true)}
          >
            CSV 업로드
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={handleAddClick}>
            학과 추가
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : departments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          등록된 학과가 없습니다.
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell width={50}>순서</TableCell>
                <TableCell>학과명</TableCell>
                <TableCell width={100}>코드</TableCell>
                <TableCell width={80} align="center">활성화</TableCell>
                <TableCell width={100} align="center">관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id} hover>
                  <TableCell>{dept.displayOrder}</TableCell>
                  <TableCell>
                    <Box>
                      <Box>{dept.name}</Box>
                      {dept.nameEn && (
                        <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          {dept.nameEn}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {dept.code ? (
                      <Chip label={dept.code} size="small" variant="outlined" />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={dept.isActive ? '활성' : '비활성'}
                      size="small"
                      color={dept.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="수정">
                        <IconButton size="small" onClick={() => handleEdit(dept)} color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="삭제">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(dept.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editDepartment ? '학과 수정' : '학과 추가'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="학과명"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="영문 학과명"
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              fullWidth
            />

            <TextField
              label="학과 코드"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              fullWidth
            />

            <TextField
              label="정렬 순서"
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="활성화"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormDialogOpen(false)}>취소</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editDepartment ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      <DepartmentCsvUpload
        open={csvUploadOpen}
        onClose={() => setCsvUploadOpen(false)}
        universityId={university.id}
        universityName={university.name}
        onSuccess={handleCsvUploadSuccess}
      />
    </Box>
  );
}
