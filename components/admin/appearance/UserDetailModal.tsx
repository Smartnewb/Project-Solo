import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Grid,
  Avatar,
  Chip,
  Divider,
  Link,
  CircularProgress,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InstagramIcon from '@mui/icons-material/Instagram';
import SchoolIcon from '@mui/icons-material/School';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import ImageIcon from '@mui/icons-material/Image';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/Warning';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import AdminService from '@/app/services/admin';
import { format, formatDistance } from 'date-fns';
import { ko } from 'date-fns/locale';

// 관리 기능 모달 컴포넌트들
import AccountStatusModal from './modals/AccountStatusModal';
import WarningMessageModal from './modals/WarningMessageModal';
import ProfileUpdateRequestModal from './modals/ProfileUpdateRequestModal';
import EditProfileModal from './modals/EditProfileModal';

// 성별 레이블
const GENDER_LABELS = {
  MALE: '남성',
  FEMALE: '여성'
};

// 유저 상세 정보 타입
export interface UserDetail {
  id: string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  profileImages?: {
    id: string;
    order: number;
    isMain: boolean;
    url: string;
  }[];
  profileImageUrl?: string;
  phoneNumber?: string;
  instagramId?: string;
  instagramUrl?: string;
  universityDetails?: {
    name: string;
    authentication: boolean;
    department: string;
    grade: string;
    studentNumber: string;
  };
  university?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
  lastActiveAt?: string | null;
  appearanceGrade?: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN';
  accountStatus?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  // 추가 필드
  [key: string]: any;
}

