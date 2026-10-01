"use client";
import { useEffect, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { Check } from "lucide-react";
import { useAdminSession } from "@/shared/contexts/admin-session-context";
type Country = "kr" | "jp";
const countries = [
	{ code: "kr" as const, name: "대한민국", description: "한국 사용자 데이터" },
	{ code: "jp" as const, name: "日本", description: "일본 사용자 데이터" },
];
export function AdminCountrySelectorModal({
	open,
	onClose,
}: { open: boolean; onClose: () => void }) {
	const { session, changeCountry } = useAdminSession();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		if (open) setError(null);
	}, [open]);
	async function select(code: Country) {
		if (code === session?.selectedCountry) {
			onClose();
			return;
		}
		setBusy(true);
		setError(null);
		try {
			await changeCountry(code);
			onClose();
			// eslint-disable-next-line no-restricted-properties -- CountryProvider must reinitialize after the session country changes.
			window.location.reload();
		} catch {
			setError("국가 변경에 실패했습니다. 다시 시도하세요.");
		} finally {
			setBusy(false);
		}
	}
	return (
		<Modal.Backdrop
			isOpen={open}
			onOpenChange={(next) => {
				if (!next && !busy) onClose();
			}}
			isDismissable={!busy}
			isKeyboardDismissDisabled={busy}
		>
			<Modal.Container size="sm">
				<Modal.Dialog>
					<Modal.Header>
						<Modal.Heading>운영 국가 선택</Modal.Heading>
						<p className="text-sm text-muted">
							선택한 국가의 데이터만 조회/수정됩니다
						</p>
					</Modal.Header>
					<Modal.Body className="space-y-2">
						{countries.map((c) => (
							<Button
								key={c.code}
								variant="secondary"
								fullWidth
								isDisabled={busy}
								aria-pressed={c.code === session?.selectedCountry}
								onPress={() => {
									void select(c.code);
								}}
								className={`h-auto justify-start gap-3 p-3 text-left ${c.code === session?.selectedCountry ? "border border-[#7A4AE2]" : "border border-gray-200"}`}
							>
								<span className="font-semibold">{c.code.toUpperCase()}</span>
								<span className="flex-1">
									<span className="block font-semibold">{c.name}</span>
									<span className="block text-sm text-muted">
										{c.description}
									</span>
								</span>
								{c.code === session?.selectedCountry && <Check size={18} />}
							</Button>
						))}
						{error && (
							<p role="alert" className="text-sm text-danger">
								{error}
							</p>
						)}
					</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" isDisabled={busy} onPress={onClose}>
							닫기
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
