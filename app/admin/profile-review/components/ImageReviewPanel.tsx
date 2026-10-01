import { X as CloseIcon, CircleCheck as CheckCircleIcon, Instagram as InstagramIcon, TriangleAlert as WarningIcon, Heart as FavoriteIcon, MessageCircle as ChatIcon, Users as PeopleIcon, CreditCard as PaymentIcon, GraduationCap as SchoolIcon, BadgeAlert as NewReleasesIcon, UserPlus as PersonAddIcon, ArrowDown as ArrowDownwardIcon, ChevronDown as ExpandMoreIcon } from 'lucide-react';
import { Button, Chip, Modal, TextField, TextArea } from '@heroui/react';
import { useState, useEffect } from "react";
import { useToast } from "@/shared/ui/admin/toast";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import { PendingImage, PendingUser } from "../page";
import AdminService from "@/app/services/admin";
import { safeToLocaleDateString, safeToLocaleString } from '@/app/utils/formatters';
import { mapImagesBySlot, getSlotLabel, } from "../utils/imageMapper";
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
type ApiErrorLike = {
    response?: {
        status?: number;
        data?: {
            message?: string;
        };
    };
};
const getApiError = (error: unknown): ApiErrorLike => typeof error === "object" && error !== null ? (error as ApiErrorLike) : {};
const getApiErrorMessage = (error: unknown, fallback: string) => getApiError(error).response?.data?.message || (error instanceof Error ? error.message : fallback);
const isStaleImageReviewError = (error: unknown) => {
    const response = getApiError(error).response;
    return response?.status === 400 && response.data?.message === "심사 대기 중인 이미지가 아닙니다.";
};
const getImageSlotIndex = (image: {
    imageOrder?: number;
    slotIndex?: number;
}, fallback: number) => image.slotIndex ?? fallback;
const formatPreferenceOption = (option: unknown) => {
    if (typeof option === "object" && option !== null) {
        const name = (option as {
            name?: unknown;
        }).name;
        return typeof name === "string" ? name : JSON.stringify(option);
    }
    return String(option);
};
export default function ImageReviewPanel({ user, onApprove, onReject, onImageApproved, onImageRejected, processing, setProcessing, }: ImageReviewPanelProps) {
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
        if (!user || newRank === currentRank)
            return;
        const previousRank = currentRank;
        setCurrentRank(newRank);
        setIsUpdatingRank(true);
        try {
            await AdminService.userReview.updateUserRank(user.userId, newRank as NonNullable<PendingUser["rank"]>);
        }
        catch (error: unknown) {
            setCurrentRank(previousRank);
            toast.error(getApiErrorMessage(error, "Rank 업데이트에 실패했습니다."));
        }
        finally {
            setIsUpdatingRank(false);
        }
    };
    if (!user) {
        return (<section style={{ padding: 32, textAlign: "center", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }} className="rounded-xl border bg-white p-4">
        <p style={{ fontWeight: 700, color: "#111827" }}>
          심사할 사용자를 선택해주세요.
        </p>
        <p style={{ marginTop: 8, maxWidth: 360 }}>
          왼쪽 목록에서 사용자를 선택하면 사진별 승인/반려와 등급 조정을 진행할 수 있습니다.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 16 }}>
          <a href="/admin/unapproved-users" className="inline-flex items-center gap-2 rounded-lg border p-2">
            미승인 유저 보기
          </a>
          <a href="/admin/review-inbox" className="inline-flex items-center gap-2 rounded-lg border p-2">
            검토 인박스 보기
          </a>
        </div>
      </section>);
    }
    const pendingImagesForReview: PendingImage[] = user.pendingImages && user.pendingImages.length > 0
        ? user.pendingImages
        : (user.profileImages || []).map((img, index) => ({
            id: img.id,
            imageUrl: img.imageUrl,
            imageOrder: img.imageOrder,
            slotIndex: getImageSlotIndex(img, img.imageOrder ?? index),
            isMain: img.isMain,
        }));
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
            const targetImage = pendingImagesForReview.find((img) => img.id === imageId);
            const isMainProfile = targetImage?.slotIndex === 0;
            const targetPair = slotPairs.find(([slotIndex]) => slotIndex === targetImage?.slotIndex)?.[1];
            const isRepresentativeReplacement = isMainProfile &&
                Boolean(targetPair?.current) &&
                (Boolean(user.isApproved || user.approved) || Boolean(targetImage?.isRepresentativeReplacement));
            if (isMainProfile && !isRepresentativeReplacement) {
                toast.info("대표사진 신규 심사는 상단 회원 승인 흐름에서 처리합니다.");
                return;
            }
            if (isRepresentativeReplacement) {
                const confirmed = await confirmAction({
                    message: "대표사진 교체를 승인하시겠습니까?\n회원 승인 상태는 유지되고 대표사진만 새 이미지로 교체됩니다.",
                    confirmText: "교체 승인",
                    severity: "info",
                });
                if (!confirmed)
                    return;
            }
            setProcessing(true);
            await AdminService.profileImages.approveIndividualImage(imageId);
            onImageApproved(imageId);
            if (isRepresentativeReplacement) {
                toast.success("대표사진 교체가 승인되었습니다.");
            }
        }
        catch (error: unknown) {
            if (isStaleImageReviewError(error)) {
                await onImageApproved(imageId);
                toast.info("이미 심사 완료된 이미지라 목록을 새로고침했습니다.");
                return;
            }
            toast.error(getApiErrorMessage(error, "이미지 승인 중 오류가 발생했습니다."));
        }
        finally {
            setProcessing(false);
        }
    };
    const handleRejectImageClick = (imageId: string) => {
        setSelectedImageId(imageId);
        setRejectImageModalOpen(true);
    };
    const handleRejectImageConfirm = async () => {
        if (!selectedImageId)
            return;
        if (!imageRejectionReason.trim()) {
            toast.error("거절 사유를 입력해주세요.");
            return;
        }
        const targetImage = pendingImagesForReview.find((img) => img.id === selectedImageId);
        const isMainProfile = targetImage?.slotIndex === 0;
        const targetPair = slotPairs.find(([slotIndex]) => slotIndex === targetImage?.slotIndex)?.[1];
        const isRepresentativeReplacement = isMainProfile &&
            Boolean(targetPair?.current) &&
            (Boolean(user.isApproved || user.approved) || Boolean(targetImage?.isRepresentativeReplacement));
        if (isMainProfile && !isRepresentativeReplacement) {
            toast.info("대표사진 신규 심사는 상단 회원 반려 흐름에서 처리합니다.");
            return;
        }
        if (isRepresentativeReplacement) {
            const confirmed = await confirmAction({
                message: `대표사진 교체를 거절하시겠습니까?\n회원 승인 상태는 유지되고 기존 대표사진이 유지됩니다.\n거절 사유: ${imageRejectionReason}`,
                confirmText: "교체 거절",
                severity: "error",
            });
            if (!confirmed)
                return;
        }
        try {
            setProcessing(true);
            await AdminService.profileImages.rejectIndividualImage(selectedImageId, imageRejectionReason);
            setRejectImageModalOpen(false);
            const rejectedImageId = selectedImageId;
            setSelectedImageId(null);
            setImageRejectionReason("");
            onImageRejected(rejectedImageId);
            if (isRepresentativeReplacement) {
                toast.success("대표사진 교체가 거절되었습니다.");
            }
        }
        catch (error: unknown) {
            if (isStaleImageReviewError(error)) {
                setRejectImageModalOpen(false);
                const staleImageId = selectedImageId;
                setSelectedImageId(null);
                setImageRejectionReason("");
                await onImageRejected(staleImageId);
                toast.info("이미 심사 완료된 이미지라 목록을 새로고침했습니다.");
                return;
            }
            toast.error(getApiErrorMessage(error, "이미지 거절 중 오류가 발생했습니다."));
        }
        finally {
            setProcessing(false);
        }
    };
    const handleRejectImageModalClose = () => {
        setRejectImageModalOpen(false);
        setSelectedImageId(null);
        setImageRejectionReason("");
    };
    const rankSelected = currentRank !== "UNKNOWN";
    const slotPairs = Array.from(mapImagesBySlot(user.profileUsing, pendingImagesForReview)).sort(([a], [b]) => a - b);
    return (<section style={{ padding: 24, display: "flex", flexDirection: "column" }} className="rounded-xl border bg-white p-4">
      {/* 유저 정보 (컴팩트 1줄) */}
      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <p style={{ fontWeight: 700 }}>
          {user.name}
        </p>
        <Chip size="sm">{`${user.age}세`}</Chip>
        <Chip size="sm">{user.gender === "MALE" ? "남성" : "여성"}</Chip>
        {user.mbti && (<Chip size="sm">{user.mbti}</Chip>)}
        {user.universityName && (<p>
            {user.universityName}
          </p>)}
        {(user.instagramId || user.instagram) && (<a href={`https://instagram.com/${user.instagramId || user.instagram}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 2.4, color: "#E1306C" }}>
            <InstagramIcon style={{ fontSize: 16, color: "#E1306C" }}></InstagramIcon>
            <p style={{ fontWeight: 500, color: "#E1306C" }}>
              @{user.instagramId || user.instagram}
            </p>
          </a>)}
      </div>

      {/* Rank 선택 (이미지 위) */}
      <div style={{ marginBottom: 16, padding: 12, backgroundColor: "#fafafa", borderRadius: 2, border: "1px solid #e0e0e0" }}>
        {!rankSelected && (<p style={{ color: "#ed6c02", display: "block", marginBottom: 8 }}>
            승인하려면 Rank를 먼저 선택해주세요
          </p>)}
        <p style={{ fontWeight: 700, marginBottom: 4, display: "block", color: "#344054" }}>
          Rank 선택
        </p>
        <div style={{ display: "flex", gap: 4 }}>
          {(["S", "A", "B", "C"] as const).map((rank) => {
            const config = getRankConfig(rank);
            const isSelected = currentRank === rank;
            return (<Button key={rank} isDisabled={isUpdatingRank} aria-pressed={isSelected} variant={isSelected ? "primary" : "secondary"} onPress={() => handleRankChange(rank)}>{`${rank}등급`}</Button>);
        })}
        </div>
      </div>

      <div style={{ marginBottom: 16, padding: 12, borderRadius: 2, border: "1px solid #e0e0e0", backgroundColor: "#fffdf5" }}>
        <p style={{ color: "#7a4d00", fontWeight: 600 }}>
          대표사진은 회원 승인 흐름에서 처리하고, 추가 사진은 개별 이미지 심사로 승인/거절합니다.
        </p>
      </div>

      {/* 승인/거절 버튼 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Button fullWidth onPress={handleReject} variant="secondary" style={{ height: 44 }}>
          반려하기
        </Button>
        <Button fullWidth isDisabled={!rankSelected || processing} onPress={handleApprove} variant="primary" style={{ height: 44, backgroundColor: rankSelected
                ? getRankConfig(currentRank).color
                : undefined }}>
          회원 승인하기
        </Button>
      </div>

      {/* 프로필 이미지 - Before/After 비교 */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ marginBottom: 12, fontWeight: 600 }}>
          프로필 이미지 심사 (
          {user.pendingImages?.length || user.profileImages?.length || 0}장 대기
          중)
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          {slotPairs
            .map(([slotIndex, pair]) => {
            const isRepresentativeReplacement = slotIndex === 0 &&
                Boolean(pair.current) &&
                (Boolean(user.isApproved || user.approved) || Boolean(pair.pending?.isRepresentativeReplacement));
            const showImageActions = Boolean(pair.pending) && (slotIndex > 0 || isRepresentativeReplacement);
            const canApprove = pair.pending?.canApprove !== false;
            const canReject = pair.pending?.canReject !== false;
            return (<div key={slotIndex} style={{ padding: 12, backgroundColor: "#fafafa", borderRadius: 2, border: "1px solid #e0e0e0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                  <p style={{ fontSize: "0.75rem" }}>
                    {getSlotLabel(slotIndex)}
                  </p>
                  {slotIndex === 0 && (<Chip size="sm">{"대표"}</Chip>)}
                </div>

                {/* 이전 사진 (위) */}
                <p style={{ display: "block", marginBottom: 4, color: "#4caf50", fontWeight: 600, fontSize: "0.7rem" }}>
                  ● 이전
                </p>
                {pair.current ? (<Button variant="tertiary" aria-label="이미지 확대" onPress={() => handleImageClick(pair.current!.imageUrl)} style={{ position: "relative", borderRadius: 1.5, overflow: "hidden", cursor: "pointer", border: "2px solid #4caf50" }}>
                    <div style={{ position: "relative", paddingTop: "100%" }}>
                      <img src={pair.current.imageUrl} alt="현재 프로필" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}/>
                    </div>
                  </Button>) : (<div style={{ position: "relative", paddingTop: "100%", backgroundColor: "#f5f5f5", borderRadius: 1.5, border: "2px dashed #d0d5dd" }}>
                    <p style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "0.7rem" }}>
                      없음
                    </p>
                  </div>)}

                {/* 화살표 */}
                <div style={{ textAlign: "center", paddingBlock: 2 }}>
                  <ArrowDownwardIcon style={{ fontSize: 18, color: "#d0d5dd" }}></ArrowDownwardIcon>
                </div>

                {/* 변경 예정 (아래) */}
                <p style={{ display: "block", marginBottom: 4, color: "#ff9800", fontWeight: 600, fontSize: "0.7rem" }}>
                  ● 변경
                </p>
                {pair.pending ? (<div style={{ position: "relative" }}>
                    <Button variant="tertiary" aria-label="이미지 확대" onPress={() => handleImageClick(pair.pending!.imageUrl)} style={{ position: "relative", borderRadius: 1.5, overflow: "hidden", cursor: "pointer", border: "2px solid #ff9800" }}>
                      <div style={{ position: "relative", paddingTop: "100%" }}>
                        <img src={pair.pending.imageUrl} alt="대기 중인 프로필" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}/>
                      </div>
                    </Button>
                    {showImageActions ? (isRepresentativeReplacement ? (<div style={{ display: "grid", gap: 4, marginTop: 6 }}>
                          <Button isDisabled={!canReject || processing} onPress={() => handleRejectImageClick(pair.pending!.id)} variant="secondary" style={{ fontSize: "0.7rem", minHeight: 28, paddingBlock: 2 }}>
                            교체 거절
                          </Button>
                          <Button isDisabled={!canApprove || processing} onPress={() => handleApproveImage(pair.pending!.id)} variant="primary" style={{ fontSize: "0.7rem", minHeight: 28, paddingBlock: 2 }}>
                            대표사진 교체 승인
                          </Button>
                        </div>) : (<div style={{ display: "flex", gap: 4, marginTop: 6, justifyContent: "center" }}>
                          <span title={"사진 거절"}>
                            <span>
                              <Button aria-label="사진 거절" isDisabled={!canReject || processing} onPress={() => handleRejectImageClick(pair.pending!.id)} variant="tertiary" isIconOnly={true} style={{ backgroundColor: "#f44336", color: "#fff", width: 28, height: 28 }}>
                                <CloseIcon style={{ fontSize: 16 }}></CloseIcon>
                              </Button>
                            </span>
                          </span>
                          <span title={"사진 승인"}>
                            <span>
                              <Button aria-label="사진 승인" isDisabled={!canApprove || processing} onPress={() => handleApproveImage(pair.pending!.id)} variant="tertiary" isIconOnly={true} style={{ backgroundColor: "#4caf50", color: "#fff", width: 28, height: 28 }}>
                                <CheckCircleIcon style={{ fontSize: 16 }}></CheckCircleIcon>
                              </Button>
                            </span>
                          </span>
                        </div>)) : slotIndex === 0 ? (<p style={{ display: "block", marginTop: 6, color: "#7a4d00", textAlign: "center", fontSize: "0.68rem" }}>
                        회원 승인에서 처리
                      </p>) : null}
                  </div>) : (<div style={{ position: "relative", paddingTop: "100%", backgroundColor: "#f5f5f5", borderRadius: 1.5, border: "2px dashed #d0d5dd" }}>
                    <p style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "0.7rem" }}>
                      없음
                    </p>
                  </div>)}
              </div>);
        })}
        </div>
      </div>

      {/* 심사 상세 정보 (접힘 섹션) - 이미지 그리드 아래 */}
      <Button variant="tertiary" aria-label="선택" onPress={() => setShowReviewContext(!showReviewContext)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", paddingBlock: 8, paddingInline: 4, marginBottom: 8 }}>
        <p style={{ fontWeight: 600, color: "#667085" }}>
          📋 심사 상세 정보 (선호도, 거절 이력, 참고 정보)
        </p>
        <ExpandMoreIcon style={{ fontSize: 20, color: "#667085", transform: showReviewContext ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}></ExpandMoreIcon>
      </Button>

      <div hidden={!showReviewContext}>

      {/* 심사 참고 정보 */}
      {user.reviewContext && (<div style={{ marginBottom: 24 }}>
          <p style={{ marginBottom: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            📋 심사 참고 정보
          </p>

          {/* 경고 배너: 신고/제재 이력 */}
          {(user.reviewContext.reportCount > 0 ||
                user.reviewContext.hasSuspensionHistory) && (<div style={{ marginBottom: 16, padding: 12, backgroundColor: "#ffebee", borderRadius: 1, border: "1px solid #ffcdd2", display: "flex", alignItems: "center", gap: 8 }}>
              <WarningIcon style={{ color: "#d32f2f", fontSize: 20 }}></WarningIcon>
              <div>
                {user.reviewContext.reportCount > 0 && (<p style={{ color: "#c62828", fontWeight: 600 }}>
                    신고 {user.reviewContext.reportCount}회
                  </p>)}
                {user.reviewContext.hasSuspensionHistory && (<p style={{ color: "#c62828", fontWeight: 600 }}>
                    제재 이력 있음
                  </p>)}
              </div>
            </div>)}

          {/* 첫 심사 + 가입일 */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {user.reviewContext.isFirstReview && (<Chip size="sm">{"첫 심사"}</Chip>)}
            {user.reviewContext.isUniversityVerified && (<Chip size="sm">{"학교 인증"}</Chip>)}
            {user.reviewContext.hasPurchased && (<Chip size="sm">{user.reviewContext.totalPurchaseAmount
                    ? `결제 ${user.reviewContext.totalPurchaseAmount.toLocaleString()}원`
                    : "유료 회원"}</Chip>)}
          </div>

          {/* 활동 통계 */}
          <div style={{ display: "grid", gap: 8, padding: 12, backgroundColor: "#fafafa", borderRadius: 1, border: "1px solid #e0e0e0" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                <PersonAddIcon style={{ fontSize: 18, color: "#757575" }}></PersonAddIcon>
              </div>
              <p style={{ display: "block" }}>
                가입일
              </p>
              <p style={{ fontWeight: 600, fontSize: "0.75rem" }}>
                {safeToLocaleDateString(user.reviewContext.userCreatedAt, "ko-KR", { month: "short", day: "numeric" })}
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                <FavoriteIcon style={{ fontSize: 18, color: "#e91e63" }}></FavoriteIcon>
              </div>
              <p style={{ display: "block" }}>
                받은 좋아요
              </p>
              <p style={{ fontWeight: 600 }}>
                {user.reviewContext.receivedLikeCount}
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                <PeopleIcon style={{ fontSize: 18, color: "#9c27b0" }}></PeopleIcon>
              </div>
              <p style={{ display: "block" }}>
                매칭
              </p>
              <p style={{ fontWeight: 600 }}>
                {user.reviewContext.matchCount}
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                <ChatIcon style={{ fontSize: 18, color: "#2196f3" }}></ChatIcon>
              </div>
              <p style={{ display: "block" }}>
                채팅방
              </p>
              <p style={{ fontWeight: 600 }}>
                {user.reviewContext.chatRoomCount}
              </p>
            </div>
          </div>
        </div>)}

      <hr style={{ marginBottom: 16 }}></hr>

      {/* 선호도 */}
      {user.preferences && user.preferences.length > 0 && (<div style={{ marginBottom: 24 }}>
          <p style={{ marginBottom: 8, fontWeight: 600 }}>
            선호도
          </p>
          {(user.preferences || []).map((pref, index) => (<div key={index} style={{ marginBottom: 8 }}>
              <p>
                {pref.typeName}
              </p>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                {pref.options.map((option, idx) => (<Chip key={idx} size="sm">{formatPreferenceOption(option)}</Chip>))}
              </div>
            </div>))}
        </div>)}

      {/* 거절 이력 */}
      {user.rejectionHistory && user.rejectionHistory.length > 0 && (<div style={{ marginBottom: 24 }}>
          <p style={{ marginBottom: 8, fontWeight: 600, color: "#dc2626" }}>
            거절 이력
          </p>
          {(user.rejectionHistory || []).map((history, index) => (<div key={index} style={{ marginBottom: 8, padding: 8, backgroundColor: "#fff3e0", borderRadius: 1 }}>
              <p style={{ fontWeight: 600 }}>
                {history.category}
              </p>
              <p style={{ marginTop: 4 }}>
                {history.reason}
              </p>
              <p>
                {safeToLocaleString(history.createdAt)}
              </p>
            </div>))}
        </div>)}

      {/* 거절된 이미지 */}
      {user.rejectedImages && user.rejectedImages.length > 0 && (<div style={{ marginBottom: 24 }}>
          <p style={{ marginBottom: 12, fontWeight: 600, color: "#dc2626" }}>
            🚫 거절된 이미지 ({user.rejectedImages.length}장)
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {user.rejectedImages.map((image, index) => (<Button variant="tertiary" aria-label="이미지 확대" key={image.id} onPress={() => handleImageClick(image.imageUrl)} style={{ position: "relative", width: 100, borderRadius: 1.5, overflow: "hidden", border: "2px solid #ffcdd2", backgroundColor: "#ffebee", cursor: "pointer" }}>
                <div style={{ position: "relative", paddingTop: "100%" }}>
                  <img src={image.imageUrl} alt={`거절된 이미지 ${index + 1}`} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }}/>
                  <div style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", backgroundColor: "rgba(244, 67, 54, 0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CloseIcon style={{ fontSize: 14, color: "#fff" }}></CloseIcon>
                  </div>
                </div>
                <div style={{ padding: 8 }}>
                  <p style={{ display: "block", color: "#c62828", fontWeight: 500, fontSize: "0.7rem", lineHeight: 1.3, overflow: "hidden", whiteSpace: "nowrap" }}>
                    {image.rejectionReason}
                  </p>
                  <p style={{ fontSize: "0.65rem", color: "#6b7280" }}>
                    {safeToLocaleDateString(image.rejectedAt, "ko-KR", {
                    month: "short",
                    day: "numeric",
                })}
                  </p>
                </div>
              </Button>))}
          </div>
        </div>)}

      {user.bio && (<p style={{ marginTop: 8, marginBottom: 16 }}>
          &quot;{user.bio}&quot;
        </p>)}

      </div>

      {/* 이미지 확대 모달 */}
      <Modal.Backdrop isOpen={imageModalOpen} onOpenChange={next => {
            if (!next)
                handleImageModalClose();
        }}><Modal.Container size="lg"><Modal.Dialog aria-label="프로필 이미지 확대" style={{ width: '100%', maxWidth: 600, minWidth: 0 }}><Modal.Body>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
          <Button aria-label="확대 이미지 닫기" onPress={handleImageModalClose} variant="tertiary" isIconOnly={true} style={{ position: "absolute", top: 8, right: 8, backgroundColor: "white", color: "#333", zIndex: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            <CloseIcon></CloseIcon>
          </Button>
          {selectedImageUrl && (<img src={selectedImageUrl} alt="확대 이미지" style={{ maxWidth: "100%", maxHeight: "calc(100dvh - 140px)", width: "auto", height: "auto", objectFit: "contain", borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}/>)}
        </div>
      </Modal.Body></Modal.Dialog></Modal.Container></Modal.Backdrop>

      {/* 개별 이미지 거절 사유 입력 모달 */}
      <Modal.Backdrop isOpen={rejectImageModalOpen} onOpenChange={next => {
            if (!next)
                handleRejectImageModalClose();
        }}><Modal.Container size="lg"><Modal.Dialog aria-label="이미지 거절 사유 선택" style={{ width: '100%', maxWidth: 900, minWidth: 0 }}><Modal.Body>
        <div style={{ padding: 32 }}>
          <h2 style={{ marginBottom: 8, fontWeight: 700 }} className="text-lg font-semibold">
            이미지 거절 사유 선택
          </h2>
          <p style={{ marginBottom: 24 }}>
            해당 이미지를 거절하는 사유를 선택하거나 입력해주세요.
          </p>

          {/* 빠른 템플릿 선택 */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ marginBottom: 12, fontWeight: 600, color: "var(--accent)" }}>
              ⚡ 빠른 선택
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {[
            "얼굴 식별 불가",
            "화질 불량",
            "동물 사진",
            "동일 사진",
            "부적절한 노출",
            "타인 사진 도용",
        ].map((template) => (<Button key={template} variant="secondary" onPress={() => setImageRejectionReason(template)}>{template}</Button>))}
            </div>
          </div>

          <hr style={{ marginBottom: 24 }}>
            <p>
              카테고리별 사유
            </p>
          </hr>

          {/* 카테고리별 템플릿 */}
          <div style={{ marginBottom: 24 }}>
            {/* 프로필 이미지 문제 */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ marginBottom: 8, fontWeight: 600, color: "#6b7280", display: "block" }}>
                📷 프로필 이미지 문제
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
            "본인 사진 아님",
            "얼굴 가림",
            "과도한 보정",
            "단체 사진",
            "풍경/사물 사진",
            "어린 시절 사진",
            "동물 사진",
            "동일 사진",
        ].map((template) => (<Button key={template} variant="secondary" onPress={() => setImageRejectionReason(template)}>{template}</Button>))}
              </div>
            </div>

            {/* 품질 문제 */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ marginBottom: 8, fontWeight: 600, color: "#6b7280", display: "block" }}>
                🔍 품질 문제
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["흐릿한 사진", "너무 어두움", "해상도 낮음", "필터 과다"].map((template) => (<Button key={template} variant="secondary" onPress={() => setImageRejectionReason(template)}>{template}</Button>))}
              </div>
            </div>

            {/* 부적절한 내용 */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ marginBottom: 8, fontWeight: 600, color: "#6b7280", display: "block" }}>
                ⚠️ 부적절한 내용
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
            "선정적인 포즈",
            "음주/흡연 장면",
            "폭력적 내용",
            "혐오 표현 포함",
        ].map((template) => (<Button key={template} variant="secondary" onPress={() => setImageRejectionReason(template)}>{template}</Button>))}
              </div>
            </div>

            {/* 신원 확인 불가 */}
            <div>
              <p style={{ marginBottom: 8, fontWeight: 600, color: "#6b7280", display: "block" }}>
                🔐 신원 확인 불가
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
            "연예인/유명인 사진",
            "인터넷 이미지 도용",
            "AI 생성 이미지",
        ].map((template) => (<Button key={template} variant="secondary" onPress={() => setImageRejectionReason(template)}>{template}</Button>))}
              </div>
            </div>
          </div>

          <hr style={{ marginBottom: 24 }}>
            <p>
              또는 직접 입력
            </p>
          </hr>

          {/* 직접 입력 */}
          <TextField className="mb-4"><TextArea aria-label="사진 거절 사유" rows={4} value={imageRejectionReason} onChange={(e) => setImageRejectionReason(e.target.value)} placeholder="거절 사유를 자세히 입력해주세요..."></TextArea></TextField>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <Button onPress={handleRejectImageModalClose} variant="tertiary">
              취소
            </Button>
            <Button onPress={handleRejectImageConfirm} variant="primary">
              거절하기
            </Button>
          </div>
        </div>
      </Modal.Body></Modal.Dialog></Modal.Container></Modal.Backdrop>
    </section>);
}
