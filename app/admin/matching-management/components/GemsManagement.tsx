'use client';
import { Button, Spinner, Chip, Modal, TextField, Label, Input, TextArea } from '@heroui/react';
import React, { useState } from 'react';
import { Search as SearchIcon, Plus as AddIcon, Minus as RemoveIcon, Diamond as DiamondIcon } from 'lucide-react';
import { UserSearchResult } from '../types';
import AdminService from '@/app/services/admin';
import { MAX_GEM_GRANT } from '@/app/admin/constants/gem-limits';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
interface GemsManagementProps {
    searchTerm: string;
    searchLoading: boolean;
    error: string | null;
    searchResults: UserSearchResult[];
    selectedUser: UserSearchResult | null;
    setSearchTerm: (term: string) => void;
    searchUsers: () => void;
    handleUserSelect: (user: UserSearchResult) => void;
}
interface GemsInfo {
    userId: string;
    gemBalance: number;
    totalCharged: number;
    totalConsumed: number;
    lastTransaction: string;
}
const GemsManagement: React.FC<GemsManagementProps> = ({ searchTerm, searchLoading, error, searchResults, selectedUser, setSearchTerm, searchUsers, handleUserSelect }) => {
    const confirm = useConfirm();
    // 구슬 관련 상태
    const [gemsInfo, setGemsInfo] = useState<GemsInfo | null>(null);
    const [gemsLoading, setGemsLoading] = useState(false);
    const [gemsError, setGemsError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionResult, setActionResult] = useState<string | null>(null);
    // 구슬 액션 관련 상태
    const [gemsCount, setGemsCount] = useState(1);
    const [overLimitDialogOpen, setOverLimitDialogOpen] = useState(false);
    const [overLimitReason, setOverLimitReason] = useState('');
    // 구슬 정보 조회
    const fetchGemsInfo = async (userId: string) => {
        setGemsLoading(true);
        setGemsError(null);
        setGemsInfo(null);
        try {
            const response = await AdminService.userAppearance.getUserGems(userId);
            ;
            setGemsInfo(response);
        }
        catch (err: any) {
            const errorMessage = err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                '구슬 정보 조회 중 오류가 발생했습니다.';
            setGemsError(errorMessage);
        }
        finally {
            setGemsLoading(false);
        }
    };
    // 구슬 추가
    const addGems = async () => {
        if (!selectedUser)
            return;
        if (gemsCount > MAX_GEM_GRANT) {
            setOverLimitReason('');
            setOverLimitDialogOpen(true);
            return;
        }
        const ok = await confirm({
            title: '구슬 추가',
            message: `${selectedUser.name}님에게 구슬 ${gemsCount}개를 추가합니다.`,
            confirmText: '추가',
        });
        if (!ok)
            return;
        await executeAddGems();
    };
    const executeAddGems = async (reason?: string) => {
        if (!selectedUser)
            return;
        setActionLoading(true);
        setGemsError(null);
        setActionResult(null);
        try {
            const response = await AdminService.userAppearance.addUserGems(selectedUser.id, gemsCount, reason);
            ;
            setActionResult(reason
                ? `성공적으로 ${gemsCount}개의 구슬을 추가했습니다. [상한 초과 사유: ${reason}]`
                : `성공적으로 ${gemsCount}개의 구슬을 추가했습니다.`);
            await fetchGemsInfo(selectedUser.id);
            setGemsCount(1);
        }
        catch (err: any) {
            const errorMessage = err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                '구슬 추가 중 오류가 발생했습니다.';
            setGemsError(errorMessage);
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleOverLimitConfirm = async () => {
        setOverLimitDialogOpen(false);
        await executeAddGems(overLimitReason);
    };
    // 구슬 제거
    const removeGems = async () => {
        if (!selectedUser)
            return;
        const ok = await confirm({
            title: '구슬 제거',
            message: `${selectedUser.name}님의 구슬 ${gemsCount}개를 제거합니다.`,
            confirmText: '제거',
            severity: 'error',
        });
        if (!ok)
            return;
        setActionLoading(true);
        setGemsError(null);
        setActionResult(null);
        try {
            const response = await AdminService.userAppearance.removeUserGems(selectedUser.id, gemsCount);
            ;
            setActionResult(`성공적으로 ${gemsCount}개의 구슬을 제거했습니다.`);
            // 구슬 정보 새로고침
            await fetchGemsInfo(selectedUser.id);
            setGemsCount(1);
        }
        catch (err: any) {
            const errorMessage = err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                '구슬 제거 중 오류가 발생했습니다.';
            setGemsError(errorMessage);
        }
        finally {
            setActionLoading(false);
        }
    };
    // 사용자 선택 핸들러
    const handleUserSelectWithGems = async (user: UserSearchResult) => {
        setActionResult(null);
        handleUserSelect(user);
        await fetchGemsInfo(user.id);
    };
    return (<div>
      {/* 사용자 검색 섹션 */}
      <section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold">
          구슬 관리
        </h2>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <TextField className="mb-4"><Label>{"사용자 이름 검색"}</Label><Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && searchUsers()}></Input></TextField>
          <Button onPress={searchUsers} isDisabled={searchLoading} variant="primary" style={{ minWidth: 100 }}>
            {searchLoading ? <Spinner size="sm"></Spinner> : '검색'}
          </Button>
        </div>

        {/* 에러 메시지 */}
        {error && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
            {error}
          </aside>)}

        {/* 검색 결과 */}
        {searchResults.length > 0 && (<div style={{ marginTop: 16 }}>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr className="border-b">
                  <th scope="col" className="border-b px-4 py-3">프로필</th>
                  <th scope="col" className="border-b px-4 py-3">이름</th>
                  <th scope="col" className="border-b px-4 py-3">전화번호</th>
                  <th scope="col" className="border-b px-4 py-3">성별</th>
                  <th scope="col" className="border-b px-4 py-3">대학교</th>
                  <th scope="col" className="border-b px-4 py-3">외모등급</th>
                  <th scope="col" className="border-b px-4 py-3">액션</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((user) => (<tr key={user.id} style={{ cursor: 'pointer' }} className="border-b">
                    <td className="border-b px-4 py-3">
                      <img src={user.profileImageUrl} alt="프로필" className="h-9 w-9 rounded-full object-cover"></img>
                    </td>
                    <td className="border-b px-4 py-3">{user.name}</td>
                    <td className="border-b px-4 py-3">{user.phoneNumber}</td>
                    <td className="border-b px-4 py-3">
                      <Chip size="sm">{user.gender === 'MALE' ? '남성' : '여성'}</Chip>
                    </td>
                    <td className="border-b px-4 py-3">{typeof user.university === 'object' ? user.university?.name || '-' : user.university || '-'}</td>
                    <td className="border-b px-4 py-3">
                      <Chip size="sm">{user.appearanceGrade || 'UNKNOWN'}</Chip>
                    </td>
                    <td className="border-b px-4 py-3">
                      <Button onPress={() => handleUserSelectWithGems(user)} isDisabled={gemsLoading} variant="secondary">
                        선택
                      </Button>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </section>

      {/* 선택된 사용자의 구슬 정보 */}
      {selectedUser && (<section style={{ padding: 24 }} className="rounded-xl border bg-white p-4">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="text-lg font-semibold">
            <DiamondIcon></DiamondIcon>
            {selectedUser.name}님의 구슬 정보
          </h2>

          {gemsLoading && (<div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <Spinner size="sm"></Spinner>
            </div>)}

          {gemsError && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
              {gemsError}
            </aside>)}

          {actionResult && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
              {actionResult}
            </aside>)}

          {gemsInfo && (<div>
              {/* 구슬 정보 표시 */}
              <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
                <section style={{ padding: 16, textAlign: 'center' }} className="rounded-xl border bg-white p-4">
                  <p>
                    {gemsInfo.gemBalance}
                  </p>
                  <p>
                    현재 구슬 보유량
                  </p>
                </section>
                <section style={{ padding: 16, textAlign: 'center' }} className="rounded-xl border bg-white p-4">
                  <h2 className="text-lg font-semibold">
                    {gemsInfo.totalCharged}
                  </h2>
                  <p>
                    총 충전량
                  </p>
                </section>
                <section style={{ padding: 16, textAlign: 'center' }} className="rounded-xl border bg-white p-4">
                  <h2 className="text-lg font-semibold">
                    {gemsInfo.totalConsumed}
                  </h2>
                  <p>
                    총 소모량
                  </p>
                </section>
                <section style={{ padding: 16, textAlign: 'center' }} className="rounded-xl border bg-white p-4">
                  <p>
                    {gemsInfo.lastTransaction || '-'}
                  </p>
                  <p>
                    마지막 거래일
                  </p>
                </section>
              </div>

              {/* 구슬 관리 액션 */}
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
                <TextField className="mb-4"><Label>{"구슬 개수"}</Label><Input type="number" value={gemsCount} onChange={(e) => setGemsCount(Math.max(1, parseInt(e.target.value) || 1))} {...{ min: 1, max: 1000 }}></Input></TextField>

                <Button onPress={addGems} isDisabled={actionLoading} variant="primary" style={{ minWidth: 120 }}>{<AddIcon></AddIcon>}
                  {actionLoading ? <Spinner size="sm"></Spinner> : '구슬 추가'}
                </Button>

                <Button onPress={removeGems} isDisabled={actionLoading || !gemsInfo || gemsInfo.gemBalance === 0} variant="secondary" style={{ minWidth: 120 }}>{<RemoveIcon></RemoveIcon>}
                  {actionLoading ? <Spinner size="sm"></Spinner> : '구슬 제거'}
                </Button>
              </div>
            </div>)}
        </section>)}

      <Modal.Backdrop isOpen={overLimitDialogOpen} isDismissable={!actionLoading} isKeyboardDismissDisabled={actionLoading} onOpenChange={next => {
            if (!next && !actionLoading)
                (() => setOverLimitDialogOpen(false))();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 444, minWidth: 0 }}>
        <Modal.Heading>구슬 지급 확인</Modal.Heading>
        <Modal.Body>
          <p style={{ marginBottom: 16 }}>
            {MAX_GEM_GRANT}개 초과의 구슬을 지급하려고 합니다. 사유를 입력해주세요.
          </p>
          <TextField className="mb-4"><Label>{"지급 사유"}</Label><TextArea value={overLimitReason} onChange={(e) => setOverLimitReason(e.target.value)} rows={3} autoFocus></TextArea></TextField>
        </Modal.Body>
        <Modal.Footer>
          <Button onPress={() => setOverLimitDialogOpen(false)} isDisabled={actionLoading} variant="tertiary">취소</Button>
          <Button onPress={handleOverLimitConfirm} isDisabled={!overLimitReason.trim()} variant="primary">
            확인
          </Button>
        </Modal.Footer>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>
    </div>);
};
export default GemsManagement;
