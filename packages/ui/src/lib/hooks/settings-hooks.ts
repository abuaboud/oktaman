import { useQuery } from '@tanstack/react-query';
import { Settings, ValidationResult } from '@oktaman/shared';
import { api } from '../api';

const SETTINGS_QUERY_KEY = ['settings'];
const VALIDATION_QUERY_KEY = ['settings', 'validation'];

function useSettings() {
    return useQuery({
        queryKey: SETTINGS_QUERY_KEY,
        queryFn: async () => {
            return api.get<Settings>('/api/v1/settings');
        },
    });
}

function useValidation() {
    return useQuery({
        queryKey: VALIDATION_QUERY_KEY,
        queryFn: async () => {
            return api.get<ValidationResult>('/api/v1/settings/validation');
        },
    });
}

export const settingsHooks = {
    useSettings,
    useValidation,
};
