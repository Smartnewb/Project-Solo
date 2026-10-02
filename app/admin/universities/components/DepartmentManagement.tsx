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
  Tooltip,
} from "@heroui/react";
import {
  Plus as AddIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
  Upload as UploadFileIcon,
} from "lucide-react";
import { useState, useEffect } from "react";

import AdminService from "@/app/services/admin";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import { useToast } from "@/shared/ui/admin/toast";
import DepartmentCsvUpload from "./DepartmentCsvUpload";
import type {
  UniversityDetail,
  DepartmentItem,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
} from "@/types/admin";

interface DepartmentManagementProps {
  university: UniversityDetail;
  onChanged: () => void;
}

interface FormData {
  name: string;
  code: string;
  nameEn: string;
  displayOrder: number;
  isActive: boolean;
}

export default function DepartmentManagement({
  university,
  onChanged,
}: DepartmentManagementProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [csvUploadOpen, setCsvUploadOpen] = useState(false);
  const [editDepartment, setEditDepartment] = useState<DepartmentItem | null>(
    null,
  );
  const [formData, setFormData] = useState<FormData>({
    name: "",
    code: "",
    nameEn: "",
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    loadDepartments();
  }, [university.id]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await AdminService.universities.departments.getList(
        university.id,
        {
          limit: 200,
          sortBy: "displayOrder",
          sortOrder: "asc",
        },
      );
      setDepartments(data.items);
    } catch {
      toast.error("학과 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditDepartment(null);
    setFormData({
      name: "",
      code: "",
      nameEn: "",
      displayOrder: departments.length,
      isActive: true,
    });
    setFormDialogOpen(true);
  };

  const handleEdit = (department: DepartmentItem) => {
    setEditDepartment(department);
    setFormData({
      name: department.name,
      code: department.code || "",
      nameEn: department.nameEn || "",
      displayOrder: department.displayOrder,
      isActive: department.isActive,
    });
    setFormDialogOpen(true);
  };

  const handleDelete = async (dept: DepartmentItem) => {
    const id = dept.id;
    const ok = await confirm({
      title: "학과 삭제",
      message: `'${dept.name}' 학과를 삭제합니다.\n삭제하시겠습니까?`,
      confirmText: "삭제",
      severity: "error",
    });
    if (!ok) return;

    try {
      await AdminService.universities.departments.delete(university.id, id);
      loadDepartments();
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "삭제에 실패했습니다.");
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.warning("학과명을 입력해주세요.");
      return;
    }
    if (Number.isNaN(formData.displayOrder)) {
      toast.warning("정렬 순서를 숫자로 입력해주세요.");
      return;
    }

    try {
      setSaving(true);
      if (editDepartment) {
        const updateData: UpdateDepartmentRequest = {};
        if (formData.name !== editDepartment.name)
          updateData.name = formData.name;
        if (formData.code !== (editDepartment.code || ""))
          updateData.code = formData.code || undefined;
        if (formData.nameEn !== (editDepartment.nameEn || ""))
          updateData.nameEn = formData.nameEn || undefined;
        if (formData.displayOrder !== editDepartment.displayOrder)
          updateData.displayOrder = formData.displayOrder;
        if (formData.isActive !== editDepartment.isActive)
          updateData.isActive = formData.isActive;

        await AdminService.universities.departments.update(
          university.id,
          editDepartment.id,
          updateData,
        );
      } else {
        const createData: CreateDepartmentRequest = {
          name: formData.name,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
        };
        if (formData.code) createData.code = formData.code;
        if (formData.nameEn) createData.nameEn = formData.nameEn;

        await AdminService.universities.departments.create(
          university.id,
          createData,
        );
      }

      setFormDialogOpen(false);
      loadDepartments();
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleCsvUploadSuccess = () => {
    setCsvUploadOpen(false);
    loadDepartments();
    onChanged();
  };

  return (
    <div style={{ paddingBlock: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <Chip size="sm">{`총 ${departments.length}개`}</Chip>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => setCsvUploadOpen(true)} variant={"secondary"}>
            {<UploadFileIcon size={16} />}CSV 업로드
          </Button>
          <Button onClick={handleAddClick} variant={"primary"}>
            {<AddIcon size={16} />}학과 추가
          </Button>
        </div>
      </div>
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingBlock: 32,
          }}
        >
          <Spinner aria-label="로딩 중" />
        </div>
      ) : departments.length === 0 ? (
        <div
          style={{ textAlign: "center", paddingBlock: 32, color: "#52525b" }}
        >
          등록된 학과가 없습니다.
        </div>
      ) : (
        <div>
          <table className="w-full text-sm text-left">
            <thead>
              <tr style={{ backgroundColor: "#f4f4f5" }}>
                <th
                  scope="col"
                  style={{ width: 50 }}
                  className="px-3 py-2 border-b border-default"
                >
                  순서
                </th>
                <th scope="col" className="px-3 py-2 border-b border-default">
                  학과명
                </th>
                <th
                  scope="col"
                  style={{ width: 100 }}
                  className="px-3 py-2 border-b border-default"
                >
                  코드
                </th>
                <th
                  scope="col"
                  style={{ width: 80 }}
                  className="px-3 py-2 border-b border-default"
                >
                  활성화
                </th>
                <th
                  scope="col"
                  style={{ width: 100 }}
                  className="px-3 py-2 border-b border-default"
                >
                  관리
                </th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td className="px-3 py-2 border-b border-default">
                    {dept.displayOrder}
                  </td>
                  <td className="px-3 py-2 border-b border-default">
                    <div>
                      <div>{dept.name}</div>
                      {dept.nameEn && (
                        <div style={{ fontSize: "0.75rem", color: "#52525b" }}>
                          {dept.nameEn}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 border-b border-default">
                    {dept.code ? <Chip size="sm">{dept.code}</Chip> : "-"}
                  </td>
                  <td className="px-3 py-2 border-b border-default">
                    <Chip size="sm">{dept.isActive ? "활성" : "비활성"}</Chip>
                  </td>
                  <td className="px-3 py-2 border-b border-default">
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        justifyContent: "center",
                      }}
                    >
                      <Tooltip>
                        <Button
                            onClick={() => handleEdit(dept)}
                            variant={"secondary"}
                            isIconOnly
                            aria-label="학과 수정"
                          >
                            <EditIcon size={16} />
                          </Button>
                        <Tooltip.Content>{"수정"}</Tooltip.Content>
                      </Tooltip>
                      <Tooltip>
                        <Button
                            onClick={() => handleDelete(dept)}
                            variant={"secondary"}
                            isIconOnly
                            aria-label="학과 삭제"
                          >
                            <DeleteIcon size={16} />
                          </Button>
                        <Tooltip.Content>{"삭제"}</Tooltip.Content>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal.Backdrop
        isOpen={formDialogOpen}
        isDismissable={!saving}
        isKeyboardDismissDisabled={saving}
        onOpenChange={(isOpen) => {
          if (!isOpen && !saving) setFormDialogOpen(false);
        }}
      >
        <Modal.Container>
          <Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }} className="max-w-3xl">
            <Modal.Heading>
              {editDepartment ? "학과 수정" : "학과 추가"}
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
                <TextField>
                  <Label>{"학과명"}</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </TextField>
                <TextField>
                  <Label>{"영문 학과명"}</Label>
                  <Input
                    value={formData.nameEn}
                    onChange={(e) =>
                      setFormData({ ...formData, nameEn: e.target.value })
                    }
                  />
                </TextField>
                <TextField>
                  <Label>{"학과 코드"}</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                  />
                </TextField>
                <TextField>
                  <Label>{"정렬 순서"}</Label>
                  <Input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayOrder: parseInt(e.target.value),
                      })
                    }
                  />
                </TextField>
                <Switch
                  isSelected={formData.isActive}
                  onChange={(isSelected) =>
                    setFormData({ ...formData, isActive: isSelected })
                  }
                  aria-label="활성화"
                >
                  <Switch.Content>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <Label>{"활성화"}</Label>
                  </Switch.Content>
                </Switch>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => setFormDialogOpen(false)}
                variant={"secondary"}
                isDisabled={saving}
              >
                취소
              </Button>
              <Button
                onClick={handleSubmit}
                variant={"primary"}
                isDisabled={saving}
              >
                {saving ? <Spinner aria-label="저장 중" /> : editDepartment ? "수정" : "추가"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      <DepartmentCsvUpload
        open={csvUploadOpen}
        onClose={() => setCsvUploadOpen(false)}
        universityId={university.id}
        universityName={university.name}
        onSuccess={handleCsvUploadSuccess}
      />
    </div>
  );
}
