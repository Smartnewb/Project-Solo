"use client";
import {
  Button,
  FieldError,
  Input,
  Label,
  Spinner,
  TextField,
} from "@heroui/react";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import AdminService, {
  type ProfileCurationReviewImage,
  type ProfileCurationReviewUser,
} from "@/app/services/admin";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";

const DEFAULT_EXPIRY_DAYS = 14;

type PreparedImage = { assetId: string; previewUrl: string };

function defaultExpiryValue() {
  const date = new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const localTime = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localTime.toISOString().slice(0, 16);
}

export default function ProfileCurationPage() {
  const imageInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const userId = useSearchParams().get("userId");
  const [user, setUser] = useState<ProfileCurationReviewUser | null>(null);
  const [preparedImages, setPreparedImages] = useState<
    Record<string, PreparedImage>
  >({});
  const [expiresAt, setExpiresAt] = useState(defaultExpiryValue);
  const [loading, setLoading] = useState(true);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const approvedImages = useMemo(() => user?.approvedImages ?? [], [user]);

  useEffect(() => {
    let active = true;
    if (!userId) {
      setError("심사 알림의 큐레이팅 버튼에서 다시 열어주세요.");
      setLoading(false);
      return;
    }

    void AdminService.profileCuration
      .getReviewUser(userId)
      .then((result) => {
        if (!active) return;
        if (result.gender !== "MALE") {
          setError("프로필 큐레이팅은 남성 회원에게만 제안할 수 있습니다.");
          return;
        }
        setUser(result);
      })
      .catch(
        (requestError) =>
          active &&
          setError(
            getAdminErrorMessage(requestError, "회원을 불러오지 못했습니다."),
          ),
      )
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [userId]);

  const upload = async (
    image: ProfileCurationReviewImage,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setUploadingImageId(image.imageId);
    try {
      const asset =
        await AdminService.profileCuration.uploadPreparedAsset(file);
      const previewUrl = URL.createObjectURL(file);
      setPreparedImages((current) => {
        const previous = current[image.imageId];
        if (previous) URL.revokeObjectURL(previous.previewUrl);
        return {
          ...current,
          [image.imageId]: { assetId: asset.id, previewUrl },
        };
      });
    } catch (requestError) {
      setError(
        getAdminErrorMessage(
          requestError,
          "결과 사진을 업로드하지 못했습니다.",
        ),
      );
    } finally {
      setUploadingImageId(null);
      event.target.value = "";
    }
  };

  const submit = async () => {
    if (!userId || !user) return;
    const items = approvedImages.filter(
      (image) => preparedImages[image.imageId],
    );
    if (items.length === 0) {
      setError("제안할 결과 사진을 1장 이상 업로드해주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await AdminService.profileCuration.create({
        userId,
        expiresAt: new Date(expiresAt).toISOString(),
        items: items.map((image) => ({
          sourceProfileImageId: image.imageId,
          targetSlotIndex: image.slotIndex,
          preparedImageAssetId: preparedImages[image.imageId].assetId,
        })),
      });
      setSuccess(`${items.length}장의 프로필 큐레이팅 제안을 발송했습니다.`);
    } catch (requestError) {
      setError(
        getAdminErrorMessage(
          requestError,
          "큐레이팅 제안을 발송하지 못했습니다.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{ display: "grid", minHeight: "100vh", placeItems: "center" }}
      >
        <Spinner aria-label="로딩 중" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1040, marginInline: "auto" }}>
      <h4>프로필 큐레이팅 제안</h4>
      <p style={{ marginBottom: 24 }}>
        운영진이 검토한 결과 사진만 올리면, 회원에게 한 번의 제안으로
        전달됩니다.
      </p>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
          style={{ marginBottom: 16 }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
          style={{ marginBottom: 16 }}
        >
          {success}
        </div>
      )}
      {user && (
        <div>
          <div className="flex flex-row gap-3 min-w-0">
            <div>
              <h6>{user.name}</h6>
              <p>승인된 프로필 사진에서 최대 3장을 선택할 수 있습니다.</p>
            </div>
            <TextField>
              <Label>{"제안 만료"}</Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
              />
            </TextField>
          </div>
          <hr style={{ marginBlock: 24 }} />
          {approvedImages.length === 0 ? (
            <div
              role="alert"
              className="rounded-lg border border-default p-3 text-sm"
            >
              승인된 프로필 사진이 없어 제안을 만들 수 없습니다.
            </div>
          ) : (
            <div className="flex flex-col gap-3 min-w-0">
              {approvedImages.map((image) => {
                const prepared = preparedImages[image.imageId];
                const isUploading = uploadingImageId === image.imageId;
                return (
                  <div key={image.imageId} style={{ padding: 16 }}>
                    <div className="flex flex-col md:flex-row gap-3 min-w-0">
                      <img
                        src={image.url}
                        alt={`현재 프로필 사진 슬롯 ${image.slotIndex + 1}`}
                        style={{
                          width: 112,
                          aspectRatio: "1 / 1",
                          objectFit: "cover",
                          borderRadius: 1,
                        }}
                      ></img>
                      <div style={{ flex: 1 }}>
                        <p>현재 사진 · 슬롯 {image.slotIndex + 1}</p>
                        <p style={{ marginBottom: 12 }}>
                          이 사진을 개선한 결과를 같은 슬롯에 제안합니다.
                        </p>
                        <Button
                          variant="secondary"
                          isDisabled={isUploading || submitting}
                          onPress={() =>
                            imageInputs.current[image.imageId]?.click()
                          }
                        >
                          {isUploading
                            ? "사진 업로드 중"
                            : prepared
                              ? "결과 사진 다시 선택"
                              : "검토 완료 사진 업로드"}
                        </Button>
                        <input
                          ref={(node) => {
                            imageInputs.current[image.imageId] = node;
                          }}
                          disabled={isUploading || submitting}
                          hidden
                          type="file"
                          accept="image/*"
                          onChange={(event) => void upload(image, event)}
                        />
                      </div>
                      {prepared && (
                        <img
                          src={prepared.previewUrl}
                          alt={`큐레이팅 결과 미리보기 슬롯 ${image.slotIndex + 1}`}
                          style={{
                            width: 112,
                            aspectRatio: "1 / 1",
                            objectFit: "cover",
                            borderRadius: 1,
                          }}
                        ></img>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 24,
            }}
          >
            <Button
              onClick={() => void submit()}
              variant={"primary"}
              isDisabled={
                submitting ||
                uploadingImageId !== null ||
                approvedImages.length === 0
              }
            >
              {submitting ? "제안 발송 중" : "회원에게 큐레이팅 제안하기"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
