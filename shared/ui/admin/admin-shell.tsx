"use client";
/* eslint-disable no-restricted-globals, no-restricted-properties -- AdminShell: reads/writes localStorage during country change and uses reload for legacy compatibility. */

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
	AdminSessionContext,
	type AdminSession,
} from "@/shared/contexts/admin-session-context";
import { AdminQueryProvider } from "@/shared/providers/query-provider";
import { AdminSidebar } from "./sidebar";
import { AdminCountrySelectorModal } from "./admin-country-selector";
import {
	buildAdminLogoutPayload,
	getStoredAdminRefreshToken,
	setStoredAdminRefreshToken,
} from "@/shared/auth/admin-auth-contract";
import { CountryProvider } from "@/contexts/CountryContext";
import { AdminErrorBoundary } from "./admin-error-boundary";
import { ToastProvider, ToastContainer } from "@/shared/ui/admin/toast";
import {
	ConfirmDialogProvider,
	ConfirmDialog,
} from "@/shared/ui/admin/confirm-dialog";
import { CommandSearch } from "./command-search";
import { Button, Drawer, Spinner } from "@heroui/react";
import { Menu, Globe, LogOut } from "lucide-react";

export function AdminShell({ children }: { children: ReactNode }) {
	const router = useRouter();
	const [session, setSession] = useState<AdminSession | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [countryModalOpen, setCountryModalOpen] = useState(false);

	useEffect(() => {
		async function initSession() {
			setIsLoading(true);
			try {
				const res = await fetch("/api/admin/session");
				if (res.ok) {
					const data = await res.json();
					setSession(data);
				} else if (res.status === 401 || res.status === 403) {
					setError("Authentication required");
					router.push("/");
				} else {
					setError("세션 확인 실패 (서버 오류). 페이지를 새로고침하세요.");
				}
			} catch {
				setError(
					"네트워크 오류로 세션을 확인할 수 없습니다. 페이지를 새로고침하세요.",
				);
			} finally {
				setIsLoading(false);
			}
		}

		initSession();
	}, [router]);

	const changeCountry = useCallback(async (country: string) => {
		const res = await fetch("/api/admin/session/country", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ country }),
		});
		if (res.ok) {
			setSession((prev) =>
				prev ? { ...prev, selectedCountry: country } : null,
			);
		} else {
			throw new Error("국가 변경 실패");
		}
	}, []);

	const logout = useCallback(async () => {
		const refreshToken = getStoredAdminRefreshToken();
		const logoutPayload = buildAdminLogoutPayload(refreshToken);
		await fetch("/api/admin/auth/logout", {
			method: "POST",
			headers: logoutPayload
				? { "Content-Type": "application/json" }
				: undefined,
			body: logoutPayload ? JSON.stringify(logoutPayload) : undefined,
		});
		setStoredAdminRefreshToken(null);
		setSession(null);
		router.push("/");
	}, [router]);

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-white text-[#222222]">
				<Spinner aria-label="세션 확인 중" />
			</div>
		);
	}

	if (!session) {
		if (error && error !== "Authentication required") {
			return (
				<div className="flex items-center justify-center min-h-screen p-6 bg-white">
					<div className="max-w-md text-center space-y-4">
						<p className="text-[#3f3f3f]">{error}</p>
						<Button
							onClick={() => window.location.reload()}
							className="min-h-12 rounded-lg bg-[#7A4AE2] px-6 py-[14px] text-sm font-medium text-white transition-colors "
						>
							새로고침
						</Button>
					</div>
				</div>
			);
		}
		return null;
	}

	const sidebar = (
		<>
			<div className="flex h-14 shrink-0 items-center border-b border-gray-100 px-4">
				<h2 className="text-sm font-semibold">Sometimes Admin</h2>
			</div>
			<AdminSidebar onNavigate={() => setSidebarOpen(false)} />
			<div className="shrink-0 border-t border-gray-200 px-3 py-2">
				<p
					title={session.user.email}
					className="mb-1 truncate px-1 text-xs text-gray-500"
				>
					{session.user.email}
				</p>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						onPress={() => {
							setSidebarOpen(false);
							setCountryModalOpen(true);
						}}
						className="h-10 min-w-0 flex-1 justify-start px-2 text-sm [@media(pointer:coarse)]:h-11"
						aria-label={`운영 국가 변경 (${session.selectedCountry.toUpperCase()})`}
					>
						<Globe size={16} />
						<span>{session.selectedCountry.toUpperCase()}</span>
					</Button>
					<Button
						variant="ghost"
						onPress={() => {
							void logout();
						}}
						className="h-10 min-w-0 px-2 text-xs text-gray-600 [@media(pointer:coarse)]:h-11"
					>
						<LogOut size={15} />
						로그아웃
					</Button>
				</div>
			</div>
		</>
	);
	return (
		<AdminSessionContext.Provider
			value={{ session, isLoading, error, changeCountry, logout }}
		>
			<CountryProvider>
				<AdminQueryProvider>
					<div className="admin-heroui-screen flex min-h-screen bg-white text-foreground">
						<aside
							aria-label="관리자 메뉴"
							className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-gray-200 bg-white md:flex"
						>
							{sidebar}
						</aside>
						<Drawer.Backdrop isOpen={sidebarOpen} onOpenChange={setSidebarOpen}>
							<Drawer.Content placement="left" className="w-72">
								<Drawer.Dialog
									aria-label="관리자 메뉴"
									className="flex h-full flex-col p-0"
								>
									<Drawer.CloseTrigger
										aria-label="메뉴 닫기"
										className="absolute right-2 top-2"
									/>
									{sidebar}
								</Drawer.Dialog>
							</Drawer.Content>
						</Drawer.Backdrop>
						<div className="flex min-w-0 flex-1 flex-col">
							<header className="flex items-center justify-between border-b border-gray-200 p-4 md:hidden">
								<h1 className="text-lg font-semibold">관리자 대시보드</h1>
								<Button
									variant="tertiary"
									isIconOnly
									aria-label="메뉴 열기"
									onPress={() => setSidebarOpen(true)}
								>
									<Menu size={22} />
								</Button>
							</header>
							<main className="min-w-0 flex-1 p-4 md:p-6">
								<ToastProvider>
									<ConfirmDialogProvider>
										<ToastContainer />
										<ConfirmDialog />
										<AdminErrorBoundary>{children}</AdminErrorBoundary>
									</ConfirmDialogProvider>
								</ToastProvider>
							</main>
						</div>
						<CommandSearch />
						<AdminCountrySelectorModal
							open={countryModalOpen}
							onClose={() => setCountryModalOpen(false)}
						/>
					</div>
				</AdminQueryProvider>
			</CountryProvider>
		</AdminSessionContext.Provider>
	);
}
