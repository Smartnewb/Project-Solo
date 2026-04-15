import type {
	CandidateListQuery,
	GhostListQuery,
	ListReferencePoolQuery,
	PhaseSchoolListQuery,
	RealUserListQuery,
} from '@/app/types/ghost-injection';

export const ghostInjectionKeys = {
	all: ['admin', 'ghost-injection'] as const,
	status: () => [...ghostInjectionKeys.all, 'status'] as const,

	ghosts: () => [...ghostInjectionKeys.all, 'ghosts'] as const,
	ghostList: (query: GhostListQuery) =>
		[...ghostInjectionKeys.ghosts(), 'list', query] as const,
	ghostDetail: (id: string) => [...ghostInjectionKeys.ghosts(), 'detail', id] as const,

	candidates: () => [...ghostInjectionKeys.all, 'candidates'] as const,
	candidateList: (query: CandidateListQuery) =>
		[...ghostInjectionKeys.candidates(), 'list', query] as const,

	phaseSchools: () => [...ghostInjectionKeys.all, 'phase-schools'] as const,
	phaseSchoolList: (query: PhaseSchoolListQuery) =>
		[...ghostInjectionKeys.phaseSchools(), 'list', query] as const,

	blacklist: () => [...ghostInjectionKeys.all, 'blacklist'] as const,
};

export const referencePoolKeys = {
	all: ['admin', 'ghost-reference-pool'] as const,
	stats: () => [...referencePoolKeys.all, 'stats'] as const,
	list: (query: ListReferencePoolQuery) =>
		[...referencePoolKeys.all, 'list', query] as const,
	realUsers: (query: RealUserListQuery) =>
		[...referencePoolKeys.all, 'real-users', query] as const,
};
