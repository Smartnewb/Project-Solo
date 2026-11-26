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

type VerificationQueueTab = "pending" | "post_review";

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
  verifiedAt?: string | null;
  isPostReview?: boolean;
  // 서류 종류: 'university'(대학) | 'workplace'(직장). 옛 응답에는 없을 수 있다.
  type?: string;
  documentType?: string | null;
  kind?: string | null;
  // 승인하면 직장인 요금이 내려가는 신청이면 DOWN (서버 priceTierChange)
  priceTierChange?: "DOWN" | "UP" | "NONE" | null;
}

// 서류 이름 (서버 documentType)
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  SCHOOL_EMAIL: "학교 이메일",
  STUDENT_ID: "학생증",
  ENROLLMENT: "재학증명서",
  GRAD_STUDENT_ID: "대학원 학생증",
  GRAD_ENROLLMENT: "대학원 재학증명서",
  GRADUATION_CERTIFICATE: "졸업증명서",
  EMPLOYEE_ID: "사원증",
  EMPLOYMENT_CERTIFICATE: "재직증명서",
  INTERN_CONFIRMATION: "인턴 확인서",
};

// 승인·반려 요청에 넘길 서류 종류: 'workplace'만 직장, 나머지는 대학
const getVerificationType = (
  user: UniversityVerificationUser,
): "university" | "workplace" =>
  user.type === "workplace" ? "workplace" : "university";

// 목록 행과 확인 창에 보여줄 '대학/직장 · 서류 이름(· 승격)'
const getDocumentSummary = (user: UniversityVerificationUser) => {
  const typeLabel = getVerificationType(user) === "workplace" ? "직장" : "대학";
  const documentLabel =
    (user.documentType && DOCUMENT_TYPE_LABELS[user.documentType]) || "학생증";
  const parts = [typeLabel, documentLabel];
  // 서버 kind: NEW(신규) | UPGRADE(승격)
  if (user.kind === "UPGRADE") parts.push("승격");
  if (user.priceTierChange === "DOWN") parts.push("요금이 내려가는 변경");
  return parts.join(" · ");
};

// 확인 창 제목·본문의 인증 이름: 직장 서류면 '직장', 아니면 기존대로 '학생증'
const getConfirmSubject = (user: UniversityVerificationUser | null) =>
  user && getVerificationType(user) === "workplace" ? "직장" : "학생증";

// 같은 회원이 대학·직장 서류를 함께 올릴 수 있어 id+type으로 행을 구분한다.
const getRowKey = (user: UniversityVerificationUser) =>
  `${user.id}:${getVerificationType(user)}`;

interface UniversityVerificationResponse {
  users: UniversityVerificationUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  queue?: "pending" | "post_review" | "all";
  counts?: {
    pending: number;
    postReview: number;
  };
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
  const [activeQueue, setActiveQueue] =
    useState<VerificationQueueTab>("pending");
  const [queueCounts, setQueueCounts] = useState<{
    pending: number;
    postReview: number;
  } | null>(null);
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
  const fetchUsers = async (overrides?: {
    page?: number;
    queue?: VerificationQueueTab;
    name?: string;
    university?: string;
  }) => {
    const targetPage = overrides?.page ?? page;
    const targetQueue = overrides?.queue ?? activeQueue;
    const targetName = overrides?.name ?? nameFilter;
    const targetUniversity = overrides?.university ?? universityFilter;

    try {
      setLoading(true);
      setError(null);

      const response: UniversityVerificationResponse =
        await AdminService.userAppearance.getUniversityVerificationPending({
          page: targetPage + 1, // API는 1부터 시작
          limit: rowsPerPage,
          name: targetName || undefined,
          university: targetUniversity || undefined,
          queue: targetQueue,
        });

      setUsers(response.users);
      setTotalItems(response.total);
      if (response.counts) {
        setQueueCounts(response.counts);
      } else {
        setQueueCounts((prev) => ({
          pending:
            targetQueue === "pending" ? response.total : (prev?.pending ?? 0),
          postReview:
            targetQueue === "post_review"
              ? response.total
              : (prev?.postReview ?? 0),
        }));
      }
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

  // 컴포넌트 마운트 및 탭·페이지 변경 시 데이터 조회
  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, activeQueue]);

