export type ApprovedPhotoCount = 1 | 2 | 3;
export type PreviewCountry = 'kr' | 'jp';
export type MatchStatus = 'PENDING' | 'OPEN' | 'IN_CHAT' | 'REJECTED';

export interface PreviewSimulation {
	approvedPhotoCount: ApprovedPhotoCount;
	country: PreviewCountry;
	matchStatus: MatchStatus;
}

export const DEFAULT_SIMULATION: PreviewSimulation = {
	approvedPhotoCount: 3,
	country: 'kr',
	matchStatus: 'PENDING',
};

export const APPROVED_PHOTO_OPTIONS: ApprovedPhotoCount[] = [1, 2, 3];
export const COUNTRY_OPTIONS: PreviewCountry[] = ['kr', 'jp'];
export const MATCH_STATUS_OPTIONS: MatchStatus[] = ['PENDING', 'OPEN', 'IN_CHAT', 'REJECTED'];
