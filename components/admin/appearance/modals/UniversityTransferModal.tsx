import {
  Alert,
  Button,
  Checkbox,
  Chip,
  ComboBox,
  Input,
  Label,
  ListBox,
  Modal,
  Separator,
} from "@heroui/react";
import { GraduationCap } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import AdminService from "@/app/services/admin";
import type { DepartmentItem, UniversityItem } from "@/types/admin";

interface UniversityTransferModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  currentUniversityName?: string | null;
  currentDepartmentName?: string | null;
  currentGrade?: string | null;
  isVerified?: boolean;
  onSuccess?: (result: {
    universityName: string;
    departmentName: string;
  }) => void;
}

function normalizeItems<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data?.items)) return value.data.items;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

export default function UniversityTransferModal({
  open,
  onClose,
  userId,
  userName,
  currentUniversityName,
  currentDepartmentName,
  currentGrade,
  isVerified,
  onSuccess,
}: UniversityTransferModalProps) {
  const [universitySearch, setUniversitySearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [selectedUniversity, setSelectedUniversity] =
    useState<UniversityItem | null>(null);
  const [selectedDepartment, setSelectedDepartment] =
    useState<DepartmentItem | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setUniversitySearch("");
      setDepartmentSearch("");
      setUniversities([]);
      setDepartments([]);
      setSelectedUniversity(null);
      setSelectedDepartment(null);
      setConfirmed(false);
      setError(null);
      return;
    }

    let active = true;
    setLoadingUniversities(true);
    const timer = setTimeout(async () => {
      try {
        const result = await AdminService.universities.getList({
          name: universitySearch.trim() || undefined,
          limit: 20,
          isActive: true,
          sortBy: "name",
          sortOrder: "asc",
        });
        if (active) setUniversities(normalizeItems<UniversityItem>(result));
      } catch (err: any) {
        if (active)
          setError(err.message || "대학교 목록을 불러오지 못했습니다.");
      } finally {
        if (active) setLoadingUniversities(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, universitySearch]);

  useEffect(() => {
    if (!open || !selectedUniversity) {
      setDepartments([]);
      setSelectedDepartment(null);
      return;
    }

    let active = true;
    setLoadingDepartments(true);
    const timer = setTimeout(async () => {
      try {
        const result = await AdminService.universities.departments.getList(
          selectedUniversity.id,
          {
            name: departmentSearch.trim() || undefined,
            limit: 30,
            isActive: true,
            sortBy: "displayOrder",
            sortOrder: "asc",
          },
        );
        if (active) setDepartments(normalizeItems<DepartmentItem>(result));
      } catch (err: any) {
        if (active) setError(err.message || "학과 목록을 불러오지 못했습니다.");
      } finally {
        if (active) setLoadingDepartments(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, selectedUniversity, departmentSearch]);

  const isSameTarget = useMemo(() => {
    return (
      selectedUniversity?.name === currentUniversityName &&
      selectedDepartment?.name === currentDepartmentName
    );
  }, [
    currentDepartmentName,
    currentUniversityName,
    selectedDepartment,
    selectedUniversity,
  ]);

  const canSave = Boolean(
    selectedUniversity && selectedDepartment && confirmed && !isSameTarget,
  );

  const handleSubmit = async () => {
    if (!selectedUniversity || !selectedDepartment || !canSave) return;

    try {
      setSaving(true);
      setError(null);
      const result = await AdminService.userAppearance.updateUserUniversity(
        userId,
        {
          universityId: selectedUniversity.id,
          departmentId: selectedDepartment.id,
        },
      );
      onSuccess?.({
        universityName: result?.universityName ?? selectedUniversity.name,
        departmentName: result?.departmentName ?? selectedDepartment.name,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "학교/학과 변경 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) (saving ? undefined : onClose)?.();
      }}
      isDismissable={!saving}
      isKeyboardDismissDisabled={saving}
    >
      <Modal.Container size="md" scroll="inside" className="w-full">
        <Modal.Dialog style={{ width: "100%", maxWidth: "44rem", minWidth: 0 }}>
          <Modal.Header>
            <Modal.Heading>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <GraduationCap />
                학교/학과 변경
              </div>
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body className="min-w-0 [overflow-wrap:anywhere]">
            <div style={{ paddingTop: 4 }}>
              {error && (
                <Alert style={{ marginBottom: 8 }} status="danger" role="alert">
                  <Alert.Content>{error}</Alert.Content>
                </Alert>
              )}
              <div style={{ marginBottom: 8 }}>
                <div className={"text-sm text-neutral-700"}>변경 대상</div>
                <div className={"text-sm text-neutral-700"}>
                  {userName || userId}
                </div>
              </div>
              <div
                style={{
                  padding: 8,
                  backgroundColor: "#fafafa",
                  borderRadius: 6,
                  marginBottom: 8,
                }}
              >
                <div className={"text-sm text-neutral-700"}>현재 정보</div>
                <div className={"text-sm text-neutral-700"}>
                  {currentUniversityName || "학교 없음"}·{" "}
                  {currentDepartmentName || "학과 없음"}
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  {currentGrade && (
                    <Chip
                      size={"sm"}
                      variant={"soft"}
                    >{`${currentGrade}학년`}</Chip>
                  )}
                  <Chip size={"sm"} variant={"soft"}>
                    {isVerified ? "인증 유지" : "미인증"}
                  </Chip>
                </div>
              </div>
              <Separator style={{ marginBottom: 8 }}></Separator>
              <div className={"grid grid-cols-1 gap-4 md:grid-cols-2"}>
                <div className={"min-w-0"}>
                  <ComboBox
                    inputValue={universitySearch}
                    selectedKey={selectedUniversity?.id ?? null}
                    onInputChange={(value) =>
                      ((_, value) => setUniversitySearch(value))(null, value)
                    }
                    onSelectionChange={(key) =>
                      ((_, value) => {
                        setSelectedUniversity(value);
                        setDepartmentSearch("");
                        setSelectedDepartment(null);
                        setConfirmed(false);
                      })(
                        null,
                        universities.find((option) => option.id === key) ??
                          null,
                      )
                    }
                    isDisabled={undefined}
                    allowsCustomValue={false}
                  >
                    <Label>{"변경할 대학교"}</Label>
                    <ComboBox.InputGroup>
                      <Input placeholder={"대학교명 검색"} />
                      <ComboBox.Trigger />
                    </ComboBox.InputGroup>
                    <ComboBox.Popover>
                      <ListBox>
                        {universities.map((option) => (
                          <ListBox.Item
                            key={option.id}
                            id={option.id}
                            textValue={option.name}
                          >
                            {option.name}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </ComboBox.Popover>
                  </ComboBox>
                </div>
                <div className={"min-w-0"}>
                  <ComboBox
                    inputValue={departmentSearch}
                    selectedKey={selectedDepartment?.id ?? null}
                    onInputChange={(value) =>
                      ((_, value) => setDepartmentSearch(value))(null, value)
                    }
                    onSelectionChange={(key) =>
                      ((_, value) => {
                        setSelectedDepartment(value);
                        setConfirmed(false);
                      })(
                        null,
                        departments.find((option) => option.id === key) ?? null,
                      )
                    }
                    isDisabled={!selectedUniversity}
                    allowsCustomValue={false}
                  >
                    <Label>{"변경할 학과"}</Label>
                    <ComboBox.InputGroup>
                      <Input
                        placeholder={
                          selectedUniversity
                            ? "학과명 검색"
                            : "먼저 대학교를 선택하세요"
                        }
                      />
                      <ComboBox.Trigger />
                    </ComboBox.InputGroup>
                    <ComboBox.Popover>
                      <ListBox>
                        {departments.map((option) => (
                          <ListBox.Item
                            key={option.id}
                            id={option.id}
                            textValue={option.name}
                          >
                            {option.name}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </ComboBox.Popover>
                  </ComboBox>
                </div>
              </div>
              {isSameTarget && (
                <Alert style={{ marginTop: 8 }} status={"default"} role="alert">
                  <Alert.Content>현재 학교/학과와 동일합니다.</Alert.Content>
                </Alert>
              )}
              <div className="flex items-center gap-2">
                <Checkbox
                  isSelected={confirmed}
                  isDisabled={
                    !selectedUniversity ||
                    !selectedDepartment ||
                    isSameTarget ||
                    saving
                  }
                  isIndeterminate={undefined}
                  onChange={(isSelected) => setConfirmed(isSelected)}
                >
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Label>{"이 유저의 학교/학과를 변경합니다."}</Label>
                  </Checkbox.Content>
                </Checkbox>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="flex-wrap gap-2">
            <Button
              onClick={onClose}
              variant={"ghost"}
              isDisabled={saving}
              size={"md"}
              className="rounded-xl"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              variant={"primary"}
              isDisabled={!canSave || saving}
              size={"md"}
              className="rounded-xl"
            >
              {saving ? "변경 중..." : "변경하기"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
