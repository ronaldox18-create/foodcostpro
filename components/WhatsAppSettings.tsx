import React, { useState, useEffect } from 'react';
import { MessageCircle, Check, Loader2, Info, Radio, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { WhatsAppService } from '../services/whatsapp';
import { WhatsAppConfig } from '../types';

const WhatsAppSettings: React.FC = () => {
    const [config, setConfig] = useState<Partial<WhatsAppConfig>>({
        phone_number_id: '',
        business_account_id: '',
        access_token: '',
        webhook_verify_token: '',
        is_enabled: false,
        status: 'disconnected',
        auto_send_order_confirmed: true,
        auto_send_order_preparing: true,
        auto_send_order_ready: true,
        auto_send_order_delivered: true,
        auto_send_loyalty_points: true
    });

    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [loadingConfig, setLoadingConfig] = useState(true);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoadingConfig(true);
        const data = await WhatsAppService.getConfig();
        if (data) {
            setConfig(data);
        }
        setLoadingConfig(false);
    };

    const handleSave = async () => {
        setLoading(true);
        setMessage(null);

        try {
            const success = await WhatsAppService.saveConfig(config);

            if (success) {
                setMessage({
                    type: 'success',
                    text: 'Configurações salvas com sucesso!'
                });
                await loadConfig(); // Recarregar para pegar updated_at atualizado
            } else {
                setMessage({
                    type: 'error',
                    text: 'Erro ao salvar configurações'
                });
            }
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'Erro desconhecido'
            });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setMessage(null);

        try {
            const result = await WhatsAppService.testConnection();

            setMessage({
                type: result.success ? 'success' : 'error',
                text: result.message
            });

            if (result.success) {
                await loadConfig(); // Recarregar status atualizado
            }
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'Erro ao testar conexão'
            });
        } finally {
            setTesting(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    if (loadingConfig) {
        return (
            <div className="bg-white rounded-2xl border-2 border-green-100 shadow-sm p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                    <span className="ml-3 text-gray-600">Carregando configurações...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border-2 border-green-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-green-50 bg-gradient-to-r from-green-50 to-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-xl border border-green-100 shadow-sm">
                            <MessageCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">WhatsApp Business</h3>
                            <p className="text-sm text-gray-600">Notificações automáticas via WhatsApp</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.status === 'active' ? 'bg-green-100 text-green-800' :
                                config.status === 'error' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                            }`}>
                            {config.status === 'active' ? '✓ Conectado' :
                                config.status === 'error' ? '✗ Erro' : '○ Desconectado'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
                {/* Info Alert */}
                <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl flex gap-3">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold mb-1">Como obter as credenciais?</p>
                        <ol className="list-decimal ml-4 space-y-1">
                            <li>Acesse <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="font-bold underline">Meta Business Manager</a></li>
                            <li>Crie um app WhatsApp Business</li>
                            <li>Configure webhooks e obtenha os tokens</li>
                            <li>Copie as credenciais abaixo</li>
                        </ol>
                        <p className="mt-2">
                            <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold underline">
                                📘 Ver documentação completa
                            </a>
                        </p>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                    {/* Phone Number ID */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1">
                            Phone Number ID *
                        </label>
                        <input
                            value={config.phone_number_id || ''}
                            onChange={(e) => setConfig({ ...config, phone_number_id: e.target.value })}
                            type="text"
                            placeholder="123456789012345"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Encontre em: WhatsApp Manager → API Setup</p>
                    </div>

                    {/* Business Account ID */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1">
                            Business Account ID *
                        </label>
                        <input
                            value={config.business_account_id || ''}
                            onChange={(e) => setConfig({ ...config, business_account_id: e.target.value })}
                            type="text"
                            placeholder="987654321098765"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                        />
                    </div>

                    {/* Access Token */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1">
                            Access Token (Permanente) *
                        </label>
                        <input
                            value={config.access_token || ''}
                            onChange={(e) => setConfig({ ...config, access_token: e.target.value })}
                            type="password"
                            placeholder="EAAxxxxxxxxxx..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">⚠️ Use token permanente, não temporário</p>
                    </div>

                    {/* Webhook Verify Token */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1">
                            Webhook Verify Token *
                        </label>
                        <input
                            value={config.webhook_verify_token || ''}
                            onChange={(e) => setConfig({ ...config, webhook_verify_token: e.target.value })}
                            type="text"
                            placeholder="seu_token_secreto_123"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Crie um token único para verificar webhooks</p>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-4"></div>

                {/* Auto Send Settings */}
                <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Envio Automático de Notificações</h4>
                    <div className="space-y-2">
                        {/* Ativar WhatsApp */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900 text-sm">Ativar WhatsApp</p>
                                <p className="text-xs text-gray-600">Habilitar envio de mensagens</p>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, is_enabled: !config.is_enabled })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${config.is_enabled ? 'bg-green-600' : 'bg-gray-300'
                                    }`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${config.is_enabled ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>

                        {/* Pedido Confirmado */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900 text-sm">Pedido Confirmado</p>
                                <p className="text-xs text-gray-600">Enviar quando pedido for criado</p>
                            </div>
                            <button
                                disabled={!config.is_enabled}
                                onClick={() => setConfig({ ...config, auto_send_order_confirmed: !config.auto_send_order_confirmed })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${config.auto_send_order_confirmed && config.is_enabled ? 'bg-green-600' : 'bg-gray-300'
                                    } ${!config.is_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${config.auto_send_order_confirmed ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>

                        {/* Pedido em Preparação */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900 text-sm">Pedido em Preparação</p>
                                <p className="text-xs text-gray-600">Status "preparing"</p>
                            </div>
                            <button
                                disabled={!config.is_enabled}
                                onClick={() => setConfig({ ...config, auto_send_order_preparing: !config.auto_send_order_preparing })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${config.auto_send_order_preparing && config.is_enabled ? 'bg-green-600' : 'bg-gray-300'
                                    } ${!config.is_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${config.auto_send_order_preparing ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>

                        {/* Pedido Pronto */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900 text-sm">Pedido Pronto</p>
                                <p className="text-xs text-gray-600">Status "ready"</p>
                            </div>
                            <button
                                disabled={!config.is_enabled}
                                onClick={() => setConfig({ ...config, auto_send_order_ready: !config.auto_send_order_ready })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${config.auto_send_order_ready && config.is_enabled ? 'bg-green-600' : 'bg-gray-300'
                                    } ${!config.is_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${config.auto_send_order_ready ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>

                        {/* Pedido Entregue */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900 text-sm">Pedido Entregue</p>
                                <p className="text-xs text-gray-600">Status "delivered"</p>
                            </div>
                            <button
                                disabled={!config.is_enabled}
                                onClick={() => setConfig({ ...config, auto_send_order_delivered: !config.auto_send_order_delivered })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${config.auto_send_order_delivered && config.is_enabled ? 'bg-green-600' : 'bg-gray-300'
                                    } ${!config.is_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${config.auto_send_order_delivered ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>

                        {/* Pontos de Fidelidade */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900 text-sm">Pontos de Fidelidade</p>
                                <p className="text-xs text-gray-600">Notificar quando ganhar pontos</p>
                            </div>
                            <button
                                disabled={!config.is_enabled}
                                onClick={() => setConfig({ ...config, auto_send_loyalty_points: !config.auto_send_loyalty_points })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${config.auto_send_loyalty_points && config.is_enabled ? 'bg-green-600' : 'bg-gray-300'
                                    } ${!config.is_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${config.auto_send_loyalty_points ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`p-3 rounded-lg border text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${message.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                        {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        <span className="font-medium">{message.text}</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col gap-2">
                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-green-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Check size={18} />
                                Salvar Configurações
                            </>
                        )}
                    </button>

                    {/* Test Connection Button */}
                    {config.phone_number_id && config.access_token && (
                        <button
                            onClick={handleTestConnection}
                            disabled={testing || loading}
                            className={`w-full py-2 border font-medium rounded-xl transition-colors flex items-center justify-center gap-2 ${testing || loading
                                    ? 'bg-gray-100 text-gray-400 border-gray-200'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {testing ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Testando conexão...
                                </>
                            ) : (
                                <>
                                    <Radio size={16} />
                                    Testar Conexão
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Help Text */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
                    <p className="text-sm text-yellow-800">
                        <strong>⚠️ Importante:</strong> Antes de ativar, certifique-se de criar e aprovar os templates de mensagem no Meta Business Manager.
                        <a href="/TEMPLATES_WHATSAPP.md" className="font-bold underline ml-1">Ver templates necessários</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppSettings;
