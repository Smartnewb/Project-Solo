import { Label as HeroSelectLabel } from "@heroui/react";
import {
  Button,
  FieldError,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  Switch,
  TextField,
} from "@heroui/react";
import { useState, useEffect } from "react";
import { Controller } from "react-hook-form";

import AdminService from "@/app/services/admin";
import type {
  UniversityItem,
  CreateUniversityRequest,
  UpdateUniversityRequest,
  RegionMetaItem,
  TypeMetaItem,
  UniversityType,
} from "@/types/admin";
import { useAdminForm } from "@/app/admin/hooks/forms";
import {
  universitySchema,
  type UniversityFormValues,
} from "@/app/admin/hooks/forms/schemas/university.schema";

interface UniversityFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  editUniversity: UniversityItem | null;
  regions: RegionMetaItem[];
  types: TypeMetaItem[];
}

export default function UniversityFormDialog({
  open,
  onClose,
  onSubmit,
  editUniversity,
  regions,
  types,
}: UniversityFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [foundations, setFoundations] = useState<TypeMetaItem[]>([]);

  const { control, handleFormSubmit, reset } =
    useAdminForm<UniversityFormValues>({
      schema: universitySchema,
      defaultValues: {
        name: "",
        region: "",
        code: "",
        en: "",
        type: "UNIVERSITY",
        foundation: "",
        isActive: true,
      },
    });

  useEffect(() => {
    if (open) {
      loadFoundations();
      if (editUniversity) {
        reset({
          name: editUniversity.name,
          region: editUniversity.region,
          code: editUniversity.code || "",
          en: editUniversity.en || "",
          type: editUniversity.type,
          foundation: editUniversity.foundation || "",
          isActive: editUniversity.isActive,
        });
      } else {
        reset({
          name: "",
          region: "",
          code: "",
          en: "",
          type: "UNIVERSITY",
          foundation: "",
          isActive: true,
        });
      }
    }
  }, [open, editUniversity]);

  const loadFoundations = async () => {
    try {
      const data = await AdminService.universities.meta.getFoundations();
      setFoundations(data);
    } catch {}
  };

  const onFormSubmit = handleFormSubmit(async (data: UniversityFormValues) => {
    setLoading(true);
    try {
      if (editUniversity) {
        const updateData: UpdateUniversityRequest = {};
        if (data.name !== editUniversity.name) updateData.name = data.name;
        if (data.region !== editUniversity.region)
          updateData.region = data.region;
        if (data.code !== (editUniversity.code || ""))
          updateData.code = data.code || undefined;
        if (data.en !== (editUniversity.en || ""))
          updateData.en = data.en || undefined;
        if (data.type !== editUniversity.type)
          updateData.type = data.type as UniversityType;
        if (data.foundation !== (editUniversity.foundation || ""))
          updateData.foundation = data.foundation || undefined;
        if (data.isActive !== editUniversity.isActive)
          updateData.isActive = data.isActive;

        await AdminService.universities.update(editUniversity.id, updateData);
      } else {
        const createData: CreateUniversityRequest = {
          name: data.name,
          region: data.region,
          type: data.type as UniversityType,
          isActive: data.isActive,
        };
        if (data.code) createData.code = data.code;
        if (data.en) createData.en = data.en;
        if (data.foundation) createData.foundation = data.foundation;

        await AdminService.universities.create(createData);
      }

      onSubmit();
    } finally {
      setLoading(false);
    }
  });

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <Modal.Container>
        <Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }} className="max-w-3xl">
          <Modal.Heading>
            {editUniversity ? "대학 수정" : "대학 등록"}
          </Modal.Heading>
          <Modal.Body>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                marginTop: 8,
              }}
            >
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField isInvalid={!!fieldState.error}>
                    <Label>{"대학명"}</Label>
                    <Input {...field} required />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </TextField>
                )}
              />
              <Controller
                name="en"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField isInvalid={!!fieldState.error}>
                    <Label>{"영문명"}</Label>
                    <Input {...field} />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </TextField>
                )}
              />
              <Controller
                name="code"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField isInvalid={!!fieldState.error}>
                    <Label>{"대학 코드"}</Label>
                    <Input {...field} />
                    <FieldError>
                      {fieldState.error?.message ||
                        "로고 URL 생성에 사용됩니다"}
                    </FieldError>
                  </TextField>
                )}
              />
              <Controller
                name="region"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <Select
                      selectedKey={field.value || null}
                      onSelectionChange={(key) => field.onChange(key)}
                      aria-label={"지역"}
                    >
                      <HeroSelectLabel>지역</HeroSelectLabel>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {regions.map((region) => (
                            <ListBox.Item
                              key={region.code}
                              id={region.code}
                              textValue={
                                String(region.nameLocal) +
                                "(" +
                                String(region.name) +
                                ")"
                              }
                            >
                              {region.nameLocal}({region.name})
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                )}
              />
              <Controller
                name="type"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <Select
                      selectedKey={field.value || null}
                      onSelectionChange={(key) => field.onChange(key)}
                      aria-label={"대학 유형"}
                    >
                      <HeroSelectLabel>대학 유형</HeroSelectLabel>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {types.map((type) => (
                            <ListBox.Item
                              key={type.code}
                              id={type.code}
                              textValue={String(type.name)}
                            >
                              {type.name}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                )}
              />
              <Controller
                name="foundation"
                control={control}
                render={({ field }) => (
                  <div>
                    <Select
                      selectedKey={field.value || null}
                      onSelectionChange={(key) => field.onChange(key)}
                      aria-label={"설립 유형"}
                    >
                      <HeroSelectLabel>설립 유형</HeroSelectLabel>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          <ListBox.Item id={""} textValue={"선택 안 함"}>
                            선택 안 함
                          </ListBox.Item>
                          {foundations.map((foundation) => (
                            <ListBox.Item
                              key={foundation.code}
                              id={foundation.code}
                              textValue={String(foundation.name)}
                            >
                              {foundation.name}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                )}
              />
              <Controller
                name="isActive"
                control={control}
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
                      <Label>{"활성화"}</Label>
                    </Switch.Content>
                  </Switch>
                )}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={onClose}
              variant={"secondary"}
              isDisabled={loading}
            >
              취소
            </Button>
            <Button
              onClick={onFormSubmit}
              variant={"primary"}
              isDisabled={loading}
            >
              {loading ? (
                <Spinner aria-label="로딩 중" />
              ) : editUniversity ? (
                "수정"
              ) : (
                "등록"
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
