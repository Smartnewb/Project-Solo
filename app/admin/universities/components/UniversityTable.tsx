import { Button, Chip, Label, Switch, Tooltip } from "@heroui/react";
import {
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
  Eye as VisibilityIcon,
  GraduationCap as SchoolIcon,
} from "lucide-react";

import type { UniversityItem } from "@/types/admin";

interface UniversityTableProps {
  universities: UniversityItem[];
  onEdit: (university: UniversityItem) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onViewDetail: (university: UniversityItem) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function UniversityTable({
  universities,
  onEdit,
  onDelete,
  onToggleActive,
  onViewDetail,
  page,
  totalPages,
  onPageChange,
}: UniversityTableProps) {
  const getTypeLabel = (type: string) => {
    return type === "UNIVERSITY" ? "4년제" : "전문대";
  };

  const getTypeColor = (type: string) => {
    return type === "UNIVERSITY" ? "primary" : "secondary";
  };

  return (
    <div>
      <div>
        <table className="w-full text-sm text-left">
          <thead>
            <tr style={{ backgroundColor: "#f4f4f5" }}>
              <th
                scope="col"
                style={{ width: 60 }}
                className="px-3 py-2 border-b border-default"
              >
                로고
              </th>
              <th scope="col" className="px-3 py-2 border-b border-default">
                대학명
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
                style={{ width: 120 }}
                className="px-3 py-2 border-b border-default"
              >
                지역
              </th>
              <th
                scope="col"
                style={{ width: 100 }}
                className="px-3 py-2 border-b border-default"
              >
                유형
              </th>
              <th
                scope="col"
                style={{ width: 120 }}
                className="px-3 py-2 border-b border-default"
              >
                설립
              </th>
              <th
                scope="col"
                style={{ width: 80 }}
                className="px-3 py-2 border-b border-default"
              >
                학과수
              </th>
              <th
                scope="col"
                style={{ width: 100 }}
                className="px-3 py-2 border-b border-default"
              >
                활성화
              </th>
              <th
                scope="col"
                style={{ width: 150 }}
                className="px-3 py-2 border-b border-default"
              >
                관리
              </th>
            </tr>
          </thead>
          <tbody>
            {universities.map((university) => (
              <tr key={university.id}>
                <td className="px-3 py-2 border-b border-default">
                  {university.logoUrl ? (
                    <img
                      src={university.logoUrl}
                      alt={university.name}
                      className="h-12 w-12 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      <SchoolIcon size={16} />
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 border-b border-default">
                  <div>
                    <div style={{ fontWeight: 500 }}>{university.name}</div>
                    {university.en && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#52525b",
                          marginTop: 4,
                        }}
                      >
                        {university.en}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 border-b border-default">
                  {university.code ? (
                    <Chip size="sm">{university.code}</Chip>
                  ) : (
                    <div style={{ color: "#52525b" }}>-</div>
                  )}
                </td>
                <td className="px-3 py-2 border-b border-default">
                  {university.regionName || university.region}
                </td>
                <td className="px-3 py-2 border-b border-default">
                  <Chip size="sm">{getTypeLabel(university.type)}</Chip>
                </td>
                <td className="px-3 py-2 border-b border-default">
                  {university.foundation || "-"}
                </td>
                <td className="px-3 py-2 border-b border-default">
                  <Chip size="sm">{university.departmentCount || 0}</Chip>
                </td>
                <td className="px-3 py-2 border-b border-default">
                  <Switch
                    isSelected={university.isActive}
                    onChange={(isSelected) =>
                      onToggleActive(university.id, isSelected)
                    }
                    aria-label="활성화"
                  >
                    <Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Content>
                  </Switch>
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
                      <Tooltip.Trigger>
                        <Button
                          onClick={() => onViewDetail(university)}
                          variant={"secondary"}
                          isIconOnly
                          aria-label="작업 실행"
                        >
                          <VisibilityIcon size={16} />
                        </Button>
                      </Tooltip.Trigger>
                      <Tooltip.Content>{"상세 보기"}</Tooltip.Content>
                    </Tooltip>
                    <Tooltip>
                      <Tooltip.Trigger>
                        <Button
                          onClick={() => onEdit(university)}
                          variant={"secondary"}
                          isIconOnly
                          aria-label="작업 실행"
                        >
                          <EditIcon size={16} />
                        </Button>
                      </Tooltip.Trigger>
                      <Tooltip.Content>{"수정"}</Tooltip.Content>
                    </Tooltip>
                    <Tooltip>
                      <Tooltip.Trigger>
                        <Button
                          onClick={() => onDelete(university.id)}
                          variant={"secondary"}
                          isIconOnly
                          aria-label="작업 실행"
                        >
                          <DeleteIcon size={16} />
                        </Button>
                      </Tooltip.Trigger>
                      <Tooltip.Content>{"삭제"}</Tooltip.Content>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 24 }}
        >
          <nav aria-label="페이지" className="flex items-center gap-2">
            <Button
              variant="secondary"
              isDisabled={page <= 1}
              onPress={() =>
                ((_, value) => onPageChange(value))(null, page - 1)
              }
            >
              이전
            </Button>
            <span>
              {page} / {totalPages}
            </span>
            <Button
              variant="secondary"
              isDisabled={page >= totalPages}
              onPress={() =>
                ((_, value) => onPageChange(value))(null, page + 1)
              }
            >
              다음
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
}
