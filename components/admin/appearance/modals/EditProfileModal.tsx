import {
  Alert,
  Button,
  Input,
  Label,
  Modal,
  Spinner,
  TextField,
} from "@heroui/react";
import { Edit } from "lucide-react";
import React, { useState, useEffect } from "react";

import AdminService from "@/app/services/admin";
import { UserDetail } from "../UserDetailModal";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userDetail: UserDetail | null;
  onSuccess?: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  onClose,
  userId,
  userDetail,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    instagramId: "",
    mbti: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 유저 정보로 폼 초기화
  useEffect(() => {
    if (!open) return;
    setError(null);
    setSuccess(false);
    if (userDetail) {
      setFormData({
        name: userDetail.name || "",
        email: userDetail.email || "",
        phoneNumber: userDetail.phoneNumber || "",
        instagramId: userDetail.instagramId || "",
        mbti: userDetail.mbti || "",
      });
    }
  }, [userDetail, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>,
  ) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // API 스키마에 맞게 데이터 구성
      // 제공된 API 문서에 따라 필요한 필드만 포함
      const profileData = {
        userId: userId,
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        instagramId: formData.instagramId || "",
        mbti: formData.mbti || "",
      };

      // 실제 API 호출
      await AdminService.userAppearance.updateUserProfile(userId, profileData);

      setSuccess(true);
      if (onSuccess) onSuccess();

      // 성공 후 1초 후에 모달 닫기
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error: any) {
      console.error("프로필 수정 오류:", error);
      setError(error.message || "프로필 수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose?.();
      }}
      isDismissable={!loading}
      isKeyboardDismissDisabled={loading}
    >
      <Modal.Container size="md" scroll="inside" className="w-full">
        <Modal.Dialog style={{ width: "100%", maxWidth: "44rem", minWidth: 0 }}>
          <Modal.Header>
            <Modal.Heading>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Edit />
                프로필 직접 수정
              </div>
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body className="min-w-0 [overflow-wrap:anywhere]">
            {success ? (
              <Alert style={{ marginTop: 8 }} status={"success"} role="alert">
                <Alert.Content>
                  프로필이 성공적으로 수정되었습니다.
                </Alert.Content>
              </Alert>
            ) : (
              <div style={{ paddingTop: 8 }}>
                {error && (
                  <Alert
                    style={{ marginBottom: 8 }}
                    status="danger"
                    role="alert"
                  >
                    <Alert.Content>{error}</Alert.Content>
                  </Alert>
                )}
                <div className={"grid grid-cols-1 gap-4 md:grid-cols-2"}>
                  {/* 이름 */}
                  <div className={"min-w-0"}>
                    <TextField
                      className="w-full"
                      isDisabled={loading}
                      isInvalid={undefined}
                    >
                      <Label>{"이름"}</Label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        aria-label={"이름"}
                      />
                    </TextField>
                  </div>
                  {/* 이메일 */}
                  <div className={"min-w-0"}>
                    <TextField
                      className="w-full"
                      isDisabled={loading}
                      isInvalid={undefined}
                    >
                      <Label>{"이메일"}</Label>
                      <Input
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                        aria-label={"이메일"}
                      />
                    </TextField>
                  </div>
                  {/* 전화번호 */}
                  <div className={"min-w-0"}>
                    <TextField
                      className="w-full"
                      isDisabled={loading}
                      isInvalid={undefined}
                    >
                      <Label>{"전화번호"}</Label>
                      <Input
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="010-1234-5678"
                        aria-label={"전화번호"}
                      />
                    </TextField>
                  </div>
                  {/* 인스타그램 ID */}
                  <div className={"min-w-0"}>
                    <TextField
                      className="w-full"
                      isDisabled={loading}
                      isInvalid={undefined}
                    >
                      <Label>{"인스타그램 ID"}</Label>
                      <Input
                        name="instagramId"
                        value={formData.instagramId}
                        onChange={handleChange}
                        placeholder="@instagram_id"
                        aria-label={"인스타그램 ID"}
                      />
                    </TextField>
                  </div>
                  {/* MBTI */}
                  <div className={"min-w-0"}>
                    <TextField
                      className="w-full"
                      isDisabled={loading}
                      isInvalid={undefined}
                    >
                      <Label>{"MBTI"}</Label>
                      <Input
                        name="mbti"
                        value={formData.mbti}
                        onChange={handleChange}
                        placeholder="ENFP"
                        aria-label={"MBTI"}
                      />
                    </TextField>
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="flex-wrap gap-2">
            <Button
              onClick={handleClose}
              variant={"ghost"}
              isDisabled={loading}
              size={"md"}
              className="rounded-xl"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              variant={"primary"}
              isDisabled={loading || success || !formData.name}
              size={"md"}
              className="rounded-xl"
            >
              {loading ? <Spinner aria-label="불러오는 중" size="sm" /> : null}
              {loading ? "저장 중..." : "저장하기"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};

export default EditProfileModal;
