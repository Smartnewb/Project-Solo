import { useState, useEffect } from "react";
import { useToast } from "@/shared/ui/admin/toast";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import {
  Paper,
  Typography,
  Box,
  Button,
  IconButton,
  Dialog,
  Chip,
  Collapse,
  Divider,
  TextField,
  Link,
  Tooltip,
} from "@mui/material";
import { PendingUser } from "../page";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import InstagramIcon from "@mui/icons-material/Instagram";
import WarningIcon from "@mui/icons-material/Warning";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatIcon from "@mui/icons-material/Chat";
import PeopleIcon from "@mui/icons-material/People";
import PaymentIcon from "@mui/icons-material/Payment";
import SchoolIcon from "@mui/icons-material/School";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AdminService from "@/app/services/admin";
import { safeToLocaleDateString, safeToLocaleString } from '@/app/utils/formatters';
import {
  mapImagesBySlot,
  getSlotLabel,
  formatApprovedDate,
} from "../utils/imageMapper";

interface ImageReviewPanelProps {
  user: PendingUser | null;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  onImageApproved: (imageId: string) => void;
  onImageRejected: (imageId: string) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
}

const getRankConfig = (rank?: string) => {
  const configs = {
    S: {
      label: "S",
      color: "#9c27b0",
      bgColor: "#f3e5f5",
      tooltip: "최상위 등급",
    },
    A: {
      label: "A",
      color: "#2196f3",
      bgColor: "#e3f2fd",
      tooltip: "상위 등급",
    },
    B: {
      label: "B",
      color: "#4caf50",
      bgColor: "#e8f5e9",
      tooltip: "중위 등급",
    },
    C: {
      label: "C",
      color: "#ff9800",
      bgColor: "#fff3e0",
      tooltip: "하위 등급",
    },
    UNKNOWN: {
      label: "미분류",
      color: "#9e9e9e",
      bgColor: "#f5f5f5",
      tooltip: "등급 미정",
    },
  };

  return configs[rank as keyof typeof configs] || configs.UNKNOWN;
};

