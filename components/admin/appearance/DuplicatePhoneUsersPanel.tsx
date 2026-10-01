"use client";
import { Button as HeroActionButton } from "@heroui/react";
import { Alert, Avatar, Button, Card, Chip, Spinner } from "@heroui/react";

import { Phone, RefreshCw, X } from "lucide-react";

import { useState, useEffect } from "react";

import AdminService from "@/app/services/admin";
import UserDetailModal from "@/components/admin/appearance/UserDetailModal";

interface DuplicatePhoneUser {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  refreshToken: string;
}

export default function DuplicatePhoneUsersPanel() {
  const [users, setUsers] = useState<DuplicatePhoneUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);

  // 중복 휴대폰 번호 사용자 조회
  const fetchDuplicatePhoneUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("중복 휴대폰 번호 사용자 조회 시작");
      const response =
        await AdminService.userAppearance.getDuplicatePhoneUsers();
      console.log("중복 휴대폰 번호 사용자 조회 응답:", response);

      // API 응답 구조에 맞게 데이터 설정
      if (response && response.users) {
        setUsers(response.users);
        setTotalCount(response.totalCount || response.users.length);
      } else {
        setUsers([]);
        setTotalCount(0);
      }
    } catch (error: any) {
      console.error("중복 휴대폰 번호 사용자 조회 중 오류:", error);
      setError(
        error.message || "중복 휴대폰 번호 사용자 조회 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchDuplicatePhoneUsers();
  }, []);

  // 새로고침 핸들러
  const handleRefresh = () => {
    fetchDuplicatePhoneUsers();
  };

  // 사용자 클릭 핸들러
  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserDetailModal(true);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setShowUserDetailModal(false);
    setSelectedUserId(null);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 4 }}
          className={"text-lg font-semibold text-neutral-900"}
        >
          <Phone />
          중복 휴대폰 번호 사용자
        </div>
        <Button
          onClick={handleRefresh}
          variant={"secondary"}
          isDisabled={loading}
          size={"md"}
          className="rounded-xl"
        >
          {<RefreshCw />}새로고침
        </Button>
      </div>
      {/* 통계 정보 */}
      <Card style={{ marginBottom: 12 }}>
        <Card.Content>
          <div className={"text-lg font-semibold text-neutral-900"}>
            중복 휴대폰 번호 통계
          </div>
          <div className={"text-sm text-neutral-700"}>
            총 <strong>{totalCount}명</strong>의 중복 휴대폰 번호 사용자가
            발견되었습니다.
          </div>
        </Card.Content>
      </Card>
      {/* 에러 표시 */}
      {error && (
        <Alert style={{ marginBottom: 12 }} status="danger" role="alert">
          <Alert.Content>
            {error}
            <Button
              onClick={handleRefresh}
              style={{ marginLeft: 8 }}
              variant={"ghost"}
              isDisabled={undefined}
              size={"sm"}
              className="rounded-xl"
            >
              다시 시도
            </Button>
          </Alert.Content>
        </Alert>
      )}
      {/* 로딩 상태 */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
          <Spinner aria-label="불러오는 중" size="sm" />
        </div>
      )}
      {/* 사용자 목록 테이블 */}
      {!loading && !error && (
        <div className={"overflow-x-auto"}>
          <table
            className={
              "w-full text-sm text-left [&_td]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
            }
          >
            <thead>
              <tr>
                <th>사용자</th>
                <th>이메일</th>
                <th>휴대폰 번호</th>
                <th>가입일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ paddingTop: 16, paddingBottom: 16 }}>
                    <div className={"text-sm text-neutral-700"}>
                      중복 휴대폰 번호로 가입한 사용자가 없습니다.
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} style={{ cursor: "pointer" }}>
                    <td>
                      <HeroActionButton
                        variant="ghost"
                        className="h-auto justify-start whitespace-normal p-0"
                        onClick={() => handleUserClick(user.id)}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Avatar style={{ backgroundColor: "#b45309" }}>
                            <Avatar.Image src={undefined} alt={"프로필"} />
                            <Avatar.Fallback>
                              {user.name
                                ? user.name.charAt(0).toUpperCase()
                                : "?"}
                            </Avatar.Fallback>
                          </Avatar>
                          <div className={"text-sm text-neutral-700"}>
                            {user.name || "이름 없음"}
                          </div>
                        </div>
                      </HeroActionButton>
                    </td>
                    <td>
                      <div className={"text-sm text-neutral-700"}>
                        {user.email || "-"}
                      </div>
                    </td>
                    <td>
                      <div className={"text-sm text-neutral-700"}>
                        {user.phoneNumber || "-"}
                      </div>
                    </td>
                    <td>
                      <div className={"text-sm text-neutral-700"}>
                        {user.createdAt || "-"}
                      </div>
                    </td>
                    <td>
                      <Chip size={"sm"} variant={"soft"}>
                        {"중복 휴대폰"}
                      </Chip>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* 사용자 상세 정보 모달 */}
      {showUserDetailModal && selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          open={showUserDetailModal}
          onClose={handleCloseModal}
          userDetail={{} as any}
          loading={false}
          error={null}
        />
      )}
    </div>
  );
}
