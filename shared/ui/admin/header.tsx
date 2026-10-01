"use client";
import { Button } from "@heroui/react";
import { Menu } from "lucide-react";
export function AdminHeader({
	onMenuToggle,
	title = "Admin",
}: { onMenuToggle?: () => void; title?: string }) {
	return (
		<header className="sticky top-0 z-30 flex min-h-14 items-center gap-3 border-b border-gray-200 bg-white px-4">
			{onMenuToggle && (
				<Button
					variant="tertiary"
					isIconOnly
					aria-label="메뉴 열기"
					onPress={onMenuToggle}
					className="md:hidden"
				>
					<Menu size={20} />
				</Button>
			)}
			<h1 className="truncate text-lg font-semibold">{title}</h1>
		</header>
	);
}
