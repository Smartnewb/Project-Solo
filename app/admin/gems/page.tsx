'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import AdminService from '@/app/services/admin';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DiamondIcon from '@mui/icons-material/Diamond';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import AddIcon from '@mui/icons-material/Add';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar
} from '@mui/material';
import axiosServer from '@/utils/axios';

interface UserSearchResult {
  id: string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  phoneNumber?: string;
  profileImageUrl?: string;
  appearanceGrade?: string;
  university?: string | { name: string };
  universityDetails?: { name: string; department?: string };
}

interface BulkGrantResponse {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  errors: Array<{
    identifier: string;
    reason: string;
  }>;
  pushNotificationResult?: {
    pushSuccessCount: number;
    pushFailureCount: number;
  };
}

export default function GemsManagementPage() {
  const [inputMethod, setInputMethod] = useState<'phoneNumbers' | 'csvFile'>('phoneNumbers');
  const [phoneNumbersText, setPhoneNumbersText] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [gemAmount, setGemAmount] = useState<number>(10);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkGrantResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);

  const searchUsers = async () => {
    if (!userSearchTerm.trim()) {
      setUserSearchError('검색어를 입력해주세요.');
      return;
    }

    setUserSearchLoading(true);
    setUserSearchError(null);

    try {
      const response = await axiosServer.get('/admin/users/appearance', {
        params: {
          page: 1,
          limit: 20,
          searchTerm: userSearchTerm
        }
      });

      let results: UserSearchResult[] = [];
      if (response.data?.items && Array.isArray(response.data.items)) {
        results = response.data.items;
      } else if (Array.isArray(response.data)) {
        results = response.data;
      }

      setUserSearchResults(results);
      if (results.length === 0) {
        setUserSearchError(`"${userSearchTerm}" 검색 결과가 없습니다.`);
      }
    } catch (err: any) {
      console.error('사용자 검색 오류:', err);
      setUserSearchError(err.response?.data?.message || '사용자 검색 중 오류가 발생했습니다.');
      setUserSearchResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  };

  const handleAddUserPhone = (user: UserSearchResult) => {
    if (!user.phoneNumber) {
      alert('해당 사용자의 전화번호 정보가 없습니다.');
      return;
    }

    const currentPhones = phoneNumbersText
      .split(/[,\n]/)
      .map(phone => phone.trim())
      .filter(phone => phone.length > 0);

    const normalizedNewPhone = user.phoneNumber.replace(/[\s-]/g, '');
    const isDuplicate = currentPhones.some(
      phone => phone.replace(/[\s-]/g, '') === normalizedNewPhone
    );

    if (isDuplicate) {
      alert('이미 추가된 전화번호입니다.');
      return;
    }

    if (phoneNumbersText.trim()) {
      setPhoneNumbersText(prev => prev + ', ' + user.phoneNumber);
    } else {
      setPhoneNumbersText(user.phoneNumber || '');
    }
  };

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    const cleaned = phoneNumber.replace(/[\s-]/g, '');
    const pattern = /^0\d{9,10}$/;
    return pattern.test(cleaned);
  };

  const formatPhoneNumberForDisplay = (value: string): string => {
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('CSV 파일만 업로드할 수 있습니다.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB 이하만 가능합니다.');
        return;
      }
      setCsvFile(file);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'phoneNumber\n010-1234-5678\n010-9876-5432';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'gem_grant_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitClick = () => {
    if (!gemAmount || gemAmount < 1) {
      alert('구슬 개수는 1개 이상이어야 합니다.');
      return;
    }

    if (!message.trim()) {
      alert('지급 사유 메시지를 입력해주세요.');
      return;
    }

    if (message.length > 200) {
      alert('메시지는 200자 이하로 입력해주세요.');
      return;
    }

    if (inputMethod === 'phoneNumbers' && !phoneNumbersText.trim()) {
      alert('전화번호를 입력해주세요.');
      return;
    }

    if (inputMethod === 'csvFile' && !csvFile) {
      alert('CSV 파일을 업로드해주세요.');
      return;
    }

    // 전화번호 형식 검증
    if (inputMethod === 'phoneNumbers') {
      const phoneNumberArray = phoneNumbersText
        .split(/[,\n]/)
        .map(phone => phone.trim())
        .filter(phone => phone.length > 0);

      const invalidPhones = phoneNumberArray.filter(phone => !validatePhoneNumber(phone));

      if (invalidPhones.length > 0) {
        alert(`유효하지 않은 전화번호가 있습니다:\n${invalidPhones.join('\n')}`);
        return;
      }
    }

    setConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setConfirmDialogOpen(false);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let phoneNumbers: string[] | undefined;

      if (inputMethod === 'phoneNumbers') {
        phoneNumbers = phoneNumbersText
          .split(/[,\n]/)
          .map(phone => phone.trim())
          .filter(phone => phone.length > 0);
      }

      const response = await AdminService.gems.bulkGrant({
        phoneNumbers,
        csvFile: inputMethod === 'csvFile' ? csvFile || undefined : undefined,
        gemAmount,
        message
      });

      setResult(response);

      if (response.failedCount === 0) {
        alert('구슬 지급이 성공적으로 완료되었습니다!');
      } else {
        alert(`구슬 지급이 완료되었습니다.\n성공: ${response.successCount}명, 실패: ${response.failedCount}개`);
      }
    } catch (err: any) {
      console.error('구슬 지급 실패:', err);
      setError(err.response?.data?.message || '구슬 지급 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPhoneNumbersText('');
    setCsvFile(null);
    setGemAmount(10);
    setMessage('');
    setResult(null);
    setError(null);
  };

  const getUserCount = () => {
    if (inputMethod === 'phoneNumbers') {
      return phoneNumbersText
        .split(/[,\n]/)
        .map(phone => phone.trim())
        .filter(phone => phone.length > 0).length;
    } else {
      return csvFile ? '파일' : 0;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <DiamondIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5" fontWeight="bold">
            구슬 일괄 지급
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            여러 사용자에게 동일한 양의 구슬을 지급하고 푸시 알림을 발송합니다.
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend">입력 방식 선택</FormLabel>
          <RadioGroup
            row
            value={inputMethod}
            onChange={(e) => setInputMethod(e.target.value as 'phoneNumbers' | 'csvFile')}
          >
            <FormControlLabel value="phoneNumbers" control={<Radio />} label="전화번호 직접 입력" />
            <FormControlLabel value="csvFile" control={<Radio />} label="CSV 파일 업로드" />
          </RadioGroup>
        </FormControl>

        {inputMethod === 'phoneNumbers' ? (
          <Box sx={{ mb: 3 }}>
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon fontSize="small" />
                사용자 검색으로 추가
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="이름 또는 전화번호로 검색"
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                />
                <Button
                  variant="contained"
                  onClick={searchUsers}
                  disabled={userSearchLoading}
                  sx={{ minWidth: 80 }}
                >
                  {userSearchLoading ? <CircularProgress size={20} /> : '검색'}
                </Button>
              </Box>

              {userSearchError && (
                <Alert severity="info" sx={{ mb: 2 }} onClose={() => setUserSearchError(null)}>
                  {userSearchError}
                </Alert>
              )}

              {userSearchResults.length > 0 && (
                <Paper variant="outlined" sx={{ maxHeight: 250, overflow: 'auto' }}>
                  <List dense disablePadding>
                    {userSearchResults.map((user) => (
                      <ListItem
                        key={user.id}
                        divider
                        secondaryAction={
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => handleAddUserPhone(user)}
                            disabled={!user.phoneNumber}
                          >
                            선택
                          </Button>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar src={user.profileImageUrl} sx={{ width: 36, height: 36 }}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {user.name} ({user.age}세, {user.gender === 'MALE' ? '남' : '여'})
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
                                  sx={{ height: 18, fontSize: '0.65rem' }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              {user.phoneNumber && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <PhoneIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {user.phoneNumber}
                                  </Typography>
                                </Box>
                              )}
                              <Typography variant="caption" color="text.secondary">
                                {user.university
                                  ? (typeof user.university === 'string' ? user.university : user.university.name)
                                  : user.universityDetails?.name || ''}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Paper>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              전화번호
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={5}
              value={phoneNumbersText}
              onChange={(e) => setPhoneNumbersText(e.target.value)}
              placeholder="010-1234-5678, 010-9876-5432, 010-5555-6666"
              helperText="전화번호를 쉼표(,) 또는 줄바꿈으로 구분하여 입력하세요. (0으로 시작하는 10~11자리)"
            />
          </Box>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="subtitle2">CSV 파일 업로드</Typography>
              <Tooltip title="CSV 템플릿 다운로드">
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadTemplate}
                >
                  템플릿 다운로드
                </Button>
              </Tooltip>
            </Box>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              fullWidth
              sx={{ py: 2 }}
            >
              {csvFile ? csvFile.name : 'CSV 파일 선택'}
              <input
                type="file"
                hidden
                accept=".csv,text/csv"
                onChange={handleFileChange}
              />
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              phoneNumber 컬럼이 포함된 CSV 파일을 업로드하세요. (최대 10MB)
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              지급할 구슬 개수
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={gemAmount}
              onChange={(e) => setGemAmount(parseInt(e.target.value) || 0)}
              inputProps={{ min: 1 }}
              placeholder="10"
              required
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            지급 사유 메시지 (푸시 알림으로 발송됨)
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="이벤트 참여 보상"
            inputProps={{ maxLength: 200 }}
            helperText={`${message.length}/200자 | 이 메시지는 사용자에게 푸시 알림으로 전송됩니다.`}
            required
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSubmitClick}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DiamondIcon />}
          >
            {loading ? '처리 중...' : '구슬 지급 및 알림 발송'}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={handleReset}
            disabled={loading}
          >
            초기화
          </Button>
        </Box>
      </Paper>

      {result && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
            처리 결과
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    전체 처리
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {result.totalProcessed}개
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    전화번호
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ borderColor: 'success.main' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="success.main">
                    ✓ 성공
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {result.successCount}명
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    구슬 지급 완료
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ borderColor: 'error.main' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="error.main">
                    ✗ 실패
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {result.failedCount}개
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    전화번호
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {result.pushNotificationResult && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                푸시 알림 발송 결과
              </Typography>
              <Typography variant="body2">
                발송 성공: {result.pushNotificationResult.pushSuccessCount}명 |
                발송 실패: {result.pushNotificationResult.pushFailureCount}명
              </Typography>
              {result.pushNotificationResult.pushFailureCount > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  * 푸시 알림 발송 실패 시에도 구슬 지급은 완료되었습니다.
                </Typography>
              )}
            </Alert>
          )}

          {result.errors.length > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                실패 상세 내역
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>전화번호</TableCell>
                      <TableCell>실패 사유</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.errors.map((error, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatPhoneNumberForDisplay(error.identifier)}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              error.reason === 'Phone number not registered'
                                ? '등록되지 않은 전화번호'
                                : error.reason
                            }
                            size="small"
                            color="error"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Paper>
      )}

      {/* 확인 다이얼로그 */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>구슬 지급 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            다음 내용으로 구슬을 지급하시겠습니까?
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2">
                • 대상: {inputMethod === 'phoneNumbers' ? `${getUserCount()}개 전화번호` : 'CSV 파일'}
              </Typography>
              <Typography variant="body2">
                • 지급 구슬: {gemAmount}개
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                • 푸시 메시지: "{message}"
              </Typography>
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            취소
          </Button>
          <Button onClick={handleConfirmSubmit} variant="contained" color="primary">
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