interface UserDetailModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  userDetail: UserDetail | null;
  loading: boolean;
  error: string | null;
  onRefresh?: () => void; // 데이터 새로고침 콜백
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  open,
  onClose,
  userId,
  userDetail,
  loading,
  error,
  onRefresh
}) => {
  // 관리 메뉴 상태
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);

  // 모달 상태
  const [accountStatusModalOpen, setAccountStatusModalOpen] = useState(false);
  const [warningMessageModalOpen, setWarningMessageModalOpen] = useState(false);
  const [profileUpdateRequestModalOpen, setProfileUpdateRequestModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);

  // 작업 상태
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // 메뉴 열기
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  // 메뉴 닫기
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  // 계정 상태 변경 모달 열기
  const handleOpenAccountStatusModal = () => {
    handleCloseMenu();
    setAccountStatusModalOpen(true);
  };

  // 경고 메시지 모달 열기
  const handleOpenWarningMessageModal = () => {
    handleCloseMenu();
    setWarningMessageModalOpen(true);
  };

  // 프로필 수정 요청 모달 열기
  const handleOpenProfileUpdateRequestModal = () => {
    handleCloseMenu();
    setProfileUpdateRequestModalOpen(true);
  };

  // 프로필 직접 수정 모달 열기
  const handleOpenEditProfileModal = () => {
    handleCloseMenu();
    setEditProfileModalOpen(true);
  };

  // 강제 로그아웃 처리
  const handleForceLogout = async () => {
    if (!userId) return;

    try {
      handleCloseMenu();
      setActionLoading(true);
      setActionError(null);

      await AdminService.userAppearance.forceLogout(userId);

      setActionSuccess('사용자가 강제 로그아웃 되었습니다.');
      if (onRefresh) onRefresh();
    } catch (error: any) {
      setActionError(error.message || '강제 로그아웃 처리 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" component="div">
          사용자 상세 정보
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* 관리 메뉴 버튼 */}
          {!loading && userDetail && (
            <Tooltip title="관리 메뉴">
              <IconButton
                color="primary"
                onClick={handleOpenMenu}
                sx={{ mr: 1 }}
                disabled={actionLoading}
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          )}
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider />

      {/* 관리 메뉴 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleOpenAccountStatusModal}>
          <ListItemIcon>
            <BlockIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>계정 상태 변경</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenWarningMessageModal}>
          <ListItemIcon>
            <WarningIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>경고 메시지 발송</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleForceLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>강제 로그아웃</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleOpenProfileUpdateRequestModal}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>프로필 수정 요청</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenEditProfileModal}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>프로필 직접 수정</ListItemText>
        </MenuItem>
      </Menu>
      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : !userDetail ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography>사용자 정보를 찾을 수 없습니다.</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* 프로필 이미지 섹션 */}
            <Grid item xs={12} md={5}>
              <Box sx={{ position: 'relative', mb: 2 }}>
                {/* 프로필 이미지 표시 */}
                {userDetail.profileImages && userDetail.profileImages.length > 0 ? (
                  // 메인 이미지 표시
                  <Box sx={{ position: 'relative' }}>
                    <Box
                      component="img"
                      src={userDetail.profileImages[0].url}
                      alt={userDetail.name}
                      sx={{
                        width: '100%',
                        height: 400,
                        objectFit: 'cover',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    {/* 메인 이미지 표시 */}
                    <Chip
                      label="메인 이미지"
                      color="primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        backgroundColor: 'rgba(25, 118, 210, 0.8)',
                      }}
                    />
                  </Box>
                ) : userDetail.profileImageUrl ? (
                  // 단일 profileImageUrl이 있는 경우
                  <Box
                    component="img"
                    src={userDetail.profileImageUrl}
                    alt={userDetail.name}
                    sx={{
                      width: '100%',
                      height: 400,
                      objectFit: 'cover',
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                ) : (
                  // 이미지가 없는 경우 성별에 따라 랜덤 이미지 표시
                  <Box
                    component="img"
                    src={userDetail.gender === 'MALE'
                         ? `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 50) + 1}.jpg`
                         : `https://randomuser.me/api/portraits/women/${Math.floor(Math.random() * 50) + 1}.jpg`}
                    alt={userDetail.name}
                    sx={{
                      width: '100%',
                      height: 400,
                      objectFit: 'cover',
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                )}
              </Box>

              {/* 추가 이미지 썸네일 - 실제 데이터 또는 임의 생성 */}
              {(() => {
                // 실제 추가 이미지가 있는 경우
                if (userDetail.profileImages && userDetail.profileImages.length > 1) {
                  return (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        추가 이미지 ({userDetail.profileImages.length - 1}장)
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {userDetail.profileImages.slice(1).map((image, index) => (
                          <Box
                            key={image.id}
                            sx={{ position: 'relative' }}
                          >
                            <Box
                              component="img"
                              src={image.url}
                              alt={`${userDetail.name} 프로필 이미지 ${index + 2}`}
                              sx={{
                                width: 100,
                                height: 100,
                                objectFit: 'cover',
                                borderRadius: 1,
                                cursor: 'pointer',
                                '&:hover': {
                                  opacity: 0.8,
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                                }
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                textAlign: 'center',
                                padding: '2px 0'
                              }}
                            >
                              {index + 2}번째
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  );
                }
                // 추가 이미지가 없는 경우 임의로 생성
                else {
                  // 성별에 따라 다른 이미지 세트 사용
                  const genderPath = userDetail.gender === 'MALE' ? 'men' : 'women';

                  // 첫 번째 이미지 ID (메인 이미지와 다른 ID 사용)
                  const baseId = userDetail.gender === 'MALE' ? 50 : 60;

                  // 임의로 2개의 추가 이미지 생성
                  const additionalImages = [
                    {
                      id: `random-${baseId + 1}`,
                      url: `https://randomuser.me/api/portraits/${genderPath}/${baseId + 1}.jpg`,
                      index: 0
                    },
                    {
                      id: `random-${baseId + 2}`,
                      url: `https://randomuser.me/api/portraits/${genderPath}/${baseId + 2}.jpg`,
                      index: 1
                    }
                  ];

                  return (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        추가 이미지 (2장)
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {additionalImages.map((image, index) => (
                          <Box
                            key={image.id}
                            sx={{ position: 'relative' }}
                          >
                            <Box
                              component="img"
                              src={image.url}
                              alt={`${userDetail.name} 프로필 이미지 ${index + 2}`}
                              sx={{
                                width: 100,
                                height: 100,
                                objectFit: 'cover',
                                borderRadius: 1,
                                cursor: 'pointer',
                                '&:hover': {
                                  opacity: 0.8,
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                                }
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                textAlign: 'center',
                                padding: '2px 0'
                              }}
                            >
                              {index + 2}번째
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  );
                }
              })()}
            </Grid>

            {/* 사용자 정보 섹션 */}
            <Grid item xs={12} md={7}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ mb: 1 }}>
                  {/* 이름과 외모 등급을 같은 줄에 표시 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mr: 2 }}>
                      {userDetail.name}
                    </Typography>

                    {/* 외모 등급 강조 표시 */}
                    {(userDetail.appearanceGrade || userDetail.appearanceRank) && (
                      <Chip
                        label={`외모 등급: ${userDetail.appearanceGrade || userDetail.appearanceRank}`}
                        size="small"
                        color={
                          (userDetail.appearanceGrade === 'S' || userDetail.appearanceRank === 'S') ? 'success' :
                          (userDetail.appearanceGrade === 'A' || userDetail.appearanceRank === 'A') ? 'primary' :
                          (userDetail.appearanceGrade === 'B' || userDetail.appearanceRank === 'B') ? 'info' :
                          (userDetail.appearanceGrade === 'C' || userDetail.appearanceRank === 'C') ? 'warning' : 'default'
                        }
                        sx={{
                          fontWeight: 'bold',
                          mr: 1,
                          backgroundColor: (userDetail.appearanceGrade === 'S' || userDetail.appearanceRank === 'S') ? 'rgba(46, 204, 113, 0.9)' :
                                          (userDetail.appearanceGrade === 'A' || userDetail.appearanceRank === 'A') ? 'rgba(52, 152, 219, 0.9)' :
                                          (userDetail.appearanceGrade === 'B' || userDetail.appearanceRank === 'B') ? 'rgba(52, 152, 219, 0.7)' :
                                          (userDetail.appearanceGrade === 'C' || userDetail.appearanceRank === 'C') ? 'rgba(241, 196, 15, 0.9)' :
                                          'rgba(189, 195, 199, 0.9)',
                          color: 'white'
                        }}
                      />
                    )}
                  </Box>

                  {/* 나이, 성별 및 계정 상태 표시 */}
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip
                      label={`${userDetail.age}세 / ${GENDER_LABELS[userDetail.gender]}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />

                    {userDetail.accountStatus && userDetail.accountStatus !== 'ACTIVE' && (
                      <Chip
                        label={userDetail.accountStatus === 'INACTIVE' ? '비활성화' : '정지됨'}
                        size="small"
                        color="error"
                      />
                    )}
                  </Box>
                </Box>

                {/* 대학 정보 */}
                {(userDetail.universityDetails || userDetail.university) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      {userDetail.universityDetails ? (
                        <>
                          <Typography variant="body1">
                            {userDetail.universityDetails.name}{' '}
                            {userDetail.universityDetails.authentication && (
                              <span style={{ color: '#2ECC71', marginLeft: '4px' }}>✓</span>
                            )}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {userDetail.universityDetails.department} {userDetail.universityDetails.grade}학년
                            {userDetail.universityDetails.studentNumber && ` (${userDetail.universityDetails.studentNumber})`}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body1">
                          {userDetail.university}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}

                {/* 연락처 정보 */}
                {userDetail.phoneNumber && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1">{userDetail.phoneNumber}</Typography>
                  </Box>
                )}

                {/* 이메일 정보 */}
                {userDetail.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1">{userDetail.email}</Typography>
                  </Box>
                )}

                {/* 인스타그램 정보 */}
                {(userDetail.instagramId || userDetail.instagramUrl) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <InstagramIcon sx={{ mr: 1, color: '#E1306C' }} />
                    <Link
                      href={userDetail.instagramUrl || `https://instagram.com/${userDetail.instagramId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                        color: 'primary.main',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {userDetail.instagramId || userDetail.instagramUrl?.split('/').pop()}
                      <OpenInNewIcon sx={{ ml: 0.5, fontSize: 16 }} />
                    </Link>
                  </Box>
                )}

                {/* 날짜 정보 */}
                <Box sx={{ mt: 3, mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    활동 정보
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {userDetail.createdAt && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarTodayIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          가입일: {new Date(userDetail.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    )}

                    {userDetail.lastActiveAt && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTimeIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          마지막 활동: {new Date(userDetail.lastActiveAt).toLocaleDateString('ko-KR', {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* 추가 정보 섹션 */}
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    시스템 정보
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        사용자 ID
                      </Typography>
                      <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                        {userDetail.id || userId || '-'}
                      </Typography>
                    </Grid>

                    {/* 추가 필드 표시 - 가독성 개선 (불필요한 필드 제외) */}
                    {Object.entries(userDetail)
                      .filter(([key]) => !['id', 'name', 'age', 'gender', 'profileImages', 'profileImageUrl',
                                          'phoneNumber', 'instagramId', 'instagramUrl', 'universityDetails',
                                          'university', 'email', 'createdAt', 'updatedAt', 'lastActiveAt',
                                          'appearanceGrade', 'accountStatus', 'role', 'title', 'introduction',
                                          'appearanceRank', 'oauthProvider', 'deletedAt'].includes(key))
                      .map(([key, value]) => {
                        // preferences 필드 특별 처리
                        if (key === 'preferences' && Array.isArray(value)) {
                          return (
                            <Grid item xs={12} key={key}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                                선호도 정보
                              </Typography>
                              <Box sx={{ pl: 2 }}>
                                {value.map((pref: any, index: number) => (
                                  <Box key={index} sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                      {pref.typeName}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                      {pref.selectedOptions?.map((option: any, optIndex: number) => (
                                        <Chip
                                          key={optIndex}
                                          label={option.displayName}
                                          size="small"
                                          variant="outlined"
                                        />
                                      ))}
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            </Grid>
                          );
                        }

                        // 날짜 필드, role, title, introduction, appearanceRank, oauthProvider, deletedAt 필드는 상세 정보에서 제외

                        // 기본 필드 처리
                        return (
                          <Grid item xs={12} key={key}>
                            <Typography variant="body2" color="text.secondary">
                              {key}
                            </Typography>
                            <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </Typography>
                          </Grid>
                        );
                      })
                    }
                  </Grid>
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      {/* 성공/오류 메시지 */}
      {actionSuccess && (
        <Alert
          severity="success"
          sx={{ position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 1000 }}
          onClose={() => setActionSuccess(null)}
        >
          {actionSuccess}
        </Alert>
      )}

      {actionError && (
        <Alert
          severity="error"
          sx={{ position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 1000 }}
          onClose={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      )}

      {/* 관리 기능 모달들 */}
      <AccountStatusModal
        open={accountStatusModalOpen}
        onClose={() => setAccountStatusModalOpen(false)}
        userId={userId || ''}
        onSuccess={() => {
          setActionSuccess('계정 상태가 변경되었습니다.');
          if (onRefresh) onRefresh();
        }}
      />

      <WarningMessageModal
        open={warningMessageModalOpen}
        onClose={() => setWarningMessageModalOpen(false)}
        userId={userId || ''}
        onSuccess={() => {
          setActionSuccess('경고 메시지가 발송되었습니다.');
          if (onRefresh) onRefresh();
        }}
      />

      <ProfileUpdateRequestModal
        open={profileUpdateRequestModalOpen}
        onClose={() => setProfileUpdateRequestModalOpen(false)}
        userId={userId || ''}
        onSuccess={() => {
          setActionSuccess('프로필 수정 요청이 발송되었습니다.');
          if (onRefresh) onRefresh();
        }}
      />

      <EditProfileModal
        open={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        userId={userId || ''}
        userDetail={userDetail}
        onSuccess={() => {
          setActionSuccess('프로필이 수정되었습니다.');
          if (onRefresh) onRefresh();
        }}
      />
    </Dialog>
  );
};

export default UserDetailModal;
