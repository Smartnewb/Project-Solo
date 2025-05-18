import React from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Divider,
  Chip,
  Grid,
  Paper
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { UserSearchResult, MatchingResult } from '../types';

interface SingleMatchingProps {
  selectedUser: UserSearchResult | null;
  matchingLoading: boolean;
  matchingResult: MatchingResult | null;
  processSingleMatching: () => void;
}

const SingleMatching: React.FC<SingleMatchingProps> = ({
  selectedUser,
  matchingLoading,
  matchingResult,
  processSingleMatching
}) => {
  return (
    <>
      {/* 선택된 사용자 정보 */}
      {selectedUser && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            선택된 사용자:
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar src={selectedUser.profileImageUrl} sx={{ mr: 2 }}>
                <PersonIcon />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1">
                    {selectedUser.name} ({selectedUser.age}세, {selectedUser.gender === 'MALE' ? '남성' : '여성'})
                  </Typography>
                  {selectedUser.appearanceGrade && (
                    <Chip
                      size="small"
                      label={selectedUser.appearanceGrade}
                      color={
                        selectedUser.appearanceGrade === 'S' ? 'secondary' :
                        selectedUser.appearanceGrade === 'A' ? 'primary' :
                        selectedUser.appearanceGrade === 'B' ? 'success' :
                        selectedUser.appearanceGrade === 'C' ? 'warning' : 'default'
                      }
                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
                <Typography variant="body2" color="textSecondary">
                  {selectedUser.university ? (
                    typeof selectedUser.university === 'string' ?
                      selectedUser.university :
                      selectedUser.university.name
                  ) : selectedUser.universityDetails?.name ?
                    `${selectedUser.universityDetails.name} ${selectedUser.universityDetails.department || ''}` :
                    '대학 정보 없음'}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Button
            variant="contained"
            color="primary"
            onClick={processSingleMatching}
            disabled={matchingLoading}
            sx={{ mt: 2 }}
            fullWidth
          >
            {matchingLoading ? <CircularProgress size={24} /> : '매칭 실행'}
          </Button>
        </Paper>
      )}

      {/* 매칭 결과 */}
      {matchingResult && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            매칭 결과
          </Typography>
          {matchingResult.success ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                매칭 성공! 유사도: {(matchingResult.similarity * 100).toFixed(1)}%
              </Alert>
              <Grid container spacing={3}>
                {/* 요청자 정보 */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        요청자 정보
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          src={matchingResult.requester.profileImages?.find(img => img.isMain)?.url}
                          sx={{ width: 64, height: 64, mr: 2 }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body1">
                            {matchingResult.requester.name} ({matchingResult.requester.age}세)
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {matchingResult.requester.gender === 'MALE' ? '남성' : '여성'}
                            {matchingResult.requester.rank && ` • ${matchingResult.requester.rank}등급`}
                            {matchingResult.requester.mbti && ` • ${matchingResult.requester.mbti}`}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="body2">
                        {matchingResult.requester.universityDetails?.name} {matchingResult.requester.universityDetails?.department}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {matchingResult.requester.universityDetails?.grade} {matchingResult.requester.universityDetails?.studentNumber}
                      </Typography>

                      {/* 선호 조건 */}
                      {matchingResult.requester.preferences && matchingResult.requester.preferences.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            선호 조건:
                          </Typography>
                          {matchingResult.requester.preferences.map((pref, index) => (
                            <Box key={index} sx={{ mb: 1 }}>
                              <Typography variant="body2" color="textSecondary">
                                {pref.typeName}:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {pref.selectedOptions.map(option => (
                                  <Chip
                                    key={option.id}
                                    label={option.displayName}
                                    size="small"
                                    sx={{ mb: 0.5 }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* 매칭 상대 정보 */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        매칭 상대 정보
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          src={matchingResult.partner.profileImages?.find(img => img.isMain)?.url}
                          sx={{ width: 64, height: 64, mr: 2 }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body1">
                            {matchingResult.partner.name} ({matchingResult.partner.age}세)
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {matchingResult.partner.gender === 'MALE' ? '남성' : '여성'}
                            {matchingResult.partner.rank && ` • ${matchingResult.partner.rank}등급`}
                            {matchingResult.partner.mbti && ` • ${matchingResult.partner.mbti}`}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="body2">
                        {matchingResult.partner.universityDetails?.name} {matchingResult.partner.universityDetails?.department}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {matchingResult.partner.universityDetails?.grade} {matchingResult.partner.universityDetails?.studentNumber}
                      </Typography>

                      {/* 선호 조건 */}
                      {matchingResult.partner.preferences && matchingResult.partner.preferences.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            선호 조건:
                          </Typography>
                          {matchingResult.partner.preferences.map((pref, index) => (
                            <Box key={index} sx={{ mb: 1 }}>
                              <Typography variant="body2" color="textSecondary">
                                {pref.typeName}:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {pref.selectedOptions.map(option => (
                                  <Chip
                                    key={option.id}
                                    label={option.displayName}
                                    size="small"
                                    sx={{ mb: 0.5 }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          ) : (
            <Alert severity="error">
              매칭 실패: {matchingResult.success === false ? '적합한 매칭 상대를 찾을 수 없습니다.' : '알 수 없는 오류가 발생했습니다.'}
            </Alert>
          )}
        </Box>
      )}
    </>
  );
};

export default SingleMatching;
