"use client";
import { Label as HeroSelectLabel } from "@heroui/react";

import { Button as HeroActionButton } from "@heroui/react";
import {
  ListBox,
  Select,
  Alert,
  Avatar,
  Button,
  Card,
  Input,
  Label,
  Modal,
  Pagination,
  Separator,
  Spinner,
  TextField,
} from "@heroui/react";

import { CircleCheck, CircleX, Eye, GraduationCap } from "lucide-react";

import React, { useState, useEffect } from "react";

import AdminService from "@/app/services/admin";
import { useToast } from "@/shared/ui/admin/toast";
import UserDetailModal, { UserDetail } from "./UserDetailModal";

interface UniversityVerificationUser {
  id: string;
  name: string;
  age?: number;
  birthday?: string;
  email: string;
  phoneNumber: string;
  profileImageUrl?: string;
  universityName: string;
  departmentName: string;
  grade: string;
  studentNumber: string;
  certificateImageUrl: string;
  createdAt: string;
}

interface UniversityVerificationResponse {
  users: UniversityVerificationUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ConfirmDialog {
  open: boolean;
  user: UniversityVerificationUser | null;
  action: "approve" | "reject" | null;
}

interface CertificateDialog {
  open: boolean;
  imageUrl: string;
}

export default function UniversityVerificationPendingPanel() {
  const toast = useToast();
  const [users, setUsers] = useState<UniversityVerificationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [nameFilter, setNameFilter] = useState("");
  const [universityFilter, setUniversityFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    open: false,
    user: null,
    action: null,
  });

  const [certificateDialog, setCertificateDialog] = useState<CertificateDialog>(
    {
      open: false,
      imageUrl: "",
    },
  );

  // 사용자 상세 정보 모달 상태
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // 사용자 목록 조회
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: UniversityVerificationResponse =
        await AdminService.userAppearance.getUniversityVerificationPending({
          page: page + 1, // API는 1부터 시작
          limit: rowsPerPage,
          name: nameFilter || undefined,
          university: universityFilter || undefined,
        });

