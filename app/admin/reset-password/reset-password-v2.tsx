"use client";
import {
  Button,
  FieldError,
  Input,
  Label,
  Modal,
  Spinner,
  TextField,
} from "@heroui/react";
import { Search as SearchIcon, Copy as ContentCopyIcon } from "lucide-react";

import { useState, useEffect } from "react";
import { Controller } from "react-hook-form";

import AdminService from "@/app/services/admin";
import { useToast } from "@/shared/ui/admin/toast";
import { safeToLocaleString } from "@/app/utils/formatters";
import { useAdminForm } from "@/app/admin/hooks/forms";
import {
  resetPasswordSearchSchema,
  type ResetPasswordSearchValues,
} from "@/app/admin/hooks/forms/schemas/reset-password.schema";

function ResetPasswordPageContent() {
  const toast = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searched, setSearched] = useState(false);

  // 확인 다이얼로그
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [resetLoading, setResetLoading] = useState(false);

  // 결과 다이얼로그
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");

  const { control, handleFormSubmit, getValues } =
    useAdminForm<ResetPasswordSearchValues>({
      schema: resetPasswordSearchSchema,
      defaultValues: {
        searchQuery: "",
      },
    });

  const searchUsers = async (pageNum: number = 1) => {
    const query = getValues("searchQuery").trim();
    if (!query) return;

    try {
      setLoading(true);
      setError("");
      setSearched(true);

      const isPhoneNumber = /^[\d\-]+$/.test(query);

      const data = await AdminService.userAppearance.searchUsersForReset({
        name: isPhoneNumber ? undefined : query,
        phoneNumber: isPhoneNumber ? query : undefined,
        page: pageNum,
        limit: 10,
      });

      const userList = Array.isArray(data) ? data : (data?.data ?? []);
      setUsers(userList);
      const total = data?.meta?.total ?? userList.length;
      setTotalCount(total);
      setTotalPages(Math.ceil(total / 10) || 1);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.response?.data?.message || "검색 중 오류가 발생했습니다.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const onSearchSubmit = handleFormSubmit(async () => {
    await searchUsers(1);
  });

  const handlePageChange = (_: any, value: number) => {
    searchUsers(value);
  };

  const handleResetClick = (user: any) => {
    setSelectedUser(user);
    setConfirmDialogOpen(true);
  };

  const confirmReset = async () => {
    if (!selectedUser) return;

    try {
      setResetLoading(true);
      const result = await AdminService.userAppearance.resetPassword(
        selectedUser.userId || selectedUser.id,
      );
      setTemporaryPassword(
        result.temporaryPassword || result.data?.temporaryPassword || "",
      );
      setConfirmDialogOpen(false);
      setPasswordDialogOpen(true);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "비밀번호 초기화에 실패했습니다.",
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      toast.success("임시 비밀번호가 복사되었습니다.");
    } catch {
      toast.error("복사에 실패했습니다. 비밀번호를 직접 선택해 복사해주세요.");
    }
  };

  const handlePasswordDialogClose = () => {
    setPasswordDialogOpen(false);
    setTemporaryPassword("");
    setSelectedUser(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return safeToLocaleString(dateString, "ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h5 className="text-lg font-semibold text-foreground">
          비밀번호 초기화
        </h5>
        <p style={{ marginTop: 8 }}>
          회원의 비밀번호를 초기화하고 임시 비밀번호를 발급합니다.
        </p>
      </div>
      {/* 검색 영역 */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <Controller
          name="searchQuery"
          control={control}
          render={({ field }) => (
            <TextField
              style={{ width: 400 }}
              aria-label={"이름 또는 전화번호로 검색"}
            >
              <Input
                {...field}
                placeholder="이름 또는 전화번호로 검색"
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSearchSubmit();
                }}
                aria-label={"이름 또는 전화번호로 검색"}
              />
            </TextField>
          )}
        />
        <Button
          onClick={onSearchSubmit}
          variant={"primary"}
          isDisabled={loading}
        >
          {<SearchIcon size={16} />}검색
        </Button>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
          style={{ marginBottom: 16 }}
        >
          {error}
        </div>
      )}
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingBlock: 64,
          }}
        >
          <Spinner aria-label="로딩 중" />
        </div>
      ) : !searched ? (
        <div style={{ textAlign: "center", paddingBlock: 64 }}>
          <p>비밀번호를 초기화할 회원을 검색해주세요.</p>
        </div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: "center", paddingBlock: 64 }}>
          <p>검색 결과가 없습니다.</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <p>총 {totalCount}명의 검색 결과</p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th scope="col" className="px-3 py-2 border-b border-default">
                    이름
                  </th>
                  <th scope="col" className="px-3 py-2 border-b border-default">
                    전화번호
                  </th>
                  <th scope="col" className="px-3 py-2 border-b border-default">
                    상태
                  </th>
                  <th scope="col" className="px-3 py-2 border-b border-default">
                    가입일
                  </th>
                  <th scope="col" className="px-3 py-2 border-b border-default">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId}>
                    <td className="px-3 py-2 border-b border-default">
                      {user.name || "-"}
                    </td>
                    <td className="px-3 py-2 border-b border-default">
                      {user.phoneNumber || "-"}
                    </td>
                    <td className="px-3 py-2 border-b border-default">
                      {(() => {
                        if (user.deletedAt)
                          return `탈퇴 (${formatDate(user.deletedAt)})`;
                        if (user.status === "approved") return "활성";
                        if (user.status === "pending") return "대기";
                        if (user.status === "rejected") return "거절";
                        return user.status || "-";
                      })()}
                    </td>
                    <td className="px-3 py-2 border-b border-default">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-3 py-2 border-b border-default">
                      <Button
                        onClick={() => handleResetClick(user)}
                        variant={"secondary"}
                      >
                        비밀번호 초기화
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <nav aria-label="페이지" className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  isDisabled={page <= 1}
                  onPress={() => handlePageChange(null, page - 1)}
                >
                  이전
                </Button>
                <span>
                  {page} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  isDisabled={page >= totalPages}
                  onPress={() => handlePageChange(null, page + 1)}
                >
                  다음
                </Button>
              </nav>
            </div>
          )}
        </>
      )}
      {/* 확인 다이얼로그 */}
      <Modal.Backdrop
        isOpen={confirmDialogOpen}
        isDismissable={!resetLoading}
        isKeyboardDismissDisabled={resetLoading}
        onOpenChange={(isOpen) => {
          if (!isOpen && !resetLoading) setConfirmDialogOpen(false);
        }}
      >
        <Modal.Container>
          <Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }} className="max-w-3xl">
            <Modal.Heading>비밀번호 초기화</Modal.Heading>
            <Modal.Body>
              <p>
                <strong>{selectedUser?.name}</strong>님의 비밀번호를
                초기화하시겠습니까?
                <br />
                <br />
                초기화 시 임시 비밀번호가 발급되며, 기존 비밀번호는 사용할 수
                없게 됩니다.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => setConfirmDialogOpen(false)}
                variant={"secondary"}
                isDisabled={resetLoading}
              >
                취소
              </Button>
              <Button
                onClick={confirmReset}
                variant={"primary"}
                isDisabled={resetLoading}
              >
                {resetLoading ? <Spinner aria-label="로딩 중" /> : "초기화"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      {/* 임시 비밀번호 표시 다이얼로그 */}
      <Modal.Backdrop
        isOpen={passwordDialogOpen}
        isDismissable={false}
        isKeyboardDismissDisabled
        onOpenChange={() => {
          // 임시 비밀번호는 한 번만 표시되므로 확인 버튼으로만 닫는다.
        }}
      >
        <Modal.Container>
          <Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }} className="max-w-3xl">
            <Modal.Heading>비밀번호 초기화 완료</Modal.Heading>
            <Modal.Body>
              <p style={{ marginBottom: 16 }}>
                비밀번호가 성공적으로 초기화되었습니다.
                <br />
                아래 임시 비밀번호를 회원에게 전달해주세요.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TextField>
                  <Label>{"임시 비밀번호"}</Label>
                  <Input value={temporaryPassword} readOnly />
                </TextField>
                <Button
                  onClick={handleCopyPassword}
                  variant={"secondary"}
                  isIconOnly
                  aria-label="임시 비밀번호 복사"
                >
                  <ContentCopyIcon size={16} />
                </Button>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={handlePasswordDialogClose} variant={"primary"}>
                확인
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}

export default function ResetPasswordPageV2() {
  return <ResetPasswordPageContent />;
}
