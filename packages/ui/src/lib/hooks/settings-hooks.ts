import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, UpdateLlmSettingsRequest, UpdateToolsSettingsRequest, AddSettingsChannelRequest, UpdateSettingsChannelRequest, ValidationResult } from '@oktaman/shared';
import { api } from '../api';
import { toast } from 'sonner';

const SETTINGS_QUERY_KEY = ['settings'];
const VALIDATION_QUERY_KEY = ['settings', 'validation'];

function useSettings() {
    return useQuery({
        queryKey: SETTINGS_QUERY_KEY,
        queryFn: async () => {
            return api.get<Settings>('/v1/settings');
        },
    });
}

function useValidation() {
    return useQuery({
        queryKey: VALIDATION_QUERY_KEY,
        queryFn: async () => {
            return api.get<ValidationResult>('/v1/settings/validation');
        },
    });
}

function useUpdateLlmSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateLlmSettingsRequest) => {
            return api.put<Settings>('/v1/settings/llm', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: VALIDATION_QUERY_KEY });
            toast.success('LLM settings saved successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to save LLM settings: ${error.message}`);
        },
    });
}

function useUpdateToolsSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateToolsSettingsRequest) => {
            return api.put<Settings>('/v1/settings/tools', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
            toast.success('Tools settings saved successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to save tools settings: ${error.message}`);
        },
    });
}

function useAddChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: AddSettingsChannelRequest) => {
            return api.post<Settings>('/v1/settings/channels', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
            toast.success('Channel added successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to add channel: ${error.message}`);
        },
    });
}

function useUpdateChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ channelId, data }: { channelId: string; data: UpdateSettingsChannelRequest }) => {
            return api.put<Settings>(`/v1/settings/channels/${channelId}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
            toast.success('Channel updated successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to update channel: ${error.message}`);
        },
    });
}

function useRemoveChannel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (channelId: string) => {
            return api.delete<Settings>(`/v1/settings/channels/${channelId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
            toast.success('Channel removed successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to remove channel: ${error.message}`);
        },
    });
}

export const settingsHooks = {
    useSettings,
    useValidation,
    useUpdateLlmSettings,
    useUpdateToolsSettings,
    useAddChannel,
    useUpdateChannel,
    useRemoveChannel,
};
