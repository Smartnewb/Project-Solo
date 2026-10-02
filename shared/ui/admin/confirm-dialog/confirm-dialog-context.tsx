"use client";

import {
	createContext,
	useCallback,
	useContext,
	useRef,
	useState,
} from "react";

interface ConfirmOptions {
	title?: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	severity?: "warning" | "error" | "info";
}

interface ConfirmState extends ConfirmOptions {
	open: boolean;
}

interface ConfirmDialogContextValue {
	state: ConfirmState;
	confirm: (options: ConfirmOptions) => Promise<boolean>;
	handleConfirm: () => void;
	handleCancel: () => void;
}

const defaultState: ConfirmState = {
	open: false,
	message: "",
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(
	null,
);

export function ConfirmDialogProvider({
	children,
}: { children: React.ReactNode }) {
	const [state, setState] = useState<ConfirmState>(defaultState);
	const resolveRef = useRef<(value: boolean) => void>(() => {});

	const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
		return new Promise((resolve) => {
			// 이미 열린 확인창이 있으면 취소로 끝내서 앞선 await 가 영원히 멈추지 않게 한다.
			resolveRef.current(false);
			resolveRef.current = resolve;
			setState({ ...options, open: true });
		});
	}, []);

	// 닫힘 애니메이션 동안 빈 다이얼로그가 보이지 않도록 내용은 유지하고 open 만 끈다.
	const handleConfirm = useCallback(() => {
		resolveRef.current(true);
		resolveRef.current = () => {};
		setState((prev) => ({ ...prev, open: false }));
	}, []);

	const handleCancel = useCallback(() => {
		resolveRef.current(false);
		resolveRef.current = () => {};
		setState((prev) => ({ ...prev, open: false }));
	}, []);

	return (
		<ConfirmDialogContext.Provider
			value={{ state, confirm, handleConfirm, handleCancel }}
		>
			{children}
		</ConfirmDialogContext.Provider>
	);
}

export function useConfirm() {
	const ctx = useContext(ConfirmDialogContext);
	if (!ctx)
		throw new Error("useConfirm must be used within ConfirmDialogProvider");
	return ctx.confirm;
}

export function useConfirmDialogState() {
	const ctx = useContext(ConfirmDialogContext);
	if (!ctx)
		throw new Error(
			"useConfirmDialogState must be used within ConfirmDialogProvider",
		);
	return ctx;
}
