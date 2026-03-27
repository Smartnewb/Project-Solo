import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import type { CreateDepartmentRequest, CreateUniversityRequest, BulkCreateDepartmentsRequest, DepartmentListParams, UniversityListParams, UpdateDepartmentRequest, UpdateUniversityRequest } from '@/types/admin';

export const systemKeys = {
  all: ['admin', 'system'] as const,
  fcmTokens: () => [...systemKeys.all, 'fcmTokens'] as const,
  universities: () => [...systemKeys.all, 'universities'] as const,
  universityMeta: () => [...systemKeys.universities(), 'meta'] as const,
  departments: (universityId: string) => [...systemKeys.universities(), universityId, 'departments'] as const,
};

// --- fcmTokens ---

export function useFcmTokens(page: number = 1, limit: number = 20, hasToken?: boolean) {
  return useQuery({
    queryKey: [...systemKeys.fcmTokens(), { page, limit, hasToken }],
    queryFn: () => AdminService.fcmTokens.getTokens(page, limit, hasToken),
  });
}

// --- universities.meta ---

export function useUniversityMetaRegions() {
  return useQuery({
    queryKey: [...systemKeys.universityMeta(), 'regions'],
    queryFn: () => AdminService.universities.meta.getRegions(),
  });
}

export function useUniversityMetaTypes() {
  return useQuery({
    queryKey: [...systemKeys.universityMeta(), 'types'],
    queryFn: () => AdminService.universities.meta.getTypes(),
  });
}

export function useUniversityMetaFoundations() {
  return useQuery({
    queryKey: [...systemKeys.universityMeta(), 'foundations'],
    queryFn: () => AdminService.universities.meta.getFoundations(),
  });
}

// --- universities ---

export function useUniversityList(params?: UniversityListParams) {
  return useQuery({
    queryKey: [...systemKeys.universities(), 'list', params],
    queryFn: () => AdminService.universities.getList(params),
  });
}

export function useUniversityById(id: string) {
  return useQuery({
    queryKey: [...systemKeys.universities(), 'detail', { id }],
    queryFn: () => AdminService.universities.getById(id),
    enabled: !!id,
  });
}

export function useCreateUniversity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUniversityRequest) => AdminService.universities.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: systemKeys.universities() });
    },
  });
}

export function useUpdateUniversity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUniversityRequest }) =>
      AdminService.universities.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: systemKeys.universities() });
    },
  });
}

export function useDeleteUniversity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AdminService.universities.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: systemKeys.universities() });
    },
  });
}

export function useUploadUniversityLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      AdminService.universities.uploadLogo(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: systemKeys.universities() });
    },
  });
}

export function useDeleteUniversityLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AdminService.universities.deleteLogo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: systemKeys.universities() });
    },
  });
}

export function useUniversities() {
  return useQuery({
    queryKey: [...systemKeys.universities(), 'all'],
    queryFn: () => AdminService.universities.getUniversities(),
  });
}

export function useUniversityClusters() {
  return useQuery({
    queryKey: [...systemKeys.universities(), 'clusters'],
    queryFn: () => AdminService.universities.getClusters(),
  });
}

export function useUniversityDepartments(university: string) {
  return useQuery({
    queryKey: [...systemKeys.universities(), 'departments', { university }],
    queryFn: () => AdminService.universities.getDepartments(university),
    enabled: !!university,
  });
}

// --- universities.departments ---

export function useDepartmentList(universityId: string, params?: DepartmentListParams) {
  return useQuery({
    queryKey: [...systemKeys.departments(universityId), 'list', params],
    queryFn: () => AdminService.universities.departments.getList(universityId, params),
    enabled: !!universityId,
  });
}

export function useDepartmentById(universityId: string, id: string) {
  return useQuery({
    queryKey: [...systemKeys.departments(universityId), 'detail', { id }],
    queryFn: () => AdminService.universities.departments.getById(universityId, id),
    enabled: !!universityId && !!id,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ universityId, data }: { universityId: string; data: CreateDepartmentRequest }) =>
      AdminService.universities.departments.create(universityId, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: systemKeys.departments(variables.universityId) });
    },
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ universityId, id, data }: { universityId: string; id: string; data: UpdateDepartmentRequest }) =>
      AdminService.universities.departments.update(universityId, id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: systemKeys.departments(variables.universityId) });
    },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ universityId, id }: { universityId: string; id: string }) =>
      AdminService.universities.departments.delete(universityId, id),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: systemKeys.departments(variables.universityId) });
    },
  });
}

export function useBulkCreateDepartments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ universityId, data }: { universityId: string; data: BulkCreateDepartmentsRequest }) =>
      AdminService.universities.departments.bulkCreate(universityId, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: systemKeys.departments(variables.universityId) });
    },
  });
}

export function useDownloadDepartmentTemplate() {
  return useMutation({
    mutationFn: (universityId: string) =>
      AdminService.universities.departments.downloadTemplate(universityId),
  });
}

export function useUploadDepartmentsCsv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ universityId, file }: { universityId: string; file: File }) =>
      AdminService.universities.departments.uploadCsv(universityId, file),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: systemKeys.departments(variables.universityId) });
    },
  });
}
