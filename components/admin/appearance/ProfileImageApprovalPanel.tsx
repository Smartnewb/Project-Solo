"use client";
import { Button as HeroActionButton } from "@heroui/react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Chip,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";

import React, { useState, useEffect } from "react";

import AdminService from "@/app/services/admin";
import UserDetailModal from "./UserDetailModal";
import { useToast } from "@/shared/ui/admin/toast";

// 프로필 이미지 승인 대기 사용자 타입
interface PendingProfileImageUser {
  userId: string;
  userName: string;
  images: Array<{
    id: string;
    imageUrl: string;
    imageOrder: number;
    isMain: boolean;
  }>;
  createdAt: string;
}

const ProfileImageApprovalPanel: React.FC = () => {
  const toast = useToast();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const [pendingUsers, setPendingUsers] = useState<PendingProfileImageUser[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사용자 상세 정보 모달 관련 상태
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  // 승인/거절 모달 관련 상태
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [customRejectionReason, setCustomRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // 이미지 확대 모달 관련 상태
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [selectedImageUserName, setSelectedImageUserName] = useState("");

  // 거절 모달을 열거나 닫을 때(백드롭/Esc 포함) 이전 사유가 남지 않게 초기화
  useEffect(() => {
    setRejectionReason("");
    setCustomRejectionReason("");
  }, [rejectionModalOpen]);

  // 거절 사유 템플릿
  const rejectionReasons = [
    {
      value: "PROFILE_PHOTO_SELF",
      label: "본인 사진으로 프로필을 변경해주세요",
    },
    {
      value: "PROFILE_PHOTO_CLEAR_FACE",
      label: "프로필 사진을 본인 얼굴이 잘 보이는 사진으로 변경해주세요",
    },
    {
      value: "PROFILE_PHOTO_NATURAL",
      label: "상대방이 봐도 부담스럽지 않은 자연스러운 사진으로 변경해주세요",
    },
    {
      value: "PROFILE_PHOTO_FORMAT_UNSUPPORTED",
      label: "프로필 이미지 형식 지원 안함(jpg, jpeg, png 지원)",
    },
    { value: "OTHER", label: "기타 (직접 입력)" },
  ];

  // 거절 사유 한글 표시 함수
  const getRejectionReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      PROFILE_PHOTO_CLEAR_FACE:
        "프로필 사진을 본인 얼굴이 잘 보이는 사진으로 변경해주세요",
      PROFILE_PHOTO_SELF: "본인 사진으로 프로필을 변경해주세요",
      PROFILE_PHOTO_NATURAL:
        "상대방이 봐도 부담스럽지 않은 자연스러운 사진으로 변경해주세요",
      PROFILE_PHOTO_FORMAT_UNSUPPORTED:
        "프로필 이미지 형식 지원 안함(jpg, jpeg, png 지원)",
    };
    return reasonMap[reason] || reason;
  };

  // 심사 대기 중인 프로필 이미지 목록 조회
  const fetchPendingProfileImages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await AdminService.profileImages.getPendingProfileImages();
      setPendingUsers(response.data || []);
    } catch (error: any) {
      console.error("심사 대기 중인 프로필 이미지 목록 조회 오류:", error);
      setError(error.message || "데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 사용자 상세 정보 조회
  const fetchUserDetail = async (userId: string) => {
    try {
      setLoadingUserDetail(true);
      setUserDetailError(null);
      setSelectedUserId(userId);

      const response = await AdminService.userAppearance.getUserDetails(userId);
      setUserDetail(response);
      setUserDetailModalOpen(true);
    } catch (error: any) {
      console.error("사용자 상세 정보 조회 오류:", error);
      setUserDetailError(
        error.message || "사용자 정보를 불러오는 중 오류가 발생했습니다.",
      );
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // 프로필 이미지 승인
  const handleApprove = async () => {
    if (!selectedUserId) return;

    try {
      setActionLoading(true);
      await AdminService.profileImages.approveProfileImage(selectedUserId);

      // 목록 새로고침
      await fetchPendingProfileImages();
      setApprovalModalOpen(false);
      setSelectedUserId(null);
    } catch (error: any) {
      console.error("프로필 이미지 승인 오류:", error);
      const message = error.message || "승인 처리 중 오류가 발생했습니다.";
      setError(message);
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  // 프로필 이미지 거절
  const handleReject = async () => {
    if (!selectedUserId || !rejectionReason.trim()) return;

    try {
      setActionLoading(true);

      const finalRejectionReason =
        rejectionReason === "OTHER"
          ? customRejectionReason.trim()
          : getRejectionReasonLabel(rejectionReason);

      await AdminService.profileImages.rejectProfileImage(
        selectedUserId,
        finalRejectionReason,
      );

      // 목록 새로고침
      await fetchPendingProfileImages();
      setRejectionModalOpen(false);
      setSelectedUserId(null);
      setRejectionReason("");
      setCustomRejectionReason("");
    } catch (error: any) {
      console.error("프로필 이미지 거절 오류:", error);
      const message = error.message || "거절 처리 중 오류가 발생했습니다.";
      setError(message);
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  // 이미지 클릭 핸들러
  const handleImageClick = (imageUrl: string, userName: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageUserName(userName);
    setImageModalOpen(true);
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchPendingProfileImages();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 12 }}>
        <Spinner aria-label="불러오는 중" size="sm" />
      </div>
    );
  }

  return (
    <div>
      <div className={"text-lg font-semibold text-neutral-900"}>
        프로필 이미지 승인 관리
      </div>
      {/* 이전 안내 Alert */}
      <Alert style={{ marginBottom: 12 }} status={"warning"} role="alert">
        <Alert.Content>
          <div
            style={{ fontWeight: 600, marginBottom: 4 }}
            className={"text-lg font-semibold text-neutral-900"}
          >
            ⚠️ 메뉴 이전 안내
          </div>
          <div
            style={{ marginBottom: 4 }}
            className={"text-sm text-neutral-700"}
          >
            프로필 이미지 승인 관리 기능이{" "}
            <strong>&quot;회원 적격 심사&quot;</strong>메뉴로 이전되었습니다.
          </div>
          <div className={"text-sm text-neutral-700"}>
            • 새로운 메뉴에서 개별 이미지 심사와 사용자 전체 정보를 함께 확인할
            수 있습니다.
            <br />• 좌측 사이드바에서{" "}
            <strong>&quot;회원 적격 심사&quot;</strong>메뉴를 이용해주세요.
          </div>
          <div style={{ marginTop: 8 }}>
            <Button
              onPress={() => {
                window.location.href = "/admin/profile-review";
              }}
              style={{ fontWeight: 600 }}
              variant={"primary"}
              isDisabled={undefined}
              size={"md"}
              className="rounded-xl"
            >
              회원 적격 심사 메뉴로 이동하기 →
            </Button>
          </div>
        </Alert.Content>
      </Alert>
      {error && (
        <Alert style={{ marginBottom: 8 }} status="danger" role="alert">
          <Alert.Content>{error}</Alert.Content>
        </Alert>
      )}
      {/* 모바일: 카드 레이아웃 */}
      {isMobile ? (
        <div className={"flex flex-wrap items-center gap-2"}>
          {pendingUsers.length === 0 ? (
            <div style={{ padding: 12 }} className={"text-sm text-neutral-700"}>
              심사 대기 중인 프로필 이미지가 없습니다.
            </div>
          ) : (
            pendingUsers.map((user) => (
              <Card key={user.userId}>
                <Card.Content>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <HeroActionButton
                        variant="ghost"
                        style={{ cursor: "pointer", color: "#7A4AE2" }}
                        className={"text-sm text-neutral-700"}
                        onClick={() => fetchUserDetail(user.userId)}
                      >
                        {user.userName}
                      </HeroActionButton>
                      <div className={"text-sm text-neutral-700"}>
                        {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                      </div>
                    </div>
                  </div>
                  {/* 이미지 목록 */}
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      marginBottom: 8,
                      overflowX: "auto",
                    }}
                  >
                    {user.images.map((image) => (
                      <div
                        key={image.id}
                        style={{ position: "relative", flexShrink: 0 }}
                      >
                        <HeroActionButton
                          variant="ghost"
                          className="h-auto min-w-0 p-0"
                          onClick={() => handleImageClick(image.imageUrl, user.userName)}
                          aria-label={`${user.userName} 프로필 이미지 확대`}
                        >
                          <Avatar
                            style={{ width: 60, height: 60, cursor: "pointer" }}
                          >
                            <Avatar.Image src={image.imageUrl} alt={"프로필"} />
                            <Avatar.Fallback></Avatar.Fallback>
                          </Avatar>
                        </HeroActionButton>
                        {image.isMain && (
                          <Chip
                            style={{
                              position: "absolute",
                              top: -8,
                              right: -8,
                              fontSize: "0.7rem",
                            }}
                            size={"sm"}
                            variant={"soft"}
                          >
                            {"대표"}
                          </Chip>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <Button
                      onClick={() => fetchUserDetail(user.userId)}
                      variant={"secondary"}
                      isDisabled={undefined}
                      size={"sm"}
                      className="rounded-xl"
                    >
                      상세보기
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedUserId(user.userId);
                        setApprovalModalOpen(true);
                      }}
                      variant={"primary"}
                      isDisabled={undefined}
                      size={"sm"}
                      className="rounded-xl"
                    >
                      승인
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedUserId(user.userId);
                        setRejectionModalOpen(true);
                      }}
                      variant={"primary"}
                      isDisabled={undefined}
                      size={"sm"}
                      className="rounded-xl"
                    >
                      거절
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* 데스크톱: 테이블 레이아웃 */
        <div className={"overflow-x-auto"}>
          <table
            className={
              "w-full text-sm text-left [&_td]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
            }
          >
            <thead>
              <tr>
                <th>사용자</th>
                <th>승인 대기 프로필 이미지</th>
                <th>신청일</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.length === 0 ? (
                <tr>
                  <td colSpan={4}>심사 대기 중인 프로필 이미지가 없습니다.</td>
                </tr>
              ) : (
                pendingUsers.map((user) => (
                  <tr key={user.userId}>
                    <td>
                      <HeroActionButton
                        variant="ghost"
                        style={{ cursor: "pointer", color: "#7A4AE2" }}
                        className={"text-sm text-neutral-700"}
                        onClick={() => fetchUserDetail(user.userId)}
                      >
                        {user.userName}
                      </HeroActionButton>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        {user.images.map((image) => (
                          <div key={image.id} style={{ position: "relative" }}>
                            <HeroActionButton
                              variant="ghost"
                              className="h-auto min-w-0 p-0"
                              onClick={() => handleImageClick(image.imageUrl, user.userName)}
                              aria-label={`${user.userName} 프로필 이미지 확대`}
                            >
                              <Avatar
                                style={{
                                  width: 50,
                                  height: 50,
                                  cursor: "pointer",
                                }}
                              >
                                <Avatar.Image
                                  src={image.imageUrl}
                                  alt={"프로필"}
                                />
                                <Avatar.Fallback></Avatar.Fallback>
                              </Avatar>
                            </HeroActionButton>
                            {image.isMain && (
                              <Chip
                                style={{
                                  position: "absolute",
                                  top: -8,
                                  right: -8,
                                  fontSize: "0.7rem",
                                }}
                                size={"sm"}
                                variant={"soft"}
                              >
                                {"대표"}
                              </Chip>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Button
                          onClick={() => fetchUserDetail(user.userId)}
                          variant={"secondary"}
                          isDisabled={undefined}
                          size={"sm"}
                          className="rounded-xl"
                        >
                          상세보기
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedUserId(user.userId);
                            setApprovalModalOpen(true);
                          }}
                          variant={"primary"}
                          isDisabled={undefined}
                          size={"sm"}
                          className="rounded-xl"
                        >
                          승인
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedUserId(user.userId);
                            setRejectionModalOpen(true);
                          }}
                          variant={"primary"}
                          isDisabled={undefined}
                          size={"sm"}
                          className="rounded-xl"
                        >
                          거절
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* 승인 확인 모달 */}
      <Modal.Backdrop
        isOpen={approvalModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen && !actionLoading) setApprovalModalOpen(false);
        }}
        isDismissable={!actionLoading}
        isKeyboardDismissDisabled={actionLoading}
      >
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>프로필 이미지 승인</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className={"text-sm text-neutral-700"}>
                선택한 사용자의 프로필 이미지를 승인하시겠습니까?
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => setApprovalModalOpen(false)}
                variant={"ghost"}
                isDisabled={actionLoading}
                size={"md"}
                className="rounded-xl"
              >
                취소
              </Button>
              <Button
                onClick={handleApprove}
                variant={"primary"}
                isDisabled={actionLoading}
                size={"md"}
                className="rounded-xl"
              >
                {actionLoading ? (
                  <Spinner aria-label="불러오는 중" size="sm" />
                ) : (
                  "승인"
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      {/* 거절 모달 */}
      <Modal.Backdrop
        isOpen={rejectionModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen && !actionLoading) setRejectionModalOpen(false);
        }}
        isDismissable={!actionLoading}
        isKeyboardDismissDisabled={actionLoading}
      >
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>프로필 이미지 거절</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div
                style={{ marginBottom: 8 }}
                className={"text-sm text-neutral-700"}
              >
                거절 사유를 선택해주세요.
              </div>
              <div style={{ marginTop: 4 }}>
                <Label>거절 사유</Label>
                <Select
                  selectedKey={rejectionReason}
                  onSelectionChange={(value) =>
                    ((e) => {
                      setRejectionReason(e.target.value);
                      if (e.target.value !== "OTHER") {
                        setCustomRejectionReason("");
                      }
                    })({
                      target: { value },
                    } as React.ChangeEvent<HTMLSelectElement>)
                  }
                  isDisabled={undefined}
                  aria-label={"거절 사유"}
                  className="w-full"
                >
                  <Label>{"거절 사유"}</Label>
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
              {rejectionReason === "OTHER" && (
                <div style={{ marginTop: 8 }}>
                  <TextField
                    className="w-full"
                    isDisabled={undefined}
                    isInvalid={undefined}
                  >
                    <Label>{"기타 거절 사유"}</Label>
                    <TextArea
                      value={customRejectionReason}
                      onChange={(e) => setCustomRejectionReason(e.target.value)}
                      placeholder="거절 사유를 직접 입력해주세요"
                      required
                      rows={3}
                      aria-label={"기타 거절 사유"}
                    />
                  </TextField>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => setRejectionModalOpen(false)}
                variant={"ghost"}
                isDisabled={actionLoading}
                size={"md"}
                className="rounded-xl"
              >
                취소
              </Button>
              <Button
                onClick={handleReject}
                variant={"danger"}
                isDisabled={
                  actionLoading ||
                  !rejectionReason.trim() ||
                  (rejectionReason === "OTHER" && !customRejectionReason.trim())
                }
                size={"md"}
                className="rounded-xl"
              >
                {actionLoading ? (
                  <Spinner aria-label="불러오는 중" size="sm" />
                ) : (
                  "거절"
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      {/* 이미지 확대 모달 */}
      <Modal.Backdrop
        isOpen={imageModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) (() => setImageModalOpen(false))?.();
        }}
        isDismissable={(() => setImageModalOpen(false)) !== undefined}
      >
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog
            aria-label={`${selectedImageUserName} 프로필 이미지 확대`}
          >
            <Modal.Body
              style={{ padding: 0, display: "flex", justifyContent: "center" }}
            >
              <img
                src={selectedImageUrl}
                alt="프로필 이미지"
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                }}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => setImageModalOpen(false)}
                variant={"ghost"}
                isDisabled={undefined}
                size={"md"}
                className="rounded-xl"
              >
                닫기
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      {/* 사용자 상세 정보 모달 */}
      {userDetail && (
        <UserDetailModal
          open={userDetailModalOpen}
          onClose={() => setUserDetailModalOpen(false)}
          userId={selectedUserId}
          userDetail={userDetail}
          loading={loadingUserDetail}
          error={userDetailError}
          onRefresh={() => selectedUserId && fetchUserDetail(selectedUserId)}
        />
      )}
    </div>
  );
};

export default ProfileImageApprovalPanel;
