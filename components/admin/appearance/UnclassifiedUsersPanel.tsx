'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  IconButton,
  Menu,
  Link,
  ImageList,
  ImageListItem,
  Paper,
  Tooltip
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import EditIcon from '@mui/icons-material/Edit';
import InstagramIcon from '@mui/icons-material/Instagram';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AdminService from '@/app/services/admin';
import {
  UserProfileWithAppearance,
  AppearanceGrade,
  Gender
} from '@/app/admin/users/appearance/types';

// 등급 색상 정의
const GRADE_COLORS: Record<AppearanceGrade, string> = {
  'S': '#8E44AD', // 보라색
  'A': '#3498DB', // 파란색
  'B': '#2ECC71', // 초록색
  'C': '#F39C12', // 주황색
  'UNKNOWN': '#95A5A6' // 회색
};

// 등급 한글 표시
const GRADE_LABELS: Record<AppearanceGrade, string> = {
  'S': 'S등급',
  'A': 'A등급',
  'B': 'B등급',
  'C': 'C등급',
  'UNKNOWN': '미분류'
};

// 성별 한글 표시
const GENDER_LABELS: Record<Gender, string> = {
  'MALE': '남성',
  'FEMALE': '여성'
};

export default function UnclassifiedUsersPanel() {
  const [users, setUsers] = useState<UserProfileWithAppearance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(12);
  const [refreshTrigger, setRefreshTrigger] = useState<{[userId: string]: number}>({}); // 사용자별 리렌더링 트리거

  // 등급 설정 상태
  const [selectedUser, setSelectedUser] = useState<UserProfileWithAppearance | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<AppearanceGrade>('UNKNOWN');
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeMenuAnchorEl, setGradeMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  // 이미지 관련 상태
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedUserImages, setSelectedUserImages] = useState<{url: string, isMain?: boolean}[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 사용자 카드 이미지 슬라이더 상태
  const [userCardImageIndices, setUserCardImageIndices] = useState<{[userId: string]: number}>({});

  // 미분류 사용자 목록 조회
  const fetchUnclassifiedUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // 미분류 사용자 목록 가져오기
      const response = await AdminService.userAppearance.getUnclassifiedUsers(page, pageSize);
      console.log('미분류 사용자 목록 응답:', response);

      // 사용자 목록이 있는 경우
      if (response.items && response.items.length > 0) {
        // 각 사용자에 대해 가상의 이미지 배열 생성
        const enhancedUsers = response.items.map(user => {
          // 사용자 ID 가져오기 (userId 또는 id 필드 사용)
          const userId = user.userId || user.id;

          // 프로필 이미지 URL이 있는 경우
          if (user.profileImageUrl) {
            console.log(`사용자 ${user.name}의 프로필 이미지 URL:`, user.profileImageUrl);

            // 이미지 URL에서 파일명 추출
            const urlParts = user.profileImageUrl.split('/');
            const fileName = urlParts[urlParts.length - 1].split('?')[0];
            const fileNameWithoutExt = fileName.split('.')[0];

            // 가상의 이미지 배열 생성 (원본 이미지 + 변형된 이미지 2개)
            const profileImages = [
              { id: `${fileNameWithoutExt}-1`, url: user.profileImageUrl, isMain: true },
              {
                id: `${fileNameWithoutExt}-2`,
                url: user.profileImageUrl.replace(fileName, `${fileNameWithoutExt}-2.jpg`),
                isMain: false
              },
              {
                id: `${fileNameWithoutExt}-3`,
                url: user.profileImageUrl.replace(fileName, `${fileNameWithoutExt}-3.jpg`),
                isMain: false
              }
            ];

            console.log(`사용자 ${user.name}의 가상 이미지 배열 생성:`, profileImages);

            // 이미지 배열이 포함된 사용자 정보 반환
            return {
              ...user,
              profileImages: profileImages
            };
          }

          // 프로필 이미지 URL이 없는 경우 더미 이미지 배열 생성
          const gender = user.gender === 'MALE' ? 'men' : 'women';
          const randomId = Math.floor(Math.random() * 50) + 1;
          const dummyImages = [
            {
              id: `dummy-${userId}-1`,
              url: `https://randomuser.me/api/portraits/${gender}/${randomId}.jpg`,
              isMain: true
            },
            {
              id: `dummy-${userId}-2`,
              url: `https://randomuser.me/api/portraits/${gender}/${randomId + 1}.jpg`,
              isMain: false
            },
            {
              id: `dummy-${userId}-3`,
              url: `https://randomuser.me/api/portraits/${gender}/${randomId + 2}.jpg`,
              isMain: false
            }
          ];

          console.log(`사용자 ${user.name}의 더미 이미지 배열 생성:`, dummyImages);

          return {
            ...user,
            profileImages: dummyImages
          };
        });

        console.log('이미지 배열이 포함된 사용자 목록:', enhancedUsers);
        setUsers(enhancedUsers);
      } else {
        // 사용자가 없는 경우 빈 배열 설정
        setUsers([]);
      }

      // 페이지네이션 정보 업데이트
      setTotalPages(response.meta.totalPages || 1);
    } catch (err: any) {
      console.error('미분류 사용자 목록 조회 중 오류:', err);
      console.error('오류 상세 정보:', err.response?.data || err.message);
      setError(err.message || '미분류 사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 페이지 변경 시 데이터 조회
  useEffect(() => {
    fetchUnclassifiedUsers();
  }, [page]);

  // 페이지 변경 핸들러
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // 등급 토글 메뉴 열기
  const handleOpenGradeMenu = (event: React.MouseEvent<HTMLElement>, user: UserProfileWithAppearance) => {
    setGradeMenuAnchorEl(event.currentTarget);
    setSelectedUser(user);
    setSelectedGrade(user.appearanceGrade);
    setActiveUserId(user.userId);
  };

  // 등급 토글 메뉴 닫기
  const handleCloseGradeMenu = () => {
    setGradeMenuAnchorEl(null);
    setActiveUserId(null);
  };

  // 사용자 카드 이미지 슬라이더 핸들러
  const handlePrevImage = (userId: string, images: any[]) => {
    console.log('이전 이미지 버튼 클릭:', { userId, imagesLength: images.length });

    if (!images || images.length <= 1) {
      console.log('이미지가 없거나 하나뿐입니다.');
      return;
    }

    // 현재 인덱스 가져오기
    const currentIndex = userCardImageIndices[userId] || 0;
    console.log('현재 이미지 인덱스:', currentIndex);

    // 새 인덱스 계산
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    console.log('새 이미지 인덱스:', newIndex);

    // 강제 리렌더링을 위한 새 객체 생성
    const newIndices = { ...userCardImageIndices };
    newIndices[userId] = newIndex;

    // 상태 업데이트
    setUserCardImageIndices(newIndices);

    // 이미지 URL 직접 확인
    if (images[newIndex]) {
      console.log('새 이미지 URL:', images[newIndex].url);
    }

    // 특정 사용자에 대해서만 리렌더링 트리거 업데이트
    setRefreshTrigger(prev => ({
      ...prev,
      [userId]: (prev[userId] || 0) + 1
    }));
  };

  const handleNextImage = (userId: string, images: any[]) => {
    console.log('다음 이미지 버튼 클릭:', { userId, imagesLength: images.length });

    if (!images || images.length <= 1) {
      console.log('이미지가 없거나 하나뿐입니다.');
      return;
    }

    // 현재 인덱스 가져오기
    const currentIndex = userCardImageIndices[userId] || 0;
    console.log('현재 이미지 인덱스:', currentIndex);

    // 새 인덱스 계산
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    console.log('새 이미지 인덱스:', newIndex);

    // 강제 리렌더링을 위한 새 객체 생성
    const newIndices = { ...userCardImageIndices };
    newIndices[userId] = newIndex;

    // 상태 업데이트
    setUserCardImageIndices(newIndices);

    // 이미지 URL 직접 확인
    if (images[newIndex]) {
      console.log('새 이미지 URL:', images[newIndex].url);
    }

    // 특정 사용자에 대해서만 리렌더링 트리거 업데이트
    setRefreshTrigger(prev => ({
      ...prev,
      [userId]: (prev[userId] || 0) + 1
    }));
  };

  // 사용자의 이미지 개수 가져오기
  const getUserImageCount = (user: UserProfileWithAppearance): number => {
    // 실제 프로필 이미지가 있는 경우
    if (user.profileImages && user.profileImages.length > 0) {
      return user.profileImages.length;
    }
    // 이미지가 없는 경우 더미 이미지 3개 사용
    return 3;
  };

  // 이미지 모달 열기
  const handleOpenImageModal = (user: UserProfileWithAppearance) => {
    setSelectedUser(user);

    // 사용자의 이미지 목록 설정
    let images = [];

    // 실제 프로필 이미지가 있는 경우
    if (user.profileImages && user.profileImages.length > 0) {
      images = user.profileImages.map(img => ({ url: img.url, isMain: img.isMain }));
    }
    // 단일 프로필 이미지 URL만 있는 경우
    else if (user.profileImageUrl) {
      images = [{ url: user.profileImageUrl, isMain: true }];
    }
    // 이미지가 없는 경우 성별에 따라 랜덤 이미지 생성 (실제 구현에서는 필요 없을 수 있음)
    else {
      const gender = user.gender === 'MALE' ? 'men' : 'women';
      const randomId = Math.floor(Math.random() * 50) + 1;
      images = [{ url: `https://randomuser.me/api/portraits/${gender}/${randomId}.jpg`, isMain: true }];
    }

    setSelectedUserImages(images);
    setCurrentImageIndex(userCardImageIndices[user.userId || user.id] || 0);
    setImageModalOpen(true);
  };

  // 이미지 모달 닫기
  const handleCloseImageModal = () => {
    setImageModalOpen(false);
  };

  // 이미지 변경 핸들러
  const handleChangeImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  // 이미지 모달에서 등급 설정
  const handleSetGradeFromModal = (grade: AppearanceGrade) => {
    if (selectedUser) {
      handleSaveGrade(grade);
      handleCloseImageModal();
    }
  };

  // 등급 설정 저장
  const handleSaveGrade = async (newGrade: AppearanceGrade) => {
    console.log('미분류 패널 - 등급 설정 시작:', { newGrade });
    console.log('미분류 패널 - 선택된 사용자:', selectedUser);

    if (!selectedUser) {
      console.error('미분류 패널 - 선택된 사용자가 없습니다.');
      setError('선택된 사용자가 없습니다.');
      return;
    }

    // userId가 없는 경우 id를 사용
    const userId = selectedUser.userId || selectedUser.id;

    if (!userId) {
      console.error('미분류 패널 - 선택된 사용자의 ID가 없습니다.');
      setError('선택된 사용자의 ID가 없습니다.');
      return;
    }

    console.log('미분류 패널 - 등급 설정 파라미터:', { userId, grade: newGrade });

    try {
      setSavingGrade(true);
      await AdminService.userAppearance.setUserAppearanceGrade(userId, newGrade);
      console.log('미분류 패널 - 등급 설정 성공!');

      // 목록 업데이트 (미분류에서 제거)
      if (newGrade !== 'UNKNOWN') {
        setUsers(users.filter(user => {
          const userIdToCompare = user.userId || user.id;
          return userIdToCompare !== userId;
        }));
      } else {
        // 미분류로 다시 설정한 경우는 상태만 업데이트
        setUsers(users.map(user => {
          const userIdToCompare = user.userId || user.id;
          return userIdToCompare === userId
            ? { ...user, appearanceGrade: newGrade }
            : user;
        }));
      }

      handleCloseGradeMenu();
    } catch (err: any) {
      console.error('미분류 패널 - 등급 설정 중 오류:', err);
      setError(err.message || '등급 설정 중 오류가 발생했습니다.');
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">미분류 사용자</Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={fetchUnclassifiedUsers}
          disabled={loading}
        >
          새로고침
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Alert severity="info">
          미분류 사용자가 없습니다.
        </Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            {users.map((user) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={user.userId}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {/* 프로필 이미지 - 클릭 시 모달 열림 */}
                      <Box
                        sx={{
                          width: '100%',
                          height: 200,
                          position: 'relative',
                          mb: 2,
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}
                      >
                        {/* 이미지 */}
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            cursor: 'pointer',
                            position: 'relative',
                            '&:hover': {
                              opacity: 0.9,
                              '&::after': {
                                content: '"크게 보기"',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                zIndex: 1
                              }
                            }
                          }}
                          onClick={() => handleOpenImageModal(user)}
                        >
                          {/* 이미지 렌더링 - 직접 URL 계산 */}
                          {(() => {
                            const userId = user.userId || user.id;
                            const currentIndex = userCardImageIndices[userId] || 0;

                            // 더미 이미지 배열 (성별에 따라 다른 이미지 세트 사용)
                            const dummyImages = user.gender === 'MALE'
                              ? [
                                  'https://randomuser.me/api/portraits/men/1.jpg',
                                  'https://randomuser.me/api/portraits/men/2.jpg',
                                  'https://randomuser.me/api/portraits/men/3.jpg'
                                ]
                              : [
                                  'https://randomuser.me/api/portraits/women/1.jpg',
                                  'https://randomuser.me/api/portraits/women/2.jpg',
                                  'https://randomuser.me/api/portraits/women/3.jpg'
                                ];

                            // 이미지 URL 결정
                            let imageUrl = '';

                            // 실제 프로필 이미지가 있는 경우
                            if (user.profileImages && user.profileImages.length > 0) {
                              const safeIndex = Math.min(currentIndex, user.profileImages.length - 1);
                              imageUrl = user.profileImages[safeIndex].url;
                            }
                            // 단일 프로필 이미지 URL만 있는 경우
                            else if (user.profileImageUrl) {
                              imageUrl = user.profileImageUrl;
                            }
                            // 이미지가 없는 경우 더미 이미지 사용
                            else {
                              const dummyIndex = currentIndex % 3;
                              imageUrl = dummyImages[dummyIndex];
                            }

                            // 사용자별 리렌더링 트리거 값 가져오기
                            const userRefreshTrigger = refreshTrigger[userId] || 0;

                            // 캐시 방지를 위한 쿼리 파라미터 추가
                            const cacheBuster = `?v=${userRefreshTrigger}-${currentIndex}`;
                            const finalUrl = `${imageUrl}${imageUrl.includes('?') ? '&' : cacheBuster}`;

                            console.log(`사용자 ${user.name}의 이미지 URL:`, finalUrl);

                            return (
                              <Box
                                component="img"
                                key={`img-${userId}-${currentIndex}-${userRefreshTrigger}`}
                                src={finalUrl}
                                alt={user.name}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            );
                          })()}
                        </Box>

                        {/* 이미지 개수 표시 - 항상 표시 */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            borderRadius: '12px',
                            padding: '2px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            zIndex: 2
                          }}
                        >
                          {(() => {
                            const userId = user.userId || user.id;
                            const currentIndex = userCardImageIndices[userId] || 0;
                            const totalImages = getUserImageCount(user);

                            // 현재 인덱스가 범위를 벗어나지 않도록 조정
                            const displayIndex = (currentIndex % totalImages) + 1;

                            return `${displayIndex} / ${totalImages}`;
                          })()}
                        </Box>

                        {/* 좌우 버튼 - 항상 표시 */}
                        <>
                          {/* 왼쪽 버튼 */}
                          <IconButton
                            size="small"
                            sx={{
                              position: 'absolute',
                              left: 8,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              backgroundColor: 'rgba(25, 118, 210, 0.8)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(25, 118, 210, 1)'
                              },
                              zIndex: 999,
                              width: 36,
                              height: 36,
                              minWidth: 36,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                            }}
                            onClick={(e) => {
                              e.stopPropagation(); // 모달 열림 방지
                              console.log('왼쪽 화살표 클릭 - 사용자:', user.name);

                              // 이미지 배열 준비
                              const images = user.profileImages && user.profileImages.length > 0
                                ? user.profileImages
                                : new Array(3).fill({ id: 'dummy', url: 'dummy' });

                              handlePrevImage(user.userId || user.id, images);
                            }}
                          >
                            <ArrowBackIosNewIcon fontSize="small" />
                          </IconButton>

                          {/* 오른쪽 버튼 */}
                          <IconButton
                            size="small"
                            sx={{
                              position: 'absolute',
                              right: 8,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              backgroundColor: 'rgba(25, 118, 210, 0.8)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(25, 118, 210, 1)'
                              },
                              zIndex: 999,
                              width: 36,
                              height: 36,
                              minWidth: 36,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                            }}
                            onClick={(e) => {
                              e.stopPropagation(); // 모달 열림 방지
                              console.log('오른쪽 화살표 클릭 - 사용자:', user.name);

                              // 이미지 배열 준비
                              const images = user.profileImages && user.profileImages.length > 0
                                ? user.profileImages
                                : new Array(3).fill({ id: 'dummy', url: 'dummy' });

                              handleNextImage(user.userId || user.id, images);
                            }}
                          >
                            <ArrowForwardIosIcon fontSize="small" />
                          </IconButton>
                        </>
                      </Box>

                      <Typography variant="h6" gutterBottom>
                        {user.name}
                      </Typography>

                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {user.age}세 / {GENDER_LABELS[user.gender]}
                      </Typography>

                      {user.universityDetails?.name && (
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {user.universityDetails.name}
                        </Typography>
                      )}

                      {user.instagramId && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1 }}>
                          <InstagramIcon sx={{ mr: 0.5, color: '#E1306C' }} fontSize="small" />
                          <Link
                            href={`https://instagram.com/${user.instagramId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              textDecoration: 'none',
                              color: 'primary.main',
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            {user.instagramId}
                            <OpenInNewIcon sx={{ ml: 0.5 }} fontSize="small" />
                          </Link>
                        </Box>
                      )}

                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                        <Chip
                          label={GRADE_LABELS[user.appearanceGrade]}
                          sx={{
                            bgcolor: GRADE_COLORS[user.appearanceGrade],
                            color: 'white',
                            cursor: 'pointer'
                          }}
                          onClick={(e) => handleOpenGradeMenu(e, user)}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      )}

      {/* 등급 설정 토글 메뉴 */}
      <Menu
        anchorEl={gradeMenuAnchorEl}
        open={Boolean(gradeMenuAnchorEl)}
        onClose={handleCloseGradeMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <MenuItem
          onClick={() => handleSaveGrade('S')}
          sx={{
            color: GRADE_COLORS['S'],
            fontWeight: selectedGrade === 'S' ? 'bold' : 'normal',
            bgcolor: selectedGrade === 'S' ? 'rgba(142, 68, 173, 0.1)' : 'transparent'
          }}
        >
          S등급
        </MenuItem>
        <MenuItem
          onClick={() => handleSaveGrade('A')}
          sx={{
            color: GRADE_COLORS['A'],
            fontWeight: selectedGrade === 'A' ? 'bold' : 'normal',
            bgcolor: selectedGrade === 'A' ? 'rgba(52, 152, 219, 0.1)' : 'transparent'
          }}
        >
          A등급
        </MenuItem>
        <MenuItem
          onClick={() => handleSaveGrade('B')}
          sx={{
            color: GRADE_COLORS['B'],
            fontWeight: selectedGrade === 'B' ? 'bold' : 'normal',
            bgcolor: selectedGrade === 'B' ? 'rgba(46, 204, 113, 0.1)' : 'transparent'
          }}
        >
          B등급
        </MenuItem>
        <MenuItem
          onClick={() => handleSaveGrade('C')}
          sx={{
            color: GRADE_COLORS['C'],
            fontWeight: selectedGrade === 'C' ? 'bold' : 'normal',
            bgcolor: selectedGrade === 'C' ? 'rgba(243, 156, 18, 0.1)' : 'transparent'
          }}
        >
          C등급
        </MenuItem>
        <MenuItem
          onClick={() => handleSaveGrade('UNKNOWN')}
          sx={{
            color: GRADE_COLORS['UNKNOWN'],
            fontWeight: selectedGrade === 'UNKNOWN' ? 'bold' : 'normal',
            bgcolor: selectedGrade === 'UNKNOWN' ? 'rgba(149, 165, 166, 0.1)' : 'transparent'
          }}
        >
          미분류
        </MenuItem>
      </Menu>

      {/* 이미지 모달 */}
      <Dialog
        open={imageModalOpen}
        onClose={handleCloseImageModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {selectedUser?.name} - 프로필 이미지
          </Typography>
          <Button onClick={handleCloseImageModal}>닫기</Button>
        </DialogTitle>

        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: '80vh' }}>
          {/* 메인 이미지 영역 */}
          <Box sx={{
            flex: 2,
            display: 'flex',
            flexDirection: 'column',
            height: { xs: '50vh', md: '100%' },
            position: 'relative',
            bgcolor: '#000'
          }}>
            {selectedUserImages.length > 0 && (
              <Box
                component="img"
                src={selectedUserImages[currentImageIndex]?.url}
                alt={`${selectedUser?.name} 프로필 이미지`}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  maxHeight: '100%'
                }}
              />
            )}
          </Box>

          {/* 사이드바 영역 - 썸네일 및 정보 */}
          <Box sx={{
            flex: 1,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            height: { xs: 'auto', md: '100%' },
            overflow: 'auto'
          }}>
            {/* 사용자 정보 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {selectedUser?.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedUser?.age}세 / {selectedUser?.gender && GENDER_LABELS[selectedUser.gender]}
              </Typography>
              {selectedUser?.universityDetails?.name && (
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {selectedUser.universityDetails.name}
                </Typography>
              )}
            </Box>

            {/* 썸네일 이미지 목록 */}
            {selectedUserImages.length > 1 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  모든 이미지 ({selectedUserImages.length}장)
                </Typography>
                <ImageList cols={3} gap={8}>
                  {selectedUserImages.map((image, index) => (
                    <ImageListItem
                      key={index}
                      onClick={() => handleChangeImage(index)}
                      sx={{
                        cursor: 'pointer',
                        border: currentImageIndex === index ? '2px solid #1976d2' : 'none',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <img
                        src={image.url}
                        alt={`${selectedUser?.name} 이미지 ${index + 1}`}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </Box>
            )}

            {/* 등급 설정 버튼 */}
            <Box sx={{ mt: 'auto' }}>
              <Typography variant="subtitle1" gutterBottom>
                외모 등급 설정
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button
                  variant="contained"
                  sx={{ bgcolor: GRADE_COLORS['S'], '&:hover': { bgcolor: GRADE_COLORS['S'] } }}
                  onClick={() => handleSetGradeFromModal('S')}
                >
                  S등급
                </Button>
                <Button
                  variant="contained"
                  sx={{ bgcolor: GRADE_COLORS['A'], '&:hover': { bgcolor: GRADE_COLORS['A'] } }}
                  onClick={() => handleSetGradeFromModal('A')}
                >
                  A등급
                </Button>
                <Button
                  variant="contained"
                  sx={{ bgcolor: GRADE_COLORS['B'], '&:hover': { bgcolor: GRADE_COLORS['B'] } }}
                  onClick={() => handleSetGradeFromModal('B')}
                >
                  B등급
                </Button>
                <Button
                  variant="contained"
                  sx={{ bgcolor: GRADE_COLORS['C'], '&:hover': { bgcolor: GRADE_COLORS['C'] } }}
                  onClick={() => handleSetGradeFromModal('C')}
                >
                  C등급
                </Button>
                <Button
                  variant="contained"
                  sx={{ bgcolor: GRADE_COLORS['UNKNOWN'], '&:hover': { bgcolor: GRADE_COLORS['UNKNOWN'] } }}
                  onClick={() => handleSetGradeFromModal('UNKNOWN')}
                >
                  미분류
                </Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
