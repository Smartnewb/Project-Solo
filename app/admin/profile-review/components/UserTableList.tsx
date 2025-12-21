import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  TablePagination,
  Tooltip
} from '@mui/material';
import { PendingUser } from '../page';
import { format } from 'date-fns';

interface UserTableListProps {
  users: PendingUser[];
  selectedUser: PendingUser | null;
  onUserSelect: (user: PendingUser) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  onPageChange: (page: number) => void;
}

const getRankConfig = (rank?: string) => {
  const configs = {
    S: { label: 'S', color: '#9c27b0', bgColor: '#f3e5f5', tooltip: '최상위 등급' },
    A: { label: 'A', color: '#2196f3', bgColor: '#e3f2fd', tooltip: '상위 등급' },
    B: { label: 'B', color: '#4caf50', bgColor: '#e8f5e9', tooltip: '중위 등급' },
    C: { label: 'C', color: '#ff9800', bgColor: '#fff3e0', tooltip: '하위 등급' },
    UNKNOWN: { label: '미분류', color: '#9e9e9e', bgColor: '#f5f5f5', tooltip: '등급 미정' }
  };

  return configs[rank as keyof typeof configs] || configs.UNKNOWN;
};

const RankBadge = ({ rank }: { rank?: string }) => {
  const config = getRankConfig(rank);

  return (
    <Tooltip title={config.tooltip}>
      <Chip
        label={config.label}
        size="small"
        sx={{
          backgroundColor: config.bgColor,
          color: config.color,
          fontWeight: 'bold',
          minWidth: 60
        }}
      />
    </Tooltip>
  );
};

export default function UserTableList({ users, selectedUser, onUserSelect, pagination, onPageChange }: UserTableListProps) {
  if (users.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          심사 대기 중인 사용자가 없습니다.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell>이름</TableCell>
            <TableCell>나이/성별</TableCell>
            <TableCell align="center">Rank</TableCell>
            <TableCell>대학교</TableCell>
            <TableCell>학과</TableCell>
            <TableCell align="center">사진 수</TableCell>
            <TableCell>MBTI</TableCell>
            <TableCell align="center">최초심사</TableCell>
            <TableCell>등록일시</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              hover
              onClick={() => onUserSelect(user)}
              sx={{
                cursor: 'pointer',
                backgroundColor: selectedUser?.id === user.id ? '#e3f2fd' : 'inherit',
                '&:hover': {
                  backgroundColor: selectedUser?.id === user.id ? '#bbdefb' : '#f5f5f5',
                }
              }}
            >
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {user.name}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                  {user.age}세 · {user.gender === 'male' ? '남' : user.gender === 'female' ? '여' : '-'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <RankBadge rank={user.rank} />
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                  {user.universityName || '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                  {user.department || '-'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={`${(user.pendingImages?.length || 0)}장`}
                  size="small"
                  sx={{
                    backgroundColor: '#fff3e0',
                    color: '#e65100',
                    fontWeight: 'bold'
                  }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {user.mbti || '-'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={user.approved ? '아니오' : '예'}
                  size="small"
                  color={user.approved ? 'default' : 'warning'}
                  sx={{
                    fontWeight: 600,
                    minWidth: 50
                  }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm')}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={pagination.total}
        page={pagination.page - 1}
        onPageChange={(event, newPage) => onPageChange(newPage + 1)}
        rowsPerPage={pagination.limit}
        rowsPerPageOptions={[20]}
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 총 ${count}명`}
        labelRowsPerPage="페이지당 행 수:"
      />
    </TableContainer>
  );
}
