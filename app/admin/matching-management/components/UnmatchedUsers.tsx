import { Button, Spinner, TextField, Label, Input, Select, ListBox } from '@heroui/react';
import { RefreshCw as RefreshIcon, ListFilter as FilterListIcon } from 'lucide-react';
import React from 'react';
import { safeFormat } from '@/app/utils/formatters';
import { UnmatchedUser } from '../types';
interface UnmatchedUsersProps {
    unmatchedUsers: UnmatchedUser[];
    unmatchedUsersLoading: boolean;
    unmatchedUsersError: string | null;
    unmatchedUsersTotalCount: number;
    unmatchedUsersPage: number;
    unmatchedUsersLimit: number;
    unmatchedUsersSearchTerm: string;
    unmatchedUsersGenderFilter: string;
    selectedUnmatchedUser: UnmatchedUser | null;
    setUnmatchedUsersSearchTerm: (value: string) => void;
    setUnmatchedUsersGenderFilter: (value: string) => void;
    handleUnmatchedUsersSearch: () => void;
    handleUnmatchedUsersPageChange: (event: unknown, newPage: number) => void;
    handleUnmatchedUsersLimitChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    handleUnmatchedUserSelect: (user: UnmatchedUser) => void;
    processUnmatchedUserMatching: () => void;
    fetchUnmatchedUsers: () => void;
}
const UnmatchedUsers: React.FC<UnmatchedUsersProps> = ({ unmatchedUsers, unmatchedUsersLoading, unmatchedUsersError, unmatchedUsersTotalCount, unmatchedUsersPage, unmatchedUsersLimit, unmatchedUsersSearchTerm, unmatchedUsersGenderFilter, selectedUnmatchedUser, setUnmatchedUsersSearchTerm, setUnmatchedUsersGenderFilter, handleUnmatchedUsersSearch, handleUnmatchedUsersPageChange, handleUnmatchedUsersLimitChange, handleUnmatchedUserSelect, processUnmatchedUserMatching, fetchUnmatchedUsers }) => {
    return (<section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="text-lg font-semibold">
          매칭 대기 사용자 목록
        </h2>
        <span title={"새로고침"}>
          <Button onPress={fetchUnmatchedUsers} isDisabled={unmatchedUsersLoading} variant="tertiary" isIconOnly={true}>
            <RefreshIcon></RefreshIcon>
          </Button>
        </span>
      </div>

      {/* 필터링 영역 */}
      <div style={{ marginBottom: 24 }} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="min-w-0">
          <TextField className="mb-4"><Label>{"이름 검색"}</Label><Input value={unmatchedUsersSearchTerm} onChange={(e) => setUnmatchedUsersSearchTerm(e.target.value)}></Input></TextField>
        </div>
        <div className="min-w-0">
          <div>
            <label>성별</label>
            <Select value={unmatchedUsersGenderFilter} aria-label={"성별"} onChange={(key) => {
            const value = String(key ?? "");
            setUnmatchedUsersGenderFilter(value);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
              <ListBox.Item id={"all"} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
              <ListBox.Item id={"MALE"} textValue={"\uB0A8\uC131"}>남성</ListBox.Item>
              <ListBox.Item id={"FEMALE"} textValue={"\uC5EC\uC131"}>여성</ListBox.Item>
            </ListBox></Select.Popover></Select>
          </div>
        </div>
        <div className="min-w-0">
          <Button fullWidth onPress={handleUnmatchedUsersSearch} isDisabled={unmatchedUsersLoading} variant="primary">{<FilterListIcon></FilterListIcon>}
            필터 적용
          </Button>
        </div>
      </div>

      {unmatchedUsersError && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 24 }}>
          {unmatchedUsersError}
        </aside>)}

      {/* 매칭 대기 사용자 테이블 */}
      {unmatchedUsersLoading ? (<div style={{ display: 'flex', justifyContent: 'center', marginBlock: 32 }}>
          <Spinner size="sm"></Spinner>
        </div>) : (<>
          <div>
            <table style={{ minWidth: 650 }} className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr style={{ backgroundColor: '#f5f5f5' }} className="border-b">
                  <th scope="col" className="border-b px-4 py-3">ID</th>
                  <th scope="col" className="border-b px-4 py-3">이름</th>
                  <th scope="col" className="border-b px-4 py-3">나이/성별</th>
                  <th scope="col" className="border-b px-4 py-3">가입일</th>
                  <th scope="col" className="border-b px-4 py-3">실패 사유</th>
                  <th scope="col" className="border-b px-4 py-3">실패 일시</th>
                  <th scope="col" className="border-b px-4 py-3">액션</th>
                </tr>
              </thead>
              <tbody>
                {unmatchedUsers.length > 0 ? (unmatchedUsers.map((user) => (<tr key={user.id} style={{ cursor: 'pointer' }} className="border-b">
                      <td className="border-b px-4 py-3">{user.id}</td>
                      <td className="border-b px-4 py-3">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <img src={user.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
                          <Button variant="tertiary" onPress={() => handleUnmatchedUserSelect(user)}>{user.name}</Button>
                        </div>
                      </td>
                      <td className="border-b px-4 py-3">{user.age}세 / {user.gender === 'MALE' ? '남성' : '여성'}</td>
                      <td className="border-b px-4 py-3">
                        {user.joinedAt ? safeFormat(user.joinedAt, 'yyyy-MM-dd') :
                    user.createdAt ? safeFormat(user.createdAt, 'yyyy-MM-dd') : '정보 없음'}
                      </td>
                      <td className="border-b px-4 py-3">
                        {user.failureReason || '정보 없음'}
                      </td>
                      <td className="border-b px-4 py-3">
                        {user.failureDate ? safeFormat(user.failureDate, 'yyyy-MM-dd HH:mm') : '없음'}
                      </td>
                      <td className="border-b px-4 py-3">
                        <Button onClick={(e) => {
                    e.stopPropagation();
                    handleUnmatchedUserSelect(user);
                    processUnmatchedUserMatching();
                }} variant="secondary">
                          매칭 실행
                        </Button>
                      </td>
                    </tr>))) : (<tr className="border-b">
                    <td colSpan={8} className="border-b px-4 py-3">
                      매칭 대기 중인 사용자가 없습니다.
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          <div className="flex items-center justify-end gap-3 border-t p-4"><div><Select aria-label="페이지당 행 수" value={unmatchedUsersLimit} onChange={(key) => {
                const value = String(key ?? "");
                (handleUnmatchedUsersLimitChange)({ target: { value: value }, currentTarget: { value: value } } as never);
            }} className="min-w-[120px]"><Label>페이지당 행 수</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={5} textValue={"5"}>5</ListBox.Item><ListBox.Item id={10} textValue={"10"}>10</ListBox.Item><ListBox.Item id={25} textValue={"25"}>25</ListBox.Item><ListBox.Item id={50} textValue={"50"}>50</ListBox.Item></ListBox></Select.Popover></Select></div><Button variant="secondary" isDisabled={unmatchedUsersPage - 1 <= 0} onPress={() => ((_, newPage) => handleUnmatchedUsersPageChange(_, newPage + 1))(null, unmatchedUsersPage - 1 - 1)}>이전</Button><span>{unmatchedUsersPage - 1 + 1} 페이지 / {unmatchedUsersTotalCount}개</span><Button variant="secondary" isDisabled={(unmatchedUsersPage - 1 + 1) * unmatchedUsersLimit >= unmatchedUsersTotalCount} onPress={() => ((_, newPage) => handleUnmatchedUsersPageChange(_, newPage + 1))(null, unmatchedUsersPage - 1 + 1)}>다음</Button></div>
        </>)}


    </section>);
};
export default UnmatchedUsers;
