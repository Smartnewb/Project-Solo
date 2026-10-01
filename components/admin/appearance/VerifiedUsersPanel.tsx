"use client";
import { Label as HeroSelectLabel } from "@heroui/react";

import { Button as HeroActionButton } from "@heroui/react";
import {
  ListBox,
  Select,
  Alert,
  Avatar,
  Button,
  Chip,
  Input,
  Label,
  Pagination,
  Spinner,
  TextField,
} from "@heroui/react";

import { Search } from "lucide-react";

import React, { useState, useEffect } from "react";

import AdminService from "@/app/services/admin";
import UserDetailModal, { UserDetail } from "./UserDetailModal";

// 대학교 인증 사용자 타입
interface VerifiedUser {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  universityName: string;
  departmentName: string;
  grade: string;
  studentNumber: string;
  verifiedAt: string;
  createdAt: string;
  gender?: "MALE" | "FEMALE";
  profileImageUrl?: string;
  profileImages?: {
    id: string;
    url: string;
    isMain: boolean;
    order: number;
  }[];
  hasPreferences?: boolean; // 프로필 정보 입력 여부
  isLongTermInactive?: boolean; // 장기 미접속자 여부
}

// API 응답 타입
interface VerifiedUsersResponse {
  data: VerifiedUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const VerifiedUsersPanel: React.FC = () => {
  const [users, setUsers] = useState<VerifiedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [nameFilter, setNameFilter] = useState("");
  const [universityFilter, setUniversityFilter] = useState("");

  // 사용자 상세 모달 상태
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  // 사용자 목록 조회
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: VerifiedUsersResponse =
        await AdminService.userAppearance.getVerifiedUsers({
          page: page + 1, // API는 1부터 시작
          limit: rowsPerPage,
          name: nameFilter || undefined,
          university: universityFilter || undefined,
        });

      setUsers(response.data);
      setTotalItems(response.meta?.total ?? 0);
    } catch (err: any) {
      console.error("대학교 인증 사용자 조회 중 오류:", err);
      setError(
        err.message ||
          "대학교 인증 사용자 목록을 불러오는 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage]);

  // 페이지 변경 핸들러
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경 핸들러
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 검색 핸들러
  const handleSearch = () => {
    setPage(0);
    fetchUsers();
  };

  // 엔터 키 검색
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  // 사용자 상세 모달 열기
  const handleOpenUserDetailModal = async (userId: string) => {
    try {
      setSelectedUserId(userId);
      setUserDetailModalOpen(true);
      setLoadingUserDetail(true);
      setUserDetailError(null);
      setUserDetail(null);

      console.log("유저 상세 정보 조회 요청:", userId);
      const data = await AdminService.userAppearance.getUserDetails(userId);
      console.log("유저 상세 정보 응답:", data);

      setUserDetail(data);
    } catch (error: any) {
      console.error("유저 상세 정보 조회 중 오류:", error);
      setUserDetailError(
        error.message || "유저 상세 정보를 불러오는 중 오류가 발생했습니다.",
      );
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // 사용자 상세 모달 닫기
  const handleCloseUserDetailModal = () => {
    setUserDetailModalOpen(false);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className={"text-lg font-semibold text-neutral-900"}>
        대학교 인증 사용자 ({totalItems}명)
      </div>
      {/* 검색 필터 */}
      <section style={{ padding: 8, marginBottom: 8 }}>
        <div className={"grid grid-cols-1 gap-4 md:grid-cols-2"}>
          <div className={"min-w-0"}>
            <TextField
              className="w-full"
              isDisabled={undefined}
              isInvalid={undefined}
            >
              <Label>{"이름 검색"}</Label>
              {
                <span>
                  <Search />
                </span>
              }
              <Input
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                aria-label={"이름 검색"}
              />
            </TextField>
          </div>
          <div className={"min-w-0"}>
            <TextField
              className="w-full"
              isDisabled={undefined}
              isInvalid={undefined}
            >
              <Label>{"대학교 검색"}</Label>
              {
                <span>
                  <Search />
                </span>
              }
              <Input
                value={universityFilter}
                onChange={(e) => setUniversityFilter(e.target.value)}
                aria-label={"대학교 검색"}
              />
            </TextField>
          </div>
          <div className={"min-w-0"}>
            <Button
              onClick={handleSearch}
              variant={"primary"}
              isDisabled={loading}
              size={"md"}
              className="rounded-xl"
            >
              검색
            </Button>
          </div>
        </div>
      </section>
      {/* 오류 메시지 */}
      {error && (
        <Alert style={{ marginBottom: 8 }} status="danger" role="alert">
          <Alert.Content>{error}</Alert.Content>
        </Alert>
      )}
      {/* 테이블 */}
      <div className={"overflow-x-auto"}>
        <table
          className={
            "w-full text-sm text-left [&_td]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
          }
        >
          <thead>
            <tr>
              <th>프로필</th>
              <th>이름</th>
              <th>이메일</th>
              <th>전화번호</th>
              <th>대학교</th>
              <th>학과</th>
              <th>학년</th>
              <th>학번</th>
              <th>프로필 정보</th>
              <th>접속 상태</th>
              <th>인증일시</th>
              <th>가입일시</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} style={{ paddingTop: 16, paddingBottom: 16 }}>
                  <Spinner aria-label="불러오는 중" size="sm" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ paddingTop: 16, paddingBottom: 16 }}>
                  대학교 인증 사용자가 없습니다.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <HeroActionButton
                      variant="ghost"
                      className="h-auto min-w-0 p-0"
                      onClick={() => handleOpenUserDetailModal(user.id)}
                      aria-label="프로필 상세 보기"
                    >
                      <Avatar
                        style={{ width: 40, height: 40, cursor: "pointer" }}
                      >
                        <Avatar.Image
                          src={
                            user.profileImageUrl || user.profileImages?.[0]?.url
                          }
                          alt={user.name}
                        />
                        <Avatar.Fallback>
                          {user.name?.charAt(0) || "?"}
                        </Avatar.Fallback>
                      </Avatar>
                    </HeroActionButton>
                  </td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phoneNumber}</td>
                  <td>{user.universityName}</td>
                  <td>{user.departmentName}</td>
                  <td>{user.grade}</td>
                  <td>{user.studentNumber}</td>
                  <td>
                    <Chip
                      style={{
                        backgroundColor: user.hasPreferences
                          ? "#e8f5e8"
                          : "#ffebee",
                        color: user.hasPreferences ? "#2e7d32" : "#c62828",
                        fontWeight: "medium",
                      }}
                      size={"sm"}
                      variant={"soft"}
                    >
                      {user.hasPreferences ? "입력 완료" : "미입력"}
                    </Chip>
                  </td>
                  <td>
                    <Chip
                      style={{
                        backgroundColor: user.isLongTermInactive
                          ? "#ffebee"
                          : "#e8f5e8",
                        color: user.isLongTermInactive ? "#c62828" : "#2e7d32",
                        fontWeight: "medium",
                      }}
                      size={"sm"}
                      variant={"soft"}
                    >
                      {user.isLongTermInactive ? "장기 미접속" : "정상"}
                    </Chip>
                  </td>
                  <td>{formatDate(user.verifiedAt)}</td>
                  <td>{formatDate(user.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* 페이지네이션 */}
      <Pagination aria-label="페이지 이동">
        <Pagination.Summary>
          {page + 1} / {Math.max(1, Math.ceil(totalItems / rowsPerPage))}
        </Pagination.Summary>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous
              isDisabled={page <= 0}
              onPress={() => handleChangePage(null, page - 1)}
            >
              이전
            </Pagination.Previous>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Next
              isDisabled={page + 1 >= Math.ceil(totalItems / rowsPerPage)}
              onPress={() => handleChangePage(null, page + 1)}
            >
              다음
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
        <div className="flex items-center gap-2">
          <Select
            aria-label="행 수"
            selectedKey={String(rowsPerPage ?? "")}
            isDisabled={undefined}
            onSelectionChange={(key) =>
              handleChangeRowsPerPage({
                target: { value: String(key ?? "") },
              } as React.ChangeEvent<HTMLSelectElement>)
            }
          >
            <HeroSelectLabel>행 수 </HeroSelectLabel>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {[10, 20, 50].map((size) => (
                  <ListBox.Item
                    key={size}
                    id={String(size)}
                    textValue={String(size)}
                  >
                    {size}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </Pagination>
      {/* 사용자 상세 정보 모달 */}
      {!!userDetail && (
        <UserDetailModal
          open={userDetailModalOpen}
          onClose={handleCloseUserDetailModal}
          userId={selectedUserId}
          userDetail={userDetail}
          loading={loadingUserDetail}
          error={userDetailError}
          onRefresh={() => {
            // 데이터 새로고침
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};

export default VerifiedUsersPanel;
