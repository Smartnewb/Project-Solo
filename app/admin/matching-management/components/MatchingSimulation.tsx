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
  Chip,
  Grid,
  Paper,
  Slider,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { UserSearchResult, MatchingSimulationResult } from '../types';

interface MatchingSimulationProps {
  selectedUser: UserSearchResult | null;
  simulationLoading: boolean;
  simulationResult: MatchingSimulationResult | null;
  matchLimit: number;
  selectedPartnerIndex: number | null;
  setMatchLimit: (value: number) => void;
  runMatchingSimulation: () => void;
  handlePartnerSelect: (index: number) => void;
}

const MatchingSimulation: React.FC<MatchingSimulationProps> = ({
  selectedUser,
  simulationLoading,
  simulationResult,
  matchLimit,
  selectedPartnerIndex,
  setMatchLimit,
  runMatchingSimulation,
  handlePartnerSelect
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

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              매칭 결과 수 제한 (1-20):
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Slider
                value={matchLimit}
                onChange={(_, newValue) => setMatchLimit(newValue as number)}
                min={1}
                max={20}
                step={1}
                valueLabelDisplay="auto"
                sx={{ mr: 2, flexGrow: 1 }}
              />
              <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
                {matchLimit}명
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={runMatchingSimulation}
              disabled={simulationLoading}
              fullWidth
            >
              {simulationLoading ? <CircularProgress size={24} /> : '매칭 시뮬레이션 실행'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* 매칭 시뮬레이션 결과 */}
      {simulationResult && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            매칭 시뮬레이션 결과
          </Typography>

          {simulationResult.success ? (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                {simulationResult.message}
              </Alert>

              {/* 선택된 매칭 상대 (최적 매칭 또는 사용자가 선택한 매칭) */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1">
                    {selectedPartnerIndex === null ? '최적 매칭 상대:' : `선택한 매칭 상대 (#${selectedPartnerIndex + 1}):`}
                  </Typography>
                  {selectedPartnerIndex !== null && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handlePartnerSelect(-1)} // -1을 전달하여 null로 설정
                    >
                      최적 매칭 상대로 돌아가기
                    </Button>
                  )}
                </Box>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      {/* 선택된 파트너 정보 표시 */}
                      {(() => {
                        // 표시할 파트너 정보 결정
                        const partnerInfo = selectedPartnerIndex !== null && simulationResult.potentialPartners[selectedPartnerIndex]
                          ? simulationResult.potentialPartners[selectedPartnerIndex]
                          : simulationResult.selectedPartner;

                        return (
                          <>
                            <Avatar
                              src={partnerInfo.profile.profileImages?.find(img => img.isMain)?.url}
                              sx={{ width: 80, height: 80, mr: 2 }}
                            >
                              <PersonIcon />
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6">
                                  {partnerInfo.profile.name}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={partnerInfo.profile.rank}
                                  color={
                                    partnerInfo.profile.rank === 'S' ? 'secondary' :
                                    partnerInfo.profile.rank === 'A' ? 'primary' :
                                    partnerInfo.profile.rank === 'B' ? 'success' :
                                    partnerInfo.profile.rank === 'C' ? 'warning' : 'default'
                                  }
                                  sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                />
                                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                                  <Typography variant="body2" fontWeight="bold" color="primary">
                                    유사도: {(partnerInfo.similarity * 100).toFixed(1)}%
                                  </Typography>
                                </Box>
                              </Box>

                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {partnerInfo.profile.age}세 / {partnerInfo.profile.gender === 'MALE' ? '남성' : '여성'}
                                {partnerInfo.profile.mbti && ` • ${partnerInfo.profile.mbti}`}
                              </Typography>

                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {partnerInfo.profile.universityDetails?.name} {partnerInfo.profile.universityDetails?.department}
                                {partnerInfo.profile.universityDetails?.grade && ` • ${partnerInfo.profile.universityDetails?.grade}`}
                                {partnerInfo.profile.universityDetails?.studentNumber && ` • ${partnerInfo.profile.universityDetails?.studentNumber}`}
                              </Typography>

                              {/* 선호 조건 */}
                              {partnerInfo.profile.preferences && partnerInfo.profile.preferences.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    선호 조건:
                                  </Typography>
                                  <Grid container spacing={1}>
                                    {partnerInfo.profile.preferences.map((pref, index) => (
                                      <Grid item xs={12} sm={6} key={index}>
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
                                      </Grid>
                                    ))}
                                  </Grid>
                                </Box>
                              )}
                            </Box>
                          </>
                        );
                      })()}
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              {/* 잠재적 매칭 상대 목록 */}
              {simulationResult.potentialPartners && simulationResult.potentialPartners.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    잠재적 매칭 상대 목록:
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell>순위</TableCell>
                          <TableCell>프로필</TableCell>
                          <TableCell>이름</TableCell>
                          <TableCell>나이/성별</TableCell>
                          <TableCell>대학교</TableCell>
                          <TableCell>유사도</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {simulationResult.potentialPartners.map((partner, index) => (
                          <TableRow
                            key={partner.profile.id}
                            hover
                            onClick={() => handlePartnerSelect(index)}
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: selectedPartnerIndex === index ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                            }}
                          >
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <Avatar src={partner.profile.profileImages?.find(img => img.isMain)?.url}>
                                <PersonIcon />
                              </Avatar>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {partner.profile.name}
                                {partner.profile.rank && (
                                  <Chip
                                    size="small"
                                    label={partner.profile.rank}
                                    color={
                                      partner.profile.rank === 'S' ? 'secondary' :
                                      partner.profile.rank === 'A' ? 'primary' :
                                      partner.profile.rank === 'B' ? 'success' :
                                      partner.profile.rank === 'C' ? 'warning' : 'default'
                                    }
                                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>{partner.profile.age}세 / {partner.profile.gender === 'MALE' ? '남성' : '여성'}</TableCell>
                            <TableCell>{partner.profile.universityDetails?.name || '정보 없음'}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                  sx={{
                                    width: 60,
                                    bgcolor: 'grey.300',
                                    mr: 1,
                                    borderRadius: 1,
                                    position: 'relative'
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: `${partner.similarity * 100}%`,
                                      height: 8,
                                      bgcolor: partner.similarity > 0.7 ? 'success.main' : partner.similarity > 0.5 ? 'primary.main' : 'warning.main',
                                      borderRadius: 1
                                    }}
                                  />
                                </Box>
                                <Typography variant="body2">
                                  {(partner.similarity * 100).toFixed(1)}%
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </>
          ) : (
            <Alert severity="warning">
              {simulationResult.message || '매칭 가능한 사용자를 찾을 수 없습니다.'}
            </Alert>
          )}
        </Box>
      )}
    </>
  );
};

export default MatchingSimulation;
