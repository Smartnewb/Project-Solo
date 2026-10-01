"use client";
import { Label as HeroSelectLabel } from "@heroui/react";

import {
  Button,
  Checkbox,
  Chip,
  FieldError,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  TextField,
} from "@heroui/react";
import {
  Search as SearchIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
  Languages as TranslateIcon,
  Eye as VisibilityIcon,
} from "lucide-react";

import { useState, useEffect, useCallback } from "react";

import AdminService from "@/app/services/admin";
import type {
  Big5Dimension,
  QuestionListItem,
  QuestionListPagination,
  QuestionDetail,
} from "@/types/moment";
import { safeToLocaleDateString } from "@/app/utils/formatters";
import QuestionDetailDialog from "./QuestionDetailDialog";
import QuestionEditDialog from "./QuestionEditDialog";

const DIMENSION_LABELS: Record<Big5Dimension, string> = {
  openness: "개방성",
  conscientiousness: "성실성",
  extraversion: "외향성",
  agreeableness: "우호성",
  neuroticism: "신경성",
};

const DIMENSION_COLORS: Record<
  Big5Dimension,
  "primary" | "secondary" | "success" | "warning" | "error"
> = {
  openness: "primary",
  conscientiousness: "secondary",
  extraversion: "success",
  agreeableness: "warning",
  neuroticism: "error",
};

