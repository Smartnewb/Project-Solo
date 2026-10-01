'use client';

import { useState } from 'react';
import { Avatar, Button, Chip, Description, Input, Label, Modal, Radio, RadioGroup, Spinner, TextArea, TextField } from '@heroui/react';
import { Search, X, Landmark } from 'lucide-react';
import AdminService from '@/app/services/admin';
import type {
  RefundUserSearchResult,
  EligibleChatRoom,
  RefundReasonCode,
  RefundPreviewResponse,
} from '@/types/admin';
import { safeToLocaleString } from '@/app/utils/formatters';

const REFUND_REASONS = [
  {
    code: 'A' as RefundReasonCode,
    text: '첫 메시지를 보냈는데 답장이 없었어요',
  },
  {
    code: 'B' as RefundReasonCode,
    text: '무슨 말을 해야할지 몰라서 메시지를 못 보냈어요',
  },
  {
    code: 'C' as RefundReasonCode,
    text: '메시지를 주고 받았는데 대화가 어색하게 끊겼어요',
  },
  {
    code: 'D' as RefundReasonCode,
    text: '프로필을 다시 보니 생각보다 관심이 안갔어요',
  },
];

export default function ChatRefundTab() {
  const [searchName, setSearchName] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [users, setUsers] = useState<RefundUserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<RefundUserSearchResult | null>(null);

  const [eligibleRooms, setEligibleRooms] = useState<EligibleChatRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState<EligibleChatRoom | null>(null);
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<RefundReasonCode>('A');

  const [previewData, setPreviewData] = useState<RefundPreviewResponse | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [smsContent, setSmsContent] = useState('');

  const [processing, setProcessing] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const locked = searchLoading || roomsLoading || previewLoading || processing || reasonModalOpen || previewModalOpen;
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSearch = async () => {
    if (locked) return;
    if (!searchName.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    setSearchLoading(true);
    setError('');
    setUsers([]);
    setSelectedUser(null);
    setEligibleRooms([]);

    try {
      const response = await AdminService.chatRefund.searchUsers(searchName.trim());
      setUsers(response.users);

      if (response.users.length === 0) {
        setError('검색 결과가 없습니다.');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || '사용자 검색에 실패했습니다.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUserSelect = async (user: RefundUserSearchResult) => {
    if (locked) return;
    setSelectedUser(user);
    setRoomsLoading(true);
    setError('');
    setEligibleRooms([]);

    try {
      const response = await AdminService.chatRefund.getEligibleRooms(user.userId);
      setEligibleRooms(response.eligibleRooms);

      if (response.eligibleRooms.length === 0) {
        setError('환불 가능한 채팅방이 없습니다.');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || '채팅방 목록을 불러오는데 실패했습니다.');
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleRefundClick = (room: EligibleChatRoom) => {
    if (locked) return;
    setSelectedRoom(room);
    setSelectedReason('A');
    setReasonModalOpen(true);
  };

  const handleReasonSubmit = async () => {
    if (!selectedUser || !selectedRoom || previewLoading) return;
    setPreviewLoading(true);

    setReasonModalOpen(false);
    setError('');

    try {
      const preview = await AdminService.chatRefund.previewRefund({
        userId: selectedUser.userId,
        chatRoomId: selectedRoom.chatRoomId,
        refundReasonCode: selectedReason,
      });

      setPreviewData(preview);
      setSmsContent(preview.smsContent);
      setPreviewModalOpen(true);
    } catch (error: any) {
      setError(error.response?.data?.message || '환불 미리보기에 실패했습니다.');
    } finally { setPreviewLoading(false); }
  };

  const handleProcessRefund = async () => {
    if (!selectedUser || !selectedRoom || !previewData || processing) return;

    setProcessing(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await AdminService.chatRefund.processRefund({
        userId: selectedUser.userId,
        chatRoomId: selectedRoom.chatRoomId,
        refundReasonCode: selectedReason,
        smsContent: smsContent,
      });

      setPreviewModalOpen(false);

      if (result.smsError) {
        setSuccessMessage(`환불 처리는 완료되었으나 SMS 발송에 실패했습니다: ${result.smsError}`);
      } else {
        setSuccessMessage('환불이 성공적으로 처리되었습니다.');
      }

      setEligibleRooms(prevRooms =>
        prevRooms.filter(room => room.chatRoomId !== selectedRoom.chatRoomId)
      );

      setSelectedRoom(null);
      setPreviewData(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '환불 처리에 실패했습니다.';
      setError(errorMessage);

      if (error.response?.status === 409) {
        setPreviewModalOpen(false);
        setPreviewData(null);
        setEligibleRooms(prevRooms =>
          prevRooms.filter(room => room.chatRoomId !== selectedRoom.chatRoomId)
        );
      }
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return safeToLocaleString(dateString);
  };

  return <div className="space-y-4">
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-red-200 p-3"><p>{error}</p><Button variant="tertiary" isIconOnly aria-label="오류 닫기" onPress={() => setError('')}><X size={16} /></Button></div>}
    {successMessage && <div role="status" className="flex items-center justify-between gap-3 rounded-lg border p-3"><p>{successMessage}</p><Button variant="tertiary" isIconOnly aria-label="결과 닫기" onPress={() => setSuccessMessage('')}><X size={16} /></Button></div>}
    <form className="flex items-end gap-3 rounded-xl border bg-white p-4" onSubmit={e => { e.preventDefault(); void handleSearch(); }}>
      <TextField className="flex-1" isDisabled={locked}><Label>사용자 이름</Label><Input value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="검색할 사용자 이름을 입력하세요" /></TextField>
      <Button type="submit" isDisabled={locked}>{searchLoading ? <Spinner size="sm" /> : <Search size={16} />}검색</Button>
    </form>
    {previewLoading && <p role="status" className="flex items-center gap-2"><Spinner size="sm" />환불 미리보기 불러오는 중...</p>}
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="min-w-0 space-y-3"><h2 className="text-lg font-semibold">검색 결과</h2><div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm"><caption className="sr-only">환불 대상 사용자 검색 결과</caption><thead className="bg-gray-50"><tr>{['이름', '전화번호', '작업'].map(title => <th key={title} scope="col" className="border-b p-3 text-left">{title}</th>)}</tr></thead>
          <tbody>{users.length === 0 ? <tr><td colSpan={3} className="p-6 text-center text-gray-600">검색된 사용자가 없습니다.</td></tr> : users.map(user => <tr key={user.userId} className={`border-b last:border-0 ${selectedUser?.userId === user.userId ? 'bg-gray-50' : ''}`}>
            <th scope="row" className="p-3 text-left font-normal">{user.name}</th><td className="p-3">{user.phoneNumber}</td><td className="p-3"><Button size="sm" variant="secondary" aria-label={`${user.name} 선택`} aria-pressed={selectedUser?.userId === user.userId} isDisabled={locked} onPress={() => void handleUserSelect(user)}>{roomsLoading && selectedUser?.userId === user.userId ? <Spinner size="sm" /> : '선택'}</Button></td>
          </tr>)}</tbody>
        </table>
      </div></section>
      <section className="min-w-0 space-y-3"><h2 className="text-lg font-semibold">환불 가능 채팅방{selectedUser && ` - ${selectedUser.name}`}</h2><div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm"><caption className="sr-only">선택 사용자의 환불 가능 채팅방</caption><thead className="bg-gray-50"><tr>{['상대방', '대학교', '메시지 수', '생성일', '작업'].map(title => <th key={title} scope="col" className="whitespace-nowrap border-b p-3 text-left">{title}</th>)}</tr></thead>
          <tbody>{!selectedUser || eligibleRooms.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-gray-600">{!selectedUser ? '사용자를 먼저 선택해주세요.' : roomsLoading ? '조회 중...' : '환불 가능한 채팅방이 없습니다.'}</td></tr> : eligibleRooms.map(room => <tr key={room.chatRoomId} className="border-b last:border-0">
            <th scope="row" className="p-3 text-left font-normal"><div className="flex items-center gap-2"><Avatar size="sm"><Avatar.Image src={room.partnerInfo.profileImageUrl} alt="" /><Avatar.Fallback>{room.partnerInfo.name.slice(0,1)}</Avatar.Fallback></Avatar>{room.partnerInfo.name}</div></th>
            <td className="p-3">{room.partnerInfo.university}</td><td className="p-3"><Chip size="sm" variant="soft">{room.totalMessageCount}개</Chip></td><td className="whitespace-nowrap p-3">{formatDate(room.createdAt)}</td><td className="p-3"><Button size="sm" onPress={() => handleRefundClick(room)} isDisabled={locked} aria-label={`${room.partnerInfo.name} 채팅방 환불하기`}><Landmark size={16} />환불하기</Button></td>
          </tr>)}</tbody>
        </table>
      </div></section>
    </div>
    <Modal.Backdrop isOpen={reasonModalOpen} onOpenChange={setReasonModalOpen}>
      <Modal.Container size="md"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}><Modal.Header className="flex items-center justify-between flex-row flex-wrap gap-3"><Modal.Heading>환불 사유 선택</Modal.Heading><Button isIconOnly variant="tertiary" aria-label="환불 사유 닫기" onPress={() => setReasonModalOpen(false)}><X size={18} /></Button></Modal.Header>
        <Modal.Body><RadioGroup value={selectedReason} onChange={value => setSelectedReason(value as RefundReasonCode)}><Label>환불 사유를 선택해주세요</Label>{REFUND_REASONS.map(reason => <Radio key={reason.code} value={reason.code}><Radio.Content><Radio.Control><Radio.Indicator /></Radio.Control><Label>{reason.text}</Label></Radio.Content></Radio>)}</RadioGroup></Modal.Body>
        <Modal.Footer><Button variant="secondary" onPress={() => setReasonModalOpen(false)}>취소</Button><Button onPress={() => void handleReasonSubmit()}>다음</Button></Modal.Footer>
      </Modal.Dialog></Modal.Container>
    </Modal.Backdrop>
    <Modal.Backdrop isOpen={previewModalOpen} onOpenChange={open => !processing && setPreviewModalOpen(open)} isDismissable={!processing} isKeyboardDismissDisabled={processing}>
      <Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 900, minWidth: 0 }}><Modal.Header className="flex items-center justify-between flex-row flex-wrap gap-3"><Modal.Heading>SMS 미리보기 및 확인</Modal.Heading><Button isIconOnly variant="tertiary" aria-label="환불 미리보기 닫기" isDisabled={processing} onPress={() => setPreviewModalOpen(false)}><X size={18} /></Button></Modal.Header>
        <Modal.Body className="space-y-4">{previewData && <>
          <section className="space-y-2 rounded-lg bg-gray-50 p-4"><h3 className="font-semibold">환불 정보</h3><dl className="space-y-2 text-sm">{[
            ['사용자', previewData.userName], ['전화번호', previewData.phoneNumber], ['환급 구슬', `${previewData.refundGemAmount}개`], ['사유', previewData.refundReasonText],
          ].map(([title, value]) => <div key={title} className="flex gap-3"><dt className="min-w-20 text-gray-600">{title}</dt><dd>{value}</dd></div>)}</dl></section>
          <TextField isDisabled={processing}><Label>SMS 내용</Label><TextArea value={smsContent} onChange={e => setSmsContent(e.target.value)} rows={4} /><Description>필요시 SMS 내용을 수정할 수 있습니다.</Description></TextField>
          {error && <p role="alert" className="text-red-700">{error}</p>}
        </>}</Modal.Body>
        <Modal.Footer><Button variant="secondary" isDisabled={processing} onPress={() => setPreviewModalOpen(false)}>취소</Button><Button isDisabled={processing} onPress={() => void handleProcessRefund()}>{processing ? <Spinner size="sm" /> : <Landmark size={16} />}{processing ? '처리 중...' : '환불 처리'}</Button></Modal.Footer>
      </Modal.Dialog></Modal.Container>
    </Modal.Backdrop>
  </div>;
}
