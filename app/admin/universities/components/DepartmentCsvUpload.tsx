import { Button, Modal, Spinner } from "@heroui/react";
import {
  Upload as UploadFileIcon,
  Download as DownloadIcon,
  CircleCheck as CheckCircleIcon,
  TriangleAlert as WarningIcon,
  Info as InfoIcon,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

import AdminService from "@/app/services/admin";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import type { UploadDepartmentsCsvResponse } from "@/types/admin";

interface DepartmentCsvUploadProps {
  open: boolean;
  onClose: () => void;
  universityId: string;
  universityName: string;
  onSuccess: () => void;
}

export default function DepartmentCsvUpload({
  open,
  onClose,
  universityId,
  universityName,
  onSuccess,
}: DepartmentCsvUploadProps) {
  const confirm = useConfirm();
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadDepartmentsCsvResponse | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    },
    [],
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["text/csv", "application/vnd.ms-excel", "text/plain"];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".csv")) {
      setError("CSV 파일만 업로드 가능합니다.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setError("");
    setResult(null);
    setSelectedFile(file);
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      setError("");
      const blob =
        await AdminService.universities.departments.downloadTemplate(
          universityId,
        );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "departments_template.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "템플릿 다운로드에 실패했습니다.",
      );
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const ok = await confirm({
      title: "학과 전체 교체",
      message: `'${universityName}'의 기존 학과가 모두 삭제되고 CSV 파일(${selectedFile.name})의 내용으로 교체됩니다.\n계속하시겠습니까?`,
      confirmText: "교체",
      severity: "error",
    });
    if (!ok) {
      return;
    }

    try {
      setUploading(true);
      setError("");
      const response = await AdminService.universities.departments.uploadCsv(
        universityId,
        selectedFile,
      );
      setResult(response);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedFile(null);

      successTimerRef.current = setTimeout(() => {
        successTimerRef.current = null;
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setError("");
      setResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (successTimerRef.current) {
        // 업로드는 이미 반영됐으므로 대기 중이던 목록 갱신을 즉시 수행한다.
        clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
        onSuccess();
      } else {
        onClose();
      }
    }
  };

  return (
    <Modal.Backdrop
      isOpen={open}
      isDismissable={!uploading}
      isKeyboardDismissDisabled={uploading}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <Modal.Container>
        <Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }} className="max-w-3xl">
          <Modal.Heading>
            학과 CSV 일괄 업로드
            <p style={{ marginTop: 4 }}>{universityName}</p>
          </Modal.Heading>
          <Modal.Body>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* 안내 메시지 */}
              <div
                role="alert"
                className="rounded-lg border border-default p-3 text-sm"
              >
                <p>주의: 기존 학과가 모두 삭제됩니다</p>
                <p>
                  CSV 파일의 내용으로 학과 목록이 완전히 교체됩니다. 필요한 경우
                  먼저 백업하세요.
                </p>
              </div>
              {/* 사용 방법 */}
              <div style={{ padding: 16 }}>
                <p style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <InfoIcon size={16} />
                  사용 방법
                </p>
                <ul>
                  <li>
                    <InfoIcon size={16} />
                    <span>
                      {"템플릿 다운로드"}
                      <small>{"CSV 형식을 확인하세요"}</small>
                    </span>
                  </li>
                  <li>
                    <InfoIcon size={16} />
                    <span>
                      {"데이터 작성"}
                      <small>{"Excel에서 작성 후 CSV UTF-8로 저장"}</small>
                    </span>
                  </li>
                  <li>
                    <InfoIcon size={16} />
                    <span>
                      {"파일 업로드"}
                      <small>{"작성한 CSV 파일을 업로드"}</small>
                    </span>
                  </li>
                </ul>
              </div>
              {/* 템플릿 다운로드 */}
              <Button
                onClick={handleDownloadTemplate}
                fullWidth
                variant={"secondary"}
                isDisabled={downloadingTemplate || uploading}
              >
                {<DownloadIcon size={16} />}
                {downloadingTemplate ? "다운로드 중..." : "CSV 템플릿 다운로드"}
              </Button>
              <hr />
              {/* 파일 선택 */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,application/vnd.ms-excel"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                fullWidth
                variant={"secondary"}
                isDisabled={uploading}
              >
                {<UploadFileIcon size={16} />}CSV 파일 선택
              </Button>
              {selectedFile && (
                <div style={{ padding: 16, backgroundColor: "#f4f4f5" }}>
                  <p>선택된 파일</p>
                  <p>
                    {selectedFile.name}({(selectedFile.size / 1024).toFixed(2)}
                    KB)
                  </p>
                </div>
              )}
              {/* 에러 메시지 */}
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-default p-3 text-sm"
                >
                  {error}
                  <Button
                    variant="secondary"
                    aria-label="알림 닫기"
                    onClick={() => setError("")}
                  >
                    닫기
                  </Button>
                </div>
              )}
              {/* 업로드 결과 */}
              {result && (
                <div
                  role="alert"
                  className="rounded-lg border border-default p-3 text-sm"
                >
                  <p>{result.message}</p>
                  <div style={{ marginTop: 8 }}>
                    <p>
                      삭제: {result.deleted}개 | 생성: {result.created}개
                    </p>
                    {result.warnings && result.warnings.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <p>경고:</p>
                        {result.warnings.map((warning, index) => (
                          <p key={index}>• {warning}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* CSV 형식 안내 */}
              <div style={{ padding: 16, backgroundColor: "#f4f4f5" }}>
                <p>CSV 형식 안내</p>
                <p>
                  • 필수 컬럼: name (학과명)
                  <br />• 선택 컬럼: code, nameEn, displayOrder, isActive
                  <br />• UTF-8 인코딩 권장
                  <br />• 최대 파일 크기: 5MB
                </p>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={handleClose}
              variant={"secondary"}
              isDisabled={uploading}
            >
              {result ? "닫기" : "취소"}
            </Button>
            <Button
              onClick={handleUpload}
              variant={"primary"}
              isDisabled={!selectedFile || uploading}
            >
              {uploading ? (
                <Spinner aria-label="로딩 중" />
              ) : (
                <UploadFileIcon size={16} />
              )}
              {uploading ? "업로드 중..." : "업로드"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
