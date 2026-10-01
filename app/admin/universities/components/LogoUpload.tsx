import { Button, Spinner } from "@heroui/react";
import {
  Upload as UploadIcon,
  Trash2 as DeleteIcon,
  GraduationCap as SchoolIcon,
} from "lucide-react";
import { useState, useRef } from "react";

import AdminService from "@/app/services/admin";
import type { UniversityDetail } from "@/types/admin";

interface LogoUploadProps {
  university: UniversityDetail;
  onUploaded: () => void;
}

export default function LogoUpload({
  university,
  onUploaded,
}: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("JPG, PNG, WEBP 형식의 이미지만 업로드 가능합니다.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setError("");
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (!university.code) {
      setError(
        "대학 코드가 설정되지 않았습니다. 먼저 대학 정보를 수정하여 코드를 설정해주세요.",
      );
      return;
    }

    try {
      setUploading(true);
      setError("");
      await AdminService.universities.uploadLogo(university.id, selectedFile);
      setSelectedFile(null);
      setPreview(null);
      onUploaded();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("로고를 삭제하시겠습니까?")) return;

    try {
      setDeleting(true);
      setError("");
      await AdminService.universities.deleteLogo(university.id);
      onUploaded();
    } catch (err: any) {
      setError(err.response?.data?.message || "삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div style={{ paddingBlock: 16 }}>
      {!university.code && (
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
          style={{ marginBottom: 16 }}
        >
          로고를 업로드하려면 먼저 대학 코드를 설정해야 합니다.
        </div>
      )}
      <div style={{ padding: 24, marginBottom: 16 }}>
        <p>현재 로고</p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 16,
          }}
        >
          {university.logoUrl ? (
            <>
              <img
                src={university.logoUrl}
                alt={university.name}
                className="h-12 w-12 rounded-lg object-contain"
              />
              <div>
                <p>{university.logoUrl}</p>
                <Button
                  onClick={handleDelete}
                  style={{ marginTop: 8 }}
                  variant={"secondary"}
                  isDisabled={deleting}
                >
                  {<DeleteIcon size={16} />}
                  {deleting ? "삭제 중..." : "로고 삭제"}
                </Button>
              </div>
            </>
          ) : (
            <div
              style={{
                textAlign: "center",
                paddingBlock: 16,
                width: "100%",
                color: "#52525b",
              }}
            >
              <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <SchoolIcon size={16} />
              </div>
              <p>등록된 로고가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
          style={{ marginBottom: 16 }}
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
      <div style={{ padding: 24 }}>
        <p>새 로고 업로드</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        {preview ? (
          <div>
            <div
              style={{ marginTop: 16, marginBottom: 16, textAlign: "center" }}
            >
              <img
                src={preview}
                alt="Preview"
                className="h-12 w-12 rounded-lg object-contain"
              />
              <p>미리보기</p>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <Button
                onClick={handleUpload}
                variant={"primary"}
                isDisabled={uploading || !university.code}
              >
                {<UploadIcon size={16} />}
                {uploading ? <Spinner aria-label="로딩 중" /> : "업로드"}
              </Button>
              <Button
                onClick={handleCancel}
                variant={"secondary"}
                isDisabled={uploading}
              >
                취소
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => fileInputRef.current?.click()}
            style={{ marginTop: 16 }}
            variant={"secondary"}
            isDisabled={!university.code}
          >
            {<UploadIcon size={16} />}파일 선택
          </Button>
        )}
        <p style={{ marginTop: 16 }}>
          • JPG, PNG, WEBP 형식만 가능
          <br />• 최대 파일 크기: 5MB
          <br />• 파일명은 대학 코드를 기반으로 자동 생성됩니다
        </p>
      </div>
    </div>
  );
}
