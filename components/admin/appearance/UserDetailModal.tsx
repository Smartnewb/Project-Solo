import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import { Button as HeroActionButton } from "@heroui/react";
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Separator,
  Spinner,
  Tabs,
  TextArea,
  TextField,
  Tooltip,
} from "@heroui/react";
import {
  Ban,
  Calendar,
  Clock,
  Copy,
  Diamond,
  Edit,
  EllipsisVertical,
  ExternalLink,
  GraduationCap,
  Instagram,
  KeyRound,
  Mail,
  Phone,
  Ticket,
  User,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import AdminService, { blacklist as blacklistApi } from "@/app/services/admin";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldBan, RotateCcw } from "lucide-react";
import { BlacklistRegisterModal } from "@/app/admin/blacklist/components/BlacklistRegisterModal";
import { BlacklistReleaseDialog } from "@/app/admin/blacklist/components/BlacklistReleaseDialog";
import { BlacklistHistoryTimeline } from "@/app/admin/blacklist/components/BlacklistHistoryTimeline";
import {
  formatDateWithoutTimezoneConversion,
  formatDateTimeWithoutTimezoneConversion,
} from "@/app/utils/formatters";

// 관리 기능 모달 컴포넌트들
import EditProfileModal from "./modals/EditProfileModal";
import EmailNotificationModal from "./modals/EmailNotificationModal";
import SmsNotificationModal from "./modals/SmsNotificationModal";
import UniversityTransferModal from "./modals/UniversityTransferModal";
import BirthdayEditModal from "./modals/BirthdayEditModal";
import AccountStatusModal from "./modals/AccountStatusModal";
import { ReferralPostSignupSection } from "./referral/ReferralPostSignupSection";
import { sanitizeUrl } from "@/shared/lib/safe-url";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import { useToast } from "@/shared/ui/admin/toast";

const SHOW_REMATCH_TICKET_ADMIN = false;

// 성별 레이블
const GENDER_LABELS = {
  MALE: "남성",
  FEMALE: "여성",
};

