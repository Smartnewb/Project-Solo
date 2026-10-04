"use client";
import { useEffect, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { useCountry } from "@/contexts/CountryContext";
import SanctionNoticePanel from "./SanctionNoticePanel";
export type SuspendDurationDays = 3 | 7 | 14 | 30;
interface Props { open: boolean; onClose: () => void; userId: string; isSuspended: boolean; userName?: string; onSuccess?: (message: string) => void; }
export default function AccountStatusModal({ open, onClose, userId, isSuspended, userName, onSuccess }: Props) {
 const [busy, setBusy] = useState(false);
 const { country } = useCountry();
 useEffect(() => { setBusy(false); }, [open, userId, country]);
 const close = () => { if (!busy) onClose(); };
 return <Modal.Backdrop isOpen={open} onOpenChange={value => { if (!value) close(); }} isDismissable={!busy} isKeyboardDismissDisabled={busy}>
  <Modal.Container size="lg" scroll="inside" className="w-full"><Modal.Dialog style={{ width: "100%", maxWidth: "48rem", minWidth: 0 }}>
   <Modal.Header><Modal.Heading>제재·환불 안내</Modal.Heading></Modal.Header>
   <Modal.Body>{open && <SanctionNoticePanel key={`${country}:${userId}`} userId={userId} country={country} userName={userName} isSuspended={isSuspended} onBusyChange={setBusy} onChanged={onSuccess} onLater={close} />}</Modal.Body>
   <Modal.Footer><Button variant="secondary" isDisabled={busy} onPress={close}>닫기</Button></Modal.Footer>
  </Modal.Dialog></Modal.Container>
 </Modal.Backdrop>;
}
