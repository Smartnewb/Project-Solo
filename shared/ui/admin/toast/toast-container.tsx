"use client";
import { Toast, ToastProvider as HeroToastProvider } from "@heroui/react";
import { useToast } from "./toast-context";
export function ToastContainer() {
	const { queue } = useToast();
	return (
		<HeroToastProvider
			queue={queue}
			placement="top end"
			width="min(400px, calc(100vw - 32px))"
		>
			{({ toast }) => (
				<Toast toast={toast} variant={toast.content.variant}>
					<Toast.Content>
						<Toast.Title>{toast.content.title}</Toast.Title>
					</Toast.Content>
					<Toast.CloseButton aria-label="알림 닫기" />
				</Toast>
			)}
		</HeroToastProvider>
	);
}
