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
  Link
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';

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

export default function RematchRequestPage() {
  const [rematchRequests, setRematchRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; content: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const fetchRematchRequests = async () => {
    try {
      setIsLoading(true);
      console.log('재매칭 요청 조회 시작');
      const response = await fetch('/api/admin/rematch-requests');
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('재매칭 요청 데이터:', data);
      
      // API 응답에 필요한 상태 정보가 없을 경우를 위한 임시 처리
      const enhancedRequests = (data.requests || []).map(req => ({
        ...req,
        status: req.status || 'pending', // 상태가 없으면 'pending'으로 설정
        depositConfirmed: req.depositConfirmed || false,
        matchedPartner: req.matchedPartner || {
          name: req.gender === '여성' ? '김민준' : '이서연',
          instagramId: req.gender === '여성' ? 'mj_kim97' : 'seoyeon_lee'
        }
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
    } catch (error) {
      console.error('재매칭 요청 조회 실패:', error);
      setMessage({
        type: 'error',
        content: '재매칭 요청 목록을 불러오는데 실패했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
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
    try {
      console.log('입금 확인 처리 시작:', requestId);
      
      // 실제로는 API 호출이 필요하지만 테스트를 위해 로컬 상태만 업데이트
      setRematchRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId 
            ? {...req, status: 'deposit_confirmed', depositConfirmed: true} 
            : req
        )
      );

      setMessage({
        type: 'success',
        content: '입금이 확인되었습니다.'
      });
    } catch (error) {
      console.error('입금 확인 중 오류 발생:', error);
      setMessage({
        type: 'error',
        content: error instanceof Error ? error.message : '입금 확인에 실패했습니다.'
      });
    }
  };

  // 재매칭 처리
  const processRematch = async (userId: string) => {
    try {
      console.log('재매칭 처리 시작:', userId);
      
      const response = await fetch('/api/admin/process-rematch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('재매칭 처리 결과:', data);

      // 재매칭 요청 목록 새로고침
      // fetchRematchRequests();
      
      // 테스트를 위해 로컬 상태 업데이트 - API가 완전히 구현된 후에는 fetchRematchRequests로 대체
      setRematchRequests(prevRequests => 
        prevRequests.map(req => 
          req.user_id === userId 
            ? {
                ...req, 
                status: 'completed',
                newPartner: {
                  name: '정유진',
                  instagramId: 'yujin_jung97'
                }
              } 
            : req
        )
      );

      setMessage({
        type: 'success',
        content: '재매칭이 성공적으로 처리되었습니다.'
      });
    } catch (error) {
      console.error('재매칭 처리 중 오류 발생:', error);
      setMessage({
        type: 'error',
        content: error instanceof Error ? error.message : '재매칭 처리에 실패했습니다.'
      });
    }
  };

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
          {rematchRequests.length > 0 ? (
            rematchRequests.map((request) => (
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
                        {request.status === 'completed' && (
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
                      {request.matchedPartner && (
                        <Box p={1.5} mb={1} bgcolor="#e3f2fd" borderRadius={1}>
                          <Typography variant="body2" fontWeight="medium" mb={0.5}>
                            이전 매칭 파트너:
                          </Typography>
                          <Typography variant="body2">
                            {request.matchedPartner.name} - 
                            <Link href={`https://instagram.com/${request.matchedPartner.instagramId}`} target="_blank" underline="hover">
                              @{request.matchedPartner.instagramId}
                            </Link>
                          </Typography>
                        </Box>
                      )}
                      
                      {/* 새로 매칭된 파트너 정보 (재매칭 완료 시) */}
                      {request.status === 'completed' && request.newPartner && (
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
                      {request.status === 'completed' && (
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