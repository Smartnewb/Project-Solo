import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import type {
  GenerateQuestionsRequest,
  GetQuestionsParams,
  UpdateQuestionRequest,
  TranslateQuestionsRequest,
  BulkCreateQuestionsRequest,
} from '@/types/moment';

// Query keys
export const messagingKeys = {
  all: ['admin', 'messaging'] as const,
  pushNotifications: () => [...messagingKeys.all, 'push-notifications'] as const,
  aiChat: () => [...messagingKeys.all, 'ai-chat'] as const,
  aiChatSessions: (params: object) => [...messagingKeys.aiChat(), 'sessions', params] as const,
  aiChatMessages: (sessionId: string) => [...messagingKeys.aiChat(), 'messages', sessionId] as const,
  momentQuestions: () => [...messagingKeys.all, 'moment-questions'] as const,
  momentQuestionList: (params: GetQuestionsParams) => [...messagingKeys.momentQuestions(), 'list', params] as const,
  momentQuestionDetail: (id: string) => [...messagingKeys.momentQuestions(), 'detail', id] as const,
};

// ==================== Push Notifications ====================

export function useFilterUsers(
  filters: {
    isDormant?: boolean;
    gender?: string;
    universities?: string[];
    regions?: string[];
    ranks?: string[];
    phoneNumber?: string;
    hasPreferences?: boolean;
  },
  page: number = 1,
  limit: number = 20,
) {
  return useMutation({
    mutationFn: () => AdminService.pushNotifications.filterUsers(filters, page, limit),
  });
}

export function useSendBulkNotification() {
  return useMutation({
    mutationFn: (data: { userIds: string[]; title: string; message: string }) =>
      AdminService.pushNotifications.sendBulkNotification(data),
  });
}

// ==================== AI Chat ====================

export function useAiChatSessions(params: {
  startDate?: string;
  endDate?: string;
  category?: string;
  isActive?: boolean;
  status?: string;
  userId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: messagingKeys.aiChatSessions(params),
    queryFn: () => AdminService.aiChat.getSessions(params),
  });
}

export function useAiChatMessages(sessionId: string) {
  return useQuery({
    queryKey: messagingKeys.aiChatMessages(sessionId),
    queryFn: () => AdminService.aiChat.getMessages(sessionId),
    enabled: !!sessionId,
  });
}

// ==================== Moment Questions ====================

export function useMomentQuestionList(params: GetQuestionsParams = {}) {
  return useQuery({
    queryKey: messagingKeys.momentQuestionList(params),
    queryFn: () => AdminService.momentQuestions.getList(params),
  });
}

export function useMomentQuestionDetail(id: string) {
  return useQuery({
    queryKey: messagingKeys.momentQuestionDetail(id),
    queryFn: () => AdminService.momentQuestions.getDetail(id),
    enabled: !!id,
  });
}

export function useGenerateMomentQuestions() {
  return useMutation({
    mutationFn: (data: GenerateQuestionsRequest) => AdminService.momentQuestions.generate(data),
  });
}

export function useBulkCreateMomentQuestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkCreateQuestionsRequest) => AdminService.momentQuestions.bulkCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.momentQuestions() });
    },
  });
}

export function useUpdateMomentQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuestionRequest }) =>
      AdminService.momentQuestions.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.momentQuestions() });
      queryClient.invalidateQueries({ queryKey: messagingKeys.momentQuestionDetail(id) });
    },
  });
}

export function useDeleteMomentQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AdminService.momentQuestions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.momentQuestions() });
    },
  });
}

export function useTranslateMomentQuestions() {
  return useMutation({
    mutationFn: (data: TranslateQuestionsRequest) => AdminService.momentQuestions.translate(data),
  });
}