  // 대기열 탭 전환 핸들러
  const handleSelectQueue = (nextQueue: VerificationQueueTab) => {
    if (nextQueue === activeQueue) return;
    setActiveQueue(nextQueue);
    setPage(0);
  };

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
    fetchUsers({ page: 0 });
  };

  // 검색 초기화 핸들러
  const handleResetSearch = () => {
    setNameFilter("");
    setUniversityFilter("");
    setPage(0);
    fetchUsers({ page: 0, name: "", university: "" });
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
          getVerificationType(confirmDialog.user),
        );
      } else {
        await AdminService.userAppearance.rejectUniversityVerification(
          confirmDialog.user.id,
          getVerificationType(confirmDialog.user),
        );
      }

      // 목록에서 처리한 행(id+type)만 제거
      const handledKey = getRowKey(confirmDialog.user);
      setUsers((prev) => prev.filter((user) => getRowKey(user) !== handledKey));
      setTotalItems((prev) => Math.max(0, prev - 1));
      setQueueCounts((prev) =>
        prev
          ? {
              ...prev,
              pending:
                activeQueue === "pending"
                  ? Math.max(0, prev.pending - 1)
                  : prev.pending,
              postReview:
                activeQueue === "post_review"
                  ? Math.max(0, prev.postReview - 1)
                  : prev.postReview,
            }
          : prev,
      );

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

  const isPostReviewTab = activeQueue === "post_review";
  const isDialogPostReview = Boolean(
    confirmDialog.user?.isPostReview || isPostReviewTab,
  );

  return (
    <div>
      <div className={"text-lg font-semibold text-neutral-900"}>
        학생증 인증 신청 관리
      </div>
      {/* 대기열 서브탭: 미심사 대기 vs OCR 자동승인 사후확인 */}
      <div
        role="tablist"
        aria-label="학생증 인증 대기열 구분"
        className="mt-3 mb-2 flex flex-wrap gap-2 border-b border-neutral-200 pb-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeQueue === "pending"}
          onClick={() => handleSelectQueue("pending")}
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
            activeQueue === "pending"
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          <span>미심사 대기</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              activeQueue === "pending"
                ? "bg-white/20 text-white"
                : "bg-white text-neutral-700"
            }`}
          >
            {queueCounts?.pending ?? (activeQueue === "pending" ? totalItems : 0)}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeQueue === "post_review"}
          onClick={() => handleSelectQueue("post_review")}
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
            activeQueue === "post_review"
              ? "bg-emerald-700 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          <span>OCR 자동승인 · 사후확인</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              activeQueue === "post_review"
                ? "bg-white/20 text-white"
                : "bg-white text-neutral-700"
            }`}
          >
            {queueCounts?.postReview ??
              (activeQueue === "post_review" ? totalItems : 0)}
          </span>
        </button>
      </div>
      <p className="mb-3 text-xs text-neutral-600">
        {isPostReviewTab
          ? "OCR이 이미 자동 승인해 인증이 열린 건입니다. 원본 서류를 확인한 뒤 확인 완료(원본 파기) 또는 승인 취소로 정리하세요."
          : "OCR 자동승인을 통과하지 못한 학생증과 대학원·졸업·직장 서류입니다."}
      </p>
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
              {isPostReviewTab
                ? "사후 확인 대기 중인 OCR 자동승인 건이 없습니다."
                : "미심사 대기 중인 인증 신청이 없습니다."}
            </div>
          ) : (
            users.map((user) => {
              const rowPostReview = Boolean(
                user.isPostReview || isPostReviewTab,
              );
              return (
                <Card key={getRowKey(user)}>
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
                        서류: {getDocumentSummary(user)}
                        {rowPostReview && (
                          <span className="ml-1.5 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            OCR 자동승인
                          </span>
                        )}
                      </div>
                      <div className={"text-sm text-neutral-700"}>
                        {rowPostReview ? "자동승인일" : "신청일"}:{" "}
                        {formatDate(
                          rowPostReview && user.verifiedAt
                            ? user.verifiedAt
                            : user.createdAt,
                        )}
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
                            handleOpenCertificateDialog(
                              user.certificateImageUrl,
                            )
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
                          onClick={() =>
                            handleOpenConfirmDialog(user, "approve")
                          }
                          variant={"primary"}
                          isDisabled={actionLoading === user.id}
                          size={"md"}
                          className="rounded-xl"
                        >
                          {<CircleCheck />}
                          {rowPostReview ? "확인 완료" : "승인"}
                        </Button>
                        <Button
                          onClick={() =>
                            handleOpenConfirmDialog(user, "reject")
                          }
                          variant={"danger"}
                          isDisabled={actionLoading === user.id}
                          size={"md"}
                          className="rounded-xl"
                        >
                          {<CircleX />}
                          {rowPostReview ? "승인 취소" : "거절"}
                        </Button>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              );
            })
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
                <th>서류</th>
                <th>{isPostReviewTab ? "자동승인일" : "신청일"}</th>
                <th>보기</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={12}
                    style={{ paddingTop: 12, paddingBottom: 12 }}
                  >
                    <Spinner aria-label="불러오는 중" size="sm" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    style={{ paddingTop: 12, paddingBottom: 12 }}
                  >
                    <div className={"text-sm text-neutral-700"}>
                      {isPostReviewTab
                        ? "사후 확인 대기 중인 OCR 자동승인 건이 없습니다."
                        : "미심사 대기 중인 인증 신청이 없습니다."}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const rowPostReview = Boolean(
                    user.isPostReview || isPostReviewTab,
                  );
                  return (
                    <tr key={getRowKey(user)}>
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
                            {new Date(user.birthday).toLocaleDateString(
                              "ko-KR",
                            )}
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
                      <td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span>{getDocumentSummary(user)}</span>
                          {rowPostReview && (
                            <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                              OCR 자동승인
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {formatDate(
                          rowPostReview && user.verifiedAt
                            ? user.verifiedAt
                            : user.createdAt,
                        )}
                      </td>
                      <td>
                        <Button
                          onClick={() =>
                            handleOpenCertificateDialog(
                              user.certificateImageUrl,
                            )
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
                            {<CircleCheck />}
                            {rowPostReview ? "확인 완료" : "승인"}
                          </Button>
                          <Button
                            onClick={() =>
                              handleOpenConfirmDialog(user, "reject")
                            }
                            variant={"danger"}
                            isDisabled={actionLoading === user.id}
                            size={"sm"}
                            className="rounded-xl"
                          >
                            {<CircleX />}
                            {rowPostReview ? "승인 취소" : "거절"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                {isDialogPostReview
                  ? confirmDialog.action === "approve"
                    ? "학생증 사후 확인 완료"
                    : "학생증 자동승인 취소"
                  : `${getConfirmSubject(confirmDialog.user)} 인증 ${
                      confirmDialog.action === "approve" ? "승인" : "거절"
                    }`}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className={"text-sm text-neutral-700"}>
                {isDialogPostReview ? (
                  confirmDialog.action === "approve" ? (
                    <>
                      {confirmDialog.user?.name}님의 학생증 자동승인을 사후 확인
                      완료 처리하시겠습니까? 인증 상태는 유지되며 저장된 원본
                      이미지만 즉시 파기됩니다.
                    </>
                  ) : (
                    <>
                      {confirmDialog.user?.name}님의 학생증 자동승인을
                      취소하시겠습니까? 대학 인증 상태가 해제되고 재제출 안내
                      알림이 발송됩니다.
                    </>
                  )
                ) : (
                  <>
                    {confirmDialog.user?.name}님의{" "}
                    {getConfirmSubject(confirmDialog.user)} 인증을{" "}
                    {confirmDialog.action === "approve" ? "승인" : "거절"}
                    하시겠습니까?
                  </>
                )}
              </div>
              {confirmDialog.user && (
                <div style={{ marginTop: 8 }}>
                  <div className={"text-sm text-neutral-700"}>
                    서류: {getDocumentSummary(confirmDialog.user)}
                  </div>
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
                ) : isDialogPostReview ? (
                  confirmDialog.action === "approve" ? (
                    "확인 완료"
                  ) : (
                    "승인 취소"
                  )
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
