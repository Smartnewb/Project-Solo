"use client";
import { Spinner } from "@heroui/react";
export function AdminLoading() {
	return (
		<div className="flex min-h-[60vh] items-center justify-center">
			<Spinner aria-label="불러오는 중" />
		</div>
	);
}
