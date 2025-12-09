
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabaseClient';

// Substitua pela sua PUBLIC KEY do Stripe (pk_test_...)
// Você pode colocar no .env como VITE_STRIPE_PUBLIC_KEY
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_PLACEHOLDER_KEY');

export const initiateCheckout = async (plan: 'starter' | 'online' | 'pro') => {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            throw new Error('Usuário não autenticado');
        }

        if (!session.access_token) {
            throw new Error('Sessão inválida. Faça login novamente.');
        }

        // Chama a Edge Function 'create-checkout-session'
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: {
                plan,
                returnUrl: window.location.origin + '/account?tab=plan&payment=success',
                accessToken: session.access_token // Fallback: enviando no corpo também
            },
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        });

        if (error) {
            // Tenta extrair a mensagem de erro do corpo da resposta se for um erro de função
            let errorMessage = error.message;
            if (error instanceof Error && 'context' in error) {
                // @ts-ignore
                const body = await (error as any).context?.json().catch(() => null);
                if (body && body.error) {
                    errorMessage = body.error;
                }
            }
            console.error('Detalhes do erro da Edge Function:', error);
            throw new Error(errorMessage || 'Erro ao processar pagamento');
        }

        if (data?.url) {
            // Redireciona para o Checkout do Stripe
            window.location.href = data.url;
        } else {
            throw new Error('URL de pagamento não retornada');
        }
    } catch (error: any) {
        console.error('Erro detalhado no checkout:', error);
        alert(`Erro no pagamento: ${error.message}`); // Mostra alerta visual para o usuário
        throw error;
    }
};