export default function ImageReviewPanel({
  user,
  onApprove,
  onReject,
  onImageApproved,
  onImageRejected,
  processing,
  setProcessing,
}: ImageReviewPanelProps) {
  const toast = useToast();
  const confirmAction = useConfirm();

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [rejectImageModalOpen, setRejectImageModalOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [imageRejectionReason, setImageRejectionReason] = useState("");
  const [currentRank, setCurrentRank] = useState<string>("UNKNOWN");
  const [isUpdatingRank, setIsUpdatingRank] = useState(false);
  const [showReviewContext, setShowReviewContext] = useState(false);

  useEffect(() => {
    setCurrentRank(user?.rank || "UNKNOWN");
  }, [user]);

  const handleRankChange = async (newRank: string) => {
    if (!user || newRank === currentRank) return;

    const previousRank = currentRank;
    setCurrentRank(newRank);
    setIsUpdatingRank(true);

    try {
      await AdminService.userReview.updateUserRank(
        user.userId,
        newRank as any,
      );
    } catch (error: any) {
      setCurrentRank(previousRank);
      toast.error(error.response?.data?.message || "Rank 업데이트에 실패했습니다.");
    } finally {
      setIsUpdatingRank(false);
    }
  };

  if (!user) {
    return (
      <Paper sx={{ p: 4, textAlign: "center", height: "100%" }}>
        <Typography variant="body1" color="text.secondary">
          심사할 사용자를 선택해주세요.
        </Typography>
      </Paper>
    );
  }

  const handleApprove = () => {
    onApprove(user.id || user.userId);
  };

  const handleReject = () => {
    onReject(user.id || user.userId);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageModalOpen(true);
  };

  const handleImageModalClose = () => {
    setImageModalOpen(false);
    setSelectedImageUrl(null);
  };

  const handleApproveImage = async (imageId: string) => {
    try {
      const targetImage = (user.pendingImages || user.profileImages || []).find(
        (img) => img.id === imageId,
      );
      const isMainProfile = targetImage?.slotIndex === 0;

      if (isMainProfile) {
        const confirmed = await confirmAction({
          message:
            '대표 프로필을 승인하시겠습니까?\n대표 프로필 승인 시 회원 상태가 "승인됨"으로 자동 변경되며, 회원이 서비스를 정상적으로 이용할 수 있게 됩니다.',
          confirmText: "승인",
          severity: "info",
        });
        if (!confirmed) return;
      }

      setProcessing(true);
      await AdminService.profileImages.approveIndividualImage(imageId);
      onImageApproved(imageId);

      if (isMainProfile) {
        toast.success('대표 프로필이 승인되었습니다. 회원 상태가 "승인됨"으로 변경되었습니다.');
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "이미지 승인 중 오류가 발생했습니다.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectImageClick = (imageId: string) => {
    setSelectedImageId(imageId);
    setRejectImageModalOpen(true);
  };

  const handleRejectImageConfirm = async () => {
    if (!selectedImageId) return;

    if (!imageRejectionReason.trim()) {
      toast.error("거절 사유를 입력해주세요.");
      return;
    }

    const targetImage = (user.pendingImages || user.profileImages || []).find(
      (img) => img.id === selectedImageId,
    );
    const isMainProfile = targetImage?.slotIndex === 0;

    if (isMainProfile) {
      const confirmed = await confirmAction({
        message:
          `⚠️ 대표 프로필을 거절하시겠습니까?\n대표 프로필 거절 시 회원 상태가 "거절됨"으로 변경되며, 회원이 서비스를 이용할 수 없게 됩니다.\n거절 사유: ${imageRejectionReason}`,
        confirmText: "거절",
        severity: "error",
      });
      if (!confirmed) return;
    }

    try {
      setProcessing(true);
      await AdminService.profileImages.rejectIndividualImage(
        selectedImageId,
        imageRejectionReason,
      );
      setRejectImageModalOpen(false);
      const rejectedImageId = selectedImageId;
      setSelectedImageId(null);
      setImageRejectionReason("");
      onImageRejected(rejectedImageId);

      if (isMainProfile) {
        toast.success('대표 프로필이 거절되었습니다. 회원 상태가 "거절됨"으로 변경되었습니다.');
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "이미지 거절 중 오류가 발생했습니다.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectImageModalClose = () => {
    setRejectImageModalOpen(false);
    setSelectedImageId(null);
    setImageRejectionReason("");
  };

  const rankSelected = currentRank !== "UNKNOWN";

  return (
    <Paper sx={{ p: 3, display: "flex", flexDirection: "column" }}>
      {/* 유저 정보 (컴팩트 1줄) */}
      <Box sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {user.name}
        </Typography>
        <Chip label={`${user.age}세`} size="small" sx={{ height: 22, fontSize: "0.75rem" }} />
        <Chip label={user.gender === "MALE" ? "남성" : "여성"} size="small" sx={{ height: 22, fontSize: "0.75rem" }} />
        {user.mbti && (
          <Chip label={user.mbti} size="small" color="primary" sx={{ height: 22, fontSize: "0.75rem" }} />
        )}
        {user.universityName && (
          <Typography variant="caption" color="text.secondary">
            {user.universityName}
          </Typography>
        )}
        {(user.instagramId || user.instagram) && (
          <Link
            href={`https://instagram.com/${user.instagramId || user.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.3,
              color: "#E1306C",
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            <InstagramIcon sx={{ fontSize: 16, color: "#E1306C" }} />
            <Typography variant="caption" sx={{ fontWeight: 500, color: "#E1306C" }}>
              @{user.instagramId || user.instagram}
            </Typography>
          </Link>
        )}
      </Box>

      {/* Rank 선택 (이미지 위) */}
      <Box sx={{ mb: 2, p: 1.5, backgroundColor: "#fafafa", borderRadius: 2, border: "1px solid #e0e0e0" }}>
        {!rankSelected && (
          <Typography
            variant="caption"
            sx={{ color: "#ed6c02", display: "block", mb: 1 }}
          >
            승인하려면 Rank를 먼저 선택해주세요
          </Typography>
        )}
        <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: "block", color: "#344054" }}>
          Rank 선택
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {(["S", "A", "B", "C"] as const).map((rank) => {
            const config = getRankConfig(rank);
            const isSelected = currentRank === rank;
            return (
              <Chip
                key={rank}
                label={`${rank}등급`}
                onClick={() => handleRankChange(rank)}
                disabled={isUpdatingRank}
                sx={{
                  flex: 1,
                  height: 36,
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  backgroundColor: isSelected ? config.color : config.bgColor,
                  color: isSelected ? "#fff" : config.color,
                  border: isSelected
                    ? `2px solid ${config.color}`
                    : "2px solid transparent",
                  "&:hover": {
                    backgroundColor: isSelected ? config.color : config.bgColor,
                    opacity: 0.85,
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* 승인/거절 버튼 */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
        <Button
          variant="outlined"
          color="error"
          fullWidth
          onClick={handleReject}
          sx={{ height: 44 }}
        >
          반려하기
        </Button>
        <Button
          variant="contained"
          fullWidth
          disabled={!rankSelected || processing}
          onClick={handleApprove}
          sx={{
            height: 44,
            backgroundColor: rankSelected
              ? getRankConfig(currentRank).color
              : undefined,
            "&:hover": {
              backgroundColor: rankSelected
                ? getRankConfig(currentRank).color
                : undefined,
              opacity: 0.9,
            },
          }}
        >
          {rankSelected
            ? `${currentRank}등급으로 승인하기`
            : "승인하기"}
        </Button>
      </Box>

      {/* 프로필 이미지 - Before/After 비교 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
          프로필 이미지 심사 (
          {user.pendingImages?.length || user.profileImages?.length || 0}장 대기
          중)
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
          {Array.from(
            mapImagesBySlot(
              user.profileUsing,
              user.pendingImages || user.profileImages || [],
            ),
          )
            .sort(([a], [b]) => a - b)
            .map(([slotIndex, pair]) => (
              <Box
                key={slotIndex}
                sx={{
                  p: 1.5,
                  backgroundColor: "#fafafa",
                  borderRadius: 2,
                  border: "1px solid #e0e0e0",
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}
                >
                  <Typography variant="caption" fontWeight="bold" sx={{ fontSize: "0.75rem" }}>
                    {getSlotLabel(slotIndex)}
                  </Typography>
                  {slotIndex === 0 && (
                    <Chip
                      label="대표"
                      size="small"
                      sx={{
                        backgroundColor: "#ff9800",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        height: 20,
                      }}
                    />
                  )}
                </Box>

                {/* 이전 사진 (위) */}
                <Typography
                  variant="caption"
                  sx={{ display: "block", mb: 0.5, color: "#4caf50", fontWeight: 600, fontSize: "0.7rem" }}
                >
                  ● 이전
                </Typography>
                {pair.current ? (
                  <Box
                    sx={{
                      position: "relative",
                      borderRadius: 1.5,
                      overflow: "hidden",
                      cursor: "pointer",
                      border: "2px solid #4caf50",
                      "&:hover": { opacity: 0.9 },
                    }}
                    onClick={() => handleImageClick(pair.current!.imageUrl)}
                  >
                    <Box sx={{ position: "relative", paddingTop: "100%" }}>
                      <Box
                        component="img"
                        src={pair.current.imageUrl}
                        alt="현재 프로필"
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      position: "relative",
                      paddingTop: "100%",
                      backgroundColor: "#f5f5f5",
                      borderRadius: 1.5,
                      border: "2px dashed #d0d5dd",
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontSize: "0.7rem",
                      }}
                    >
                      없음
                    </Typography>
                  </Box>
                )}

                {/* 화살표 */}
                <Box sx={{ textAlign: "center", py: 0.25 }}>
                  <ArrowDownwardIcon sx={{ fontSize: 18, color: "#d0d5dd" }} />
                </Box>

                {/* 변경 예정 (아래) */}
                <Typography
                  variant="caption"
                  sx={{ display: "block", mb: 0.5, color: "#ff9800", fontWeight: 600, fontSize: "0.7rem" }}
                >
                  ● 변경
                </Typography>
                {pair.pending ? (
                  <Box sx={{ position: "relative" }}>
                    <Box
                      sx={{
                        position: "relative",
                        borderRadius: 1.5,
                        overflow: "hidden",
                        cursor: "pointer",
                        border: "2px solid #ff9800",
                        "&:hover": { opacity: 0.9 },
                      }}
                      onClick={() =>
                        handleImageClick(pair.pending!.imageUrl)
                      }
                    >
                      <Box sx={{ position: "relative", paddingTop: "100%" }}>
                        <Box
                          component="img"
                          src={pair.pending.imageUrl}
                          alt="대기 중인 프로필"
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5, mt: 0.75, justifyContent: "center" }}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleRejectImageClick(pair.pending!.id)
                        }
                        sx={{
                          backgroundColor: "#f44336",
                          color: "#fff",
                          width: 28,
                          height: 28,
                          "&:hover": { backgroundColor: "#d32f2f" },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleApproveImage(pair.pending!.id)}
                        sx={{
                          backgroundColor: "#4caf50",
                          color: "#fff",
                          width: 28,
                          height: 28,
                          "&:hover": { backgroundColor: "#388e3c" },
                        }}
                      >
                        <CheckCircleIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      position: "relative",
                      paddingTop: "100%",
                      backgroundColor: "#f5f5f5",
                      borderRadius: 1.5,
                      border: "2px dashed #d0d5dd",
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontSize: "0.7rem",
                      }}
                    >
                      없음
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
        </Box>
      </Box>

      {/* 심사 상세 정보 (접힘 섹션) - 이미지 그리드 아래 */}
      <Box
        onClick={() => setShowReviewContext(!showReviewContext)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          py: 1,
          px: 0.5,
          borderTop: "1px solid #e0e0e0",
          borderBottom: "1px solid #e0e0e0",
          mb: 1,
          "&:hover": { backgroundColor: "#f5f5f5" },
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, color: "#667085" }}>
          📋 심사 상세 정보 (선호도, 거절 이력, 참고 정보)
        </Typography>
        <ExpandMoreIcon
          sx={{
            fontSize: 20,
            color: "#667085",
            transform: showReviewContext ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </Box>

      <Collapse in={showReviewContext}>

      {/* 심사 참고 정보 */}
      {user.reviewContext && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              mb: 1.5,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            📋 심사 참고 정보
          </Typography>

          {/* 경고 배너: 신고/제재 이력 */}
          {(user.reviewContext.reportCount > 0 ||
            user.reviewContext.hasSuspensionHistory) && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                backgroundColor: "#ffebee",
                borderRadius: 1,
                border: "1px solid #ffcdd2",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <WarningIcon sx={{ color: "#d32f2f", fontSize: 20 }} />
              <Box>
                {user.reviewContext.reportCount > 0 && (
                  <Typography
                    variant="body2"
                    sx={{ color: "#c62828", fontWeight: 600 }}
                  >
                    신고 {user.reviewContext.reportCount}회
                  </Typography>
                )}
                {user.reviewContext.hasSuspensionHistory && (
                  <Typography
                    variant="body2"
                    sx={{ color: "#c62828", fontWeight: 600 }}
                  >
                    제재 이력 있음
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* 첫 심사 + 가입일 */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
            {user.reviewContext.isFirstReview && (
              <Chip
                icon={<NewReleasesIcon sx={{ fontSize: 16 }} />}
                label="첫 심사"
                size="small"
                sx={{
                  backgroundColor: "#e3f2fd",
                  color: "#1565c0",
                  fontWeight: 600,
                  "& .MuiChip-icon": { color: "#1565c0" },
                }}
              />
            )}
            {user.reviewContext.isUniversityVerified && (
              <Chip
                icon={<SchoolIcon sx={{ fontSize: 16 }} />}
                label="학교 인증"
                size="small"
                sx={{
                  backgroundColor: "#e8f5e9",
                  color: "#2e7d32",
                  fontWeight: 600,
                  "& .MuiChip-icon": { color: "#2e7d32" },
                }}
              />
            )}
            {user.reviewContext.hasPurchased && (
              <Chip
                icon={<PaymentIcon sx={{ fontSize: 16 }} />}
                label={
                  user.reviewContext.totalPurchaseAmount
                    ? `결제 ${user.reviewContext.totalPurchaseAmount.toLocaleString()}원`
                    : "유료 회원"
                }
                size="small"
                sx={{
                  backgroundColor: "#fff3e0",
                  color: "#e65100",
                  fontWeight: 600,
                  "& .MuiChip-icon": { color: "#e65100" },
                }}
              />
            )}
          </Box>

          {/* 활동 통계 */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 1,
              p: 1.5,
              backgroundColor: "#fafafa",
              borderRadius: 1,
              border: "1px solid #e0e0e0",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 0.5 }}>
                <PersonAddIcon sx={{ fontSize: 18, color: "#757575" }} />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                가입일
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, fontSize: "0.75rem" }}
              >
                {safeToLocaleDateString(user.reviewContext.userCreatedAt, "ko-KR", { month: "short", day: "numeric" })}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 0.5 }}>
                <FavoriteIcon sx={{ fontSize: 18, color: "#e91e63" }} />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                받은 좋아요
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user.reviewContext.receivedLikeCount}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 0.5 }}>
                <PeopleIcon sx={{ fontSize: 18, color: "#9c27b0" }} />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                매칭
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user.reviewContext.matchCount}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 0.5 }}>
                <ChatIcon sx={{ fontSize: 18, color: "#2196f3" }} />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                채팅방
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user.reviewContext.chatRoomCount}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* 선호도 */}
      {user.preferences && user.preferences.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            선호도
          </Typography>
          {(user.preferences || []).map((pref, index) => (
            <Box key={index} sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {pref.typeName}
              </Typography>
              <Box
                sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}
              >
                {pref.options.map((option, idx) => (
                  <Chip
                    key={idx}
                    label={option}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* 거절 이력 */}
      {user.rejectionHistory && user.rejectionHistory.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, fontWeight: 600, color: "error.main" }}
          >
            거절 이력
          </Typography>
          {(user.rejectionHistory || []).map((history, index) => (
            <Box
              key={index}
              sx={{ mb: 1, p: 1, backgroundColor: "#fff3e0", borderRadius: 1 }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {history.category}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {history.reason}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {safeToLocaleString(history.createdAt)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* 거절된 이미지 */}
      {user.rejectedImages && user.rejectedImages.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ mb: 1.5, fontWeight: 600, color: "error.main" }}
          >
            🚫 거절된 이미지 ({user.rejectedImages.length}장)
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            {user.rejectedImages.map((image, index) => (
              <Box
                key={image.id}
                sx={{
                  position: "relative",
                  width: 100,
                  borderRadius: 1.5,
                  overflow: "hidden",
                  border: "2px solid #ffcdd2",
                  backgroundColor: "#ffebee",
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: "#ef5350",
                  },
                }}
                onClick={() => handleImageClick(image.imageUrl)}
              >
                <Box
                  sx={{
                    position: "relative",
                    paddingTop: "100%",
                  }}
                >
                  <Box
                    component="img"
                    src={image.imageUrl}
                    alt={`거절된 이미지 ${index + 1}`}
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "grayscale(30%)",
                      opacity: 0.8,
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: "rgba(244, 67, 54, 0.9)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 14, color: "#fff" }} />
                  </Box>
                </Box>
                <Box sx={{ p: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: "#c62828",
                      fontWeight: 500,
                      fontSize: "0.7rem",
                      lineHeight: 1.3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {image.rejectionReason}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: "0.65rem", color: "text.secondary" }}
                  >
                    {safeToLocaleDateString(image.rejectedAt, "ko-KR", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {user.bio && (
        <Typography variant="body2" sx={{ mt: 1, mb: 2, fontStyle: "italic" }}>
          &quot;{user.bio}&quot;
        </Typography>
      )}

      </Collapse>

      {/* 이미지 확대 모달 */}
      <Dialog
        open={imageModalOpen}
        onClose={handleImageModalClose}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "transparent",
            boxShadow: "none",
            overflow: "visible",
            maxWidth: "95vw",
            maxHeight: "95vh",
            m: 2,
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <IconButton
            onClick={handleImageModalClose}
            sx={{
              position: "absolute",
              top: -20,
              right: -20,
              backgroundColor: "white",
              color: "#333",
              zIndex: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              "&:hover": {
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          {selectedImageUrl && (
            <Box
              component="img"
              src={selectedImageUrl}
              alt="확대 이미지"
              sx={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                borderRadius: 2,
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}
            />
          )}
        </Box>
      </Dialog>

      {/* 개별 이미지 거절 사유 입력 모달 */}
      <Dialog
        open={rejectImageModalOpen}
        onClose={handleRejectImageModalClose}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
            이미지 거절 사유 선택
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            해당 이미지를 거절하는 사유를 선택하거나 입력해주세요.
          </Typography>

          {/* 빠른 템플릿 선택 */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{ mb: 1.5, fontWeight: 600, color: "primary.main" }}
            >
              ⚡ 빠른 선택
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              {[
                "얼굴 식별 불가",
                "화질 불량",
                "동물 사진",
                "동일 사진",
                "부적절한 노출",
                "타인 사진 도용",
              ].map((template) => (
                <Chip
                  key={template}
                  label={template}
                  onClick={() => setImageRejectionReason(template)}
                  color={
                    imageRejectionReason === template ? "error" : "default"
                  }
                  variant={
                    imageRejectionReason === template ? "filled" : "outlined"
                  }
                  sx={{
                    cursor: "pointer",
                    fontWeight: imageRejectionReason === template ? 600 : 400,
                    px: 1.5,
                    "&:hover": {
                      backgroundColor:
                        imageRejectionReason === template
                          ? undefined
                          : "#ffebee",
                    },
                  }}
                />
              ))}
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary">
              카테고리별 사유
            </Typography>
          </Divider>

          {/* 카테고리별 템플릿 */}
          <Box sx={{ mb: 3 }}>
            {/* 프로필 이미지 문제 */}
            <Box sx={{ mb: 2.5 }}>
              <Typography
                variant="caption"
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: "text.secondary",
                  display: "block",
                }}
              >
                📷 프로필 이미지 문제
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {[
                  "본인 사진 아님",
                  "얼굴 가림",
                  "과도한 보정",
                  "단체 사진",
                  "풍경/사물 사진",
                  "어린 시절 사진",
                  "동물 사진",
                  "동일 사진",
                ].map((template) => (
                  <Chip
                    key={template}
                    label={template}
                    size="small"
                    onClick={() => setImageRejectionReason(template)}
                    color={
                      imageRejectionReason === template ? "error" : "default"
                    }
                    variant={
                      imageRejectionReason === template ? "filled" : "outlined"
                    }
                    sx={{
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      "&:hover": {
                        backgroundColor:
                          imageRejectionReason === template
                            ? undefined
                            : "#ffebee",
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* 품질 문제 */}
            <Box sx={{ mb: 2.5 }}>
              <Typography
                variant="caption"
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: "text.secondary",
                  display: "block",
                }}
              >
                🔍 품질 문제
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {["흐릿한 사진", "너무 어두움", "해상도 낮음", "필터 과다"].map(
                  (template) => (
                    <Chip
                      key={template}
                      label={template}
                      size="small"
                      onClick={() => setImageRejectionReason(template)}
                      color={
                        imageRejectionReason === template ? "error" : "default"
                      }
                      variant={
                        imageRejectionReason === template
                          ? "filled"
                          : "outlined"
                      }
                      sx={{
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        "&:hover": {
                          backgroundColor:
                            imageRejectionReason === template
                              ? undefined
                              : "#ffebee",
                        },
                      }}
                    />
                  ),
                )}
              </Box>
            </Box>

            {/* 부적절한 내용 */}
            <Box sx={{ mb: 2.5 }}>
              <Typography
                variant="caption"
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: "text.secondary",
                  display: "block",
                }}
              >
                ⚠️ 부적절한 내용
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {[
                  "선정적인 포즈",
                  "음주/흡연 장면",
                  "폭력적 내용",
                  "혐오 표현 포함",
                ].map((template) => (
                  <Chip
                    key={template}
                    label={template}
                    size="small"
                    onClick={() => setImageRejectionReason(template)}
                    color={
                      imageRejectionReason === template ? "error" : "default"
                    }
                    variant={
                      imageRejectionReason === template ? "filled" : "outlined"
                    }
                    sx={{
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      "&:hover": {
                        backgroundColor:
                          imageRejectionReason === template
                            ? undefined
                            : "#ffebee",
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* 신원 확인 불가 */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: "text.secondary",
                  display: "block",
                }}
              >
                🔐 신원 확인 불가
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {[
                  "연예인/유명인 사진",
                  "인터넷 이미지 도용",
                  "AI 생성 이미지",
                ].map((template) => (
                  <Chip
                    key={template}
                    label={template}
                    size="small"
                    onClick={() => setImageRejectionReason(template)}
                    color={
                      imageRejectionReason === template ? "error" : "default"
                    }
                    variant={
                      imageRejectionReason === template ? "filled" : "outlined"
                    }
                    sx={{
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      "&:hover": {
                        backgroundColor:
                          imageRejectionReason === template
                            ? undefined
                            : "#ffebee",
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary">
              또는 직접 입력
            </Typography>
          </Divider>

          {/* 직접 입력 */}
          <TextField
            fullWidth
            multiline
            rows={4}
            value={imageRejectionReason}
            onChange={(e) => setImageRejectionReason(e.target.value)}
            placeholder="거절 사유를 자세히 입력해주세요..."
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
            <Button
              onClick={handleRejectImageModalClose}
              color="inherit"
              size="large"
            >
              취소
            </Button>
            <Button
              onClick={handleRejectImageConfirm}
              variant="contained"
              color="error"
              size="large"
            >
              거절하기
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Paper>
  );
}
