import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Zap, Brain, Check, Loader2, QrCode, RefreshCw } from 'lucide-react';

const WhatsAppBotSetup: React.FC = () => {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);

    const [config, setConfig] = useState({
        is_enabled: false,
        is_connected: false,
        ai_enabled: false,
        welcome_message: 'Olá! Como posso ajudar? 😊'
    });

    const [qrImage, setQrImage] = useState<string>('');
    const [backendOnline, setBackendOnline] = useState(false);

    useEffect(() => {
        checkBackend();
        loadConfig();
    }, []);

    const checkBackend = async () => {
        try {
            const response = await fetch('https://foodcostpro-production.up.railway.app/health');
            const data = await response.json();
            setBackendOnline(data.status === 'ok');
            console.log('✅ Backend status:', data);
        } catch (error) {
            setBackendOnline(false);
            console.error('❌ Backend offline:', error);
        }
    };

    const loadConfig = async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from('whatsapp_bot_config')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setConfig(data);

                if (!data.is_enabled) {
                    setStep(1);
                } else if (!data.is_connected) {
                    setStep(2);
                    // Se está habilitado mas não conectado, começar a buscar QR
                    setTimeout(() => pollForQR(), 1000);
                } else {
                    setStep(3);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar config:', error);
        } finally {
            setLoading(false);
        }
    };

    const enableBot = async () => {
        if (!user) return;

        if (!backendOnline) {
            alert('⚠️ Backend offline!\n\nRode: node server/whatsappServer.js');
            return;
        }

        setSaving(true);
        try {
            console.log('💾 Salvando config...');
            const { error } = await supabase
                .from('whatsapp_bot_config')
                .upsert({
                    user_id: user.id,
                    is_enabled: true,
                    ai_enabled: false,
                    welcome_message: config.welcome_message
                });

            if (error) throw error;

            console.log('🚀 Chamando API para iniciar bot...');
            const response = await fetch('https://foodcostpro-production.up.railway.app/api/whatsapp/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });

            const data = await response.json();
            console.log('📡 Resposta da API:', data);

            if (!data.success) {
                throw new Error(data.error || 'Erro ao iniciar bot');
            }

            setConfig({ ...config, is_enabled: true });
            setStep(2);

            console.log('⏳ Aguardando geração do QR Code...');
            setTimeout(() => pollForQR(), 2000);
        } catch (error: any) {
            console.error('❌ Erro completo:', error);
            alert(`Erro: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const pollForQR = async () => {
        if (!user) return;

        console.log('🔍 [' + new Date().toLocaleTimeString() + '] Buscando QR Code...');

        try {
            const response = await fetch(`https://foodcostpro-production.up.railway.app/api/whatsapp/qr/${user.id}`);
            const data = await response.json();

            console.log('📥 Resposta:', data);

            if (data.success && data.qrImage) {
                console.log('✅ QR Code recebido! Mostrando...');
                setQrImage(data.qrImage);

                // Começar a verificar conexão
                startConnectionCheck();
            } else {
                console.log('⏳ QR não disponível, tentando de novo em 2s...');
                setTimeout(pollForQR, 2000);
            }
        } catch (error) {
            console.error('❌ Erro ao buscar QR:', error);
            setTimeout(pollForQR, 3000);
        }
    };

    const startConnectionCheck = () => {
        const interval = setInterval(async () => {
            if (!user) return;

            try {
                const { data } = await supabase
                    .from('whatsapp_bot_config')
                    .select('is_connected')
                    .eq('user_id', user.id)
                    .single();

                console.log('🔍 Verificando conexão:', data?.is_connected);

                if (data?.is_connected) {
                    clearInterval(interval);
                    console.log('🎉 CONECTADO!');
                    setConfig(prev => ({ ...prev, is_connected: true }));
                    setStep(3);
                    setQrImage('');
                }
            } catch (error) {
                console.error('Erro ao verificar:', error);
            }
        }, 3000);
    };

    const toggleAI = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const newValue = !config.ai_enabled;

            const { error } = await supabase
                .from('whatsapp_bot_config')
                .update({ ai_enabled: newValue })
                .eq('user_id', user.id);

            if (error) throw error;

            setConfig({ ...config, ai_enabled: newValue });

            alert(newValue
                ? '🤖 IA ativada!'
                : '⏸️ IA desativada.'
            );
        } catch (error) {
            console.error('Erro:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                        <MessageCircle size={24} className="text-white" />
                    </div>
                    WhatsApp Bot
                </h1>

                <div className={`mt-4 px-4 py-2 rounded-lg inline-flex items-center gap-2 ${backendOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <div className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                    {backendOnline ? 'Backend Online ✅' : 'Backend Offline ❌'}
                </div>
            </div>

            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {step > s ? <Check size={20} /> : s}
                            </div>
                            {s < 3 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-sm">
                    <span>Ativar</span>
                    <span>Conectar</span>
                    <span>Configurar</span>
                </div>
            </div>

            {step === 1 && (
                <div className="bg-white rounded-xl border-2 border-gray-200 p-8 text-center">
                    <Zap className="w-20 h-20 mx-auto mb-4 text-green-600" />
                    <h2 className="text-2xl font-bold mb-4">Ativar WhatsApp Bot</h2>

                    <input
                        type="text"
                        value={config.welcome_message}
                        onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg mb-6"
                        placeholder="Mensagem de boas-vindas"
                    />

                    <button
                        onClick={enableBot}
                        disabled={saving || !backendOnline}
                        className="px-8 py-4 bg-green-500 text-white rounded-lg font-bold disabled:opacity-50"
                    >
                        {saving ? 'Ativando...' : 'Ativar Bot Agora!'}
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="bg-white rounded-xl border-2 border-gray-200 p-8 text-center">
                    <QrCode className="w-20 h-20 mx-auto mb-4 text-green-600" />
                    <h2 className="text-2xl font-bold mb-4">Conectar WhatsApp</h2>

                    {qrImage ? (
                        <div>
                            <div className="inline-block p-4 bg-white border-4 border-green-500 rounded-xl mb-6">
                                <img src={qrImage} alt="QR Code" className="w-64 h-64" />
                            </div>
                            <p className="text-sm text-gray-600">Escaneie com seu WhatsApp</p>
                        </div>
                    ) : (
                        <div>
                            <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
                            <p>Gerando QR Code...</p>
                            <button
                                onClick={() => pollForQR()}
                                className="mt-4 px-6 py-2 bg-gray-200 rounded-lg"
                            >
                                <RefreshCw className="inline w-4 h-4 mr-2" />
                                Recarregar
                            </button>
                        </div>
                    )}
                </div>
            )}

            {step === 3 && (
                <div className="space-y-6">
                    <div className="bg-green-100 border-2 border-green-500 rounded-xl p-6">
                        <Check className="inline w-8 h-8 text-green-600 mr-3" />
                        <span className="text-xl font-bold text-green-900">WhatsApp Conectado!</span>
                    </div>

                    <div className="bg-white rounded-xl border-2 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Brain className="w-12 h-12 text-purple-600" />
                            <div>
                                <h3 className="font-bold">IA (DeepSeek)</h3>
                                <p className="text-sm text-gray-600">Respostas inteligentes</p>
                            </div>
                        </div>

                        <button
                            onClick={toggleAI}
                            className={`w-16 h-8 rounded-full ${config.ai_enabled ? 'bg-green-500' : 'bg-gray-300'} relative`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full absolute top-1 left-1 transition-transform ${config.ai_enabled ? 'translate-x-8' : ''}`} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsAppBotSetup;
