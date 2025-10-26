import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  TableRow,
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Checkbox,
  TextField,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InstagramIcon from '@mui/icons-material/Instagram';
import SchoolIcon from '@mui/icons-material/School';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BlockIcon from '@mui/icons-material/Block';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import DiamondIcon from '@mui/icons-material/Diamond';
import AdminService from '@/app/services/admin';
import { formatDateWithoutTimezoneConversion, formatDateTimeWithoutTimezoneConversion } from '@/app/utils/formatters';

// 관리 기능 모달 컴포넌트들
import EditProfileModal from './modals/EditProfileModal';
import EmailNotificationModal from './modals/EmailNotificationModal';
import SmsNotificationModal from './modals/SmsNotificationModal';

// 성별 레이블
const GENDER_LABELS = {
  MALE: '남성',
  FEMALE: '여성'
};

// 회원가입 루트 레이블
const SIGNUP_ROUTE_LABELS = {
  PASS: 'PASS',
  KAKAO: '카카오',
  APPLE: '애플'
};

// 선호도 옵션 타입
interface PreferenceOption {
  id: string;
  displayName: string;
}

// 선호도 타입
interface Preference {
  typeName: string;
  selectedOptions: PreferenceOption[];
}

// 사용자 선호도 타입
interface UserPreferences {
  self?: Preference[];
  partner?: Preference[];
}

