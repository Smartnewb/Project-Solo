"use client";
import {
  Button,
  Input,
  Label,
  Modal,
  Pagination,
  Spinner,
  TextField,
} from "@heroui/react";
import { Copy } from "lucide-react";

import { useState } from "react";

import type { DeletedFemale, RestoreFemaleResponse } from "@/types/admin";
import {
  useDeletedFemalesList,
  useRestoreDeletedFemale,
  useSleepDeletedFemale,
} from "@/app/admin/hooks";
import { useToast } from "@/shared/ui/admin/toast/toast-context";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog/confirm-dialog-context";
import { safeToLocaleString } from "@/app/utils/formatters";

function DeletedFemalesPageContent() {
  const toast = useToast();
  const confirmAction = useConfirm();

  const [page, setPage] = useState(1);

  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreUserId, setRestoreUserId] = useState<string | null>(null);
  const [restoreUserName, setRestoreUserName] = useState("");

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [restoreResult, setRestoreResult] =
    useState<RestoreFemaleResponse | null>(null);

  const { data, isLoading, error } = useDeletedFemalesList(page, 20);
  const females = data?.items || [];
  const totalPages = data?.meta?.totalPages || 1;
  const totalCount = data?.meta?.totalCount || 0;

  const restoreMutation = useRestoreDeletedFemale();
  const sleepMutation = useSleepDeletedFemale();

  const handleRestoreClick = (user: DeletedFemale) => {
    setRestoreUserId(user.id);
    setRestoreUserName(user.name);
    setRestoreDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!restoreUserId) return;

    try {
      const result = await restoreMutation.mutateAsync(restoreUserId);
      setRestoreResult(result);
      setRestoreDialogOpen(false);
      setPasswordDialogOpen(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "복구에 실패했습니다.");
    }
  };

  const handleCopyPassword = () => {
    if (restoreResult?.temporaryPassword) {
      navigator.clipboard.writeText(restoreResult.temporaryPassword);
      toast.success("임시 비밀번호가 복사되었습니다.");
    }
  };

  const handlePasswordDialogClose = () => {
    setPasswordDialogOpen(false);
    setRestoreResult(null);
    setRestoreUserId(null);
    setRestoreUserName("");
  };

  const handleSleepClick = async (user: DeletedFemale) => {
    const ok = await confirmAction({
      title: "재탈퇴 처리",
      message: `${user.name}님을 다시 탈퇴 처리하시겠습니까?`,
    });
    if (!ok) return;

    try {
      await sleepMutation.mutateAsync(user.id);
      toast.success("재탈퇴 처리되었습니다.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "재탈퇴 처리에 실패했습니다.");
    }
  };

  const formatDate = (dateString: string) => {
    return safeToLocaleString(dateString, "ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div className={"text-lg font-semibold text-neutral-900"}>
          [리텐션] 파묘
        </div>
        <div style={{ marginTop: 4 }} className={"text-sm text-neutral-700"}>
          탈퇴한 여성 회원을 조회하고 복구할 수 있습니다.
        </div>
      </div>
      {error && (
        <div style={{ marginBottom: 8 }} className={"text-sm text-neutral-700"}>
          {(error as any).message || "목록을 불러오는데 실패했습니다."}
        </div>
      )}
      <div
        style={{
          marginBottom: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className={"text-sm text-neutral-700"}>
          총 {totalCount}명의 탈퇴 회원
        </div>
      </div>
      {isLoading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: 32,
            paddingBottom: 32,
          }}
        >
          <Spinner aria-label="불러오는 중" size="sm" />
        </div>
      ) : females.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 32, paddingBottom: 32 }}>
          <div className={"text-sm text-neutral-700"}>
            탈퇴한 여성 회원이 없습니다.
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 12 }} className={"overflow-x-auto"}>
            <table
              className={
                "w-full text-sm text-left [&_td]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
              }
            >
              <thead>
                <tr>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>전화번호</th>
                  <th>탈퇴일시</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {females.map((female) => (
                  <tr key={female.id}>
                    <td>{female.name}</td>
                    <td>{female.email || "-"}</td>
                    <td>{female.phoneNumber}</td>
                    <td>{formatDate(female.deletedAt)}</td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: 4,
                          justifyContent: "center",
                        }}
                      >
                        <Button
                          onClick={() => handleRestoreClick(female)}
                          variant={"primary"}
                          isDisabled={restoreMutation.isPending}
                          size={"sm"}
                          className="rounded-xl"
                        >
                          복구
                        </Button>
                        <Button
                          onClick={() => handleSleepClick(female)}
                          variant={"secondary"}
                          isDisabled={sleepMutation.isPending}
                          size={"sm"}
                          className="rounded-xl"
                        >
                          재탈퇴
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <Pagination aria-label="페이지 이동">
              <Pagination.Summary>
                {page} / {Math.max(1, totalPages)}
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page <= 1}
                    onPress={() =>
                      ((_, value) => setPage(value))(null, page - 1)
                    }
                  >
                    이전
                  </Pagination.Previous>
                </Pagination.Item>
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={page >= totalPages}
                    onPress={() =>
                      ((_, value) => setPage(value))(null, page + 1)
                    }
                  >
                    다음
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </div>
        </>
      )}
      <Modal.Backdrop
        isOpen={restoreDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) (() => setRestoreDialogOpen(false))?.();
        }}
        isDismissable={(() => setRestoreDialogOpen(false)) !== undefined}
      >
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>회원 복구</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div>
                <strong>{restoreUserName}</strong>님을 복구하시겠습니까?
                <br />
                <br />
                복구 시 다음과 같은 작업이 수행됩니다:
                <br />• 임시 비밀번호가 발급됩니다
                <br />• 기존 푸시 토큰이 삭제됩니다
                <br />• isRetentionUser가 true로 설정됩니다
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => setRestoreDialogOpen(false)}
                variant={"ghost"}
                isDisabled={restoreMutation.isPending}
                size={"md"}
                className="rounded-xl"
              >
                취소
              </Button>
              <Button
                onClick={confirmRestore}
                variant={"primary"}
                isDisabled={restoreMutation.isPending}
                size={"md"}
                className="rounded-xl"
              >
                {restoreMutation.isPending ? (
                  <Spinner aria-label="불러오는 중" size="sm" />
                ) : (
                  "복구"
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      <Modal.Backdrop
        isOpen={passwordDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) handlePasswordDialogClose?.();
        }}
        isDismissable={handlePasswordDialogClose !== undefined}
      >
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>회원 복구 완료</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div style={{ marginBottom: 8 }}>
                회원이 성공적으로 복구되었습니다.
                <br />
                아래 임시 비밀번호를 회원에게 전달해주세요.
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <TextField
                  className="w-full"
                  isDisabled={undefined}
                  isInvalid={undefined}
                >
                  <Label>{"임시 비밀번호"}</Label>
                  <Input
                    value={restoreResult?.temporaryPassword || ""}
                    readOnly
                    aria-label={"임시 비밀번호"}
                  />
                </TextField>
                <Button
                  onClick={handleCopyPassword}
                  variant={"ghost"}
                  isDisabled={undefined}
                  isIconOnly={true}
                  size={"md"}
                  className="rounded-lg"
                >
                  <Copy size={18} />
                </Button>
              </div>
              <div
                style={{ marginTop: 8 }}
                className={"text-sm text-neutral-700"}
              >
                이메일: {restoreResult?.email}
                <br />
                복구 시간:{" "}
                {restoreResult?.restoredAt
                  ? formatDate(restoreResult.restoredAt)
                  : "-"}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={handlePasswordDialogClose}
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
    </div>
  );
}

export default function DeletedFemalesPageV2() {
  return <DeletedFemalesPageContent />;
}
