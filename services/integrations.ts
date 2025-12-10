import { supabase } from '../utils/supabaseClient';
import { UserIntegration } from '../types';

export const IntegrationService = {
    /**
     * Get integration settings for a specific provider
     */
    async getIntegration(provider: string): Promise<UserIntegration | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('user_integrations')
            .select('*')
            .eq('user_id', user.id)
            .eq('provider', provider)
            .maybeSingle();

        if (error) {
            console.error('Error fetching integration:', error);
            throw error;
        }
        return data;
    },

    /**
     * Save or update integration credentials
     */
    async saveIntegration(provider: string, credentials: any): Promise<UserIntegration> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('user_integrations')
            .upsert({
                user_id: user.id,
                provider,
                credentials,
                status: 'active',
                is_enabled: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, provider' })
            .select()
            .single();

        if (error) {
            console.error('Error saving integration:', error);
            throw error;
        }
        return data;
    },

    /**
     * Disconnect an integration
     */
    async disconnectIntegration(provider: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { error } = await supabase
            .from('user_integrations')
            .update({
                status: 'disconnected',
                is_enabled: false,
                credentials: {}
            })
            .eq('user_id', user.id)
            .eq('provider', provider);

        if (error) throw error;
        if (error) throw error;
    },

    /**
     * Test connection for a specific provider
     */
    async testConnection(provider: string): Promise<boolean> {
        if (provider !== 'ifood') throw new Error("Teste não suportado para este provedor");

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // Chama a Edge Function para testar
        const { data, error } = await supabase.functions.invoke('sync-catalog', {
            body: {
                action: 'test_auth',
                userId: user.id
            }
        });

        if (error) {
            console.error("Erro no teste de conexão:", error);
            throw new Error(error.message || 'Erro ao comunicar com o servidor.');
        }

        if (data?.error) {
            throw new Error(data.error);
        }

        return true;
    }
};