// 회원가입 루트 레이블
const SIGNUP_ROUTE_LABELS = {
  PASS: "PASS",
  KAKAO: "카카오",
  APPLE: "애플",
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
  gender: "MALE" | "FEMALE";
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
  appearanceGrade?: "S" | "A" | "B" | "C" | "UNKNOWN";
  isUniversityVerified?: boolean; // 대학교 인증 여부
  accountStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  suspendedAt?: string | null;
  suspendedUntil?: string | null;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED"; // 승인 상태
  preferences?: UserPreferences;
  signupRoute?: "PASS" | "KAKAO" | "APPLE"; // 회원가입 루트
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
  onRejection,
}) => {
  // 내부 상태로 사용자 상세 정보 관리
  const [userDetail, setUserDetail] = useState(initialUserDetail);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState(initialError);

  // 관리 메뉴 상태
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);
  const [selectedImage, setSelectedImage] = useState<string>(
    (() => {
      if (userDetail.profileImages && userDetail.profileImages.length > 0) {
        const mainImage = userDetail.profileImages.find(
          (img) => img.isMain === true,
        );
        return mainImage ? mainImage.url : userDetail.profileImages[0].url;
      }
      if (userDetail.profileImageUrl) {
        return userDetail.profileImageUrl;
      }
      return "";
    })(),
  );

  // 외모 등급 상태
  const [appearanceGrade, setAppearanceGrade] = useState<
    "S" | "A" | "B" | "C" | "UNKNOWN"
  >(userDetail.appearanceGrade || userDetail.appearanceRank || "UNKNOWN");

  // props가 변경되면 내부 상태 업데이트
  useEffect(() => {
    setUserDetail(initialUserDetail);
    // 외모 등급도 함께 초기화
    setAppearanceGrade(
      initialUserDetail.appearanceGrade ||
        initialUserDetail.appearanceRank ||
        "UNKNOWN",
    );
    setLoading(initialLoading);
    setError(initialError);

    if (initialUserDetail) {
      if (
        initialUserDetail.profileImages &&
        initialUserDetail.profileImages.length > 0
      ) {
        const mainImage = initialUserDetail.profileImages.find(
          (img) => img.isMain === true,
        );
        const imageUrl = mainImage
          ? mainImage.url
          : initialUserDetail.profileImages[0].url;
        setSelectedImage(imageUrl);
      } else if (initialUserDetail.profileImageUrl) {
        setSelectedImage(initialUserDetail.profileImageUrl);
      } else {
        setSelectedImage("");
      }
    }
  }, [initialUserDetail, initialLoading, initialError]);

  // 모달이 열릴 때마다 외모 등급 초기화
  useEffect(() => {
    if (open) {
      setAppearanceGrade(
        userDetail.appearanceGrade || userDetail.appearanceRank || "UNKNOWN",
      );
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
      if (SHOW_REMATCH_TICKET_ADMIN) {
        fetchTicketInfo();
      }
      fetchGemsInfo();
    }
  }, [userId, open]);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setSelectedImage("");
    }
  }, [open]);
  const [savingGrade, setSavingGrade] = useState(false);

  // 모달 상태
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [universityTransferModalOpen, setUniversityTransferModalOpen] =
    useState(false);
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);
  const [emailNotificationModalOpen, setEmailNotificationModalOpen] =
    useState(false);
  const [smsNotificationModalOpen, setSmsNotificationModalOpen] =
    useState(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [revokeApprovalModalOpen, setRevokeApprovalModalOpen] = useState(false);

  // 작업 상태
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // 회원 탈퇴 관련 상태
  const [sendEmailOnDelete, setSendEmailOnDelete] = useState(false);

  // 블랙리스트 관련 상태
  const [blacklistRegisterModalOpen, setBlacklistRegisterModalOpen] =
    useState(false);
  const [blacklistReleaseDialogOpen, setBlacklistReleaseDialogOpen] =
    useState(false);
  // 계정 정지/해제 모달
  const [accountStatusModalOpen, setAccountStatusModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "blacklist">(
    "profile",
  );
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const toast = useToast();

  const blacklistHistoryQuery = useQuery({
    queryKey: ["blacklist-history", userId],
    queryFn: () => blacklistApi.getHistory(userId as string),
    enabled: !!userId && open,
    staleTime: 60_000,
  });

  const blacklistHistory = blacklistHistoryQuery.data?.data?.history ?? [];
  const activeBlacklistEntry = blacklistHistory.find(
    (h) => h.releasedAt === null,
  );
  const isBlacklisted = !!activeBlacklistEntry;

  const handleBlacklistSuccess = (message?: string) => {
    queryClient.invalidateQueries({ queryKey: ["blacklist-history", userId] });
    queryClient.invalidateQueries({ queryKey: ["blacklist"] });
    if (message) {
      setActionSuccess(message);
    }
    if (onRefresh) onRefresh();
    void refreshUserDetail();
  };

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
  // 빈 문자열 = 입력 비움(제출 차단). 임의 값으로 보정하지 않는다.
  const [gemsCount, setGemsCount] = useState<number | "">(1);
  const [gemsActionLoading, setGemsActionLoading] = useState(false);
  const [gemsAddModalOpen, setGemsAddModalOpen] = useState(false);
  const [gemsRemoveModalOpen, setGemsRemoveModalOpen] = useState(false);

  // 승인 취소 관련 상태
  const [revokeReason, setRevokeReason] = useState<string>("");
  const [customRevokeReason, setCustomRevokeReason] = useState<string>("");
  const [revokeActionLoading, setRevokeActionLoading] = useState(false);

  // 비밀번호 초기화 관련 상태
  const [resetPasswordConfirmOpen, setResetPasswordConfirmOpen] =
    useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordResultOpen, setResetPasswordResultOpen] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");

  const rejectionReasons = [
    {
      value: "LONG_TERM_INACTIVE_REAPPLY",
      label: "[장기 미접속]-재심사를 요청해주세요",
    },
    {
      value: "PROFILE_PHOTO_CLEAR_FACE",
      label: "프로필 사진을 본인 얼굴이 잘 보이는 사진으로 변경해주세요",
    },
    {
      value: "PROFILE_PHOTO_SELF",
      label: "본인 사진으로 프로필을 변경해주세요",
    },
    {
      value: "PROFILE_PHOTO_NATURAL",
      label: "상대방이 봐도 부담스럽지 않은 자연스러운 사진으로 변경해주세요",
    },
    {
      value: "PROFILE_PHOTO_FORMAT_UNSUPPORTED",
      label: "프로필 이미지 형식 지원 안함(jpg, jpeg, png 지원)",
    },
    {
      value: "INSTAGRAM_ID_CORRECT",
      label: "인스타그램 ID를 정확히 입력해주세요",
    },
    {
      value: "INSTAGRAM_ID_MAIN_ACCOUNT",
      label: "인스타그램 본계정으로 변경해주세요",
    },
    {
      value: "INSTAGRAM_ID_PUBLIC",
      label: "인스타그램을 공개계정으로 설정해주세요",
    },
    {
      value: "INSTAGRAM_ID_ACTIVE",
      label: "활동 내역이 있는 인스타그램 계정으로 변경해주세요",
    },
    {
      value: "INSTAGRAM_ID_VERIFIABLE",
      label: "본인 확인이 가능한 인스타그램 계정으로 변경해주세요",
    },
    {
      value: "BOTH_PROFILE_AND_INSTAGRAM",
      label: "프로필 사진과 인스타그램 ID 모두 수정 후 재신청해주세요",
    },
    {
      value: "NOT_ELIGIBLE",
      label: "현재 썸타임 이용 조건에 맞지 않아 승인이 어렵습니다",
    },
    {
      value: "FOREIGN_STUDENT_NOT_ACCEPTED",
      label: "죄송하지만 현재 외국인 유학생 회원가입을 받고 있지 않습니다",
    },
    {
      value: "IDENTITY_VERIFICATION_DIFFICULT",
      label: "본인 확인이 어려워 승인이 어렵습니다",
    },
    {
      value: "RELIABLE_PROFILE_REQUIRED",
      label: "신뢰할 수 있는 프로필 정보로 수정 후 재신청해주세요",
    },
    { value: "OTHER", label: "기타 (직접 입력)" },
  ];
  const getRejectionReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      PROFILE_PHOTO_CLEAR_FACE:
        "프로필 사진을 본인 얼굴이 잘 보이는 사진으로 변경해주세요",
      PROFILE_PHOTO_SELF: "본인 사진으로 프로필을 변경해주세요",
      PROFILE_PHOTO_NATURAL:
        "상대방이 봐도 부담스럽지 않은 자연스러운 사진으로 변경해주세요",
      PROFILE_PHOTO_FORMAT_UNSUPPORTED:
        "프로필 이미지 형식 지원 안함(jpg, jpeg, png 지원)",
      INSTAGRAM_ID_CORRECT: "인스타그램 ID를 정확히 입력해주세요",
      INSTAGRAM_ID_MAIN_ACCOUNT: "인스타그램 본계정으로 변경해주세요",
      INSTAGRAM_ID_PUBLIC: "인스타그램을 공개계정으로 설정해주세요",
      INSTAGRAM_ID_ACTIVE: "활동 내역이 있는 인스타그램 계정으로 변경해주세요",
      INSTAGRAM_ID_VERIFIABLE:
        "본인 확인이 가능한 인스타그램 계정으로 변경해주세요",
      BOTH_PROFILE_AND_INSTAGRAM:
        "프로필 사진과 인스타그램 ID 모두 수정 후 재신청해주세요",
      NOT_ELIGIBLE: "현재 썸타임 이용 조건에 맞지 않아 승인이 어렵습니다",
      LONG_TERM_INACTIVE_REAPPLY: "[장기 미접속]-재심사를 요청해주세요",
      FOREIGN_STUDENT_NOT_ACCEPTED:
        "죄송하지만 현재 외국인 유학생 회원가입을 받고 있지 않습니다",
      IDENTITY_VERIFICATION_DIFFICULT: "본인 확인이 어려워 승인이 어렵습니다",
      RELIABLE_PROFILE_REQUIRED:
        "신뢰할 수 있는 프로필 정보로 수정 후 재신청해주세요",
      OTHER: "기타",
    };
    return reasonMap[reason] || reason;
  };

  // 메뉴 열기
  const handleOpenMenu = (event: React.MouseEvent<Element>) => {
    setMenuAnchorEl(event.currentTarget as HTMLElement);
  };

  // 메뉴 닫기
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleOpenProfileCuration = () => {
    if (!userId || userDetail?.gender !== "MALE") return;

    window.open(
      `/admin/profile-curation?userId=${encodeURIComponent(userId)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const isAccountSuspended =
    userDetail?.accountStatus === "SUSPENDED" || !!userDetail?.suspendedAt;

  const handleOpenAccountStatusModal = () => {
    handleCloseMenu();
    setAccountStatusModalOpen(true);
  };

  // 프로필 직접 수정 모달 열기
  const handleOpenEditProfileModal = () => {
    handleCloseMenu();
    setEditProfileModalOpen(true);
  };

  const handleOpenUniversityTransferModal = () => {
    setUniversityTransferModalOpen(true);
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
    event: React.MouseEvent<Element> | null,
    newGrade: "S" | "A" | "B" | "C" | "UNKNOWN",
  ) => {
    if (!userId || !newGrade || newGrade === appearanceGrade) return;

    try {
      setSavingGrade(true);
      setActionError(null);

      await AdminService.userAppearance.setUserAppearanceGrade(
        userId,
        newGrade,
      );

      setAppearanceGrade(newGrade);
      setActionSuccess(`외모 등급이 ${newGrade}로 변경되었습니다.`);

      // 부모 컴포넌트에 변경 알림
      if (onRefresh) onRefresh();
    } catch (error: any) {
      setActionError(error.message || "외모 등급 변경 중 오류가 발생했습니다.");
      console.error("외모 등급 변경 중 오류:", error);
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

      setUserDetail((prev) =>
        prev ? { ...prev, statusAt: "instagramerror" } : prev,
      );
      setActionSuccess("인스타그램 오류 상태가 설정되었습니다.");
      if (onRefresh) onRefresh();
    } catch (error: any) {
      setActionError(
        error.message ?? "인스타그램 오류 상태 설정 중 오류가 발생했습니다.",
      );
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

      const data = await AdminService.userAppearance.getUserTickets(userId);

      setTicketInfo(data);
    } catch (error: any) {
      console.error("재매칭 티켓 정보 조회 중 오류:", error);
      setTicketError(
        error.message || "재매칭 티켓 정보를 조회하는 중 오류가 발생했습니다.",
      );
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

      await AdminService.userAppearance.createUserTickets(userId, ticketCount);

      // 성공 메시지 표시
      setActionSuccess(`재매칭 티켓 ${ticketCount}장이 추가되었습니다.`);

      // 티켓 정보 새로고침
      await fetchTicketInfo();

      // 모달 닫기
      setTicketAddModalOpen(false);
      setTicketCount(1);
    } catch (error: any) {
      console.error("재매칭 티켓 추가 중 오류:", error);
      setTicketError(
        error.message || "재매칭 티켓 추가 중 오류가 발생했습니다.",
      );
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

      await AdminService.userAppearance.deleteUserTickets(userId, ticketCount);

      // 성공 메시지 표시
      setActionSuccess(`재매칭 티켓 ${ticketCount}장이 제거되었습니다.`);

      // 티켓 정보 새로고침
      await fetchTicketInfo();

      // 모달 닫기
      setTicketRemoveModalOpen(false);
      setTicketCount(1);
    } catch (error: any) {
      console.error("재매칭 티켓 제거 중 오류:", error);
      setTicketError(
        error.message || "재매칭 티켓 제거 중 오류가 발생했습니다.",
      );
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

      const response = await AdminService.userAppearance.getUserGems(userId);

      setGemsInfo(response);
    } catch (error: any) {
      console.error("구슬 정보 조회 중 오류:", error);
      setGemsError(error.message || "구슬 정보 조회 중 오류가 발생했습니다.");
    } finally {
      setGemsLoading(false);
    }
  };

  const handleOpenGemsAddModal = () => {
    setGemsCount(1);
    setGemsError(null);
    setGemsAddModalOpen(true);
  };

  const handleOpenGemsRemoveModal = () => {
    setGemsCount(1);
    setGemsError(null);
    setGemsRemoveModalOpen(true);
  };

  // 구슬 추가
  const handleAddGems = async () => {
    if (!userId || gemsCount === "") return;

    try {
      setGemsActionLoading(true);
      setGemsError(null);

      await AdminService.userAppearance.addUserGems(userId, gemsCount);

      // 성공 메시지 표시
      setActionSuccess(`구슬 ${gemsCount}개가 추가되었습니다.`);

      // 구슬 정보 새로고침
      await fetchGemsInfo();

      // 모달 닫기
      setGemsAddModalOpen(false);
      setGemsCount(1);
    } catch (error: any) {
      console.error("구슬 추가 중 오류:", error);
      const message = error.message || "구슬 추가 중 오류가 발생했습니다.";
      setGemsError(message);
      toast.error(message);
    } finally {
      setGemsActionLoading(false);
    }
  };

  // 구슬 제거
  const handleRemoveGems = async () => {
    if (!userId || gemsCount === "") return;

    try {
      setGemsActionLoading(true);
      setGemsError(null);

      await AdminService.userAppearance.removeUserGems(userId, gemsCount);

      // 성공 메시지 표시
      setActionSuccess(`구슬 ${gemsCount}개가 제거되었습니다.`);

      // 구슬 정보 새로고침
      await fetchGemsInfo();

      // 모달 닫기
      setGemsRemoveModalOpen(false);
      setGemsCount(1);
    } catch (error: any) {
      console.error("구슬 제거 중 오류:", error);
      const message = error.message || "구슬 제거 중 오류가 발생했습니다.";
      setGemsError(message);
      toast.error(message);
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

      const data = await AdminService.userAppearance.getUserDetails(userId);

      setUserDetail(data);

      // 이미지 선택 상태 업데이트
      if (data.profileImages && data.profileImages.length > 0) {
        const mainImage = data.profileImages.find(
          (img: any) => img.isMain === true,
        );
        const imageUrl = mainImage ? mainImage.url : data.profileImages[0].url;
        setSelectedImage(imageUrl);
      } else if (data.profileImageUrl) {
        setSelectedImage(data.profileImageUrl);
      } else {
        setSelectedImage("");
      }

      // 외모 등급 상태 업데이트
      setAppearanceGrade(
        data.appearanceGrade || data.appearanceRank || "UNKNOWN",
      );
    } catch (error: any) {
      console.error("사용자 상세 정보 새로고침 중 오류:", error);
      setError(
        error.message ||
          "사용자 상세 정보를 새로고침하는 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAccountStatusSuccess = async (message: string) => {
    setActionSuccess(message);
    await refreshUserDetail();
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    if (onRefresh) onRefresh();
  };

  // 인스타그램 오류 상태 해제
  const handleResetInstagramError = async () => {
    if (!userId) return;

    try {
      setActionLoading(true);
      setActionError(null);

      await AdminService.userAppearance.resetInstagramError(userId);

      setUserDetail((prev) => (prev ? { ...prev, statusAt: null } : prev));
      setActionSuccess("인스타그램 오류 상태가 해제되었습니다.");
      if (onRefresh) onRefresh();
    } catch (error: any) {
      setActionError(
        error.message ?? "인스타그램 오류 상태 해제 중 오류가 발생했습니다.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // 회원 탈퇴 확인 다이얼로그 열기
  const handleDeleteUser = () => {
    handleCloseMenu();
    setActionError(null);
    setDeleteConfirmModalOpen(true);
    setSendEmailOnDelete(true);
  };

  // 실제 회원 탈퇴 처리
  const handleConfirmDeleteUser = async () => {
    if (!userId) return;

    try {
      setActionLoading(true);
      setActionError(null);

      await AdminService.userAppearance.deleteUser(
        userId,
        sendEmailOnDelete,
        false,
      );

      const successMessages = [];
      successMessages.push("회원이 성공적으로 탈퇴되었습니다.");
      if (sendEmailOnDelete) successMessages.push("이메일 발송됨");

      setActionSuccess(successMessages.join(" / "));
      setDeleteConfirmModalOpen(false);
      if (onRefresh) onRefresh();
      onClose();
    } catch (error: any) {
      const message = error.message || "회원 탈퇴 중 오류가 발생했습니다.";
      setActionError(message);
      toast.error(message);
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

      await AdminService.userAppearance.approveUniversityVerification(
        userDetail.id,
      );
      setUserDetail((prev) =>
        prev ? { ...prev, isUniversityVerified: true } : prev,
      );
      setUniVerificationStatus("verified");

      setActionSuccess("대학교 인증이 승인되었습니다.");
      if (onRefresh) onRefresh();
    } catch (error: any) {
      const message = getAdminErrorMessage(
        error,
        "대학교 인증 승인 중 오류가 발생했습니다.",
      );
      // 백엔드가 이미 인증된 사용자라고 거절하면 인증 상태를 즉시 반영한다.
      if (message.includes("이미 인증")) {
        setUserDetail((prev) =>
          prev ? { ...prev, isUniversityVerified: true } : prev,
        );
        setUniVerificationStatus("verified");
      }
      setActionError(message);
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  // 승인 취소 처리
  const handleRevokeApproval = async () => {
    if (!userId) return;

    if (revokeReason === "OTHER" && !customRevokeReason.trim()) return;
    if (revokeReason !== "OTHER" && !revokeReason.trim()) return;

    try {
      setRevokeActionLoading(true);
      setActionError(null);

      const finalRevokeReason =
        revokeReason === "OTHER"
          ? customRevokeReason.trim()
          : getRejectionReasonLabel(revokeReason);

      await AdminService.userAppearance.revokeUserApproval(
        userId,
        finalRevokeReason,
      );

      // 사용자 상태 업데이트
      setUserDetail((prev) =>
        prev ? { ...prev, approvalStatus: "REJECTED" } : prev,
      );

      // 성공 메시지 표시
      setActionSuccess("사용자의 승인이 취소되었습니다.");

      // 모달 닫기 및 상태 초기화
      setRevokeApprovalModalOpen(false);
      setRevokeReason("");
      setCustomRevokeReason("");

      // 부모 컴포넌트에 변경 알림
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error("승인 취소 중 오류:", error);
      const message = error.message || "승인 취소 중 오류가 발생했습니다.";
      setActionError(message);
      toast.error(message);
    } finally {
      setRevokeActionLoading(false);
    }
  };

  // 승인 취소 모달 열기
  const handleOpenRevokeApprovalModal = () => {
    handleCloseMenu();
    setActionError(null);
    setRevokeApprovalModalOpen(true);
    setRevokeReason("");
    setCustomRevokeReason("");
  };

  // 비밀번호 초기화 메뉴 클릭
  const handleResetPasswordClick = () => {
    handleCloseMenu();
    setResetPasswordConfirmOpen(true);
  };

  // 비밀번호 초기화 실행
  const handleConfirmResetPassword = async () => {
    if (!userId) return;

    try {
      setResetPasswordLoading(true);
      const result = await AdminService.userAppearance.resetPassword(userId);
      setTemporaryPassword(
        result.temporaryPassword || result.data?.temporaryPassword || "",
      );
      setResetPasswordConfirmOpen(false);
      setResetPasswordResultOpen(true);
    } catch (error: any) {
      console.error("비밀번호 초기화 중 오류:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "비밀번호 초기화에 실패했습니다.";
      setActionError(message);
      toast.error(message);
      setResetPasswordConfirmOpen(false);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // 임시 비밀번호 복사
  const handleCopyTemporaryPassword = async () => {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      toast.success("임시 비밀번호가 복사되었습니다.");
    } catch (error) {
      console.error("임시 비밀번호 복사 실패:", error);
      toast.error("복사에 실패했습니다. 비밀번호를 직접 선택해 복사해 주세요.");
    }
  };

  // 비밀번호 결과 다이얼로그 닫기
  const handleResetPasswordResultClose = () => {
    setResetPasswordResultOpen(false);
    setTemporaryPassword("");
  };

  const rawUniversity = userDetail?.university as any;
  const currentUniversityName =
    userDetail?.universityDetails?.name ??
    userDetail?.universityName ??
    (typeof rawUniversity === "string" ? rawUniversity : rawUniversity?.name) ??
    null;
  const currentDepartmentName =
    userDetail?.universityDetails?.department ??
    userDetail?.departmentName ??
    null;
  const currentUniversityGrade =
    userDetail?.universityDetails?.grade ?? userDetail?.grade ?? null;
  const isUniversityVerified =
    userDetail?.isUniversityVerified ??
    Boolean(
      userDetail?.universityDetails?.authentication ?? userDetail?.verifiedAt,
    );

  // v2 사용자 상세 응답에는 대학교 인증 상태가 없어 별도 조회한다.
  const [uniVerificationStatus, setUniVerificationStatus] = useState<
    "loading" | "verified" | "pending" | "unverified" | "unknown"
  >("loading");

  useEffect(() => {
    if (!open || !userDetail?.id) return;
    if (isUniversityVerified || !currentUniversityName) {
      setUniVerificationStatus(isUniversityVerified ? "verified" : "unknown");
      return;
    }
    let cancelled = false;
    setUniVerificationStatus("loading");
    AdminService.userAppearance
      .getUniversityVerificationStatus({
        userId: userDetail.id,
        name: userDetail.name,
        universityName: currentUniversityName,
      })
      .then((result) => {
        if (!cancelled) setUniVerificationStatus(result.status);
      })
      .catch(() => {
        if (!cancelled) setUniVerificationStatus("unknown");
      });
    return () => {
      cancelled = true;
    };
  }, [
    open,
    userDetail?.id,
    userDetail?.name,
    isUniversityVerified,
    currentUniversityName,
  ]);

  const showUniversityVerified =
    isUniversityVerified || uniVerificationStatus === "verified";

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose?.();
      }}
      isDismissable={onClose !== undefined}
    >
      <Modal.Container size="md" scroll="inside" className="w-full">
        <Modal.Dialog style={{ width: "100%", maxWidth: "72rem", minWidth: 0 }}>
          <Modal.Header
            className="relative flex-row flex-wrap gap-3 pr-12"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 4,
            }}
          >
            <Modal.Heading className="mb-0 shrink-0 text-lg font-semibold">사용자 상세 정보</Modal.Heading>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {!loading && userDetail?.gender === "MALE" && userId && (
                <Button
                  onClick={handleOpenProfileCuration}
                  variant={"secondary"}
                  isDisabled={actionLoading}
                  size={"sm"}
                  className="rounded-xl"
                >
                  {<ExternalLink />}프로필 큐레이팅
                </Button>
              )}
              {/* 계정 정지 상태 빠른 액션 */}
              {!loading && userDetail && userId && (
                <Button
                  onClick={() => setAccountStatusModalOpen(true)}
                  variant={"secondary"}
                  isDisabled={actionLoading}
                  size={"sm"}
                  className="rounded-xl"
                >
                  {<Ban />}
                  {isAccountSuspended ? "정지 해제" : "계정 정지"}
                </Button>
              )}
              {/* 블랙리스트 액션 버튼 */}
              {!loading && userDetail && userId && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 1,
                  }}
                >
                  {isBlacklisted ? (
                    <Button
                      onClick={() => setBlacklistReleaseDialogOpen(true)}
                      variant={"secondary"}
                      isDisabled={actionLoading}
                      size={"sm"}
                      className="rounded-xl"
                    >
                      {<RotateCcw size={16} />}블랙리스트 해제
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setBlacklistRegisterModalOpen(true)}
                      variant={"secondary"}
                      isDisabled={actionLoading}
                      size={"sm"}
                      className="rounded-xl"
                    >
                      {<ShieldBan size={16} />}블랙리스트 등록
                    </Button>
                  )}
                  <div
                    style={{
                      lineHeight: 1.2,
                      maxWidth: 160,
                      textAlign: "right",
                    }}
                    className={"text-sm text-neutral-700"}
                  >
                    영구 차단(블랙리스트). 기본 고지 발송
                  </div>
                </div>
              )}
              {/* 관리 메뉴 버튼 */}
              {!loading && userDetail && (
                <Tooltip>
                    <Button
                      aria-label="사용자 관리 메뉴"
                      onClick={handleOpenMenu}
                      style={{ marginRight: 4 }}
                      variant={"ghost"}
                      isDisabled={actionLoading}
                      isIconOnly={true}
                      size={"md"}
                      className="rounded-lg"
                    >
                      <EllipsisVertical />
                    </Button>
                  <Tooltip.Content>{"관리 메뉴"}</Tooltip.Content>
                </Tooltip>
              )}
              <Button
                onClick={onClose}
                aria-label="사용자 상세 닫기"
                variant={"ghost"}
                isDisabled={undefined}
                isIconOnly={true}
                size={"md"}
                className="absolute right-0 top-0 rounded-lg"
              >
                <X />
              </Button>
            </div>
          </Modal.Header>
          <Separator></Separator>
          {/* 관리 메뉴 */}
          <Modal.Backdrop
            isOpen={menuOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) handleCloseMenu?.();
            }}
            isDismissable
          >
            <Modal.Container size="md" scroll="inside" className="w-full">
              <Modal.Dialog
                style={{ width: "100%", maxWidth: "32rem", minWidth: 0 }}
              >
                <Modal.Header className="relative pr-12">
                  <Modal.Heading className="text-base font-semibold">
                    {`${userDetail?.name ?? "사용자"} 관리`}
                  </Modal.Heading>
                  <Button
                    onClick={handleCloseMenu}
                    aria-label="관리 메뉴 닫기"
                    variant={"ghost"}
                    isIconOnly={true}
                    size={"md"}
                    className="absolute right-0 top-0 rounded-lg"
                  >
                    <X />
                  </Button>
                </Modal.Header>
                <Button
                  onClick={handleOpenEditProfileModal}
                  variant={"ghost"}
                  isDisabled={undefined}
                  className="w-full justify-start"
                >
                  <span>
                    <Edit />
                  </span>
                  <span>프로필 직접 수정</span>
                </Button>
                <Separator></Separator>
                <Button
                  onClick={handleOpenEmailNotificationModal}
                  variant={"ghost"}
                  isDisabled={undefined}
                  className="w-full justify-start"
                >
                  <span>
                    <Mail />
                  </span>
                  <span>이메일 발송</span>
                </Button>
                <Button
                  onClick={handleOpenSmsNotificationModal}
                  variant={"ghost"}
                  isDisabled={undefined}
                  className="w-full justify-start"
                >
                  <span>
                    <Phone />
                  </span>
                  <span>SMS 발송</span>
                </Button>
                <Button
                  onClick={handleResetPasswordClick}
                  variant={"ghost"}
                  isDisabled={actionLoading}
                  className="w-full justify-start"
                >
                  <span>
                    <KeyRound />
                  </span>
                  <span>{"비밀번호 초기화"}</span>
                </Button>
                <Separator></Separator>
                <Button
                  onClick={handleOpenAccountStatusModal}
                  variant={"ghost"}
                  isDisabled={actionLoading}
                  className="w-full justify-start"
                >
                  <span>
                    <Ban />
                  </span>
                  <span>
                    {isAccountSuspended ? "정지 해제" : "계정 정지"}
                    <small className="block text-neutral-600">
                      {isAccountSuspended
                        ? "로그인 가능 상태로 복구"
                        : "약관 고지(알림+SMS) 발송"}
                    </small>
                  </span>
                </Button>
                <Button
                  onClick={handleDeleteUser}
                  variant={"ghost"}
                  isDisabled={actionLoading}
                  className="w-full justify-start"
                >
                  <span>
                    <Ban />
                  </span>
                  <span>{"회원 탈퇴"}</span>
                </Button>
                {showApprovalActions && (
                  <>
                    <Separator></Separator>
                    <Button
                      onClick={onApproval}
                      variant={"ghost"}
                      isDisabled={actionLoading}
                      className="w-full justify-start"
                    >
                      <span>
                        <User />
                      </span>
                      <span>{"가입 승인"}</span>
                    </Button>
                    <Button
                      onClick={onRejection}
                      variant={"ghost"}
                      isDisabled={actionLoading}
                      className="w-full justify-start"
                    >
                      <span>
                        <Ban />
                      </span>
                      <span>{"가입 거부"}</span>
                    </Button>
                  </>
                )}
                {/* 승인 취소 메뉴 - 모든 사용자에게 표시 */}
                <Separator></Separator>
                <Button
                  onClick={handleOpenRevokeApprovalModal}
                  variant={"ghost"}
                  isDisabled={actionLoading}
                  className="w-full justify-start"
                >
                  <span>
                    <Ban />
                  </span>
                  <span>{"승인 취소"}</span>
                </Button>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
          {!loading && !error && userDetail && (
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) =>
                setActiveTab(String(key) as typeof activeTab)
              }
            >
              <Tabs.List aria-label="목록 보기">
                <Tabs.Tab id={"profile"}>{"기본 정보"}</Tabs.Tab>
                <Tabs.Tab id={"blacklist"}>{"블랙리스트 이력"}</Tabs.Tab>
              </Tabs.List>
            </Tabs>
          )}
          <Modal.Body
            className="min-w-0 [overflow-wrap:anywhere] [&_svg]:shrink-0"
            style={{ padding: 12 }}
          >
            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "clamp(240px, 45vh, 400px)",
                }}
              >
                <Spinner aria-label="불러오는 중" size="sm" />
              </div>
            ) : error ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 200,
                }}
              >
                <div className={"text-sm text-neutral-700"}>{error}</div>
              </div>
            ) : !userDetail ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 200,
                }}
              >
                <div className={"text-sm text-neutral-700"}>
                  사용자 정보를 찾을 수 없습니다.
                </div>
              </div>
            ) : activeTab === "blacklist" ? (
              userId ? (
                <BlacklistHistoryTimeline
                  userId={userId}
                  onRelease={() => setBlacklistReleaseDialogOpen(true)}
                />
              ) : null
            ) : (
              <div className={"grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2"}>
                {/* 프로필 이미지 섹션 */}
                <div className={"min-w-0"}>
                  <div style={{ position: "relative", marginBottom: 8 }}>
                    {/* 프로필 이미지 표시 */}
                    {userDetail.profileImages &&
                    userDetail.profileImages.length > 0 ? (
                      // 메인 이미지 표시
                      <div style={{ position: "relative" }}>
                        <img
                          src={selectedImage}
                          alt={userDetail.name}
                          style={{
                            width: "100%",
                            height: "clamp(240px, 45vh, 400px)",
                            objectFit: "contain",
                            borderRadius: 8,
                            backgroundColor: "#f5f5f5",
                          }}
                        ></img>
                        {/* 메인 이미지 표시 */}
                        <Chip
                          style={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            backgroundColor: "rgba(25, 118, 210, 0.8)",
                          }}
                          size={"sm"}
                          variant={"soft"}
                        >
                          {"선택 이미지"}
                        </Chip>
                      </div>
                    ) : userDetail.profileImageUrl ? (
                      // 단일 profileImageUrl이 있는 경우
                      <img
                        src={selectedImage}
                        alt={userDetail.name}
                        style={{
                          width: "100%",
                          height: "clamp(240px, 45vh, 400px)",
                          objectFit: "contain",
                          borderRadius: 8,
                          backgroundColor: "#f5f5f5",
                        }}
                      ></img>
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: 160,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 8,
                          backgroundColor: "#f5f5f5",
                          color: "#9e9e9e",
                        }}
                      >
                        <User />
                      </div>
                    )}
                  </div>
                  {/* 추가 이미지 썸네일 - 실제 데이터 또는 임의 생성 */}
                  {(() => {
                    // 실제 추가 이미지가 있는 경우
                    if (
                      userDetail.profileImages &&
                      userDetail.profileImages.length > 1
                    ) {
                      return (
                        <div>
                          <div
                            style={{ marginBottom: 4 }}
                            className={"text-sm text-neutral-700"}
                          >
                            전체 이미지 ({userDetail.profileImages.length}장)
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 4,
                              flexWrap: "wrap",
                              marginBottom: 8,
                            }}
                          >
                            {userDetail.profileImages.map((image, index) => (
                              <div
                                key={image.id}
                                style={{ position: "relative" }}
                              >
                                <HeroActionButton
                                  variant="ghost"
                                  className="h-auto min-w-0 p-0"
                                  onClick={() => setSelectedImage(image.url)}
                                  aria-label={`${userDetail.name} 프로필 이미지 ${index + 2}`}
                                >
                                  <img
                                    src={image.url}
                                    alt={`${userDetail.name} 프로필 이미지 ${index + 2}`}
                                    style={{
                                      width: 100,
                                      height: 100,
                                      objectFit: "cover",
                                      borderRadius: 4,
                                      cursor: "pointer",
                                    }}
                                  ></img>
                                </HeroActionButton>
                                <div
                                  style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    backgroundColor: "rgba(0,0,0,0.6)",
                                    color: "white",
                                    textAlign: "center",
                                    padding: "2px 0",
                                  }}
                                  className={"text-sm text-neutral-700"}
                                >
                                  {index + 1}번째
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    } else {
                      return null;
                    }
                  })()}
                </div>
                {/* 사용자 정보 섹션 */}
                <div className={"min-w-0"}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ marginBottom: 4 }}>
                      {/* 이름과 외모 등급을 같은 줄에 표시 */}
                      <div
                        className="flex-wrap gap-2"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <div
                          style={{ fontWeight: "bold", marginRight: 8 }}
                          className={"text-lg font-semibold text-neutral-900"}
                        >
                          {userDetail.name}
                        </div>
                        {/* 외모 등급 토글 버튼 */}
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <div
                            style={{ marginRight: 4, fontWeight: "bold" }}
                            className={"text-sm text-neutral-700"}
                          >
                            외모 등급:
                          </div>
                          <div
                            aria-label="외모 등급"
                            className="flex flex-wrap gap-2"
                          >
                            <Button
                              variant={
                                appearanceGrade === "S"
                                  ? "primary"
                                  : "secondary"
                              }
                              isDisabled={savingGrade || actionLoading}
                              onPress={() =>
                                handleAppearanceGradeChange(null, "S")
                              }
                              aria-label="S등급"
                              style={{
                                backgroundColor:
                                  appearanceGrade === "S"
                                    ? "#8E44AD"
                                    : "transparent",
                                color:
                                  appearanceGrade === "S" ? "white" : "#8E44AD",
                                fontWeight: "bold",
                                minWidth: "36px",
                                paddingLeft: 4,
                                paddingRight: 4,
                              }}
                            >
                              S
                            </Button>
                            <Button
                              variant={
                                appearanceGrade === "A"
                                  ? "primary"
                                  : "secondary"
                              }
                              isDisabled={savingGrade || actionLoading}
                              onPress={() =>
                                handleAppearanceGradeChange(null, "A")
                              }
                              aria-label="A등급"
                              style={{
                                backgroundColor:
                                  appearanceGrade === "A"
                                    ? "#3498DB"
                                    : "transparent",
                                color:
                                  appearanceGrade === "A" ? "white" : "#3498DB",
                                fontWeight: "bold",
                                minWidth: "36px",
                                paddingLeft: 4,
                                paddingRight: 4,
                              }}
                            >
                              A
                            </Button>
                            <Button
                              variant={
                                appearanceGrade === "B"
                                  ? "primary"
                                  : "secondary"
                              }
                              isDisabled={savingGrade || actionLoading}
                              onPress={() =>
                                handleAppearanceGradeChange(null, "B")
                              }
                              aria-label="B등급"
                              style={{
                                backgroundColor:
                                  appearanceGrade === "B"
                                    ? "#2ECC71"
                                    : "transparent",
                                color:
                                  appearanceGrade === "B" ? "white" : "#2ECC71",
                                fontWeight: "bold",
                                minWidth: "36px",
                                paddingLeft: 4,
                                paddingRight: 4,
                              }}
                            >
                              B
                            </Button>
                            <Button
                              variant={
                                appearanceGrade === "C"
                                  ? "primary"
                                  : "secondary"
                              }
                              isDisabled={savingGrade || actionLoading}
                              onPress={() =>
                                handleAppearanceGradeChange(null, "C")
                              }
                              aria-label="C등급"
                              style={{
                                backgroundColor:
                                  appearanceGrade === "C"
                                    ? "#F39C12"
                                    : "transparent",
                                color:
                                  appearanceGrade === "C" ? "white" : "#F39C12",
                                fontWeight: "bold",
                                minWidth: "36px",
                                paddingLeft: 4,
                                paddingRight: 4,
                              }}
                            >
                              C
                            </Button>
                            <Button
                              variant={
                                appearanceGrade === "UNKNOWN"
                                  ? "primary"
                                  : "secondary"
                              }
                              isDisabled={savingGrade || actionLoading}
                              onPress={() =>
                                handleAppearanceGradeChange(null, "UNKNOWN")
                              }
                              aria-label="미분류"
                              style={{
                                backgroundColor:
                                  appearanceGrade === "UNKNOWN"
                                    ? "#95A5A6"
                                    : "transparent",
                                color:
                                  appearanceGrade === "UNKNOWN"
                                    ? "white"
                                    : "#95A5A6",
                                fontWeight: "bold",
                                minWidth: "36px",
                                paddingLeft: 4,
                                paddingRight: 4,
                              }}
                            >
                              미분류
                            </Button>
                          </div>
                          {savingGrade && (
                            <Spinner aria-label="불러오는 중" size="sm" />
                          )}
                        </div>
                      </div>
                      {/* 나이, 성별 및 계정 상태 표시 */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 4,
                        }}
                      >
                        <Chip
                          size={"sm"}
                          variant={"soft"}
                        >{`${userDetail.age}세 / ${GENDER_LABELS[userDetail.gender]}`}</Chip>
                        {userDetail.birthday && (
                          <Chip
                            size={"sm"}
                            variant={"soft"}
                          >{`생년월일: ${formatDateWithoutTimezoneConversion(userDetail.birthday)}`}</Chip>
                        )}
                        <Button
                          onClick={() => setBirthdayModalOpen(true)}
                          variant={"secondary"}
                          isDisabled={actionLoading}
                          size={"sm"}
                          className="rounded-xl"
                        >
                          나이 변경
                        </Button>
                        {userDetail.signupRoute && (
                          <Chip
                            size={"sm"}
                            variant={"soft"}
                          >{`가입: ${SIGNUP_ROUTE_LABELS[userDetail.signupRoute] || userDetail.signupRoute}`}</Chip>
                        )}
                        {userDetail.accountStatus === "INACTIVE" && (
                          <Chip size={"sm"} variant={"soft"}>
                            {"비활성화"}
                          </Chip>
                        )}
                        {isAccountSuspended && (
                          <HeroActionButton
                            variant="ghost"
                            className="h-auto min-w-0 p-0"
                            onClick={() => setAccountStatusModalOpen(true)}
                          >
                            <Chip
                              style={{ cursor: "pointer" }}
                              size={"sm"}
                              variant={"soft"}
                            >
                              {userDetail.suspendedUntil
                                ? `정지됨 (~${formatDateWithoutTimezoneConversion(userDetail.suspendedUntil)})`
                                : "정지됨"}
                            </Chip>
                          </HeroActionButton>
                        )}
                      </div>
                    </div>
                    {/* 대학 정보 */}
                    {(currentUniversityName || currentDepartmentName) && (
                      <div style={{ marginBottom: 8 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <GraduationCap />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {userDetail.universityDetails ? (
                              <>
                                <div className={"text-sm text-neutral-700"}>
                                  {userDetail.universityDetails.name}{" "}
                                  {userDetail.universityDetails
                                    .authentication && (
                                    <span
                                      style={{
                                        color: "#2ECC71",
                                        marginLeft: "4px",
                                      }}
                                    >
                                      ✓
                                    </span>
                                  )}
                                </div>
                                <div className={"text-sm text-neutral-700"}>
                                  {userDetail.universityDetails.department}
                                  {userDetail.universityDetails.grade}학년
                                  {userDetail.universityDetails.studentNumber &&
                                    ` (${userDetail.universityDetails.studentNumber})`}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className={"text-sm text-neutral-700"}>
                                  {currentUniversityName}
                                </div>
                                {currentDepartmentName && (
                                  <div className={"text-sm text-neutral-700"}>
                                    {currentDepartmentName}
                                    {currentUniversityGrade &&
                                      ` ${currentUniversityGrade}학년`}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          <Button
                            onClick={handleOpenUniversityTransferModal}
                            variant={"secondary"}
                            isDisabled={actionLoading}
                            size={"sm"}
                            className="rounded-xl"
                          >
                            변경
                          </Button>
                        </div>
                        {/* 대학교 인증 상태 */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            marginLeft: 16,
                          }}
                        >
                          <div className={"text-sm text-neutral-700"}>
                            인증 상태:
                          </div>
                          {showUniversityVerified ? (
                            <Chip
                              style={{
                                backgroundColor: "#e8f5e8",
                                color: "#2e7d32",
                                fontWeight: "medium",
                              }}
                              size={"sm"}
                              variant={"soft"}
                            >
                              {"✓ 인증됨"}
                            </Chip>
                          ) : (
                            <>
                              <Chip
                                style={{
                                  backgroundColor: "#fff3cd",
                                  color: "#856404",
                                  fontWeight: "medium",
                                }}
                                size={"sm"}
                                variant={"soft"}
                              >
                                {"미인증"}
                              </Chip>
                              {uniVerificationStatus === "unverified" && (
                                <p className="text-xs text-neutral-600">
                                  학생증 미제출
                                </p>
                              )}
                              {uniVerificationStatus !== "loading" && (
                                <Button
                                  style={{
                                    minWidth: "auto",
                                    paddingLeft: 8,
                                    paddingRight: 8,
                                    paddingTop: 2,
                                    paddingBottom: 2,
                                    fontSize: "0.75rem",
                                  }}
                                  onClick={async () => {
                                    const ok = await confirm({
                                      title: "대학교 인증 승인",
                                      message: `${userDetail.name}님의 대학교 인증을 승인하시겠습니까?`,
                                      confirmText: "승인",
                                    });
                                    if (ok) await handleUniversityApproval();
                                  }}
                                  variant={"primary"}
                                  isDisabled={actionLoading}
                                  size={"sm"}
                                  className="rounded-xl"
                                >
                                  인증 승인
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    {/* 연락처 정보 */}
                    {userDetail.phoneNumber && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Phone />
                        <div className={"text-sm text-neutral-700"}>
                          {userDetail.phoneNumber}
                        </div>
                      </div>
                    )}
                    {/* 이메일 정보 */}
                    {userDetail.email && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Mail />
                        <div className={"text-sm text-neutral-700"}>
                          {userDetail.email}
                        </div>
                      </div>
                    )}
                    {/* 인스타그램 정보 */}
                    {(userDetail.instagramId || userDetail.instagramUrl) && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Instagram />
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <a
                              href={
                                sanitizeUrl(userDetail.instagramUrl, {
                                  allowRelative: false,
                                }) ??
                                `https://instagram.com/${userDetail.instagramId}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                textDecoration: "none",
                                color: "#7A4AE2",
                              }}
                            >
                              {userDetail.instagramId ||
                                userDetail.instagramUrl?.split("/").pop()}
                              <ExternalLink />
                            </a>
                            {/* 인스타그램 오류 상태 표시 */}
                            {userDetail.statusAt === "instagramerror" && (
                              <Chip
                                style={{ marginLeft: 4 }}
                                size={"sm"}
                                variant={"soft"}
                              >
                                {"인스타그램 오류"}
                              </Chip>
                            )}
                          </div>
                          {/* 인스타그램 오류 설정/해제 버튼 */}
                          <div style={{ marginTop: 4 }}>
                            {userDetail.statusAt === null ||
                            userDetail.statusAt !== "instagramerror" ? (
                              <Button
                                onClick={handleSetInstagramError}
                                style={{ fontSize: "0.75rem" }}
                                variant={"secondary"}
                                isDisabled={actionLoading}
                                size={"sm"}
                                className="rounded-xl"
                              >
                                인스타그램 오류 설정
                              </Button>
                            ) : (
                              <Button
                                onClick={handleResetInstagramError}
                                style={{ fontSize: "0.75rem" }}
                                variant={"secondary"}
                                isDisabled={actionLoading}
                                size={"sm"}
                                className="rounded-xl"
                              >
                                인스타그램 오류 해제
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* 자기소개 정보 */}
                    {(userDetail.title || userDetail.introduction) && (
                      <div style={{ marginTop: 12, marginBottom: 12 }}>
                        <div
                          style={{ fontWeight: "bold", marginBottom: 4 }}
                          className={"text-sm text-neutral-700"}
                        >
                          자기소개 정보
                        </div>
                        <Separator style={{ marginBottom: 8 }}></Separator>
                        {userDetail.title && (
                          <div style={{ marginBottom: 8 }}>
                            <div
                              style={{ marginBottom: 2 }}
                              className={"text-sm text-neutral-700"}
                            >
                              한 줄 소개
                            </div>
                            <div
                              style={{ fontWeight: "medium" }}
                              className={"text-sm text-neutral-700"}
                            >
                              {userDetail.title}
                            </div>
                          </div>
                        )}
                        {userDetail.introduction && (
                          <div>
                            <div
                              style={{ marginBottom: 2 }}
                              className={"text-sm text-neutral-700"}
                            >
                              자기소개
                            </div>
                            <div className={"text-sm text-neutral-700"}>
                              {userDetail.introduction}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* 날짜 정보 */}
                    <div style={{ marginTop: 12, marginBottom: 12 }}>
                      <div
                        style={{ fontWeight: "bold", marginBottom: 4 }}
                        className={"text-sm text-neutral-700"}
                      >
                        활동 정보
                      </div>
                      <Separator style={{ marginBottom: 8 }}></Separator>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        {userDetail.createdAt && (
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <Calendar />
                            <div className={"text-sm text-neutral-700"}>
                              가입일:{" "}
                              {formatDateWithoutTimezoneConversion(
                                userDetail.createdAt,
                              )}
                            </div>
                          </div>
                        )}
                        {userDetail.lastActiveAt && (
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <Clock />
                            <div className={"text-sm text-neutral-700"}>
                              마지막 활동:{" "}
                              {formatDateTimeWithoutTimezoneConversion(
                                userDetail.lastActiveAt,
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {userId && (
                      <ReferralPostSignupSection
                        userId={userId}
                        createdAt={userDetail.createdAt}
                        onCompleted={onRefresh}
                      />
                    )}
                    {/* 추가 정보 섹션 */}
                    <div style={{ marginTop: 16 }}>
                      <div
                        style={{ fontWeight: "bold", marginBottom: 4 }}
                        className={"text-sm text-neutral-700"}
                      >
                        시스템 정보
                      </div>
                      <Separator style={{ marginBottom: 8 }}></Separator>
                      <div
                        className={
                          "grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2"
                        }
                      >
                        <div className={"min-w-0"}>
                          <div className={"text-sm text-neutral-700"}>
                            사용자 ID
                          </div>
                          <div
                            style={{ wordBreak: "break-all" }}
                            className={"text-sm text-neutral-700"}
                          >
                            {userDetail.id || userId || "-"}
                          </div>
                        </div>
                        {/* 재매칭 티켓 정보 */}
                        {SHOW_REMATCH_TICKET_ADMIN && (
                          <div className={"min-w-0"}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                marginBottom: 2,
                              }}
                            >
                              <Ticket />
                              <div className={"text-sm text-neutral-700"}>
                                재매칭 티켓
                              </div>
                            </div>
                            {ticketLoading ? (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Spinner aria-label="불러오는 중" size="sm" />
                                <div className={"text-sm text-neutral-700"}>
                                  조회 중...
                                </div>
                              </div>
                            ) : ticketError ? (
                              <div className={"text-sm text-neutral-700"}>
                                {ticketError}
                              </div>
                            ) : ticketInfo ? (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  justifyContent: "space-between",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <Chip
                                    size={"sm"}
                                    variant={"soft"}
                                  >{`${ticketInfo.stats?.available || 0}장`}</Chip>
                                  {ticketInfo.stats?.available > 0 && (
                                    <div className={"text-sm text-neutral-700"}>
                                      보유 중
                                    </div>
                                  )}
                                </div>
                                <div style={{ display: "flex", gap: 4 }}>
                                  <Button
                                    onClick={() => setTicketAddModalOpen(true)}
                                    style={{
                                      minWidth: "auto",
                                      paddingLeft: 6,
                                      paddingRight: 6,
                                      paddingTop: 2,
                                      paddingBottom: 2,
                                      fontSize: "0.75rem",
                                    }}
                                    variant={"secondary"}
                                    isDisabled={undefined}
                                    size={"sm"}
                                    className="rounded-xl"
                                  >
                                    추가
                                  </Button>
                                  {ticketInfo.stats?.available > 0 && (
                                    <Button
                                      onClick={() =>
                                        setTicketRemoveModalOpen(true)
                                      }
                                      style={{
                                        minWidth: "auto",
                                        paddingLeft: 6,
                                        paddingRight: 6,
                                        paddingTop: 2,
                                        paddingBottom: 2,
                                        fontSize: "0.75rem",
                                      }}
                                      variant={"secondary"}
                                      isDisabled={undefined}
                                      size={"sm"}
                                      className="rounded-xl"
                                    >
                                      제거
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  justifyContent: "space-between",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <Chip size={"sm"} variant={"soft"}>
                                    {"0장"}
                                  </Chip>
                                  <div className={"text-sm text-neutral-700"}>
                                    보유 없음
                                  </div>
                                </div>
                                <Button
                                  onClick={() => setTicketAddModalOpen(true)}
                                  style={{
                                    minWidth: "auto",
                                    paddingLeft: 6,
                                    paddingRight: 6,
                                    paddingTop: 2,
                                    paddingBottom: 2,
                                    fontSize: "0.75rem",
                                  }}
                                  variant={"secondary"}
                                  isDisabled={undefined}
                                  size={"sm"}
                                  className="rounded-xl"
                                >
                                  추가
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        {/* 구슬 정보 */}
                        <div className={"min-w-0"}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              marginBottom: 2,
                            }}
                          >
                            <Diamond />
                            <div className={"text-sm text-neutral-700"}>
                              구슬
                            </div>
                          </div>
                          {gemsLoading ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Spinner aria-label="불러오는 중" size="sm" />
                              <div className={"text-sm text-neutral-700"}>
                                조회 중...
                              </div>
                            </div>
                          ) : gemsError ? (
                            <div className={"text-sm text-neutral-700"}>
                              {gemsError}
                            </div>
                          ) : gemsInfo ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                justifyContent: "space-between",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Chip
                                  size={"sm"}
                                  variant={"soft"}
                                >{`${gemsInfo.gemBalance || 0}개`}</Chip>
                                {gemsInfo.gemBalance > 0 && (
                                  <div className={"text-sm text-neutral-700"}>
                                    보유 중
                                  </div>
                                )}
                              </div>
                              <div style={{ display: "flex", gap: 4 }}>
                                <Button
                                  onClick={handleOpenGemsAddModal}
                                  style={{
                                    minWidth: "auto",
                                    paddingLeft: 6,
                                    paddingRight: 6,
                                    paddingTop: 2,
                                    paddingBottom: 2,
                                    fontSize: "0.75rem",
                                  }}
                                  variant={"secondary"}
                                  isDisabled={undefined}
                                  size={"sm"}
                                  className="rounded-xl"
                                >
                                  추가
                                </Button>
                                {gemsInfo.gemBalance > 0 && (
                                  <Button
                                    onClick={handleOpenGemsRemoveModal}
                                    style={{
                                      minWidth: "auto",
                                      paddingLeft: 6,
                                      paddingRight: 6,
                                      paddingTop: 2,
                                      paddingBottom: 2,
                                      fontSize: "0.75rem",
                                    }}
                                    variant={"secondary"}
                                    isDisabled={undefined}
                                    size={"sm"}
                                    className="rounded-xl"
                                  >
                                    제거
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                justifyContent: "space-between",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Chip size={"sm"} variant={"soft"}>
                                  {"0개"}
                                </Chip>
                                <div className={"text-sm text-neutral-700"}>
                                  보유 없음
                                </div>
                              </div>
                              <Button
                                onClick={handleOpenGemsAddModal}
                                style={{
                                  minWidth: "auto",
                                  paddingLeft: 6,
                                  paddingRight: 6,
                                  paddingTop: 2,
                                  paddingBottom: 2,
                                  fontSize: "0.75rem",
                                }}
                                variant={"secondary"}
                                isDisabled={undefined}
                                size={"sm"}
                                className="rounded-xl"
                              >
                                추가
                              </Button>
                            </div>
                          )}
                        </div>
                        {/* 선호도 정보 표시 */}
                        {userDetail.preferences && (
                          <div className={"min-w-0"}>
                            <div
                              style={{ fontWeight: "bold", marginBottom: 4 }}
                              className={"text-sm text-neutral-700"}
                            >
                              선호도 정보
                            </div>
                            <Separator style={{ marginBottom: 8 }}></Separator>
                            {/* 프로필 정보 */}
                            {userDetail.preferences.self &&
                              Array.isArray(userDetail.preferences.self) &&
                              userDetail.preferences.self.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                  <div
                                    style={{
                                      fontWeight: "bold",
                                      color: "#7A4AE2",
                                      marginBottom: 8,
                                    }}
                                    className={
                                      "text-lg font-semibold text-neutral-900"
                                    }
                                  >
                                    프로필 정보
                                  </div>
                                  <div>
                                    {userDetail.preferences.self.map(
                                      (pref: any, index: number) => (
                                        <div
                                          key={index}
                                          style={{ marginBottom: 12 }}
                                        >
                                          <div
                                            style={{
                                              fontWeight: "bold",
                                              color: "#7A4AE2",
                                              marginBottom: 4,
                                            }}
                                            className={
                                              "text-sm text-neutral-700"
                                            }
                                          >
                                            {pref.typeName}
                                          </div>
                                          <div
                                            style={{
                                              display: "flex",
                                              flexWrap: "wrap",
                                              gap: 3.2,
                                              marginTop: 2,
                                            }}
                                          >
                                            {pref.selectedOptions?.map(
                                              (
                                                option: any,
                                                optIndex: number,
                                              ) => (
                                                <Chip
                                                  key={optIndex}
                                                  style={{
                                                    fontWeight: "medium",
                                                  }}
                                                  size={"sm"}
                                                  variant={"soft"}
                                                >
                                                  {option.displayName}
                                                </Chip>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            {/* 이상형 정보 */}
                            {userDetail.preferences.partner &&
                              Array.isArray(userDetail.preferences.partner) &&
                              userDetail.preferences.partner.length > 0 && (
                                <div>
                                  <div
                                    style={{
                                      fontWeight: "bold",
                                      color: "#7A4AE2",
                                      marginBottom: 8,
                                    }}
                                    className={
                                      "text-lg font-semibold text-neutral-900"
                                    }
                                  >
                                    이상형 정보
                                  </div>
                                  <div>
                                    {userDetail.preferences.partner.map(
                                      (pref: any, index: number) => (
                                        <div
                                          key={index}
                                          style={{ marginBottom: 12 }}
                                        >
                                          <div
                                            style={{
                                              fontWeight: "bold",
                                              color: "#7A4AE2",
                                              marginBottom: 4,
                                            }}
                                            className={
                                              "text-sm text-neutral-700"
                                            }
                                          >
                                            {pref.typeName}
                                          </div>
                                          <div
                                            style={{
                                              display: "flex",
                                              flexWrap: "wrap",
                                              gap: 3.2,
                                              marginTop: 2,
                                            }}
                                          >
                                            {pref.selectedOptions?.map(
                                              (
                                                option: any,
                                                optIndex: number,
                                              ) => (
                                                <Chip
                                                  key={optIndex}
                                                  style={{
                                                    fontWeight: "medium",
                                                  }}
                                                  size={"sm"}
                                                  variant={"soft"}
                                                >
                                                  {option.displayName}
                                                </Chip>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            {/* 선호도 정보가 없는 경우 */}
                            {(!userDetail.preferences.self ||
                              userDetail.preferences.self.length === 0) &&
                              (!userDetail.preferences.partner ||
                                userDetail.preferences.partner.length ===
                                  0) && (
                                <div
                                  style={{ fontStyle: "italic" }}
                                  className={"text-sm text-neutral-700"}
                                >
                                  등록된 선호도 정보가 없습니다.
                                </div>
                              )}
                          </div>
                        )}
                        {/* 추가 필드 표시 - 가독성 개선 (불필요한 필드만 제외) */}
                        {Object.entries(userDetail)
                          .filter(
                            ([key]) =>
                              ![
                                "id",
                                "name",
                                "age",
                                "gender",
                                "profileImages",
                                "profileImageUrl",
                                "phoneNumber",
                                "instagramId",
                                "instagramUrl",
                                "universityDetails",
                                "university",
                                "email",
                                "createdAt",
                                "updatedAt",
                                "lastActiveAt",
                                "appearanceGrade",
                                "accountStatus",
                                "role",
                                "preferences",
                                "appearanceRank",
                                "oauthProvider",
                                "deletedAt",
                              ].includes(key),
                          )
                          .map(([key, value]) => {
                            // 이미 별도로 표시된 필드는 제외
                            if (key === "title" || key === "introduction") {
                              return null;
                            }

                            // 기본 필드 처리
                            return (
                              <div key={key} className={"min-w-0"}>
                                <div
                                  style={{
                                    fontWeight: "bold",
                                    marginBottom: 2,
                                  }}
                                  className={"text-sm text-neutral-700"}
                                >
                                  {key === "height"
                                    ? "키"
                                    : key === "bodyType"
                                      ? "체형"
                                      : key === "religion"
                                        ? "종교"
                                        : key === "drinking"
                                          ? "음주"
                                          : key === "smoking"
                                            ? "흡연"
                                            : key === "mbti"
                                              ? "MBTI"
                                              : key === "hobby"
                                                ? "취미"
                                                : key === "job"
                                                  ? "직업"
                                                  : key === "company"
                                                    ? "회사"
                                                    : key === "school"
                                                      ? "학교"
                                                      : key === "major"
                                                        ? "전공"
                                                        : key}
                                </div>
                                <div
                                  style={{ wordBreak: "break-all" }}
                                  className={"text-sm text-neutral-700"}
                                >
                                  {typeof value === "object"
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          {/* 성공/오류 메시지 */}
          {actionSuccess && (
            <Alert
              style={{
                position: "absolute",
                bottom: 16,
                left: 16,
                right: 16,
                zIndex: 1000,
              }}
              status={"success"}
              role="alert"
            >
              <Alert.Content>{actionSuccess}</Alert.Content>
              <Button
                variant="ghost"
                isIconOnly
                aria-label="알림 닫기"
                onPress={() => setActionSuccess(null)}
              >
                닫기
              </Button>
            </Alert>
          )}
          {actionError && (
            <Alert
              style={{
                position: "absolute",
                bottom: 16,
                left: 16,
                right: 16,
                zIndex: 1000,
              }}
              status="danger"
              role="alert"
            >
              <Alert.Content>{actionError}</Alert.Content>
              <Button
                variant="ghost"
                isIconOnly
                aria-label="알림 닫기"
                onPress={() => setActionError(null)}
              >
                닫기
              </Button>
            </Alert>
          )}
          {/* 관리 기능 모달들 */}
          <EditProfileModal
            open={editProfileModalOpen}
            onClose={() => setEditProfileModalOpen(false)}
            userId={userId || ""}
            userDetail={userDetail}
            onSuccess={() => {
              setActionSuccess("프로필이 수정되었습니다.");
              // 사용자 상세 정보 새로고침
              refreshUserDetail();
              // 부모 컴포넌트의 목록 새로고침
              if (onRefresh) onRefresh();
            }}
          />
          <EmailNotificationModal
            open={emailNotificationModalOpen}
            onClose={() => setEmailNotificationModalOpen(false)}
            userId={userId || ""}
            userEmail={userDetail?.email}
            userName={userDetail?.name}
            onSuccess={() => {
              setActionSuccess("이메일이 발송되었습니다.");
              if (onRefresh) onRefresh();
            }}
          />
          <SmsNotificationModal
            open={smsNotificationModalOpen}
            onClose={() => setSmsNotificationModalOpen(false)}
            userId={userId || ""}
            phoneNumber={userDetail?.phoneNumber}
            userName={userDetail?.name}
            onSuccess={() => {
              setActionSuccess("SMS가 발송되었습니다.");
              if (onRefresh) onRefresh();
            }}
          />
          <BirthdayEditModal
            open={birthdayModalOpen}
            onClose={() => setBirthdayModalOpen(false)}
            userId={userId || ""}
            userName={userDetail?.name}
            currentBirthday={userDetail?.birthday}
            currentAge={userDetail?.age}
            onSuccess={({ birthday, age }) => {
              setActionSuccess(
                `생년월일이 ${birthday}(만 ${age}세)(으)로 변경되었습니다.`,
              );
              setUserDetail((prev) =>
                prev ? { ...prev, birthday, age } : prev,
              );
              if (onRefresh) onRefresh();
            }}
          />
          <UniversityTransferModal
            open={universityTransferModalOpen}
            onClose={() => setUniversityTransferModalOpen(false)}
            userId={userId || ""}
            userName={userDetail?.name}
            currentUniversityName={currentUniversityName}
            currentDepartmentName={currentDepartmentName}
            currentGrade={currentUniversityGrade}
            isVerified={isUniversityVerified}
            onSuccess={({ universityName, departmentName }) => {
              setActionSuccess(
                `학교/학과가 ${universityName} ${departmentName}(으)로 변경되었습니다.`,
              );
              setUserDetail((prev) =>
                prev
                  ? {
                      ...prev,
                      universityName,
                      departmentName,
                      universityDetails: prev.universityDetails
                        ? {
                            ...prev.universityDetails,
                            name: universityName,
                            department: departmentName,
                          }
                        : {
                            name: universityName,
                            authentication: isUniversityVerified,
                            department: departmentName,
                            grade: currentUniversityGrade || "",
                            studentNumber: "",
                          },
                    }
                  : prev,
              );
              refreshUserDetail();
              if (onRefresh) onRefresh();
            }}
          />
          {/* 회원 탈퇴 확인 다이얼로그 */}
          <Modal.Backdrop
            isOpen={deleteConfirmModalOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen && !actionLoading) setDeleteConfirmModalOpen(false);
            }}
            isDismissable={!actionLoading}
            isKeyboardDismissDisabled={actionLoading}
          >
            <Modal.Container size="md" scroll="inside" className="w-full">
              <Modal.Dialog
                style={{ width: "100%", maxWidth: "32rem", minWidth: 0 }}
              >
                <Modal.Header>
                  <Modal.Heading>
                    <div className={"text-lg font-semibold text-neutral-900"}>
                      회원 탈퇴 확인
                    </div>
                  </Modal.Heading>
                </Modal.Header>
                <Modal.Body className="min-w-0 [overflow-wrap:anywhere]">
                  <div
                    style={{ marginBottom: 8 }}
                    className={"text-sm text-neutral-700"}
                  >
                    정말로 <strong>{userDetail?.name}</strong>사용자를
                    탈퇴시키겠습니까?
                  </div>
                  {/* 재매칭 티켓 경고 메시지 */}
                  {SHOW_REMATCH_TICKET_ADMIN &&
                    ticketInfo?.stats?.available > 0 && (
                      <Alert
                        style={{ marginBottom: 8 }}
                        status={"warning"}
                        role="alert"
                      >
                        <Alert.Content>
                          <div className={"text-sm text-neutral-700"}>
                            <strong>주의:</strong>이 사용자는 재매칭 티켓을{" "}
                            <strong>{ticketInfo.stats.available}장</strong>
                            보유하고 있습니다. 탈퇴 처리 시 보유 중인 티켓이
                            모두 소멸됩니다.
                          </div>
                        </Alert.Content>
                      </Alert>
                    )}
                  <div
                    style={{ marginBottom: 12 }}
                    className={"text-sm text-neutral-700"}
                  >
                    이 작업은 되돌릴 수 없습니다.
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      isSelected={sendEmailOnDelete}
                      isDisabled={actionLoading}
                      isIndeterminate={undefined}
                      onChange={(isSelected) =>
                        setSendEmailOnDelete(isSelected)
                      }
                    >
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Label>{"탈퇴 처리 시 사용자에게 이메일 발송"}</Label>
                      </Checkbox.Content>
                    </Checkbox>
                  </div>
                  {actionError && (
                    <Alert
                      style={{ marginTop: 8 }}
                      status="danger"
                      role="alert"
                    >
                      <Alert.Content>{actionError}</Alert.Content>
                    </Alert>
                  )}
                </Modal.Body>
                <Modal.Footer className="flex-wrap gap-2">
                  <Button
                    onClick={() => setDeleteConfirmModalOpen(false)}
                    variant={"ghost"}
                    isDisabled={actionLoading}
                    size={"md"}
                    className="rounded-xl"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleConfirmDeleteUser}
                    variant={"danger"}
                    isDisabled={actionLoading}
                    size={"md"}
                    className="rounded-xl"
                  >
                    {actionLoading ? "처리 중..." : "탈퇴 처리"}
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
          {/* 재매칭 티켓 추가 모달 */}
          {SHOW_REMATCH_TICKET_ADMIN && (
            <Modal.Backdrop
              isOpen={ticketAddModalOpen}
              onOpenChange={(isOpen) => {
                if (!isOpen) (() => setTicketAddModalOpen(false))?.();
              }}
              isDismissable={(() => setTicketAddModalOpen(false)) !== undefined}
            >
              <Modal.Container size="md" scroll="inside" className="w-full">
                <Modal.Dialog
                  style={{ width: "100%", maxWidth: "32rem", minWidth: 0 }}
                >
                  <Modal.Header>
                    <Modal.Heading>재매칭 티켓 추가</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body className="min-w-0 [overflow-wrap:anywhere]">
                    <div
                      style={{ marginBottom: 8 }}
                      className={"text-sm text-neutral-700"}
                    >
                      <strong>{userDetail?.name}</strong>님에게 재매칭 티켓을
                      추가합니다.
                    </div>
                    <TextField
                      className="w-full"
                      isDisabled={undefined}
                      isInvalid={undefined}
                    >
                      <Label>{"추가할 티켓 개수"}</Label>
                      <Input
                        type="number"
                        value={ticketCount}
                        onChange={(
                          e: React.ChangeEvent<
                            | HTMLInputElement
                            | HTMLTextAreaElement
                            | HTMLSelectElement
                          >,
                        ) =>
                          setTicketCount(
                            Math.max(1, parseInt(e.target.value) || 1),
                          )
                        }
                        style={{ marginBottom: 8 }}
                        aria-label={"추가할 티켓 개수"}
                        {...{ min: 1, max: 100 }}
                      />
                    </TextField>
                    {ticketError && (
                      <Alert
                        style={{ marginBottom: 8 }}
                        status="danger"
                        role="alert"
                      >
                        <Alert.Content>{ticketError}</Alert.Content>
                      </Alert>
                    )}
                  </Modal.Body>
                  <Modal.Footer className="flex-wrap gap-2">
                    <Button
                      onClick={() => setTicketAddModalOpen(false)}
                      variant={"ghost"}
                      isDisabled={ticketActionLoading}
                      size={"md"}
                      className="rounded-xl"
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleAddTickets}
                      variant={"primary"}
                      isDisabled={ticketActionLoading}
                      size={"md"}
                      className="rounded-xl"
                    >
                      {ticketActionLoading ? (
                        <Spinner aria-label="불러오는 중" size="sm" />
                      ) : (
                        "티켓 추가"
                      )}
                    </Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          )}
          {/* 재매칭 티켓 제거 모달 */}
          {SHOW_REMATCH_TICKET_ADMIN && (
            <Modal.Backdrop
              isOpen={ticketRemoveModalOpen}
              onOpenChange={(isOpen) => {
                if (!isOpen) (() => setTicketRemoveModalOpen(false))?.();
              }}
              isDismissable={
                (() => setTicketRemoveModalOpen(false)) !== undefined
              }
            >
              <Modal.Container size="md" scroll="inside" className="w-full">
                <Modal.Dialog
                  style={{ width: "100%", maxWidth: "32rem", minWidth: 0 }}
                >
                  <Modal.Header>
                    <Modal.Heading>재매칭 티켓 제거</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body className="min-w-0 [overflow-wrap:anywhere]">
                    <div
                      style={{ marginBottom: 8 }}
                      className={"text-sm text-neutral-700"}
                    >
                      <strong>{userDetail?.name}</strong>님의 재매칭 티켓을
                      제거합니다.
                    </div>
                    {ticketInfo && (
                      <Alert
                        style={{ marginBottom: 8 }}
                        status={"default"}
                        role="alert"
                      >
                        <Alert.Content>
                          현재 보유 티켓:{" "}
                          <strong>{ticketInfo.stats?.available || 0}장</strong>
                        </Alert.Content>
                      </Alert>
                    )}
                    <TextField
                      className="w-full"
                      isDisabled={undefined}
                      isInvalid={undefined}
                    >
                      <Label>{"제거할 티켓 개수"}</Label>
                      <Input
                        type="number"
                        value={ticketCount}
                        onChange={(
                          e: React.ChangeEvent<
                            | HTMLInputElement
                            | HTMLTextAreaElement
                            | HTMLSelectElement
                          >,
                        ) =>
                          setTicketCount(
                            Math.max(1, parseInt(e.target.value) || 1),
                          )
                        }
                        style={{ marginBottom: 8 }}
                        aria-label={"제거할 티켓 개수"}
                        {...{
                          min: 1,
                          max: ticketInfo?.stats?.available || 1,
                        }}
                      />
                    </TextField>
                    {ticketError && (
                      <Alert
                        style={{ marginBottom: 8 }}
                        status="danger"
                        role="alert"
                      >
                        <Alert.Content>{ticketError}</Alert.Content>
                      </Alert>
                    )}
                  </Modal.Body>
                  <Modal.Footer className="flex-wrap gap-2">
                    <Button
                      onClick={() => setTicketRemoveModalOpen(false)}
                      variant={"ghost"}
                      isDisabled={ticketActionLoading}
                      size={"md"}
                      className="rounded-xl"
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleRemoveTickets}
                      variant={"primary"}
                      isDisabled={ticketActionLoading}
                      size={"md"}
                      className="rounded-xl"
                    >
                      {ticketActionLoading ? (
                        <Spinner aria-label="불러오는 중" size="sm" />
                      ) : (
                        "티켓 제거"
                      )}
                    </Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          )}
          {/* 구슬 추가 모달 */}
          <Modal.Backdrop
            isOpen={gemsAddModalOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen && !gemsActionLoading) setGemsAddModalOpen(false);
            }}
            isDismissable={!gemsActionLoading}
            isKeyboardDismissDisabled={gemsActionLoading}
          >
            <Modal.Container size="md" scroll="inside" className="w-full">
              <Modal.Dialog
                style={{ width: "100%", maxWidth: "32rem", minWidth: 0 }}
              >
                <Modal.Header>
                  <Modal.Heading>구슬 추가</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="min-w-0 [overflow-wrap:anywhere]">
                  <div
                    style={{ marginBottom: 8 }}
                    className={"text-sm text-neutral-700"}
                  >
                    <strong>{userDetail?.name}</strong>님에게 구슬을 추가합니다.
                  </div>
                  <TextField
                    className="w-full"
                    isDisabled={gemsActionLoading}
                    isInvalid={gemsCount === ""}
                  >
                    <Label>{"추가할 구슬 개수"}</Label>
                    <Input
                      type="number"
                      value={gemsCount}
                      onChange={(
                        e: React.ChangeEvent<
                          | HTMLInputElement
                          | HTMLTextAreaElement
                          | HTMLSelectElement
                        >,
                      ) => {
                        const parsed = parseInt(e.target.value, 10);
                        setGemsCount(Number.isNaN(parsed) ? "" : Math.max(1, parsed));
                      }}
                      style={{ marginBottom: 8 }}
                      aria-label={"추가할 구슬 개수"}
                      {...{ min: 1, max: 1000 }}
                    />
                  </TextField>
                  {gemsError && (
                    <Alert
                      style={{ marginBottom: 8 }}
                      status="danger"
                      role="alert"
                    >
                      <Alert.Content>{gemsError}</Alert.Content>
                    </Alert>
                  )}
                </Modal.Body>
                <Modal.Footer className="flex-wrap gap-2">
                  <Button
                    onClick={() => setGemsAddModalOpen(false)}
                    variant={"ghost"}
                    isDisabled={gemsActionLoading}
                    size={"md"}
                    className="rounded-xl"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleAddGems}
                    variant={"primary"}
                    isDisabled={gemsActionLoading || gemsCount === ""}
                    size={"md"}
                    className="rounded-xl"
                  >
                    {gemsActionLoading ? (
                      <Spinner aria-label="불러오는 중" size="sm" />
                    ) : (
                      "구슬 추가"
                    )}
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
          {/* 구슬 제거 모달 */}
          <Modal.Backdrop
            isOpen={gemsRemoveModalOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen && !gemsActionLoading) setGemsRemoveModalOpen(false);
            }}
            isDismissable={!gemsActionLoading}
            isKeyboardDismissDisabled={gemsActionLoading}
          >
            <Modal.Container size="md" scroll="inside" className="w-full">
              <Modal.Dialog
                style={{ width: "100%", maxWidth: "32rem", minWidth: 0 }}
              >
                <Modal.Header>
                  <Modal.Heading>구슬 제거</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="min-w-0 [overflow-wrap:anywhere]">
                  <div
                    style={{ marginBottom: 8 }}
                    className={"text-sm text-neutral-700"}
                  >
                    <strong>{userDetail?.name}</strong>님의 구슬을 제거합니다.
                  </div>
                  {gemsInfo && (
                    <Alert
                      style={{ marginBottom: 8 }}
                      status={"default"}
                      role="alert"
                    >
                      <Alert.Content>
                        현재 보유 구슬:{" "}
                        <strong>{gemsInfo.gemBalance || 0}개</strong>
                      </Alert.Content>
                    </Alert>
                  )}
                  <TextField
                    className="w-full"
                    isDisabled={gemsActionLoading}
                    isInvalid={gemsCount === ""}
                  >
                    <Label>{"제거할 구슬 개수"}</Label>
                    <Input
                      type="number"
                      value={gemsCount}
                      onChange={(
                        e: React.ChangeEvent<
                          | HTMLInputElement
                          | HTMLTextAreaElement
                          | HTMLSelectElement
                        >,
                      ) => {
                        const parsed = parseInt(e.target.value, 10);
                        setGemsCount(Number.isNaN(parsed) ? "" : Math.max(1, parsed));
                      }}
                      style={{ marginBottom: 8 }}
                      aria-label={"제거할 구슬 개수"}
                      {...{
                        min: 1,
                        max: gemsInfo?.gemBalance || 1,
                      }}
                    />
                  </TextField>
                  {gemsError && (
                    <Alert
                      style={{ marginBottom: 8 }}
                      status="danger"
                      role="alert"
                    >
                      <Alert.Content>{gemsError}</Alert.Content>
                    </Alert>
                  )}
                </Modal.Body>
                <Modal.Footer className="flex-wrap gap-2">
                  <Button
                    onClick={() => setGemsRemoveModalOpen(false)}
                    variant={"ghost"}
                    isDisabled={gemsActionLoading}
                    size={"md"}
                    className="rounded-xl"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleRemoveGems}
                    variant={"danger"}
                    isDisabled={gemsActionLoading || gemsCount === ""}
                    size={"md"}
                    className="rounded-xl"
                  >
                    {gemsActionLoading ? (
                      <Spinner aria-label="불러오는 중" size="sm" />
                    ) : (
                      "구슬 제거"
                    )}
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
          {/* 승인 취소 확인 모달 */}
          <Modal.Backdrop
            isOpen={revokeApprovalModalOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen && !revokeActionLoading) {
                setRevokeApprovalModalOpen(false);
                setRevokeReason("");
                setCustomRevokeReason("");
              }
            }}
            isDismissable={!revokeActionLoading}
            isKeyboardDismissDisabled={revokeActionLoading}
          >
            <Modal.Container size="md" scroll="inside" className="w-full">
              <Modal.Dialog
                style={{ width: "100%", maxWidth: "32rem", minWidth: 0 }}
              >
                <Modal.Header>
                  <Modal.Heading>
                    <div className={"text-lg font-semibold text-neutral-900"}>
                      승인 취소 확인
                    </div>
                  </Modal.Heading>
                </Modal.Header>
                <Modal.Body className="min-w-0 [overflow-wrap:anywhere]">
                  <div
                    style={{ marginBottom: 8 }}
                    className={"text-sm text-neutral-700"}
                  >
                    <strong>{userDetail?.name}</strong>님의 승인을
                    취소하시겠습니까?
                  </div>
                  <Alert
                    style={{ marginBottom: 8 }}
                    status={"warning"}
                    role="alert"
                  >
                    <Alert.Content>
                      <div className={"text-sm text-neutral-700"}>
                        <strong>경고:</strong>승인을 취소하면 사용자 상태가
                        &apos;미승인&apos;으로 변경되며, 다시 가입 승인을 받아야
                        합니다. 또한 자동으로 SMS가 발송됩니다.
                      </div>
                    </Alert.Content>
                  </Alert>
                  <div style={{ marginBottom: 8 }}>
                    <Label>승인 취소 사유</Label>
                    <Select
                      selectedKey={revokeReason}
                      onSelectionChange={(value) =>
                        ((e) => {
                          setRevokeReason(e.target.value);
                          if (e.target.value !== "OTHER") {
                            setCustomRevokeReason("");
                          }
                        })({
                          target: { value },
                        } as React.ChangeEvent<HTMLSelectElement>)
                      }
                      isDisabled={revokeActionLoading}
                      aria-label={"승인 취소 사유"}
                      className="w-full"
                    >
                      <Label>{"승인 취소 사유"}</Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {rejectionReasons.map((reason, index) => (
                            <ListBox.Item
                              key={reason.value}
                              id={reason.value}
                              textValue={reason.label}
                            >
                              {reason.label}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                  {revokeReason === "OTHER" && (
                    <TextField
                      className="w-full"
                      isDisabled={undefined}
                      isInvalid={undefined}
                    >
                      <Label>{"기타 승인 취소 사유"}</Label>
                      <TextArea
                        placeholder="승인 취소 사유를 직접 입력해주세요"
                        value={customRevokeReason}
                        onChange={(
                          e: React.ChangeEvent<
                            | HTMLInputElement
                            | HTMLTextAreaElement
                            | HTMLSelectElement
                          >,
                        ) => setCustomRevokeReason(e.target.value)}
                        style={{ marginBottom: 8 }}
                        required
                        rows={3}
                        aria-label={"기타 승인 취소 사유"}
                      />
                    </TextField>
                  )}
                  {actionError && (
                    <Alert
                      style={{ marginBottom: 8 }}
                      status="danger"
                      role="alert"
                    >
                      <Alert.Content>{actionError}</Alert.Content>
                    </Alert>
                  )}
                </Modal.Body>
                <Modal.Footer className="flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      setRevokeApprovalModalOpen(false);
                      setRevokeReason("");
                      setCustomRevokeReason("");
                    }}
                    variant={"ghost"}
                    isDisabled={revokeActionLoading}
                    size={"md"}
                    className="rounded-xl"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleRevokeApproval}
                    variant={"danger"}
                    isDisabled={
                      revokeActionLoading ||
                      !revokeReason.trim() ||
                      (revokeReason === "OTHER" && !customRevokeReason.trim())
                    }
                    size={"md"}
                    className="rounded-xl"
                  >
                    {revokeActionLoading ? (
                      <Spinner aria-label="불러오는 중" size="sm" />
                    ) : (
                      "승인 취소"
                    )}
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
          {/* 비밀번호 초기화 확인 다이얼로그 */}
          <Modal.Backdrop
            isOpen={resetPasswordConfirmOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen && !resetPasswordLoading)
                setResetPasswordConfirmOpen(false);
            }}
            isDismissable={!resetPasswordLoading}
            isKeyboardDismissDisabled={resetPasswordLoading}
          >
            <Modal.Container size="md" scroll="inside" className="w-full">
              <Modal.Dialog
                style={{ width: "100%", maxWidth: "32rem", minWidth: 0 }}
              >
                <Modal.Header>
                  <Modal.Heading>비밀번호 초기화</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="min-w-0 [overflow-wrap:anywhere]">
                  <div>
                    <strong>{userDetail?.name}</strong>님의 비밀번호를
                    초기화하시겠습니까?
                    <br />
                    <br />
                    초기화 시 임시 비밀번호가 발급되며, 기존 비밀번호는 사용할
                    수 없게 됩니다.
                  </div>
                </Modal.Body>
                <Modal.Footer className="flex-wrap gap-2">
                  <Button
                    onClick={() => setResetPasswordConfirmOpen(false)}
                    variant={"ghost"}
                    isDisabled={resetPasswordLoading}
                    size={"md"}
                    className="rounded-xl"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleConfirmResetPassword}
                    variant={"primary"}
                    isDisabled={resetPasswordLoading}
                    size={"md"}
                    className="rounded-xl"
                  >
                    {resetPasswordLoading ? (
                      <Spinner aria-label="불러오는 중" size="sm" />
                    ) : (
                      "초기화"
                    )}
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
          {/* 임시 비밀번호 결과 다이얼로그 */}
          <Modal.Backdrop
            isOpen={resetPasswordResultOpen}
            isDismissable={false}
            isKeyboardDismissDisabled
          >
            <Modal.Container size="md" scroll="inside" className="w-full">
              <Modal.Dialog
                style={{ width: "100%", maxWidth: "32rem", minWidth: 0 }}
              >
                <Modal.Header>
                  <Modal.Heading>비밀번호 초기화 완료</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="min-w-0 [overflow-wrap:anywhere]">
                  <div style={{ marginBottom: 8 }}>
                    비밀번호가 성공적으로 초기화되었습니다.
                    <br />
                    아래 임시 비밀번호를 회원에게 전달해주세요.
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <TextField
                      className="w-full"
                      isDisabled={undefined}
                      isInvalid={undefined}
                    >
                      <Label>{"임시 비밀번호"}</Label>
                      <Input
                        value={temporaryPassword}
                        readOnly
                        aria-label={"임시 비밀번호"}
                      />
                    </TextField>
                    <Button
                      onClick={handleCopyTemporaryPassword}
                      aria-label="임시 비밀번호 복사"
                      variant={"ghost"}
                      isDisabled={undefined}
                      isIconOnly={true}
                      size={"md"}
                      className="rounded-lg"
                    >
                      <Copy />
                    </Button>
                  </div>
                </Modal.Body>
                <Modal.Footer className="flex-wrap gap-2">
                  <Button
                    onClick={handleResetPasswordResultClose}
                    variant={"primary"}
                    isDisabled={undefined}
                    size={"md"}
                    className="rounded-xl"
                  >
                    확인
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
          {/* 계정 정지 / 정지 해제 모달 */}
          {userId && userDetail && (
            <AccountStatusModal
              open={accountStatusModalOpen}
              onClose={() => setAccountStatusModalOpen(false)}
              userId={userId}
              isSuspended={isAccountSuspended}
              userName={userDetail.name}
              onSuccess={handleAccountStatusSuccess}
            />
          )}
          {/* 블랙리스트 등록 모달 */}
          {userId && userDetail && (
            <BlacklistRegisterModal
              open={blacklistRegisterModalOpen}
              onClose={() => setBlacklistRegisterModalOpen(false)}
              user={{
                id: userId,
                name: userDetail.name,
                phoneNumber: userDetail.phoneNumber,
                age: userDetail.age,
                gender: userDetail.gender,
                universityName:
                  userDetail.universityDetails?.name ?? userDetail.university,
              }}
              onSuccess={handleBlacklistSuccess}
            />
          )}
          {/* 블랙리스트 해제 다이얼로그 */}
          {userId && userDetail && (
            <BlacklistReleaseDialog
              open={blacklistReleaseDialogOpen}
              onClose={() => setBlacklistReleaseDialogOpen(false)}
              userId={userId}
              userName={userDetail.name}
              currentReason={activeBlacklistEntry?.reason ?? null}
              blacklistedAt={activeBlacklistEntry?.blacklistedAt ?? null}
              onSuccess={handleBlacklistSuccess}
            />
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};

export default UserDetailModal;
