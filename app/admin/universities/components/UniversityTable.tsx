import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Avatar,
  Box,
  Pagination,
  Tooltip,
  Switch,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SchoolIcon from '@mui/icons-material/School';
import type { UniversityItem } from '@/types/admin';

interface UniversityTableProps {
  universities: UniversityItem[];
  onEdit: (university: UniversityItem) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onViewDetail: (university: UniversityItem) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function UniversityTable({
  universities,
  onEdit,
  onDelete,
  onToggleActive,
  onViewDetail,
  page,
  totalPages,
  onPageChange,
}: UniversityTableProps) {
  const getTypeLabel = (type: string) => {
    return type === 'UNIVERSITY' ? '4년제' : '전문대';
  };

  const getTypeColor = (type: string) => {
    return type === 'UNIVERSITY' ? 'primary' : 'secondary';
  };

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell width={60}>로고</TableCell>
              <TableCell>대학명</TableCell>
              <TableCell width={100}>코드</TableCell>
              <TableCell width={120}>지역</TableCell>
              <TableCell width={100}>유형</TableCell>
              <TableCell width={120}>설립</TableCell>
              <TableCell width={80} align="center">학과수</TableCell>
              <TableCell width={100} align="center">활성화</TableCell>
              <TableCell width={150} align="center">관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {universities.map((university) => (
              <TableRow key={university.id} hover>
                <TableCell>
                  {university.logoUrl ? (
                    <Avatar
                      src={university.logoUrl}
                      alt={university.name}
                      sx={{ width: 40, height: 40 }}
                    />
                  ) : (
                    <Avatar sx={{ width: 40, height: 40, bgcolor: 'grey.300' }}>
                      <SchoolIcon fontSize="small" />
                    </Avatar>
                  )}
                </TableCell>
                <TableCell>
                  <Box>
                    <Box sx={{ fontWeight: 500 }}>{university.name}</Box>
                    {university.en && (
                      <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}>
                        {university.en}
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  {university.code ? (
                    <Chip label={university.code} size="small" variant="outlined" />
                  ) : (
                    <Box sx={{ color: 'text.secondary' }}>-</Box>
                  )}
                </TableCell>
                <TableCell>
                  {university.regionName || university.region}
                </TableCell>
                <TableCell>
                  <Chip
                    label={getTypeLabel(university.type)}
                    size="small"
                    color={getTypeColor(university.type)}
                  />
                </TableCell>
                <TableCell>
                  {university.foundation || '-'}
                </TableCell>
                <TableCell align="center">
                  <Chip label={university.departmentCount || 0} size="small" />
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={university.isActive}
                    onChange={(e) => onToggleActive(university.id, e.target.checked)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    <Tooltip title="상세 보기">
                      <IconButton
                        size="small"
                        onClick={() => onViewDetail(university)}
                        color="info"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="수정">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(university)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="삭제">
                      <IconButton
                        size="small"
                        onClick={() => onDelete(university.id)}
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

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => onPageChange(value)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
}
