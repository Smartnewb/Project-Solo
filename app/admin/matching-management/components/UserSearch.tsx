import React from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { UserSearchResult } from '../types';

interface UserSearchProps {
  searchTerm: string;
  searchLoading: boolean;
  error: string | null;
  searchResults: UserSearchResult[];
  selectedUser: UserSearchResult | null;
  setSearchTerm: (value: string) => void;
  searchUsers: () => void;
  handleUserSelect: (user: UserSearchResult) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({
  searchTerm,
  searchLoading,
  error,
  searchResults,
  selectedUser,
  setSearchTerm,
  searchUsers,
  handleUserSelect
}) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          label="사용자 이름 검색"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mr: 2, flexGrow: 1 }}
        />
        <Button
          variant="contained"
          onClick={searchUsers}
          disabled={searchLoading}
        >
          {searchLoading ? <CircularProgress size={24} /> : '검색'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 검색 결과 목록 */}
      {searchResults.length > 0 ? (
        <Paper variant="outlined" sx={{ mb: 3, maxHeight: 300, overflow: 'auto' }}>
          <List>
            {searchResults.map((user) => (
              <ListItem
                key={user.id}
                sx={{ cursor: 'pointer', bgcolor: selectedUser?.id === user.id ? 'action.selected' : undefined }}
                onClick={() => handleUserSelect(user)}
              >
                <ListItemAvatar>
                  <Avatar src={user.profileImageUrl}>
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography component="span">
                        {user.name} ({user.age}세, {user.gender === 'MALE' ? '남성' : '여성'})
                      </Typography>
                      {user.appearanceGrade && (
                        <Chip
                          size="small"
                          label={user.appearanceGrade}
                          color={
                            user.appearanceGrade === 'S' ? 'secondary' :
                            user.appearanceGrade === 'A' ? 'primary' :
                            user.appearanceGrade === 'B' ? 'success' :
                            user.appearanceGrade === 'C' ? 'warning' : 'default'
                          }
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    // 대학교 정보 표시 (여러 필드 구조 지원)
                    user.university ? (
                      typeof user.university === 'string' ? user.university : user.university.name
                    ) : user.universityDetails?.name ?
                      `${user.universityDetails.name} ${user.universityDetails.department || ''}` :
                      '대학 정보 없음'
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      ) : (
        // 검색 결과가 없을 때 표시할 내용
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            검색 결과가 없습니다.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            다른 이름으로 검색해보세요.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default UserSearch;
