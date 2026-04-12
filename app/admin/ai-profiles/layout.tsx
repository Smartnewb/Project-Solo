import type { ReactNode } from 'react';
import { AiProfilesStatusBar } from './_shared/status-bar';

export default function AiProfilesLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex flex-col">
			<AiProfilesStatusBar />
			<div className="flex-1">{children}</div>
		</div>
	);
}
