"use client";
import { createContext, useContext, useMemo, useEffect } from "react";
import { ToastQueue, type ToastContentValue } from "@heroui/react";
interface ToastContextValue {
	queue: ToastQueue<ToastContentValue>;
	success: (message: string) => void;
	error: (message: string) => void;
	warning: (message: string) => void;
	info: (message: string) => void;
	dismiss: (id: string) => void;
}
const ToastContext = createContext<ToastContextValue | null>(null);
export function ToastProvider({ children }: { children: React.ReactNode }) {
	const queue = useMemo(
		() => new ToastQueue<ToastContentValue>({ maxVisibleToasts: 3 }),
		[],
	);
	useEffect(() => () => queue.clear(), [queue]);
	const value = useMemo(() => {
		const add = (title: string, variant: ToastContentValue["variant"]) => {
			queue.add({ title, variant }, { timeout: 3000 });
		};
		return {
			queue,
			success: (m: string) => add(m, "success"),
			error: (m: string) => add(m, "danger"),
			warning: (m: string) => add(m, "warning"),
			info: (m: string) => add(m, "default"),
			dismiss: (id: string) => queue.close(id),
		};
	}, [queue]);
	return (
		<ToastContext.Provider value={value}>{children}</ToastContext.Provider>
	);
}
export function useToast() {
	const value = useContext(ToastContext);
	if (!value) throw new Error("useToast must be used within ToastProvider");
	return value;
}