export default function QuestionListTab() {
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [pagination, setPagination] = useState<QuestionListPagination | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [dimensionFilter, setDimensionFilter] = useState<Big5Dimension | "">(
    "",
  );
  const [translationFilter, setTranslationFilter] = useState<
    "kr_only" | "kr_jp" | "all" | ""
  >("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] =
    useState<QuestionDetail | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AdminService.momentQuestions.getList({
        search: searchText || undefined,
        dimension: dimensionFilter || undefined,
        translationStatus: translationFilter || undefined,
        page,
        limit,
        isActive: true,
      });

      setQuestions(Array.isArray(response.questions) ? response.questions : []);
      setPagination(
        response.pagination ?? { total: 0, page, limit, totalPages: 1 },
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "질문 목록 조회에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [searchText, dimensionFilter, translationFilter, page, limit]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSearch = () => {
    setPage(1);
    fetchQuestions();
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleViewDetail = async (id: string) => {
    try {
      const detail = await AdminService.momentQuestions.getDetail(id);
      setSelectedQuestion(detail);
      setDetailDialogOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "상세 조회에 실패했습니다.");
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const detail = await AdminService.momentQuestions.getDetail(id);
      setSelectedQuestion(detail);
      setEditDialogOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "질문 조회에 실패했습니다.");
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;

    setProcessing(true);
    try {
      await AdminService.momentQuestions.delete(deleteTargetId);
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
      fetchQuestions();
    } catch (err: any) {
      setError(err.response?.data?.message || "삭제에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const handleEditSave = async (
    id: string,
    data: { text?: string; options?: { text: string; order: number }[] },
  ) => {
    setProcessing(true);
    try {
      await AdminService.momentQuestions.update(id, data);
      setEditDialogOpen(false);
      setSelectedQuestion(null);
      fetchQuestions();
    } catch (err: any) {
      setError(err.response?.data?.message || "수정에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)));
    }
  };

  const formatDate = (dateString: string) => {
    return safeToLocaleDateString(dateString, "ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div>
      <div style={{ padding: 16, marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField style={{ minWidth: 200 }}>
            <Label>{"검색"}</Label>
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="질문 텍스트 검색"
            />
          </TextField>
          <div style={{ minWidth: 150 }}>
            <Select
              selectedKey={dimensionFilter || null}
              onSelectionChange={(key) =>
                ((e) => {
                  setDimensionFilter(e.target.value as Big5Dimension | "");
                  setPage(1);
                })({ target: { value: key } } as any)
              }
              aria-label={"차원"}
            >
              <HeroSelectLabel>차원</HeroSelectLabel>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id={""} textValue={"전체"}>
                    전체
                  </ListBox.Item>
                  <ListBox.Item id={"openness"} textValue={"개방성"}>
                    개방성
                  </ListBox.Item>
                  <ListBox.Item id={"conscientiousness"} textValue={"성실성"}>
                    성실성
                  </ListBox.Item>
                  <ListBox.Item id={"extraversion"} textValue={"외향성"}>
                    외향성
                  </ListBox.Item>
                  <ListBox.Item id={"agreeableness"} textValue={"우호성"}>
                    우호성
                  </ListBox.Item>
                  <ListBox.Item id={"neuroticism"} textValue={"신경성"}>
                    신경성
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
          <div style={{ minWidth: 150 }}>
            <Select
              selectedKey={translationFilter || null}
              onSelectionChange={(key) =>
                ((e) => {
                  setTranslationFilter(
                    e.target.value as "kr_only" | "kr_jp" | "all" | "",
                  );
                  setPage(1);
                })({ target: { value: key } } as any)
              }
              aria-label={"번역 상태"}
            >
              <HeroSelectLabel>번역 상태</HeroSelectLabel>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id={""} textValue={"전체"}>
                    전체
                  </ListBox.Item>
                  <ListBox.Item id={"kr_only"} textValue={"KR만"}>
                    KR만
                  </ListBox.Item>
                  <ListBox.Item id={"kr_jp"} textValue={"KR+JP"}>
                    KR+JP
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
          <Button onClick={handleSearch} variant={"primary"}>
            {<SearchIcon size={16} />}검색
          </Button>
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
            onClick={() => setError(null)}
          >
            닫기
          </Button>
        </div>
      )}
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
      ) : (
        <>
          <div>
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th scope="col" className="px-3 py-2 border-b border-default">
                    <Checkbox
                      isSelected={
                        questions.length > 0 &&
                        selectedIds.size === questions.length
                      }
                      isIndeterminate={
                        selectedIds.size > 0 &&
                        selectedIds.size < questions.length
                      }
                      isDisabled={false}
                      onChange={handleSelectAll}
                      aria-label={"선택"}
                    >
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                  </th>
                  <th scope="col" className="px-3 py-2 border-b border-default">
                    질문
                  </th>
                  <th
                    scope="col"
                    style={{ width: 100 }}
                    className="px-3 py-2 border-b border-default"
                  >
                    차원
                  </th>
                  <th
                    scope="col"
                    style={{ width: 80 }}
                    className="px-3 py-2 border-b border-default"
                  >
                    옵션
                  </th>
                  <th
                    scope="col"
                    style={{ width: 100 }}
                    className="px-3 py-2 border-b border-default"
                  >
                    번역
                  </th>
                  <th
                    scope="col"
                    style={{ width: 100 }}
                    className="px-3 py-2 border-b border-default"
                  >
                    생성일
                  </th>
                  <th
                    scope="col"
                    style={{ width: 120 }}
                    className="px-3 py-2 border-b border-default"
                  >
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {questions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-2 border-b border-default"
                    >
                      <p style={{ paddingBlock: 32 }}>질문이 없습니다.</p>
                    </td>
                  </tr>
                ) : (
                  questions.map((question) => (
                    <tr key={question.id}>
                      <td className="px-3 py-2 border-b border-default">
                        <Checkbox
                          isSelected={selectedIds.has(question.id)}
                          isIndeterminate={false}
                          isDisabled={false}
                          onChange={() => handleToggleSelect(question.id)}
                          aria-label={"선택"}
                        >
                          <Checkbox.Content>
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox.Content>
                        </Checkbox>
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        <p
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {question.text}
                        </p>
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        <Chip size="sm">
                          {DIMENSION_LABELS[question.dimension]}
                        </Chip>
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        {question.optionCount}개
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            justifyContent: "center",
                          }}
                        >
                          {question.translationStatus.kr && (
                            <Chip size="sm">{"KR"}</Chip>
                          )}
                          {question.translationStatus.jp && (
                            <Chip size="sm">{"JP"}</Chip>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        {formatDate(question.createdAt)}
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            justifyContent: "center",
                          }}
                        >
                          <Button
                            onClick={() => handleViewDetail(question.id)}
                            aria-label="상세 보기"
                            variant={"secondary"}
                            isIconOnly
                          >
                            <VisibilityIcon size={16} />
                          </Button>
                          <Button
                            onClick={() => handleEdit(question.id)}
                            aria-label="수정"
                            variant={"secondary"}
                            isIconOnly
                          >
                            <EditIcon size={16} />
                          </Button>
                          <Button
                            onClick={() => handleDeleteClick(question.id)}
                            aria-label="삭제"
                            variant={"secondary"}
                            isIconOnly
                          >
                            <DeleteIcon size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 24,
              }}
            >
              <nav aria-label="페이지" className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  isDisabled={page <= 1}
                  onPress={() =>
                    handlePageChange({} as React.ChangeEvent<unknown>, page - 1)
                  }
                >
                  이전
                </Button>
                <span>
                  {page} / {pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  isDisabled={page >= pagination.totalPages}
                  onPress={() =>
                    handlePageChange({} as React.ChangeEvent<unknown>, page + 1)
                  }
                >
                  다음
                </Button>
              </nav>
            </div>
          )}

          {pagination && (
            <p style={{ marginTop: 8 }}>
              전체 {pagination.total}개 중 {(page - 1) * limit + 1}-
              {Math.min(page * limit, pagination.total)}개 표시
            </p>
          )}
        </>
      )}
      <QuestionDetailDialog
        open={detailDialogOpen}
        onClose={() => {
          setDetailDialogOpen(false);
          setSelectedQuestion(null);
        }}
        question={selectedQuestion}
      />
      <QuestionEditDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedQuestion(null);
        }}
        question={selectedQuestion}
        onSave={handleEditSave}
        processing={processing}
      />
      <Modal.Backdrop
        isOpen={deleteDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) (() => setDeleteDialogOpen(false))();
        }}
      >
        <Modal.Container>
          <Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }} className="max-w-3xl">
            <Modal.Heading>질문 삭제</Modal.Heading>
            <Modal.Body>
              <p>
                이 질문을 삭제하시겠습니까? 삭제된 질문은 비활성화되며, 새로운
                주차 생성 시 제외됩니다.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => setDeleteDialogOpen(false)}
                variant={"secondary"}
                isDisabled={processing}
              >
                취소
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                variant={"secondary"}
                isDisabled={processing}
              >
                {processing ? "삭제 중..." : "삭제"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
