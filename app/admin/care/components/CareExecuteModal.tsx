'use client';

import { useState } from 'react';
import { Avatar, Button, Description, Label, Modal, Radio, RadioGroup, Spinner, TextArea, TextField } from '@heroui/react';
import { ArrowRight, X } from 'lucide-react';
import type { CareTarget, CarePartner } from '@/app/services/admin/care';
import { calculateAge } from '@/app/utils/formatters';

type CareAction = 'like' | 'mutual_like' | 'open_chat';

interface CareExecuteModalProps {
	open: boolean;
	onClose: () => void;
	target: CareTarget | null;
	partner: CarePartner | null;
	onExecute: (action: CareAction, letterContent: string) => Promise<void>;
	executing: boolean;
	executeError: string | null;
}

const ACTION_OPTIONS: { value: CareAction; label: string; description: string }[] = [
	{
		value: 'like',
		label: '좋아요',
		description: '단방향 좋아요 전송. 상대 수락 필요.',
	},
	{
		value: 'mutual_like',
		label: '상호좋아요',
		description: '양방향 매칭 즉시 성립. 수락 불필요.',
	},
	{
		value: 'open_chat',
		label: '채팅방 개설',
		description: '매칭 + 채팅방 생성 + 편지 전달. 즉시 대화 가능.',
	},
];

export default function CareExecuteModal({
	open,
	onClose,
	target,
	partner,
	onExecute,
	executing,
	executeError,
}: CareExecuteModalProps) {
	const [step, setStep] = useState<1 | 2>(1);
	const [selectedAction, setSelectedAction] = useState<CareAction | null>(null);
	const [letterContent, setLetterContent] = useState('');

  const handleClose = () => {
    if (executing) return;
    setStep(1); setSelectedAction(null); setLetterContent(''); onClose();
  };
  const handleExecute = async () => {
    if (!selectedAction || executing || !letterContent.trim() || letterContent.length > 500) return;
    await onExecute(selectedAction, letterContent);
  };

	if (!target || !partner) return null;

  const targetAge = calculateAge(target.birthday);
  return <Modal.Backdrop isOpen={open} onOpenChange={isOpen => !isOpen && handleClose()} isDismissable={!executing} isKeyboardDismissDisabled={executing}>
    <Modal.Container size="md"><Modal.Dialog><Modal.Header className="flex items-center justify-between"><Modal.Heading>케어 실행</Modal.Heading><Button variant="tertiary" isIconOnly aria-label="케어 실행 닫기" onPress={handleClose} isDisabled={executing}><X size={18} /></Button></Modal.Header>
      <Modal.Body className="space-y-4">
        <p className="text-xs text-gray-600" role="status">{step} / 2 단계 · {step === 1 ? '액션 선택' : '실행 확인'}</p>
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
          <Avatar size="sm"><Avatar.Image src={target.profile_image_url || '/default-avatar.png'} alt="" /><Avatar.Fallback>{target.name.slice(0,1)}</Avatar.Fallback></Avatar><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{target.name}</p><p className="text-xs text-gray-600">{target.university_name} / {targetAge}세</p></div><ArrowRight size={18} aria-hidden="true" />
          <Avatar size="sm"><Avatar.Image src={partner.profileImageUrl || '/default-avatar.png'} alt="" /><Avatar.Fallback>{partner.name.slice(0,1)}</Avatar.Fallback></Avatar><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{partner.name}</p><p className="text-xs text-gray-600">{partner.universityName} / {partner.age}세</p></div>
        </div>
        {step === 1 ? <RadioGroup value={selectedAction ?? ''} onChange={value => setSelectedAction(value as CareAction)}><Label>액션 선택</Label>{ACTION_OPTIONS.map(option => <Radio key={option.value} value={option.value} className="rounded-lg border border-border p-3"><Radio.Content><Radio.Control><Radio.Indicator /></Radio.Control><Label>{option.label}</Label></Radio.Content><Description>{option.description}</Description></Radio>)}</RadioGroup> : <>
          <dl className="space-y-2 rounded-lg border border-border p-3 text-sm"><div><dt className="inline text-gray-600">대상: </dt><dd className="inline">{target.name} ({target.university_name}, {targetAge}세)</dd></div><div><dt className="inline text-gray-600">파트너: </dt><dd className="inline">{partner.name} ({partner.universityName}, {partner.age}세)</dd></div><div><dt className="inline text-gray-600">액션: </dt><dd className="inline font-semibold">{ACTION_OPTIONS.find(option => option.value === selectedAction)?.label}</dd></div></dl>
          <TextField value={letterContent} onChange={value => { if (value.length <= 500) setLetterContent(value); }} isDisabled={executing} isRequired><Label>편지 내용</Label><TextArea rows={3} maxLength={500} placeholder="편지 내용을 입력하세요..." /><Description>{letterContent.length} / 500</Description></TextField>
          {executeError && <p role="alert" className="text-sm text-danger">{executeError}</p>}
        </>}
      </Modal.Body><Modal.Footer>{step === 1 ? <><Button variant="secondary" onPress={handleClose}>취소</Button><Button onPress={() => selectedAction && setStep(2)} isDisabled={!selectedAction}>다음</Button></> : <><Button variant="secondary" onPress={() => setStep(1)} isDisabled={executing}>이전</Button><Button onPress={handleExecute} isDisabled={executing || !letterContent.trim()}>{executing && <Spinner size="sm" />}케어 실행</Button></>}</Modal.Footer>
    </Modal.Dialog></Modal.Container>
  </Modal.Backdrop>;
}