      setUsers(response.users);
      setTotalItems(response.total);
    } catch (err: any) {
      console.error("대학교 인증 신청 사용자 조회 중 오류:", err);
      setError(
        err.message ||
          "대학교 인증 신청 사용자 목록을 불러오는 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage]);

  // 페이지 변경 핸들러
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경 핸들러
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 검색 핸들러
  const handleSearch = () => {
    setPage(0);
    fetchUsers();
  };

  // 검색 초기화 핸들러
  const handleResetSearch = () => {
    setNameFilter("");
    setUniversityFilter("");
    setPage(0);
    setTimeout(() => {
      fetchUsers();
    }, 100);
  };

  // 확인 다이얼로그 열기
  const handleOpenConfirmDialog = (
    user: UniversityVerificationUser,
    action: "approve" | "reject",
  ) => {
    setConfirmDialog({
      open: true,
      user,
      action,
    });
  };

  // 확인 다이얼로그 닫기
  const handleCloseConfirmDialog = () => {
    setConfirmDialog({
      open: false,
      user: null,
      action: null,
    });
  };

  // 인증서 이미지 다이얼로그 열기
  const handleOpenCertificateDialog = (imageUrl: string) => {
    setCertificateDialog({
      open: true,
      imageUrl,
    });
  };

  // 인증서 이미지 다이얼로그 닫기
  const handleCloseCertificateDialog = () => {
    setCertificateDialog({
      open: false,
      imageUrl: "",
    });
  };

  // 사용자 상세 정보 모달 열기
  const handleOpenUserDetailModal = async (userId: string) => {
    try {
      setSelectedUserId(userId);
      setUserDetailModalOpen(true);
      setLoadingUserDetail(true);
      setUserDetailError(null);
      setUserDetail(null);

      console.log("유저 상세 정보 조회 요청:", userId);
      const data = await AdminService.userAppearance.getUserDetails(userId);
      console.log("유저 상세 정보 응답:", data);

      setUserDetail(data);
    } catch (error: any) {
      console.error("유저 상세 정보 조회 중 오류:", error);
      setUserDetailError(
        error.message || "유저 상세 정보를 불러오는 중 오류가 발생했습니다.",
      );
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // 사용자 상세 정보 모달 닫기
  const handleCloseUserDetailModal = () => {
    setUserDetailModalOpen(false);
  };

  // 승인/거절 처리
  const handleConfirmAction = async () => {
    if (!confirmDialog.user || !confirmDialog.action) return;

    try {
      setActionLoading(confirmDialog.user.id);

      if (confirmDialog.action === "approve") {
        await AdminService.userAppearance.approveUniversityVerification(
          confirmDialog.user.id,
        );
      } else {
        await AdminService.userAppearance.rejectUniversityVerification(
          confirmDialog.user.id,
        );
      }

      // 목록에서 해당 사용자 제거
      setUsers((prev) =>
        prev.filter((user) => user.id !== confirmDialog.user!.id),
      );
      setTotalItems((prev) => prev - 1);

      handleCloseConfirmDialog();
    } catch (err: any) {
      console.error("대학교 인증 처리 중 오류:", err);
      const message = err.message || "대학교 인증 처리 중 오류가 발생했습니다.";
      setError(message);
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className={"text-lg font-semibold text-neutral-900"}>
        학생증 인증 신청 관리
      </div>
      {error && (
        <Alert style={{ marginBottom: 12 }} status="danger" role="alert">
          <Alert.Content>{error}</Alert.Content>
        </Alert>
      )}
      {/* 검색 필터 */}
      <Card style={{ marginBottom: 12 }}>
        <Card.Content>
          <div className={"grid grid-cols-1 gap-4 md:grid-cols-2"}>
            <div className={"min-w-0"}>
              <TextField
                className="w-full"
                isDisabled={undefined}
                isInvalid={undefined}
              >
                <Label>{"이름 검색"}</Label>
                <Input
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  aria-label={"이름 검색"}
                />
              </TextField>
            </div>
            <div className={"min-w-0"}>
              <TextField
                className="w-full"
                isDisabled={undefined}
                isInvalid={undefined}
              >
                <Label>{"대학교 검색"}</Label>
                <Input
                  value={universityFilter}
                  onChange={(e) => setUniversityFilter(e.target.value)}
                  aria-label={"대학교 검색"}
                />
              </TextField>
            </div>
            <div className={"min-w-0"}>
              <div className={"flex flex-wrap items-center gap-2"}>
                <Button
                  onClick={handleSearch}
                  variant={"primary"}
                  isDisabled={undefined}
                  size={"md"}
                  className="rounded-xl"
                >
                  검색
                </Button>
                <Button
                  onClick={handleResetSearch}
                  variant={"secondary"}
                  isDisabled={undefined}
                  size={"md"}
                  className="rounded-xl"
                >
                  초기화
                </Button>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>
      {/* 모바일: 카드 레이아웃 */}
      {isMobile ? (
        <div className={"flex flex-wrap items-center gap-2"}>
          {loading ? (
            <div
              style={{ display: "flex", justifyContent: "center", padding: 12 }}
            >
              <Spinner aria-label="불러오는 중" size="sm" />
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: 12 }} className={"text-sm text-neutral-700"}>
              학생증 인증 신청한 사용자가 없습니다.
            </div>
          ) : (
            users.map((user) => (
              <Card key={user.id}>
                <Card.Content>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <HeroActionButton
                      variant="ghost"
                      className="h-auto min-w-0 p-0"
                      onClick={() => handleOpenUserDetailModal(user.id)}
                      aria-label="프로필 상세 보기"
                    >
                      <Avatar
                        style={{ width: 60, height: 60, cursor: "pointer" }}
                      >
                        <Avatar.Image
                          src={user.profileImageUrl}
                          alt={user.name}
                        />
                        <Avatar.Fallback>
                          {user.name?.charAt(0) || "?"}
                        </Avatar.Fallback>
                      </Avatar>
                    </HeroActionButton>
                    <div className={"text-lg font-semibold text-neutral-900"}>
                      {user.name}
                    </div>
                    {(user.birthday || user.age) && (
                      <div className={"text-sm text-neutral-700"}>
                        {user.birthday ? (
                          <>
                            생년월일:{" "}
                            {new Date(user.birthday).toLocaleDateString(
                              "ko-KR",
                            )}
                            {user.age && ` (${user.age}세)`}
                          </>
                        ) : user.age ? (
                          `나이: ${user.age}세`
                        ) : (
                          ""
                        )}
                      </div>
                    )}
                    <div className={"text-sm text-neutral-700"}>
                      {user.phoneNumber}
                    </div>
                    <Separator
                      style={{ width: "100%", marginTop: 4, marginBottom: 4 }}
                    ></Separator>
                    <div className={"text-sm text-neutral-700"}>
                      <strong>{user.universityName}</strong>
                    </div>
                    <div className={"text-sm text-neutral-700"}>
                      {user.departmentName}
                      {user.grade}학년
                    </div>
                    <div className={"text-sm text-neutral-700"}>
                      학번: {user.studentNumber}
                    </div>
                    <div className={"text-sm text-neutral-700"}>
                      신청일: {formatDate(user.createdAt)}
                    </div>
                    <Separator
                      style={{ width: "100%", marginTop: 4, marginBottom: 4 }}
                    ></Separator>
                    <div
                      style={{ width: "100%" }}
                      className={"flex flex-wrap items-center gap-2"}
                    >
                      <Button
                        onClick={() =>
                          handleOpenCertificateDialog(user.certificateImageUrl)
                        }
                        variant={"secondary"}
                        isDisabled={undefined}
                        size={"sm"}
                        className="rounded-xl"
                      >
                        {<Eye />}학생증 보기
                      </Button>
                    </div>
                    <div
                      style={{ width: "100%" }}
                      className={"flex flex-wrap items-center gap-2"}
                    >
                      <Button
                        onClick={() => handleOpenConfirmDialog(user, "approve")}
                        variant={"primary"}
                        isDisabled={actionLoading === user.id}
                        size={"md"}
                        className="rounded-xl"
                      >
                        {<CircleCheck />}승인
                      </Button>
                      <Button
                        onClick={() => handleOpenConfirmDialog(user, "reject")}
                        variant={"primary"}
                        isDisabled={actionLoading === user.id}
                        size={"md"}
                        className="rounded-xl"
                      >
                        {<CircleX />}거절
                      </Button>
                    </div>
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
                <th>프로필</th>
                <th>이름</th>
                <th>생년월일(나이)</th>
                <th>전화번호</th>
                <th>대학교</th>
                <th>학과</th>
                <th>학년</th>
                <th>학번</th>
                <th>신청일</th>
                <th>보기</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={11}
                    style={{ paddingTop: 12, paddingBottom: 12 }}
                  >
                    <Spinner aria-label="불러오는 중" size="sm" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    style={{ paddingTop: 12, paddingBottom: 12 }}
                  >
                    <div className={"text-sm text-neutral-700"}>
                      학생증 인증 신청한 사용자가 없습니다.
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <HeroActionButton
                        variant="ghost"
                        className="h-auto min-w-0 p-0"
                        onClick={() => handleOpenUserDetailModal(user.id)}
                        aria-label="프로필 상세 보기"
                      >
                        <Avatar
                          style={{ width: 40, height: 40, cursor: "pointer" }}
                        >
                          <Avatar.Image
                            src={user.profileImageUrl}
                            alt={user.name}
                          />
                          <Avatar.Fallback>
                            {user.name?.charAt(0) || "?"}
                          </Avatar.Fallback>
                        </Avatar>
                      </HeroActionButton>
                    </td>
                    <td>{user.name}</td>
                    <td>
                      {user.birthday ? (
                        <>
                          {new Date(user.birthday).toLocaleDateString("ko-KR")}
                          {user.age && ` (${user.age}세)`}
                        </>
                      ) : user.age ? (
                        `${user.age}세`
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{user.phoneNumber}</td>
                    <td>{user.universityName}</td>
                    <td>{user.departmentName}</td>
                    <td>{user.grade}학년</td>
                    <td>{user.studentNumber}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <Button
                        onClick={() =>
                          handleOpenCertificateDialog(user.certificateImageUrl)
                        }
                        variant={"ghost"}
                        isDisabled={undefined}
                        isIconOnly={true}
                        size={"sm"}
                        className="rounded-lg"
                      >
                        <Eye />
                      </Button>
                    </td>
                    <td>
                      <div className={"flex flex-wrap items-center gap-2"}>
                        <Button
                          onClick={() =>
                            handleOpenConfirmDialog(user, "approve")
                          }
                          variant={"primary"}
                          isDisabled={actionLoading === user.id}
                          size={"sm"}
                          className="rounded-xl"
                        >
                          {<CircleCheck />}승인
                        </Button>
                        <Button
                          onClick={() =>
                            handleOpenConfirmDialog(user, "reject")
                          }
                          variant={"primary"}
                          isDisabled={actionLoading === user.id}
                          size={"sm"}
                          className="rounded-xl"
                        >
                          {<CircleX />}거절
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination aria-label="페이지 이동">
            <Pagination.Summary>
              {page + 1} / {Math.max(1, Math.ceil(totalItems / rowsPerPage))}
            </Pagination.Summary>
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous
                  isDisabled={page <= 0}
                  onPress={() => handleChangePage(null, page - 1)}
                >
                  이전
                </Pagination.Previous>
              </Pagination.Item>
              <Pagination.Item>
                <Pagination.Next
                  isDisabled={page + 1 >= Math.ceil(totalItems / rowsPerPage)}
                  onPress={() => handleChangePage(null, page + 1)}
                >
                  다음
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
            <div className="flex items-center gap-2">
              <Select
                aria-label="행 수"
                selectedKey={String(rowsPerPage ?? "")}
                isDisabled={undefined}
                onSelectionChange={(key) =>
                  handleChangeRowsPerPage({
                    target: { value: String(key ?? "") },
                  } as React.ChangeEvent<HTMLSelectElement>)
                }
              >
                <HeroSelectLabel>행 수 </HeroSelectLabel>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {[10, 25, 50].map((size) => (
                      <ListBox.Item
                        key={size}
                        id={String(size)}
                        textValue={String(size)}
                      >
                        {size}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </Pagination>
        </div>
      )}
      {/* 확인 다이얼로그 */}
      <Modal.Backdrop
        isOpen={confirmDialog.open}
        onOpenChange={(isOpen) => {
          if (!isOpen && actionLoading === null) handleCloseConfirmDialog();
        }}
        isDismissable={actionLoading === null}
        isKeyboardDismissDisabled={actionLoading !== null}
      >
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>
                {confirmDialog.action === "approve"
                  ? "학생증 인증 승인"
                  : "학생증 인증 거절"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className={"text-sm text-neutral-700"}>
                {confirmDialog.user?.name}님의 학생증 인증을{" "}
                {confirmDialog.action === "approve" ? "승인" : "거절"}
                하시겠습니까?
              </div>
              {confirmDialog.user && (
                <div style={{ marginTop: 8 }}>
                  <div className={"text-sm text-neutral-700"}>
                    대학교: {confirmDialog.user.universityName}
                  </div>
                  <div className={"text-sm text-neutral-700"}>
                    학과: {confirmDialog.user.departmentName}
                  </div>
                  <div className={"text-sm text-neutral-700"}>
                    학년: {confirmDialog.user.grade}학년
                  </div>
                  <div className={"text-sm text-neutral-700"}>
                    학번: {confirmDialog.user.studentNumber}
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={handleCloseConfirmDialog}
                variant={"ghost"}
                isDisabled={actionLoading !== null}
                size={"md"}
                className="rounded-xl"
              >
                취소
              </Button>
              <Button
                onClick={handleConfirmAction}
                variant={
                  confirmDialog.action === "reject" ? "danger" : "primary"
                }
                isDisabled={actionLoading !== null}
                size={"md"}
                className="rounded-xl"
              >
                {actionLoading !== null ? (
                  <Spinner aria-label="불러오는 중" size="sm" />
                ) : confirmDialog.action === "approve" ? (
                  "승인"
                ) : (
                  "거절"
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      {/* 인증서 이미지 다이얼로그 */}
      <Modal.Backdrop
        isOpen={certificateDialog.open}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleCloseCertificateDialog();
        }}
      >
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <GraduationCap />
                  학생증
                </div>
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div style={{ textAlign: "center" }}>
                <img
                  src={certificateDialog.imageUrl}
                  alt="학생증"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "70vh",
                    objectFit: "contain",
                  }}
                />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={handleCloseCertificateDialog}
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
      {!!userDetail && (
        <UserDetailModal
          open={userDetailModalOpen}
          onClose={handleCloseUserDetailModal}
          userId={selectedUserId}
          userDetail={userDetail}
          loading={loadingUserDetail}
          error={userDetailError}
          onRefresh={() => {
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}
