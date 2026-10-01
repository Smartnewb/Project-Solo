"use client";
import {
  Button,
  Chip,
  FieldError,
  Input,
  Label,
  Modal,
  Spinner,
  Switch,
  TextField,
} from "@heroui/react";
import {
  Plus as AddIcon,
  Pencil as EditIcon,
  Eye as ViewIcon,
} from "lucide-react";

import { useState, useEffect } from "react";
import { Controller, useFieldArray } from "react-hook-form";
import versionService, { VersionUpdate } from "@/app/services/version";

import { useAdminForm } from "@/app/admin/hooks/forms";
import {
  versionFormSchema,
  type VersionFormData,
} from "@/app/admin/hooks/forms/schemas/version.schema";
import {
  safeToLocaleString,
  safeToLocaleDateString,
} from "@/app/utils/formatters";

function VersionManagementContent() {
  const [versions, setVersions] = useState<VersionUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<VersionUpdate | null>(
    null,
  );

  const {
    control: createControl,
    reset: resetCreate,
    handleFormSubmit: handleCreateSubmit,
  } = useAdminForm<VersionFormData>({
    schema: versionFormSchema,
    defaultValues: {
      version: "",
      description: [{ value: "" }],
      shouldUpdate: false,
    },
  });

  const {
    fields: createFields,
    append: createAppend,
    remove: createRemove,
  } = useFieldArray({
    control: createControl,
    name: "description",
  });

  const {
    control: editControl,
    reset: resetEdit,
    handleFormSubmit: handleEditSubmit,
  } = useAdminForm<VersionFormData>({
    schema: versionFormSchema,
    defaultValues: {
      version: "",
      description: [{ value: "" }],
      shouldUpdate: false,
    },
  });

  const {
    fields: editFields,
    append: editAppend,
    remove: editRemove,
  } = useFieldArray({
    control: editControl,
    name: "description",
  });

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await versionService.getAllVersionUpdates();
      setVersions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = handleCreateSubmit(async (data) => {
    try {
      setError(null);
      await versionService.createVersionUpdate({
        version: data.version,
        metadata: {
          description: data.description
            .map((d) => d.value)
            .filter((v) => v.trim() !== ""),
        },
        shouldUpdate: data.shouldUpdate,
      });
      setSuccess("버전 업데이트가 성공적으로 생성되었습니다.");
      setCreateDialogOpen(false);
      resetCreate({
        version: "",
        description: [{ value: "" }],
        shouldUpdate: false,
      });
      fetchVersions();
    } catch (err: any) {
      setError(err.message);
    }
  });

  const handleUpdateVersion = handleEditSubmit(async (data) => {
    if (!selectedVersion) return;
    try {
      setError(null);
      await versionService.updateVersionUpdate(selectedVersion.id, {
        version: data.version,
        metadata: {
          description: data.description
            .map((d) => d.value)
            .filter((v) => v.trim() !== ""),
        },
        shouldUpdate: data.shouldUpdate,
      });
      setSuccess("버전 업데이트가 성공적으로 수정되었습니다.");
      setEditDialogOpen(false);
      setSelectedVersion(null);
      fetchVersions();
    } catch (err: any) {
      setError(err.message);
    }
  });

  const openCreateDialog = () => {
    resetCreate({
      version: "",
      description: [{ value: "" }],
      shouldUpdate: false,
    });
    setCreateDialogOpen(true);
  };

  const openViewDialog = (version: VersionUpdate) => {
    setSelectedVersion(version);
    setViewDialogOpen(true);
  };

  const openEditDialog = (version: VersionUpdate) => {
    setSelectedVersion(version);
    resetEdit({
      version: version.version,
      description: version.metadata.description.map((v) => ({ value: v })),
      shouldUpdate: version.shouldUpdate,
    });
    setEditDialogOpen(true);
  };

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h4>버전 관리</h4>
        <Button onClick={openCreateDialog} variant={"primary"}>
          {<AddIcon size={16} />}새 버전 추가
        </Button>
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
            onClick={() => setError(null)}
          >
            닫기
          </Button>
        </div>
      )}
      {success && (
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
          style={{ marginBottom: 16 }}
        >
          {success}
          <Button
            variant="secondary"
            aria-label="알림 닫기"
            onClick={() => setSuccess(null)}
          >
            닫기
          </Button>
        </div>
      )}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
          <Spinner aria-label="로딩 중" />
        </div>
      ) : (
        <div>
          <table className="w-full text-sm text-left">
            <thead>
              <tr>
                <th scope="col" className="px-3 py-2 border-b border-default">
                  버전
                </th>
                <th scope="col" className="px-3 py-2 border-b border-default">
                  설명
                </th>
                <th scope="col" className="px-3 py-2 border-b border-default">
                  업데이트 필요
                </th>
                <th scope="col" className="px-3 py-2 border-b border-default">
                  생성일
                </th>
                <th scope="col" className="px-3 py-2 border-b border-default">
                  작업
                </th>
              </tr>
            </thead>
            <tbody>
              {versions.map((version) => (
                <tr key={version.id}>
                  <td className="px-3 py-2 border-b border-default">
                    <h6 className="text-base font-semibold text-foreground">
                      {version.version}
                    </h6>
                  </td>
                  <td className="px-3 py-2 border-b border-default">
                    <p style={{ maxWidth: 300 }}>
                      {version.metadata.description.slice(0, 2).join(", ")}
                      {version.metadata.description.length > 2 && "..."}
                    </p>
                  </td>
                  <td className="px-3 py-2 border-b border-default">
                    <Chip size="sm">
                      {version.shouldUpdate ? "필요" : "불필요"}
                    </Chip>
                  </td>
                  <td className="px-3 py-2 border-b border-default">
                    {safeToLocaleDateString(version.createdAt)}
                  </td>
                  <td className="px-3 py-2 border-b border-default">
                    <Button
                      onClick={() => openViewDialog(version)}
                      variant={"secondary"}
                      isIconOnly
                      aria-label="작업 실행"
                    >
                      <ViewIcon size={16} />
                    </Button>
                    <Button
                      onClick={() => openEditDialog(version)}
                      variant={"secondary"}
                      isIconOnly
                      aria-label="작업 실행"
                    >
                      <EditIcon size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* 새 버전 생성 다이얼로그 */}
      <Modal.Backdrop
        isOpen={createDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) (() => setCreateDialogOpen(false))();
        }}
      >
        <Modal.Container>
          <Modal.Dialog style={{ width: '100%', maxWidth: 900, minWidth: 0 }} className="max-w-3xl">
            <Modal.Heading>새 버전 업데이트 생성</Modal.Heading>
            <Modal.Body>
              <Controller
                name="version"
                control={createControl}
                render={({ field, fieldState }) => (
                  <TextField
                    isInvalid={!!fieldState.error}
                    style={{ marginBottom: 16 }}
                  >
                    <Label>{"버전"}</Label>
                    <Input {...field} autoFocus />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </TextField>
                )}
              />
              <p style={{ marginBottom: 8 }}>설명</p>
              {createFields.map((field, index) => (
                <div
                  key={field.id}
                  style={{ display: "flex", gap: 8, marginBottom: 8 }}
                >
                  <Controller
                    name={`description.${index}.value`}
                    control={createControl}
                    render={({ field: inputField, fieldState }) => (
                      <TextField
                        isInvalid={!!fieldState.error}
                        aria-label={`설명 ${index + 1}`}
                      >
                        <Input
                          {...inputField}
                          placeholder={`설명 ${index + 1}`}
                          aria-label={`설명 ${index + 1}`}
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </TextField>
                    )}
                  />
                  {createFields.length > 1 && (
                    <Button
                      onClick={() => createRemove(index)}
                      variant={"secondary"}
                    >
                      삭제
                    </Button>
                  )}
                </div>
              ))}
              <Button
                onClick={() => createAppend({ value: "" })}
                style={{ marginBottom: 16 }}
                variant={"secondary"}
              >
                설명 추가
              </Button>
              <Controller
                name="shouldUpdate"
                control={createControl}
                render={({ field }) => (
                  <Switch
                    isSelected={field.value}
                    onChange={field.onChange}
                    aria-label="활성화"
                  >
                    <Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Label>{"업데이트 필요"}</Label>
                    </Switch.Content>
                  </Switch>
                )}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => setCreateDialogOpen(false)}
                variant={"secondary"}
              >
                취소
              </Button>
              <Button onClick={handleCreateVersion} variant={"primary"}>
                생성
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      {/* 버전 상세 보기 다이얼로그 */}
      <Modal.Backdrop
        isOpen={viewDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) (() => setViewDialogOpen(false))();
        }}
      >
        <Modal.Container>
          <Modal.Dialog style={{ width: '100%', maxWidth: 900, minWidth: 0 }} className="max-w-3xl">
            <Modal.Heading>버전 상세 정보</Modal.Heading>
            <Modal.Body>
              {selectedVersion && (
                <div>
                  <h6 style={{ marginBottom: 16 }}>
                    버전: {selectedVersion.version}
                  </h6>
                  <p style={{ marginBottom: 8 }}>설명:</p>
                  <ul>
                    {selectedVersion.metadata.description.map((desc, index) => (
                      <li key={index}>
                        <span>{`• ${desc}`}</span>
                      </li>
                    ))}
                  </ul>
                  <hr style={{ marginBlock: 16 }} />
                  <p style={{ marginBottom: 8 }}>
                    업데이트 필요:{" "}
                    {selectedVersion.shouldUpdate ? "예" : "아니오"}
                  </p>
                  <p>생성일: {safeToLocaleString(selectedVersion.createdAt)}</p>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => setViewDialogOpen(false)}
                variant={"secondary"}
              >
                닫기
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      {/* 버전 수정 다이얼로그 */}
      <Modal.Backdrop
        isOpen={editDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) (() => setEditDialogOpen(false))();
        }}
      >
        <Modal.Container>
          <Modal.Dialog style={{ width: '100%', maxWidth: 900, minWidth: 0 }} className="max-w-3xl">
            <Modal.Heading>버전 업데이트 수정</Modal.Heading>
            <Modal.Body>
              <Controller
                name="version"
                control={editControl}
                render={({ field, fieldState }) => (
                  <TextField
                    isInvalid={!!fieldState.error}
                    style={{ marginBottom: 16 }}
                  >
                    <Label>{"버전"}</Label>
                    <Input {...field} autoFocus />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </TextField>
                )}
              />
              <p style={{ marginBottom: 8 }}>설명</p>
              {editFields.map((field, index) => (
                <div
                  key={field.id}
                  style={{ display: "flex", gap: 8, marginBottom: 8 }}
                >
                  <Controller
                    name={`description.${index}.value`}
                    control={editControl}
                    render={({ field: inputField, fieldState }) => (
                      <TextField
                        isInvalid={!!fieldState.error}
                        aria-label={`설명 ${index + 1}`}
                      >
                        <Input
                          {...inputField}
                          placeholder={`설명 ${index + 1}`}
                          aria-label={`설명 ${index + 1}`}
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </TextField>
                    )}
                  />
                  {editFields.length > 1 && (
                    <Button
                      onClick={() => editRemove(index)}
                      variant={"secondary"}
                    >
                      삭제
                    </Button>
                  )}
                </div>
              ))}
              <Button
                onClick={() => editAppend({ value: "" })}
                style={{ marginBottom: 16 }}
                variant={"secondary"}
              >
                설명 추가
              </Button>
              <Controller
                name="shouldUpdate"
                control={editControl}
                render={({ field }) => (
                  <Switch
                    isSelected={field.value}
                    onChange={field.onChange}
                    aria-label="활성화"
                  >
                    <Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Label>{"업데이트 필요"}</Label>
                    </Switch.Content>
                  </Switch>
                )}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => setEditDialogOpen(false)}
                variant={"secondary"}
              >
                취소
              </Button>
              <Button onClick={handleUpdateVersion} variant={"primary"}>
                수정
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}

export default function VersionManagementV2() {
  return <VersionManagementContent />;
}
