import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export interface Conversation {
  id: number;
  participant_1_id: number;
  participant_1_role: string;
  participant_1_name: string;
  participant_2_id: number;
  participant_2_role: string;
  participant_2_name: string;
  created_at: string;
  last_message_at: string;
  last_message_body: string;
  unread_count: number;
}

export interface Message {
  id: number;
  conversation: number;
  sender_id: number;
  sender_role: string;
  sender_name: string;
  body: string;
  read: boolean;
  created_at: string;
}

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: () =>
      apiClient
        .get("/api/conversations/")
        .then((r) => r.data)
        .catch(() => []),
    refetchInterval: 30_000,
    retry: false,
    enabled: false, // Only fetch when explicitly needed
  });
}

export function useConversationMessages(conversationId: number) {
  return useQuery<Message[]>({
    queryKey: ["conversation-messages", conversationId],
    queryFn: () =>
      apiClient.get(`/api/conversations/${conversationId}/messages/`).then((r) => r.data),
    enabled: !!conversationId,
    refetchInterval: 10_000,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      participant_2_id: number;
      participant_2_role: string;
      participant_2_name: string;
    }) => apiClient.post("/api/conversations/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, body }: { conversationId: number; body: string }) =>
      apiClient.post(`/api/conversations/${conversationId}/messages/`, { body }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["conversation-messages", variables.conversationId] }),
  });
}

export function useMarkMessageRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: number) =>
      apiClient.get(`/api/conversations/${conversationId}/messages/`),
    onSuccess: (_data, conversationId) =>
      qc.invalidateQueries({ queryKey: ["conversation-messages", conversationId] }),
  });
}
