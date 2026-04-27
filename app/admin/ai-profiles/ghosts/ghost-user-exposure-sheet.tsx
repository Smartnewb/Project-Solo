'use client';

import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from '@/shared/ui/sheet';
import { GhostUserExposureContent } from './ghost-user-exposure-content';

interface GhostUserExposureSheetProps {
	userId: string | null;
	userName?: string;
	onClose: () => void;
	onGhostSelect: (ghostAccountId: string) => void;
}

export function GhostUserExposureSheet({
	userId,
	userName,
	onClose,
	onGhostSelect,
}: GhostUserExposureSheetProps) {
	return (
		<Sheet open={Boolean(userId)} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="w-full sm:max-w-xl overflow-y-auto flex flex-col gap-0 p-0">
				<SheetHeader className="px-6 pt-6 pb-4 border-b">
					<SheetTitle className="text-base">
						Ghost 노출 이력
						{userName && (
							<span className="ml-2 text-sm font-normal text-gray-500">— {userName}</span>
						)}
					</SheetTitle>
				</SheetHeader>

				{userId && (
					<div className="flex-1 overflow-y-auto px-6 py-4">
						<GhostUserExposureContent
							userId={userId}
							onGhostSelect={(ghostAccountId) => {
								onGhostSelect(ghostAccountId);
								onClose();
							}}
						/>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
