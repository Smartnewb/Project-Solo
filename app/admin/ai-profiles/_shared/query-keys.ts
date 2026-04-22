import type {
	CandidateListQuery,
	GhostListQuery,
	ListReferencePoolQuery,
	PhaseSchoolListQuery,
	RealUserListQuery,
} from '@/app/types/ghost-injection';
import type {
	AiProfileDraftListQuery,
	BatchJobListQuery,
	PromptVersionListQuery,
	TemplateListQuery,
} from '@/app/types/ai-profile-generator';

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

export const aiProfileGeneratorKeys = {
	all: ['admin', 'ai-profile-generator'] as const,
	drafts: () => [...aiProfileGeneratorKeys.all, 'drafts'] as const,
	draftList: (query: AiProfileDraftListQuery) =>
		[...aiProfileGeneratorKeys.drafts(), 'list', query] as const,
	draftDetail: (id: string) =>
		[...aiProfileGeneratorKeys.drafts(), 'detail', id] as const,
	templates: () => [...aiProfileGeneratorKeys.all, 'templates'] as const,
	templateList: (query: TemplateListQuery) =>
		[...aiProfileGeneratorKeys.templates(), 'list', query] as const,
	templateDetail: (id: string) =>
		[...aiProfileGeneratorKeys.templates(), 'detail', id] as const,
	promptVersions: () =>
		[...aiProfileGeneratorKeys.all, 'prompt-versions'] as const,
	promptVersionList: (query: PromptVersionListQuery) =>
		[...aiProfileGeneratorKeys.promptVersions(), 'list', query] as const,
	promptVersionDetail: (id: string) =>
		[...aiProfileGeneratorKeys.promptVersions(), 'detail', id] as const,
	publishDryRun: (id: string, version: number) =>
		[...aiProfileGeneratorKeys.draftDetail(id), 'publish-dry-run', version] as const,
	previewChat: (id: string) =>
		[...aiProfileGeneratorKeys.draftDetail(id), 'preview-chat'] as const,
	batchJobs: () => [...aiProfileGeneratorKeys.all, 'batch-jobs'] as const,
	batchJobList: (query: BatchJobListQuery) =>
		[...aiProfileGeneratorKeys.batchJobs(), 'list', query] as const,
	batchJobDetail: (id: string) =>
		[...aiProfileGeneratorKeys.batchJobs(), 'detail', id] as const,
	eventCounts: (days: number) =>
		[...aiProfileGeneratorKeys.all, 'event-counts', days] as const,
	cleanupStatus: () =>
		[...aiProfileGeneratorKeys.all, 'cleanup-status'] as const,
};

export const referencePoolKeys = {
	all: ['admin', 'ghost-reference-pool'] as const,
	stats: () => [...referencePoolKeys.all, 'stats'] as const,
	list: (query: ListReferencePoolQuery) =>
		[...referencePoolKeys.all, 'list', query] as const,
	realUsers: (query: RealUserListQuery) =>
		[...referencePoolKeys.all, 'real-users', query] as const,
};
