'use client';

import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Alert,
  Chip,
  Modal,
  IconButton,
  Divider,
  Link,
  TextField,
  InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import { useRouter } from 'next/navigation';
import { AdminService } from '@/app/services';
import SearchIcon from '@mui/icons-material/Search';

// 프로필 모달 컴포넌트
function UserProfileModal({ open, onClose, userData }: {
  open: boolean;
  onClose: () => void;
  userData: any;
}) {
  if (!userData) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="user-profile-modal-title"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        p: 4,
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography id="user-profile-modal-title" variant="h6" component="h2">
            {userData.userName} 상세 정보
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box mb={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
          <Typography variant="subtitle2" fontWeight="bold" mb={1}>기본 정보</Typography>
          <Typography variant="body2"><Box component="span" fontWeight="medium">이름:</Box> {userData.userName}</Typography>
          <Typography variant="body2"><Box component="span" fontWeight="medium">사용자 ID:</Box> {userData.user_id}</Typography>
          <Typography variant="body2"><Box component="span" fontWeight="medium">성별:</Box> {userData.gender || '남성'}</Typography>
          <Typography variant="body2"><Box component="span" fontWeight="medium">가입일:</Box> {new Date(userData.created_at).toLocaleDateString('ko-KR')}</Typography>
        </Box>

        <Box mb={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
          <Typography variant="subtitle2" fontWeight="bold" mb={1}>매칭 정보</Typography>
          <Typography variant="body2">매칭 횟수: 2회</Typography>
          <Typography variant="body2">마지막 매칭: 2025-02-15</Typography>
        </Box>

        {userData.matchedPartner && (
          <Box mb={2} p={2} bgcolor="#e3f2fd" borderRadius={1}>
            <Typography variant="subtitle2" fontWeight="bold" mb={1}>이전 매칭 파트너</Typography>
            <Typography variant="body2">{userData.matchedPartner.name}</Typography>
            <Link href={`https://instagram.com/${userData.matchedPartner.instagramId}`} target="_blank" underline="hover">
              @{userData.matchedPartner.instagramId}
            </Link>
          </Box>
        )}

        {userData.newPartner && (
          <Box mb={2} p={2} bgcolor="#e8f5e9" borderRadius={1}>
            <Typography variant="subtitle2" fontWeight="bold" mb={1}>새 매칭 파트너</Typography>
            <Typography variant="body2">{userData.newPartner.name}</Typography>
            <Link href={`https://instagram.com/${userData.newPartner.instagramId}`} target="_blank" underline="hover">
              @{userData.newPartner.instagramId}
            </Link>
          </Box>
        )}
      </Box>
    </Modal>
  );
}

// calculateMatchScore 함수 정의
const calculateMatchScore = (profile1: any, profile2: any, preferences: any) => {
  let score = 0;
  const details: any = {};

  // 같은 학과인 경우 매칭 제외
  if (profile1.department === profile2.department) {
    return { score: 0, details: { 제외사유: '같은 학과' } };
  }

  // 1. 나이 선호도 점수 (35점)
  const ageDiff = Math.abs(profile2.age - profile1.age);
  let ageScore = 0;

  switch (preferences.preferred_age_type) {
    case '동갑':
      ageScore = ageDiff === 0 ? 35 : Math.max(0, 25 - (ageDiff * 5));
      break;
    case '연상':
      ageScore = profile2.age > profile1.age ? Math.max(0, 35 - (ageDiff * 3)) : 0;
      break;
    case '연하':
      ageScore = profile2.age < profile1.age ? Math.max(0, 35 - (ageDiff * 3)) : 0;
      break;
    default: // '상관없음'
      ageScore = Math.max(0, 25 - (ageDiff * 2));
  }
  score += ageScore;
  details['나이 점수'] = ageScore;

  // 2. MBTI 점수 (15점)
  const mbtiScore = preferences.preferred_mbti?.includes(profile2.mbti) ? 15 : 0;
  score += mbtiScore;
  details['MBTI 점수'] = mbtiScore;

  // 3. 성격 매칭 점수 (20점)
  const personalityScore = profile2.personalities?.filter((p: string) =>
    preferences.preferred_personalities?.includes(p)
  ).length * 5 || 0;
  score += Math.min(personalityScore, 20);
  details['성격 점수'] = Math.min(personalityScore, 20);

  // 4. 데이트 스타일 매칭 점수 (20점)
  const styleScore = profile2.dating_styles?.filter((s: string) =>
    preferences.preferred_dating_styles?.includes(s)
  ).length * 5 || 0;
  score += Math.min(styleScore, 20);
  details['데이트 스타일 점수'] = Math.min(styleScore, 20);

  // 5. 기타 선호도 점수 (10점)
  let otherScore = 0;
  if (preferences.preferred_smoking === profile2.smoking) otherScore += 4;
  if (preferences.preferred_drinking === profile2.drinking) otherScore += 3;
  if (preferences.preferred_tattoo === profile2.tattoo) otherScore += 3;
  score += otherScore;
  details['기타 선호도 점수'] = otherScore;

  details['총점'] = score;
  return { score, details };
};

export default function RematchRequestPage() {
  const [rematchRequests, setRematchRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; content: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const onFailureRedirectMain = () => {
    AdminService.auth.cleanup();
    alert("어드민 권한 만료로 로그인화면으로 이동합니다.");
    router.push('/');
  };

  const withErrorHandler = async <T,>(
    callback: () => Promise<T>,
    onError?: (error: any) => void
  ): Promise<T | undefined> => {
    try {
      return await callback();
    } catch (error) {
      console.error('Error:', error);
      if (onError) {
        onError(error);
      }
      onFailureRedirectMain();
      return undefined;
    }
  };

  const fetchRematchRequests = async () => {
    setIsLoading(true);
    await withErrorHandler(async () => {
      console.log('재매칭 요청 조회 시작');
      const response = await fetch('/api/admin/rematch-requests');

      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('재매칭 요청 데이터:', data);

      // API 응답에 필요한 상태 정보가 없을 경우를 위한 임시 처리
      const enhancedRequests = (data.requests || []).map((req: any) => ({
        ...req,
        depositConfirmed: req.depositConfirmed || false,
      }));

      setRematchRequests(enhancedRequests);

      if (enhancedRequests.length > 0) {
        setMessage({
          type: 'info',
          content: `${enhancedRequests.length}건의 재매칭 요청이 있습니다.`
        });
      } else {
        setMessage({
          type: 'info',
          content: '현재 재매칭 요청이 없습니다.'
        });
      }
    }, (error) => {
      console.error('재매칭 요청 조회 실패:', error);
      setMessage({
        type: 'error',
        content: '재매칭 요청 목록을 불러오는데 실패했습니다.'
      });
    });
    setIsLoading(false);
  };

  // 프로필 모달 열기
  const openProfileModal = (user: any) => {
    setSelectedUser(user);
    setProfileModalOpen(true);
  };

  // 프로필 모달 닫기
  const closeProfileModal = () => {
    setProfileModalOpen(false);
  };

  // 입금 확인 처리
  const confirmDeposit = async (requestId: string) => {
    await withErrorHandler(async () => {
      console.log('입금 확인 처리 시작:', requestId);

      // 실제로는 API 호출이 필요하지만 테스트를 위해 로컬 상태만 업데이트
      setRematchRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId
            ? { ...req, status: 'deposit_confirmed', depositConfirmed: true }
            : req
        )
      );

      setMessage({
        type: 'success',
        content: '입금이 확인되었습니다.'
      });
    }, (error) => {
      console.error('입금 확인 중 오류 발생:', error);
      setMessage({
        type: 'error',
        content: error instanceof Error ? error.message : '입금 확인에 실패했습니다.'
      });
    });
  };

  // 재매칭 처리
  const processRematch = async (userId: string) => {
  };

  // 검색어에 따라 필터링된 요청 목록을 반환하는 함수
  const filteredRequests = rematchRequests.filter(request =>
    request.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchRematchRequests();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <Typography variant="h4" component="h1" gutterBottom>
          재매칭 요청 관리
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={fetchRematchRequests}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : '목록 새로고침'}
        </Button>
      </div>

      {/* 검색 입력창 추가 */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="이름으로 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="검색할 이름을 입력하세요"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setSearchQuery('')}
                  edge="end"
                >
                  <CloseIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {message && (
        <Alert
          severity={message.type}
          onClose={() => setMessage(null)}
          className="mb-4"
        >
          {message.content}
        </Alert>
      )}

      {/* 사용자 프로필 모달 */}
      <UserProfileModal
        open={profileModalOpen}
        onClose={closeProfileModal}
        userData={selectedUser}
      />

      {isLoading ? (
        <div className="flex justify-center my-8">
          <CircularProgress />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <Card key={request.id} className="mb-4">
                <CardContent>
                  <div className="flex justify-between items-start">
                    <div>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography variant="h6" component="div">
                          {request.userName || '이름 없음'} ({request.gender || '성별 미상'})
                        </Typography>

                        {/* 상태 표시 */}
                        {request.status === 'pending' && (
                          <Chip size="small" label="대기중" color="warning" sx={{ ml: 1 }} />
                        )}
                        {request.status === 'deposit_confirmed' && (
                          <Chip size="small" label="입금확인" color="success" sx={{ ml: 1 }} />
                        )}
                        {request.status === 'matched' && (
                          <Chip size="small" label="재매칭완료" color="primary" sx={{ ml: 1 }} />
                        )}
                      </Box>

                      <Typography variant="body2" color="textSecondary" mb={1}>
                        요청 시간: {new Date(request.created_at).toLocaleString('ko-KR')}
                      </Typography>

                      <Button
                        startIcon={<PersonIcon />}
                        size="small"
                        sx={{ mb: 2, textTransform: 'none' }}
                        onClick={() => openProfileModal(request)}
                      >
                        상세 정보 보기
                      </Button>

                      {/* 매칭된 파트너 정보 */}
                      <Box p={1.5} mb={1} bgcolor="#e3f2fd" borderRadius={1}>
                        <Typography variant="body2" fontWeight="medium" mb={0.5}>
                          이전 매칭 파트너:
                        </Typography>
                        {request.matchedPartner ? (
                          <Typography variant="body2">
                            {request.matchedPartner.name} -
                            <Link href={`https://instagram.com/${request.matchedPartner.instagramId}`} target="_blank" underline="hover">
                              @{request.matchedPartner.instagramId}
                            </Link>
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            매칭된 파트너가 없습니다.
                          </Typography>
                        )}
                      </Box>

                      {/* 새로 매칭된 파트너 정보 (재매칭 완료 시) */}
                      {request.status === 'matched' && request.newPartner && (
                        <Box p={1.5} mb={1} bgcolor="#e8f5e9" borderRadius={1}>
                          <Typography variant="body2" fontWeight="medium" mb={0.5}>
                            새 매칭 파트너:
                          </Typography>
                          <Typography variant="body2">
                            {request.newPartner.name} -
                            <Link href={`https://instagram.com/${request.newPartner.instagramId}`} target="_blank" underline="hover">
                              @{request.newPartner.instagramId}
                            </Link>
                          </Typography>
                        </Box>
                      )}
                    </div>

                    <div>
                      {/* 대기 중인 경우 입금 확인 버튼 */}
                      {request.status === 'pending' && (
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => confirmDeposit(request.id)}
                        >
                          입금 확인
                        </Button>
                      )}

                      {/* 입금 확인된 경우 재매칭 처리 버튼 */}
                      {request.status === 'deposit_confirmed' && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => processRematch(request.user_id)}
                        >
                          재매칭 처리
                        </Button>
                      )}

                      {/* 처리 완료된 경우 */}
                      {request.status === 'matched' && (
                        <Typography variant="body2" color="success.main" fontWeight="medium">
                          처리 완료
                        </Typography>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent>
                <Typography variant="body1" className="text-center">
                  현재 재매칭 요청이 없습니다.
                </Typography>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 