// 유저 상세 정보 타입
export interface UserDetail {
  id: string;
  name: string;
  age: number;
  birthday?: string;
  gender: 'MALE' | 'FEMALE';
  profileImages: {
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
  isUniversityVerified?: boolean; // 대학교 인증 여부
  accountStatus?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'; // 승인 상태
  preferences?: UserPreferences;
  signupRoute?: 'PASS' | 'KAKAO' | 'APPLE'; // 회원가입 루트
  // 추가 필드
  [key: string]: any;
}

interface UserDetailModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  userDetail: UserDetail;
  loading: boolean;
  error: string | null;
  onRefresh?: () => void; // 데이터 새로고침 콜백
  showApprovalActions?: boolean; // 승인 관리 액션 표시 여부
  onApproval?: () => void; // 승인 버튼 클릭 콜백
  onRejection?: () => void; // 거부 버튼 클릭 콜백
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  open,
  onClose,
  userId,
  userDetail: initialUserDetail,
  loading: initialLoading,
  error: initialError,
  onRefresh,
  showApprovalActions = false,
  onApproval,
  onRejection
}) => {
  // 내부 상태로 사용자 상세 정보 관리
  const [userDetail, setUserDetail] = useState(initialUserDetail);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState(initialError);

  // 관리 메뉴 상태
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);
  console.log({ userDetail });
  const [selectedImage, setSelectedImage] = useState<string>(
    (() => {
      if (userDetail.profileImages && userDetail.profileImages.length > 0) {
        const mainImage = userDetail.profileImages.find(img => img.isMain === true);
        return mainImage ? mainImage.url : userDetail.profileImages[0].url;
      }
      if (userDetail.profileImageUrl) {
        return userDetail.profileImageUrl;
      }
      // 기본 이미지 또는 빈 문자열
      return userDetail.gender === 'MALE'
        ? `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 50) + 1}.jpg`
        : `https://randomuser.me/api/portraits/women/${Math.floor(Math.random() * 50) + 1}.jpg`;
    })()
  );

  // 외모 등급 상태
  const [appearanceGrade, setAppearanceGrade] = useState<'S' | 'A' | 'B' | 'C' | 'UNKNOWN'>(
    userDetail.appearanceGrade || userDetail.appearanceRank || 'UNKNOWN'
  );

  // props가 변경되면 내부 상태 업데이트
  useEffect(() => {
    setUserDetail(initialUserDetail);
    // 외모 등급도 함께 초기화
    setAppearanceGrade(initialUserDetail.appearanceGrade || initialUserDetail.appearanceRank || 'UNKNOWN');
    setLoading(initialLoading);
    setError(initialError);

    if (initialUserDetail) {
      if (initialUserDetail.profileImages && initialUserDetail.profileImages.length > 0) {
        const mainImage = initialUserDetail.profileImages.find(img => img.isMain === true);
        const imageUrl = mainImage ? mainImage.url : initialUserDetail.profileImages[0].url;
        setSelectedImage(imageUrl);
      } else if (initialUserDetail.profileImageUrl) {
        setSelectedImage(initialUserDetail.profileImageUrl);
      } else {
        const defaultImage = initialUserDetail.gender === 'MALE'
          ? `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 50) + 1}.jpg`
          : `https://randomuser.me/api/portraits/women/${Math.floor(Math.random() * 50) + 1}.jpg`;
        setSelectedImage(defaultImage);
      }
    }
  }, [initialUserDetail, initialLoading, initialError]);

  // 모달이 열릴 때마다 외모 등급 초기화
  useEffect(() => {
    if (open) {
      setAppearanceGrade(userDetail.appearanceGrade || userDetail.appearanceRank || 'UNKNOWN');
    }
  }, [open, userDetail.appearanceGrade, userDetail.appearanceRank]);

  // userId가 변경되면 사용자 데이터 로드
  useEffect(() => {
    if (userId && open && !initialUserDetail?.id) {
      refreshUserDetail();
    }
  }, [userId, open]);

  // 모달이 열릴 때 티켓 정보 로드
  useEffect(() => {
    if (userId && open) {
      fetchTicketInfo();
      fetchGemsInfo();
    }
  }, [userId, open]);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setSelectedImage('');
    }
  }, [open]);
  const [savingGrade, setSavingGrade] = useState(false);

  // 모달 상태
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [emailNotificationModalOpen, setEmailNotificationModalOpen] = useState(false);
  const [smsNotificationModalOpen, setSmsNotificationModalOpen] = useState(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [revokeApprovalModalOpen, setRevokeApprovalModalOpen] = useState(false);

  // 작업 상태
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // 회원 탈퇴 관련 상태
  const [sendEmailOnDelete, setSendEmailOnDelete] = useState(false);
  const [addToBlacklist, setAddToBlacklist] = useState(false);

  // 재매칭 티켓 관련 상태
  const [ticketInfo, setTicketInfo] = useState<any>(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [ticketAddModalOpen, setTicketAddModalOpen] = useState(false);
  const [ticketRemoveModalOpen, setTicketRemoveModalOpen] = useState(false);
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [ticketActionLoading, setTicketActionLoading] = useState(false);

  // 구슬 관련 상태
  const [gemsInfo, setGemsInfo] = useState<any>(null);
  const [gemsLoading, setGemsLoading] = useState(false);
  const [gemsError, setGemsError] = useState<string | null>(null);
  const [gemsCount, setGemsCount] = useState<number>(1);
  const [gemsActionLoading, setGemsActionLoading] = useState(false);
  const [gemsAddModalOpen, setGemsAddModalOpen] = useState(false);
  const [gemsRemoveModalOpen, setGemsRemoveModalOpen] = useState(false);

  // 승인 취소 관련 상태
  const [revokeReason, setRevokeReason] = useState<string>('');
  const [customRevokeReason, setCustomRevokeReason] = useState<string>('');
  const [revokeActionLoading, setRevokeActionLoading] = useState(false);

  const rejectionReasons = [
    { value: 'LONG_TERM_INACTIVE_REAPPLY', label: '[장기 미접속]-재심사를 요청해주세요' },
    { value: 'PROFILE_PHOTO_CLEAR_FACE', label: '프로필 사진을 본인 얼굴이 잘 보이는 사진으로 변경해주세요' },
    { value: 'PROFILE_PHOTO_SELF', label: '본인 사진으로 프로필을 변경해주세요' },
    { value: 'PROFILE_PHOTO_NATURAL', label: '상대방이 봐도 부담스럽지 않은 자연스러운 사진으로 변경해주세요' },
    { value: 'PROFILE_PHOTO_FORMAT_UNSUPPORTED', label: '프로필 이미지 형식 지원 안함(jpg, jpeg, png 지원)' },
    { value: 'INSTAGRAM_ID_CORRECT', label: '인스타그램 ID를 정확히 입력해주세요' },
    { value: 'INSTAGRAM_ID_MAIN_ACCOUNT', label: '인스타그램 본계정으로 변경해주세요' },
    { value: 'INSTAGRAM_ID_PUBLIC', label: '인스타그램을 공개계정으로 설정해주세요' },
    { value: 'INSTAGRAM_ID_ACTIVE', label: '활동 내역이 있는 인스타그램 계정으로 변경해주세요' },
    { value: 'INSTAGRAM_ID_VERIFIABLE', label: '본인 확인이 가능한 인스타그램 계정으로 변경해주세요' },
    { value: 'BOTH_PROFILE_AND_INSTAGRAM', label: '프로필 사진과 인스타그램 ID 모두 수정 후 재신청해주세요' },
    { value: 'NOT_ELIGIBLE', label: '현재 썸타임 이용 조건에 맞지 않아 승인이 어렵습니다' },
    { value: 'FOREIGN_STUDENT_NOT_ACCEPTED', label: '죄송하지만 현재 외국인 유학생 회원가입을 받고 있지 않습니다' },
    { value: 'IDENTITY_VERIFICATION_DIFFICULT', label: '본인 확인이 어려워 승인이 어렵습니다' },
    { value: 'RELIABLE_PROFILE_REQUIRED', label: '신뢰할 수 있는 프로필 정보로 수정 후 재신청해주세요' },
    { value: 'OTHER', label: '기타 (직접 입력)' }
  ];
  const getRejectionReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      'PROFILE_PHOTO_CLEAR_FACE': '프로필 사진을 본인 얼굴이 잘 보이는 사진으로 변경해주세요',
      'PROFILE_PHOTO_SELF': '본인 사진으로 프로필을 변경해주세요',
      'PROFILE_PHOTO_NATURAL': '상대방이 봐도 부담스럽지 않은 자연스러운 사진으로 변경해주세요',
      'PROFILE_PHOTO_FORMAT_UNSUPPORTED': '프로필 이미지 형식 지원 안함(jpg, jpeg, png 지원)',
      'INSTAGRAM_ID_CORRECT': '인스타그램 ID를 정확히 입력해주세요',
      'INSTAGRAM_ID_MAIN_ACCOUNT': '인스타그램 본계정으로 변경해주세요',
      'INSTAGRAM_ID_PUBLIC': '인스타그램을 공개계정으로 설정해주세요',
      'INSTAGRAM_ID_ACTIVE': '활동 내역이 있는 인스타그램 계정으로 변경해주세요',
      'INSTAGRAM_ID_VERIFIABLE': '본인 확인이 가능한 인스타그램 계정으로 변경해주세요',
      'BOTH_PROFILE_AND_INSTAGRAM': '프로필 사진과 인스타그램 ID 모두 수정 후 재신청해주세요',
      'NOT_ELIGIBLE': '현재 썸타임 이용 조건에 맞지 않아 승인이 어렵습니다',
      'LONG_TERM_INACTIVE_REAPPLY': '[장기 미접속]-재심사를 요청해주세요',
      'FOREIGN_STUDENT_NOT_ACCEPTED': '죄송하지만 현재 외국인 유학생 회원가입을 받고 있지 않습니다',
      'IDENTITY_VERIFICATION_DIFFICULT': '본인 확인이 어려워 승인이 어렵습니다',
      'RELIABLE_PROFILE_REQUIRED': '신뢰할 수 있는 프로필 정보로 수정 후 재신청해주세요',
      'OTHER': '기타'
    };
    return reasonMap[reason] || reason;
  };

  // 메뉴 열기
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  // 메뉴 닫기
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  // 프로필 직접 수정 모달 열기
  const handleOpenEditProfileModal = () => {
    handleCloseMenu();
    setEditProfileModalOpen(true);
  };

  // 이메일 발송 모달 열기
  const handleOpenEmailNotificationModal = () => {
    handleCloseMenu();
    setEmailNotificationModalOpen(true);
  };

  // SMS 발송 모달 열기
  const handleOpenSmsNotificationModal = () => {
    handleCloseMenu();
    setSmsNotificationModalOpen(true);
  };

  // 외모 등급 변경 처리
  const handleAppearanceGradeChange = async (
    event: React.MouseEvent<HTMLElement>,
    newGrade: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN'
  ) => {
    if (!userId || !newGrade || newGrade === appearanceGrade) return;

    try {
      setSavingGrade(true);
      setActionError(null);

      await AdminService.userAppearance.setUserAppearanceGrade(userId, newGrade);

      setAppearanceGrade(newGrade);
      setActionSuccess(`외모 등급이 ${newGrade}로 변경되었습니다.`);

      // 부모 컴포넌트에 변경 알림
      if (onRefresh) onRefresh();
    } catch (error: any) {
      setActionError(error.message || '외모 등급 변경 중 오류가 발생했습니다.');
      console.error('외모 등급 변경 중 오류:', error);
    } finally {
      setSavingGrade(false);
    }
  };

  // 인스타그램 오류 상태 설정
  const handleSetInstagramError = async () => {
    if (!userId) return;

    try {
      setActionLoading(true);
      setActionError(null);

      await AdminService.userAppearance.setInstagramError(userId);

      setActionSuccess('인스타그램 오류 상태가 설정되었습니다.');
      if (onRefresh) onRefresh();
    } catch (error: any) {
      setActionError(error.message ?? '인스타그램 오류 상태 설정 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 재매칭 티켓 정보 조회
  const fetchTicketInfo = async () => {
    if (!userId) return;

    try {
      setTicketLoading(true);
      setTicketError(null);

      console.log('재매칭 티켓 정보 조회 요청:', userId);
      const data = await AdminService.userAppearance.getUserTickets(userId);
      console.log('재매칭 티켓 정보 응답:', data);

      setTicketInfo(data);
    } catch (error: any) {
      console.error('재매칭 티켓 정보 조회 중 오류:', error);
      setTicketError(error.message || '재매칭 티켓 정보를 조회하는 중 오류가 발생했습니다.');
    } finally {
      setTicketLoading(false);
    }
  };

  // 재매칭 티켓 추가
  const handleAddTickets = async () => {
    if (!userId) return;

    try {
      setTicketActionLoading(true);
      setTicketError(null);

      console.log('재매칭 티켓 추가 요청:', { userId, count: ticketCount });
      await AdminService.userAppearance.createUserTickets(userId, ticketCount);

      // 성공 메시지 표시
      setActionSuccess(`재매칭 티켓 ${ticketCount}장이 추가되었습니다.`);

      // 티켓 정보 새로고침
      await fetchTicketInfo();

      // 모달 닫기
      setTicketAddModalOpen(false);
      setTicketCount(1);
    } catch (error: any) {
      console.error('재매칭 티켓 추가 중 오류:', error);
      setTicketError(error.message || '재매칭 티켓 추가 중 오류가 발생했습니다.');
    } finally {
      setTicketActionLoading(false);
    }
  };

  // 재매칭 티켓 제거
  const handleRemoveTickets = async () => {
    if (!userId) return;

    try {
      setTicketActionLoading(true);
      setTicketError(null);

      console.log('재매칭 티켓 제거 요청:', { userId, count: ticketCount });
      await AdminService.userAppearance.deleteUserTickets(userId, ticketCount);

      // 성공 메시지 표시
      setActionSuccess(`재매칭 티켓 ${ticketCount}장이 제거되었습니다.`);

      // 티켓 정보 새로고침
      await fetchTicketInfo();

      // 모달 닫기
      setTicketRemoveModalOpen(false);
      setTicketCount(1);
    } catch (error: any) {
      console.error('재매칭 티켓 제거 중 오류:', error);
      setTicketError(error.message || '재매칭 티켓 제거 중 오류가 발생했습니다.');
    } finally {
      setTicketActionLoading(false);
    }
  };

  // 구슬 정보 조회
  const fetchGemsInfo = async () => {
    if (!userId) return;

    try {
      setGemsLoading(true);
      setGemsError(null);

      console.log('구슬 정보 조회 요청:', userId);
      const response = await AdminService.userAppearance.getUserGems(userId);
      console.log('구슬 정보 조회 응답:', response);

      setGemsInfo(response);
    } catch (error: any) {
      console.error('구슬 정보 조회 중 오류:', error);
      setGemsError(error.message || '구슬 정보 조회 중 오류가 발생했습니다.');
    } finally {
      setGemsLoading(false);
    }
  };

  // 구슬 추가
  const handleAddGems = async () => {
    if (!userId) return;

    try {
      setGemsActionLoading(true);
      setGemsError(null);

      console.log('구슬 추가 요청:', { userId, count: gemsCount });
      await AdminService.userAppearance.addUserGems(userId, gemsCount);

      // 성공 메시지 표시
      setActionSuccess(`구슬 ${gemsCount}개가 추가되었습니다.`);

      // 구슬 정보 새로고침
      await fetchGemsInfo();

      // 모달 닫기
      setGemsAddModalOpen(false);
      setGemsCount(1);
    } catch (error: any) {
      console.error('구슬 추가 중 오류:', error);
      setGemsError(error.message || '구슬 추가 중 오류가 발생했습니다.');
    } finally {
      setGemsActionLoading(false);
    }
  };

  // 구슬 제거
  const handleRemoveGems = async () => {
    if (!userId) return;

    try {
      setGemsActionLoading(true);
      setGemsError(null);

      console.log('구슬 제거 요청:', { userId, count: gemsCount });
      await AdminService.userAppearance.removeUserGems(userId, gemsCount);

      // 성공 메시지 표시
      setActionSuccess(`구슬 ${gemsCount}개가 제거되었습니다.`);

      // 구슬 정보 새로고침
      await fetchGemsInfo();

      // 모달 닫기
      setGemsRemoveModalOpen(false);
      setGemsCount(1);
    } catch (error: any) {
      console.error('구슬 제거 중 오류:', error);
      setGemsError(error.message || '구슬 제거 중 오류가 발생했습니다.');
    } finally {
      setGemsActionLoading(false);
    }
  };

  // 사용자 상세 정보 새로고침
  const refreshUserDetail = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('사용자 상세 정보 새로고침 요청:', userId);
      const data = await AdminService.userAppearance.getUserDetails(userId);
      console.log('사용자 상세 정보 새로고침 응답:', data);

      setUserDetail(data);

      // 이미지 선택 상태 업데이트
      if (data.profileImages && data.profileImages.length > 0) {
        const mainImage = data.profileImages.find((img: any) => img.isMain === true);
        const imageUrl = mainImage ? mainImage.url : data.profileImages[0].url;
        setSelectedImage(imageUrl);
      } else if (data.profileImageUrl) {
        setSelectedImage(data.profileImageUrl);
      } else {
        // 기본 이미지 설정
        const defaultImage = data.gender === 'MALE'
          ? `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 50) + 1}.jpg`
          : `https://randomuser.me/api/portraits/women/${Math.floor(Math.random() * 50) + 1}.jpg`;
        setSelectedImage(defaultImage);
      }

      // 외모 등급 상태 업데이트
      setAppearanceGrade(data.appearanceGrade || data.appearanceRank || 'UNKNOWN');

    } catch (error: any) {
      console.error('사용자 상세 정보 새로고침 중 오류:', error);
      setError(error.message || '사용자 상세 정보를 새로고침하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 인스타그램 오류 상태 해제
  const handleResetInstagramError = async () => {
    if (!userId) return;

    try {
      setActionLoading(true);
      setActionError(null);

      await AdminService.userAppearance.resetInstagramError(userId);

      setActionSuccess('인스타그램 오류 상태가 해제되었습니다.');
      if (onRefresh) onRefresh();
    } catch (error: any) {
      setActionError(error.message ?? '인스타그램 오류 상태 해제 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 회원 탈퇴 확인 다이얼로그 열기
  const handleDeleteUser = () => {
    handleCloseMenu();
    setDeleteConfirmModalOpen(true);
    setSendEmailOnDelete(true);
    setAddToBlacklist(false); // 기본값 false로 설정
  };

  // 실제 회원 탈퇴 처리
  const handleConfirmDeleteUser = async () => {
    if (!userId) return;

    try {
      setActionLoading(true);
      setActionError(null);
      setDeleteConfirmModalOpen(false);

      await AdminService.userAppearance.deleteUser(userId, sendEmailOnDelete, addToBlacklist);

      const successMessages = [];
      successMessages.push('회원이 성공적으로 탈퇴되었습니다.');
      if (sendEmailOnDelete) successMessages.push('이메일 발송됨');
      if (addToBlacklist) successMessages.push('블랙리스트 추가됨');

      setActionSuccess(successMessages.join(' / '));
      if (onRefresh) onRefresh();
      onClose();
    } catch (error: any) {
      setActionError(error.message || '회원 탈퇴 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 대학교 인증 승인 처리
  const handleUniversityApproval = async () => {
    if (!userDetail) return;

    try {
      setActionLoading(true);
      setActionError(null);

      await AdminService.userAppearance.approveUniversityVerification(userDetail.id);
      setUserDetail(prev => prev ? { ...prev, isUniversityVerified: true } : prev);

      setActionSuccess('대학교 인증이 승인되었습니다.');
      if (onRefresh) onRefresh();
    } catch (error: any) {
      setActionError(error.message || '대학교 인증 승인 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 승인 취소 처리
  const handleRevokeApproval = async () => {
    if (!userId) return;

    if (revokeReason === 'OTHER' && !customRevokeReason.trim()) return;
    if (revokeReason !== 'OTHER' && !revokeReason.trim()) return;

    try {
      setRevokeActionLoading(true);
      setActionError(null);

      const finalRevokeReason = revokeReason === 'OTHER'
        ? customRevokeReason.trim()
        : getRejectionReasonLabel(revokeReason);

      await AdminService.userAppearance.revokeUserApproval(userId, finalRevokeReason);

      // 사용자 상태 업데이트
      setUserDetail(prev => prev ? { ...prev, approvalStatus: 'REJECTED' } : prev);

      // 성공 메시지 표시
      setActionSuccess('사용자의 승인이 취소되었습니다.');

      // 모달 닫기 및 상태 초기화
      setRevokeApprovalModalOpen(false);
      setRevokeReason('');
      setCustomRevokeReason('');

      // 부모 컴포넌트에 변경 알림
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('승인 취소 중 오류:', error);
      setActionError(error.message || '승인 취소 중 오류가 발생했습니다.');
    } finally {
      setRevokeActionLoading(false);
    }
  };

  // 승인 취소 모달 열기
  const handleOpenRevokeApprovalModal = () => {
    handleCloseMenu();
    setRevokeApprovalModalOpen(true);
    setRevokeReason('');
    setCustomRevokeReason('');
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
        <MenuItem onClick={handleOpenEditProfileModal}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>프로필 직접 수정</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleOpenEmailNotificationModal}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>이메일 발송</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenSmsNotificationModal}>
          <ListItemIcon>
            <PhoneIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>SMS 발송</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteUser} disabled={actionLoading}>
          <ListItemIcon>
            <BlockIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="회원 탈퇴" primaryTypographyProps={{ color: 'error' }} />
        </MenuItem>
        {showApprovalActions && (
          <>
            <Divider />
            <MenuItem onClick={onApproval} disabled={actionLoading}>
              <ListItemIcon>
                <PersonIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText primary="가입 승인" primaryTypographyProps={{ color: 'primary' }} />
            </MenuItem>
            <MenuItem onClick={onRejection} disabled={actionLoading}>
              <ListItemIcon>
                <BlockIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText primary="가입 거부" primaryTypographyProps={{ color: 'error' }} />
            </MenuItem>
          </>
        )}
        {/* 승인 취소 메뉴 - 모든 사용자에게 표시 */}
        <Divider />
        <MenuItem onClick={handleOpenRevokeApprovalModal} disabled={actionLoading}>
          <ListItemIcon>
            <BlockIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText primary="승인 취소" primaryTypographyProps={{ color: 'warning.main' }} />
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
                      src={selectedImage}
                      alt={userDetail.name}
                      sx={{
                        width: '100%',
                        height: 400,
                        objectFit: 'contain',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        backgroundColor: '#f5f5f5'
                      }}
                    />
                    {/* 메인 이미지 표시 */}
                    <Chip
                      label="선택 이미지"
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
                    src={selectedImage}
                    alt={userDetail.name}
                    sx={{
                      width: '100%',
                      height: 400,
                      objectFit: 'contain',
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      backgroundColor: '#f5f5f5'
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
                      objectFit: 'contain',
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      backgroundColor: '#f5f5f5'
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
                        전체 이미지 ({userDetail.profileImages.length}장)
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {userDetail.profileImages.map((image, index) => (
                          <Box
                            key={image.id}
                            sx={{ position: 'relative' }}
                          >
                            <Box
                              component="img"
                              onClick={() => setSelectedImage(image.url)}
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
                              {index + 1}번째
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

                    {/* 외모 등급 토글 버튼 */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ mr: 1, fontWeight: 'bold' }}>
                        외모 등급:
                      </Typography>
                      <ToggleButtonGroup
                        value={appearanceGrade}
                        exclusive
                        onChange={handleAppearanceGradeChange}
                        size="small"
                        disabled={savingGrade || actionLoading}
                        aria-label="외모 등급"
                      >
                        <ToggleButton value="S" aria-label="S등급" sx={{
                          bgcolor: appearanceGrade === 'S' ? '#8E44AD' : 'transparent',
                          color: appearanceGrade === 'S' ? 'white' : '#8E44AD',
                          '&:hover': { bgcolor: appearanceGrade === 'S' ? '#8E44AD' : 'rgba(142, 68, 173, 0.1)' },
                          fontWeight: 'bold',
                          minWidth: '36px',
                          px: 1
                        }}>
                          S
                        </ToggleButton>
                        <ToggleButton value="A" aria-label="A등급" sx={{
                          bgcolor: appearanceGrade === 'A' ? '#3498DB' : 'transparent',
                          color: appearanceGrade === 'A' ? 'white' : '#3498DB',
                          '&:hover': { bgcolor: appearanceGrade === 'A' ? '#3498DB' : 'rgba(52, 152, 219, 0.1)' },
                          fontWeight: 'bold',
                          minWidth: '36px',
                          px: 1
                        }}>
                          A
                        </ToggleButton>
                        <ToggleButton value="B" aria-label="B등급" sx={{
                          bgcolor: appearanceGrade === 'B' ? '#2ECC71' : 'transparent',
                          color: appearanceGrade === 'B' ? 'white' : '#2ECC71',
                          '&:hover': { bgcolor: appearanceGrade === 'B' ? '#2ECC71' : 'rgba(46, 204, 113, 0.1)' },
                          fontWeight: 'bold',
                          minWidth: '36px',
                          px: 1
                        }}>
                          B
                        </ToggleButton>
                        <ToggleButton value="C" aria-label="C등급" sx={{
                          bgcolor: appearanceGrade === 'C' ? '#F39C12' : 'transparent',
                          color: appearanceGrade === 'C' ? 'white' : '#F39C12',
                          '&:hover': { bgcolor: appearanceGrade === 'C' ? '#F39C12' : 'rgba(243, 156, 18, 0.1)' },
                          fontWeight: 'bold',
                          minWidth: '36px',
                          px: 1
                        }}>
                          C
                        </ToggleButton>
                        <ToggleButton value="UNKNOWN" aria-label="미분류" sx={{
                          bgcolor: appearanceGrade === 'UNKNOWN' ? '#95A5A6' : 'transparent',
                          color: appearanceGrade === 'UNKNOWN' ? 'white' : '#95A5A6',
                          '&:hover': { bgcolor: appearanceGrade === 'UNKNOWN' ? '#95A5A6' : 'rgba(149, 165, 166, 0.1)' },
                          fontWeight: 'bold',
                          minWidth: '36px',
                          px: 1
                        }}>
                          미분류
                        </ToggleButton>
                      </ToggleButtonGroup>
                      {savingGrade && (
                        <CircularProgress size={16} sx={{ ml: 1 }} />
                      )}
                    </Box>
                  </Box>

                  {/* 나이, 성별 및 계정 상태 표시 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      label={`${userDetail.age}세 / ${GENDER_LABELS[userDetail.gender]}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />

                    {userDetail.birthday && (
                      <Chip
                        label={`생년월일: ${formatDateWithoutTimezoneConversion(userDetail.birthday)}`}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    )}

                    {userDetail.signupRoute && (
                      <Chip
                        label={`가입: ${SIGNUP_ROUTE_LABELS[userDetail.signupRoute] || userDetail.signupRoute}`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    )}

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
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Box sx={{ flex: 1 }}>
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

                    {/* 대학교 인증 상태 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        인증 상태:
                      </Typography>
                      {userDetail.isUniversityVerified ? (
                        <Chip
                          label="✓ 인증됨"
                          size="small"
                          sx={{
                            bgcolor: '#e8f5e8',
                            color: '#2e7d32',
                            fontWeight: 'medium'
                          }}
                        />
                      ) : (
                        <>
                          <Chip
                            label="미인증"
                            size="small"
                            sx={{
                              bgcolor: '#fff3cd',
                              color: '#856404',
                              fontWeight: 'medium'
                            }}
                          />
                          <Button
                            size="small"
                            variant="contained"
                            sx={{
                              minWidth: 'auto',
                              px: 2,
                              py: 0.5,
                              fontSize: '0.75rem'
                            }}
                            onClick={() => {
                              if (window.confirm(`${userDetail.name}님의 대학교 인증을 승인하시겠습니까?`)) {
                                handleUniversityApproval();
                              }
                            }}
                          >
                            인증 승인
                          </Button>
                        </>
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
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
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

                        {/* 인스타그램 오류 상태 표시 */}
                        {userDetail.statusAt === 'instagramerror' && (
                          <Chip
                            label="인스타그램 오류"
                            size="small"
                            color="error"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>

                      {/* 인스타그램 오류 설정/해제 버튼 */}
                      <Box sx={{ mt: 1 }}>
                        {userDetail.statusAt === null || userDetail.statusAt !== 'instagramerror' ? (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={handleSetInstagramError}
                            disabled={actionLoading}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            인스타그램 오류 설정
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            color="success"
                            size="small"
                            onClick={handleResetInstagramError}
                            disabled={actionLoading}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            인스타그램 오류 해제
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* 자기소개 정보 */}
                {(userDetail.title || userDetail.introduction) && (
                  <Box sx={{ mt: 3, mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      자기소개 정보
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {userDetail.title && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          한 줄 소개
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {userDetail.title}
                        </Typography>
                      </Box>
                    )}

                    {userDetail.introduction && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          자기소개
                        </Typography>
                        <Typography variant="body1">
                          {userDetail.introduction}
                        </Typography>
                      </Box>
                    )}
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
                          가입일: {formatDateWithoutTimezoneConversion(userDetail.createdAt)}
                        </Typography>
                      </Box>
                    )}

                    {userDetail.lastActiveAt && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTimeIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          마지막 활동: {formatDateTimeWithoutTimezoneConversion(userDetail.lastActiveAt)}
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

                    {/* 재매칭 티켓 정보 */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <ConfirmationNumberIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          재매칭 티켓
                        </Typography>
                      </Box>
                      {ticketLoading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={16} />
                          <Typography variant="body2" color="text.secondary">
                            조회 중...
                          </Typography>
                        </Box>
                      ) : ticketError ? (
                        <Typography variant="body2" color="error">
                          {ticketError}
                        </Typography>
                      ) : ticketInfo ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={`${ticketInfo.stats?.available || 0}장`}
                              color={ticketInfo.stats?.available > 0 ? 'primary' : 'default'}
                              size="small"
                              variant="outlined"
                              icon={<ConfirmationNumberIcon />}
                            />
                            {ticketInfo.stats?.available > 0 && (
                              <Typography variant="body2" color="text.secondary">
                                보유 중
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => setTicketAddModalOpen(true)}
                              sx={{ minWidth: 'auto', px: 1.5, py: 0.5, fontSize: '0.75rem' }}
                            >
                              추가
                            </Button>
                            {ticketInfo.stats?.available > 0 && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => setTicketRemoveModalOpen(true)}
                                sx={{ minWidth: 'auto', px: 1.5, py: 0.5, fontSize: '0.75rem' }}
                              >
                                제거
                              </Button>
                            )}
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label="0장"
                              color="default"
                              size="small"
                              variant="outlined"
                              icon={<ConfirmationNumberIcon />}
                            />
                            <Typography variant="body2" color="text.secondary">
                              보유 없음
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => setTicketAddModalOpen(true)}
                            sx={{ minWidth: 'auto', px: 1.5, py: 0.5, fontSize: '0.75rem' }}
                          >
                            추가
                          </Button>
                        </Box>
                      )}
                    </Grid>

                    {/* 구슬 정보 */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <DiamondIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          구슬
                        </Typography>
                      </Box>
                      {gemsLoading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={16} />
                          <Typography variant="body2" color="text.secondary">
                            조회 중...
                          </Typography>
                        </Box>
                      ) : gemsError ? (
                        <Typography variant="body2" color="error">
                          {gemsError}
                        </Typography>
                      ) : gemsInfo ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={`${gemsInfo.gemBalance || 0}개`}
                              color={gemsInfo.gemBalance > 0 ? 'primary' : 'default'}
                              size="small"
                              variant="outlined"
                              icon={<DiamondIcon />}
                            />
                            {gemsInfo.gemBalance > 0 && (
                              <Typography variant="body2" color="text.secondary">
                                보유 중
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => setGemsAddModalOpen(true)}
                              sx={{ minWidth: 'auto', px: 1.5, py: 0.5, fontSize: '0.75rem' }}
                            >
                              추가
                            </Button>
                            {gemsInfo.gemBalance > 0 && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => setGemsRemoveModalOpen(true)}
                                sx={{ minWidth: 'auto', px: 1.5, py: 0.5, fontSize: '0.75rem' }}
                              >
                                제거
                              </Button>
                            )}
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label="0개"
                              color="default"
                              size="small"
                              variant="outlined"
                              icon={<DiamondIcon />}
                            />
                            <Typography variant="body2" color="text.secondary">
                              보유 없음
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => setGemsAddModalOpen(true)}
                            sx={{ minWidth: 'auto', px: 1.5, py: 0.5, fontSize: '0.75rem' }}
                          >
                            추가
                          </Button>
                        </Box>
                      )}
                    </Grid>

                    {/* 선호도 정보 표시 */}
                    {userDetail.preferences && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                          선호도 정보
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        {/* 프로필 정보 */}
                        {userDetail.preferences.self && Array.isArray(userDetail.preferences.self) && userDetail.preferences.self.length > 0 && (
                          <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'secondary.main', mb: 2 }}>
                              프로필 정보
                            </Typography>
                            <Box>
                              {userDetail.preferences.self.map((pref: any, index: number) => (
                                <Box key={index} sx={{ mb: 3 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                                    {pref.typeName}
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 0.5 }}>
                                    {pref.selectedOptions?.map((option: any, optIndex: number) => (
                                      <Chip
                                        key={optIndex}
                                        label={option.displayName}
                                        size="small"
                                        color="secondary"
                                        variant="outlined"
                                        sx={{ fontWeight: 'medium' }}
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}

                        {/* 이상형 정보 */}
                        {userDetail.preferences.partner && Array.isArray(userDetail.preferences.partner) && userDetail.preferences.partner.length > 0 && (
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
                              이상형 정보
                            </Typography>
                            <Box>
                              {userDetail.preferences.partner.map((pref: any, index: number) => (
                                <Box key={index} sx={{ mb: 3 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                                    {pref.typeName}
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 0.5 }}>
                                    {pref.selectedOptions?.map((option: any, optIndex: number) => (
                                      <Chip
                                        key={optIndex}
                                        label={option.displayName}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        sx={{ fontWeight: 'medium' }}
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}

                        {/* 선호도 정보가 없는 경우 */}
                        {(!userDetail.preferences.self || userDetail.preferences.self.length === 0) &&
                         (!userDetail.preferences.partner || userDetail.preferences.partner.length === 0) && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            등록된 선호도 정보가 없습니다.
                          </Typography>
                        )}
                      </Grid>
                    )}

                    {/* 추가 필드 표시 - 가독성 개선 (불필요한 필드만 제외) */}
                    {Object.entries(userDetail)
                      .filter(([key]) => !['id', 'name', 'age', 'gender', 'profileImages', 'profileImageUrl',
                                          'phoneNumber', 'instagramId', 'instagramUrl', 'universityDetails',
                                          'university', 'email', 'createdAt', 'updatedAt', 'lastActiveAt',
                                          'appearanceGrade', 'accountStatus', 'role', 'preferences',
                                          'appearanceRank', 'oauthProvider', 'deletedAt'].includes(key))
                      .map(([key, value]) => {
                        // 이미 별도로 표시된 필드는 제외
                        if (key === 'title' || key === 'introduction') {
                          return null;
                        }

                        // 기본 필드 처리
                        return (
                          <Grid item xs={12} key={key}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              {key === 'height' ? '키' :
                               key === 'bodyType' ? '체형' :
                               key === 'religion' ? '종교' :
                               key === 'drinking' ? '음주' :
                               key === 'smoking' ? '흡연' :
                               key === 'mbti' ? 'MBTI' :
                               key === 'hobby' ? '취미' :
                               key === 'job' ? '직업' :
                               key === 'company' ? '회사' :
                               key === 'school' ? '학교' :
                               key === 'major' ? '전공' :
                               key}
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
      <EditProfileModal
        open={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        userId={userId || ''}
        userDetail={userDetail}
        onSuccess={() => {
          setActionSuccess('프로필이 수정되었습니다.');
          // 사용자 상세 정보 새로고침
          refreshUserDetail();
          // 부모 컴포넌트의 목록 새로고침
          if (onRefresh) onRefresh();
        }}
      />

      <EmailNotificationModal
        open={emailNotificationModalOpen}
        onClose={() => setEmailNotificationModalOpen(false)}
        userId={userId || ''}
        userEmail={userDetail?.email}
        userName={userDetail?.name}
        onSuccess={() => {
          setActionSuccess('이메일이 발송되었습니다.');
          if (onRefresh) onRefresh();
        }}
      />

      <SmsNotificationModal
        open={smsNotificationModalOpen}
        onClose={() => setSmsNotificationModalOpen(false)}
        userId={userId || ''}
        phoneNumber={userDetail?.phoneNumber}
        userName={userDetail?.name}
        onSuccess={() => {
          setActionSuccess('SMS가 발송되었습니다.');
          if (onRefresh) onRefresh();
        }}
      />

      {/* 회원 탈퇴 확인 다이얼로그 */}
      <Dialog
        open={deleteConfirmModalOpen}
        onClose={() => setDeleteConfirmModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" color="error">
            회원 탈퇴 확인
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            정말로 <strong>{userDetail?.name}</strong> 사용자를 탈퇴시키겠습니까?
          </Typography>

          {/* 재매칭 티켓 경고 메시지 */}
          {ticketInfo?.stats?.available > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>주의:</strong> 이 사용자는 재매칭 티켓을 <strong>{ticketInfo.stats.available}장</strong> 보유하고 있습니다.
                탈퇴 처리 시 보유 중인 티켓이 모두 소멸됩니다.
              </Typography>
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            이 작업은 되돌릴 수 없습니다.
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={sendEmailOnDelete}
                onChange={(e) => setSendEmailOnDelete(e.target.checked)}
                color="primary"
              />
            }
            label="탈퇴 처리 시 사용자에게 이메일 발송"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={addToBlacklist}
                onChange={(e) => setAddToBlacklist(e.target.checked)}
                color="primary"
              />
            }
            label="블랙리스트에 추가"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteConfirmModalOpen(false)}
            color="inherit"
          >
            취소
          </Button>
          <Button
            onClick={handleConfirmDeleteUser}
            color="error"
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? '처리 중...' : '탈퇴 처리'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 재매칭 티켓 추가 모달 */}
      <Dialog
        open={ticketAddModalOpen}
        onClose={() => setTicketAddModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>재매칭 티켓 추가</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>{userDetail?.name}</strong>님에게 재매칭 티켓을 추가합니다.
          </Typography>

          <TextField
            fullWidth
            type="number"
            label="추가할 티켓 개수"
            value={ticketCount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTicketCount(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1, max: 100 }}
            sx={{ mb: 2 }}
          />

          {ticketError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {ticketError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setTicketAddModalOpen(false)}
            disabled={ticketActionLoading}
          >
            취소
          </Button>
          <Button
            onClick={handleAddTickets}
            variant="contained"
            disabled={ticketActionLoading}
          >
            {ticketActionLoading ? <CircularProgress size={20} /> : '티켓 추가'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 재매칭 티켓 제거 모달 */}
      <Dialog
        open={ticketRemoveModalOpen}
        onClose={() => setTicketRemoveModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>재매칭 티켓 제거</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>{userDetail?.name}</strong>님의 재매칭 티켓을 제거합니다.
          </Typography>

          {ticketInfo && (
            <Alert severity="info" sx={{ mb: 2 }}>
              현재 보유 티켓: <strong>{ticketInfo.stats?.available || 0}장</strong>
            </Alert>
          )}

          <TextField
            fullWidth
            type="number"
            label="제거할 티켓 개수"
            value={ticketCount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTicketCount(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{
              min: 1,
              max: ticketInfo?.stats?.available || 1
            }}
            sx={{ mb: 2 }}
          />

          {ticketError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {ticketError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setTicketRemoveModalOpen(false)}
            disabled={ticketActionLoading}
          >
            취소
          </Button>
          <Button
            onClick={handleRemoveTickets}
            variant="contained"
            color="error"
            disabled={ticketActionLoading}
          >
            {ticketActionLoading ? <CircularProgress size={20} /> : '티켓 제거'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 구슬 추가 모달 */}
      <Dialog
        open={gemsAddModalOpen}
        onClose={() => setGemsAddModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>구슬 추가</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>{userDetail?.name}</strong>님에게 구슬을 추가합니다.
          </Typography>

          <TextField
            fullWidth
            type="number"
            label="추가할 구슬 개수"
            value={gemsCount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGemsCount(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1, max: 1000 }}
            sx={{ mb: 2 }}
          />

          {gemsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {gemsError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGemsAddModalOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleAddGems}
            variant="contained"
            disabled={gemsActionLoading}
          >
            {gemsActionLoading ? <CircularProgress size={20} /> : '구슬 추가'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 구슬 제거 모달 */}
      <Dialog
        open={gemsRemoveModalOpen}
        onClose={() => setGemsRemoveModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>구슬 제거</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>{userDetail?.name}</strong>님의 구슬을 제거합니다.
          </Typography>

          {gemsInfo && (
            <Alert severity="info" sx={{ mb: 2 }}>
              현재 보유 구슬: <strong>{gemsInfo.gemBalance || 0}개</strong>
            </Alert>
          )}

          <TextField
            fullWidth
            type="number"
            label="제거할 구슬 개수"
            value={gemsCount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGemsCount(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{
              min: 1,
              max: gemsInfo?.gemBalance || 1
            }}
            sx={{ mb: 2 }}
          />

          {gemsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {gemsError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGemsRemoveModalOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleRemoveGems}
            variant="contained"
            color="error"
            disabled={gemsActionLoading}
          >
            {gemsActionLoading ? <CircularProgress size={20} /> : '구슬 제거'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 승인 취소 확인 모달 */}
      <Dialog
        open={revokeApprovalModalOpen}
        onClose={() => setRevokeApprovalModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" color="warning.main">
            승인 취소 확인
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>{userDetail?.name}</strong>님의 승인을 취소하시겠습니까?
          </Typography>

          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>경고:</strong> 승인을 취소하면 사용자 상태가 '미승인'으로 변경되며,
              다시 가입 승인을 받아야 합니다. 또한 자동으로 SMS가 발송됩니다.
            </Typography>
          </Alert>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>승인 취소 사유</InputLabel>
            <Select
              value={revokeReason}
              onChange={(e) => {
                setRevokeReason(e.target.value);
                if (e.target.value !== 'OTHER') {
                  setCustomRevokeReason('');
                }
              }}
              label="승인 취소 사유"
            >
              {rejectionReasons.map((reason, index) => (
                <MenuItem key={index} value={reason.value}>
                  {reason.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {revokeReason === 'OTHER' && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="기타 승인 취소 사유"
              placeholder="승인 취소 사유를 직접 입력해주세요"
              value={customRevokeReason}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomRevokeReason(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
          )}

          {actionError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {actionError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRevokeApprovalModalOpen(false);
              setRevokeReason('');
              setCustomRevokeReason('');
            }}
            disabled={revokeActionLoading}
          >
            취소
          </Button>
          <Button
            onClick={handleRevokeApproval}
            variant="contained"
            color="warning"
            disabled={
              revokeActionLoading ||
              !revokeReason.trim() ||
              (revokeReason === 'OTHER' && !customRevokeReason.trim())
            }
          >
            {revokeActionLoading ? <CircularProgress size={20} /> : '승인 취소'}
          </Button>
        </DialogActions>
      </Dialog>

    </Dialog>
  );
};

export default UserDetailModal;
