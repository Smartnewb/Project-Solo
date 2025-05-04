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
        // 각 사용자의 상세 정보를 병렬로 가져오기
        const userDetailsPromises = response.items.map(async (user) => {
          try {
            // 사용자 ID 가져오기 (userId 또는 id 필드 사용)
            const userId = user.userId || user.id;

            // 사용자 상세 정보 API 호출
            console.log(`사용자 ${user.name}(${userId})의 상세 정보 요청`);
            const userDetail = await AdminService.users.getUserDetails(userId);

            // 상세 정보 로깅 (전체 구조 확인)
            console.log(`사용자 ${user.name}의 상세 정보:`, JSON.stringify(userDetail, null, 2));

            // 프로필 이미지 정보 확인 - 모든 가능한 경로 탐색
            console.log(`사용자 ${user.name}의 프로필 이미지 필드 확인:`);
            console.log(`- profileImages:`, userDetail.profileImages);
            console.log(`- profile.images:`, userDetail.profile?.images);
            console.log(`- profileImageUrl:`, userDetail.profileImageUrl);
            console.log(`- profile.profileImageUrl:`, userDetail.profile?.profileImageUrl);

            // 이미지 배열 찾기 (여러 가능한 경로 확인)
            let profileImages = [];

            // 1. profileImages 배열 확인
            if (userDetail.profileImages && Array.isArray(userDetail.profileImages) && userDetail.profileImages.length > 0) {
              console.log(`사용자 ${user.name}의 profileImages 배열 발견: ${userDetail.profileImages.length}개`);
              profileImages = userDetail.profileImages;
            }
            // 2. profile.images 배열 확인
            else if (userDetail.profile?.images && Array.isArray(userDetail.profile.images) && userDetail.profile.images.length > 0) {
              console.log(`사용자 ${user.name}의 profile.images 배열 발견: ${userDetail.profile.images.length}개`);
              profileImages = userDetail.profile.images;
            }

            // 이미지 배열이 있는 경우 처리
            if (profileImages.length > 0) {
              // 이미지 배열 로깅
              profileImages.forEach((img, idx) => {
                console.log(`이미지 ${idx + 1}:`, JSON.stringify(img));
              });

              // 이미지 배열 검증 및 정규화
              const validImages = profileImages
                .filter(img => img && (img.url || img.s3Url))
                .map((img, idx) => ({
                  id: img.id || `img-${userId}-${idx}`,
                  url: img.url || img.s3Url,
                  isMain: img.isMain || false
                }));

              console.log(`유효한 이미지 배열 (${validImages.length}개):`, validImages);

              // 유효한 이미지가 있는 경우
              if (validImages.length > 0) {
                // 상세 정보에서 가져온 이미지 배열로 업데이트
                const enhancedUser = {
                  ...user,
                  profileImages: validImages,
                  // 기타 상세 정보 필드 추가
                  instagramId: userDetail.profile?.instagramId || user.instagramId,
                  universityDetails: userDetail.university || user.universityDetails
                };

                console.log(`사용자 ${user.name}의 업데이트된 정보:`, enhancedUser);
                return enhancedUser;
              }
            }

            // 상세 정보 모달에서 사용하는 방식과 동일하게 처리
            // 이미지 배열이 없는 경우 상세 정보 모달에서 사용하는 방식으로 처리
            if (userDetail.profileImages && userDetail.profileImages.length === 0) {
              console.log(`사용자 ${user.name}의 profileImages 배열이 비어 있습니다.`);
            }

            // 단일 이미지 URL 확인
            let profileImageUrl = null;

            // 1. profileImageUrl 확인
            if (userDetail.profileImageUrl) {
              profileImageUrl = userDetail.profileImageUrl;
              console.log(`사용자 ${user.name}의 profileImageUrl 발견:`, profileImageUrl);
            }
            // 2. profile.profileImageUrl 확인
            else if (userDetail.profile?.profileImageUrl) {
              profileImageUrl = userDetail.profile.profileImageUrl;
              console.log(`사용자 ${user.name}의 profile.profileImageUrl 발견:`, profileImageUrl);
            }
            // 3. 기존 user 객체의 profileImageUrl 확인
            else if (user.profileImageUrl) {
              profileImageUrl = user.profileImageUrl;
              console.log(`사용자 ${user.name}의 기존 profileImageUrl 사용:`, profileImageUrl);
            }

            // 단일 이미지 URL이 있는 경우 처리
            if (profileImageUrl) {
              console.log(`사용자 ${user.name}의 단일 프로필 이미지 URL 사용:`, profileImageUrl);

              // 단일 이미지를 3개로 복제 (다른 각도로 보이게 하기 위해)
              return {
                ...user,
                profileImages: [
                  { id: `${userId}-main`, url: profileImageUrl, isMain: true },
                  { id: `${userId}-copy1`, url: profileImageUrl, isMain: false },
                  { id: `${userId}-copy2`, url: profileImageUrl, isMain: false }
                ],
                // 기타 상세 정보 필드 추가
                instagramId: userDetail.profile?.instagramId || user.instagramId,
                universityDetails: userDetail.university || user.universityDetails
              };
            }

            // 기존 user 객체의 profileImageUrl 확인
            if (user.profileImageUrl) {
              console.log(`사용자 ${user.name}의 기존 profileImageUrl 사용:`, user.profileImageUrl);

              // 단일 이미지를 3개로 복제
              return {
                ...user,
                profileImages: [
                  { id: `${userId}-main`, url: user.profileImageUrl, isMain: true },
                  { id: `${userId}-copy1`, url: user.profileImageUrl, isMain: false },
                  { id: `${userId}-copy2`, url: user.profileImageUrl, isMain: false }
                ]
              };
            }

            // 상세 정보에서 첫 번째 이미지 URL 추출 시도
            if (userDetail.profileImages && userDetail.profileImages[0] && userDetail.profileImages[0].url) {
              const imageUrl = userDetail.profileImages[0].url;
              console.log(`사용자 ${user.name}의 첫 번째 프로필 이미지 URL 사용:`, imageUrl);

              return {
                ...user,
                profileImages: [
                  { id: `${userId}-main`, url: imageUrl, isMain: true },
                  { id: `${userId}-copy1`, url: imageUrl, isMain: false },
                  { id: `${userId}-copy2`, url: imageUrl, isMain: false }
                ],
                // 기타 상세 정보 필드 추가
                instagramId: userDetail.profile?.instagramId || user.instagramId,
                universityDetails: userDetail.university || user.universityDetails
              };
            }

            // 프로필 이미지가 전혀 없는 경우 더미 이미지 배열 생성
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
          } catch (error) {
            console.error(`사용자 ${user.name} 상세 정보 조회 중 오류:`, error);

            // 오류 발생 시 더미 이미지 배열 생성
            const gender = user.gender === 'MALE' ? 'men' : 'women';
            const randomId = Math.floor(Math.random() * 50) + 1;

            return {
              ...user,
              profileImages: [
                { id: `dummy-${user.id || randomId}-1`, url: `https://randomuser.me/api/portraits/${gender}/${randomId}.jpg`, isMain: true },
                { id: `dummy-${user.id || randomId}-2`, url: `https://randomuser.me/api/portraits/${gender}/${randomId + 1}.jpg`, isMain: false },
                { id: `dummy-${user.id || randomId}-3`, url: `https://randomuser.me/api/portraits/${gender}/${randomId + 2}.jpg`, isMain: false }
              ]
            };
          }
        });

        // 모든 상세 정보 요청이 완료될 때까지 대기
        const enhancedUsers = await Promise.all(userDetailsPromises);
        console.log('상세 정보가 포함된 사용자 목록:', enhancedUsers);

        // 상태 업데이트
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
    console.log('이미지 배열:', images);

    // 이미지 배열 유효성 검사
    if (!images || !Array.isArray(images) || images.length <= 1) {
      console.log('이미지가 없거나 하나뿐입니다.');
      return;
    }

    // 현재 인덱스 가져오기
    const currentIndex = userCardImageIndices[userId] || 0;
    console.log('현재 이미지 인덱스:', currentIndex);

    // 새 인덱스 계산 (순환)
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    console.log('새 이미지 인덱스:', newIndex);

    // 강제 리렌더링을 위한 새 객체 생성
    const newIndices = { ...userCardImageIndices };
    newIndices[userId] = newIndex;

    // 상태 업데이트
    setUserCardImageIndices(newIndices);

    // 이미지 URL 직접 확인
    if (images[newIndex] && images[newIndex].url) {
      console.log('새 이미지 URL:', images[newIndex].url);
    } else {
      console.warn('새 이미지에 URL이 없습니다:', images[newIndex]);
    }

    // 특정 사용자에 대해서만 리렌더링 트리거 업데이트
    setRefreshTrigger(prev => ({
      ...prev,
      [userId]: (prev[userId] || 0) + 1
    }));

    // 디버깅: 상태 업데이트 후 확인
    setTimeout(() => {
      console.log('업데이트된 인덱스:', userCardImageIndices[userId]);
      console.log('업데이트된 리렌더링 트리거:', refreshTrigger[userId]);
    }, 0);
  };

  const handleNextImage = (userId: string, images: any[]) => {
    console.log('다음 이미지 버튼 클릭:', { userId, imagesLength: images.length });
    console.log('이미지 배열:', images);

    // 이미지 배열 유효성 검사
    if (!images || !Array.isArray(images) || images.length <= 1) {
      console.log('이미지가 없거나 하나뿐입니다.');
      return;
    }

    // 현재 인덱스 가져오기
    const currentIndex = userCardImageIndices[userId] || 0;
    console.log('현재 이미지 인덱스:', currentIndex);

    // 새 인덱스 계산 (순환)
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    console.log('새 이미지 인덱스:', newIndex);

    // 강제 리렌더링을 위한 새 객체 생성
    const newIndices = { ...userCardImageIndices };
    newIndices[userId] = newIndex;

    // 상태 업데이트
    setUserCardImageIndices(newIndices);

    // 이미지 URL 직접 확인
    if (images[newIndex] && images[newIndex].url) {
      console.log('새 이미지 URL:', images[newIndex].url);
    } else {
      console.warn('새 이미지에 URL이 없습니다:', images[newIndex]);
    }

    // 특정 사용자에 대해서만 리렌더링 트리거 업데이트
    setRefreshTrigger(prev => ({
      ...prev,
      [userId]: (prev[userId] || 0) + 1
    }));

    // 디버깅: 상태 업데이트 후 확인
    setTimeout(() => {
      console.log('업데이트된 인덱스:', userCardImageIndices[userId]);
      console.log('업데이트된 리렌더링 트리거:', refreshTrigger[userId]);
    }, 0);
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

    console.log('이미지 모달 열기 - 사용자:', user.name);
    console.log('사용자 프로필 이미지 배열:', user.profileImages);

    // 사용자의 이미지 목록 설정
    let images = [];

    // 실제 프로필 이미지가 있는 경우
    if (user.profileImages && Array.isArray(user.profileImages) && user.profileImages.length > 0) {
      console.log(`사용자 ${user.name}의 프로필 이미지 ${user.profileImages.length}개 사용`);

      // 유효한 URL이 있는 이미지만 필터링
      images = user.profileImages
        .filter(img => img && img.url)
        .map(img => ({
          id: img.id || 'unknown',
          url: img.url,
          isMain: img.isMain || false
        }));

      console.log('필터링된 이미지 배열:', images);
    }
    // 단일 프로필 이미지 URL만 있는 경우
    else if (user.profileImageUrl) {
      console.log(`사용자 ${user.name}의 단일 프로필 이미지 URL 사용:`, user.profileImageUrl);

      // 더미 이미지 추가 (원본 + 더미 2개)
      const gender = user.gender === 'MALE' ? 'men' : 'women';
      const randomId = Math.floor(Math.random() * 50) + 1;

      images = [
        { id: 'main', url: user.profileImageUrl, isMain: true },
        { id: 'dummy-1', url: `https://randomuser.me/api/portraits/${gender}/${randomId}.jpg`, isMain: false },
        { id: 'dummy-2', url: `https://randomuser.me/api/portraits/${gender}/${randomId + 1}.jpg`, isMain: false }
      ];
    }
    // 이미지가 없는 경우 성별에 따라 랜덤 이미지 생성
    else {
      console.log(`사용자 ${user.name}의 이미지가 없습니다. 더미 이미지 사용`);

      const gender = user.gender === 'MALE' ? 'men' : 'women';
      const randomId = Math.floor(Math.random() * 50) + 1;

      images = [
        { id: 'dummy-1', url: `https://randomuser.me/api/portraits/${gender}/${randomId}.jpg`, isMain: true },
        { id: 'dummy-2', url: `https://randomuser.me/api/portraits/${gender}/${randomId + 1}.jpg`, isMain: false },
        { id: 'dummy-3', url: `https://randomuser.me/api/portraits/${gender}/${randomId + 2}.jpg`, isMain: false }
      ];
    }

    console.log('모달에 표시할 이미지 배열:', images);

    // 현재 카드에서 선택된 이미지 인덱스 가져오기
    const userId = user.userId || user.id;
    const currentIndex = userCardImageIndices[userId] || 0;
    const safeIndex = Math.min(currentIndex, images.length - 1);

    console.log(`현재 선택된 이미지 인덱스: ${currentIndex}, 안전한 인덱스: ${safeIndex}`);

    setSelectedUserImages(images);
    setCurrentImageIndex(safeIndex);
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

                            // 디버깅 로그 추가
                            console.log(`사용자 ${user.name}의 렌더링 시점 프로필 이미지 배열:`, user.profileImages);

                            // 실제 프로필 이미지가 있는 경우
                            if (user.profileImages && Array.isArray(user.profileImages) && user.profileImages.length > 0) {
                              console.log(`사용자 ${user.name}의 프로필 이미지 배열 길이: ${user.profileImages.length}`);
                              console.log(`현재 인덱스: ${currentIndex}`);

                              // 현재 인덱스가 배열 범위를 벗어나지 않도록 조정
                              const safeIndex = Math.min(currentIndex, user.profileImages.length - 1);
                              console.log(`안전한 인덱스: ${safeIndex}`);

                              // 선택된 이미지 객체
                              const selectedImage = user.profileImages[safeIndex];
                              console.log(`선택된 이미지:`, selectedImage);

                              if (selectedImage && selectedImage.url) {
                                imageUrl = selectedImage.url;
                                console.log(`이미지 URL 설정: ${imageUrl}`);
                              } else {
                                console.log(`선택된 이미지에 URL이 없습니다. 기본 이미지 사용`);
                                const dummyIndex = currentIndex % 3;
                                imageUrl = dummyImages[dummyIndex];
                              }
                            }
                            // 단일 프로필 이미지 URL만 있는 경우
                            else if (user.profileImageUrl) {
                              console.log(`사용자 ${user.name}의 단일 프로필 이미지 URL 사용: ${user.profileImageUrl}`);
                              imageUrl = user.profileImageUrl;
                            }
                            // 이미지가 없는 경우 더미 이미지 사용
                            else {
                              console.log(`사용자 ${user.name}의 이미지가 없습니다. 더미 이미지 사용`);
                              const dummyIndex = currentIndex % 3;
                              imageUrl = dummyImages[dummyIndex];
                            }

                            // 사용자별 리렌더링 트리거 값 가져오기
                            const userRefreshTrigger = refreshTrigger[userId] || 0;

                            // 이미지 URL 유효성 확인
                            if (!imageUrl) {
                              console.error(`사용자 ${user.name}의 이미지 URL이 없습니다.`);
                              const gender = user.gender === 'MALE' ? 'men' : 'women';
                              const randomId = Math.floor(Math.random() * 50) + 1;
                              imageUrl = `https://randomuser.me/api/portraits/${gender}/${randomId}.jpg`;
                            }

                            // 이미지 URL 정규화
                            try {
                              // 이미지 URL이 상대 경로인 경우 절대 경로로 변환
                              if (imageUrl.startsWith('/')) {
                                imageUrl = `${window.location.origin}${imageUrl}`;
                                console.log(`상대 경로를 절대 경로로 변환: ${imageUrl}`);
                              }

                              // 이미지 URL에 프로토콜이 없는 경우 추가
                              if (imageUrl.startsWith('//')) {
                                imageUrl = `https:${imageUrl}`;
                                console.log(`프로토콜 추가: ${imageUrl}`);
                              }

                              // URL 객체 생성 시도 (유효한 URL인지 확인)
                              new URL(imageUrl);
                            } catch (error) {
                              console.error(`사용자 ${user.name}의 이미지 URL이 유효하지 않습니다:`, imageUrl);
                              console.error('오류:', error);

                              // 유효하지 않은 URL인 경우 더미 이미지로 대체
                              const gender = user.gender === 'MALE' ? 'men' : 'women';
                              const randomId = Math.floor(Math.random() * 50) + 1;
                              imageUrl = `https://randomuser.me/api/portraits/${gender}/${randomId}.jpg`;
                              console.log(`유효하지 않은 URL을 더미 이미지로 대체: ${imageUrl}`);
                            }

                            // 캐시 방지를 위한 쿼리 파라미터 추가
                            let finalUrl = imageUrl;

                            try {
                              // URL 객체 생성
                              const urlObj = new URL(imageUrl);

                              // 쿼리 파라미터 추가
                              urlObj.searchParams.append('refresh', `${userRefreshTrigger}-${currentIndex}`);
                              finalUrl = urlObj.toString();
                            } catch (error) {
                              console.error(`쿼리 파라미터 추가 중 오류:`, error);

                              // 쿼리 파라미터 수동 추가
                              if (imageUrl.includes('?')) {
                                finalUrl = `${imageUrl}&refresh=${userRefreshTrigger}-${currentIndex}`;
                              } else {
                                finalUrl = `${imageUrl}?refresh=${userRefreshTrigger}-${currentIndex}`;
                              }
                            }

                            console.log(`사용자 ${user.name}의 최종 이미지 URL:`, finalUrl);

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
                                onError={(e) => {
                                  console.error(`이미지 로드 실패: ${finalUrl}`);

                                  // 이미지 로드 실패 시 더미 이미지로 대체
                                  const target = e.target as HTMLImageElement;
                                  const gender = user.gender === 'MALE' ? 'men' : 'women';
                                  const randomId = Math.floor(Math.random() * 50) + 1;

                                  // 이미지 로드 실패 횟수 추적 (무한 루프 방지)
                                  target.dataset.retryCount = (parseInt(target.dataset.retryCount || '0') + 1).toString();
                                  const retryCount = parseInt(target.dataset.retryCount || '0');

                                  console.log(`이미지 로드 실패 횟수: ${retryCount}`);

                                  // 최대 3번까지만 재시도
                                  if (retryCount > 3) {
                                    console.error(`이미지 로드 최대 재시도 횟수 초과: ${finalUrl}`);
                                    // 기본 아바타 이미지로 대체
                                    target.src = gender === 'MALE'
                                      ? 'https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_960_720.png'
                                      : 'https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_960_720.png';

                                    // 더 이상 오류 이벤트 처리 안함
                                    target.onerror = null;
                                    return;
                                  }

                                  // 이미 더미 이미지인 경우 다른 더미 이미지로 교체
                                  if (target.src.includes('randomuser.me')) {
                                    const newRandomId = randomId + (retryCount * 10); // 다른 이미지 사용
                                    target.src = `https://randomuser.me/api/portraits/${gender}/${newRandomId}.jpg`;
                                  } else if (target.src.includes('pixabay.com')) {
                                    // 이미 기본 아바타 이미지인 경우 다시 시도하지 않음
                                    target.onerror = null;
                                  } else {
                                    // 원본 이미지가 로드 실패한 경우 더미 이미지로 대체
                                    target.src = `https://randomuser.me/api/portraits/${gender}/${randomId}.jpg`;
                                  }

                                  // 콘솔에 대체 이미지 URL 출력
                                  console.log(`대체 이미지 URL: ${target.src}`);
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
