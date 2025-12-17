import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { StoreVisualSettings } from '../types';
import { Palette, Image as ImageIcon, Smartphone, Upload, Download, Loader2, Check, QrCode } from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';

const StoreVisualSettingsComponent: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<StoreVisualSettings>({
        id: '',
        user_id: user?.id || '',
        primary_color: '#ea580c', // Orange-600
        secondary_color: '#dc2626', // Red-600
        theme_mode: 'light',
        font_family: 'Inter',
    });
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [showQRGenerator, setShowQRGenerator] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (!user?.id) return;
        fetchSettings();
    }, [user]);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('store_visual_settings')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setSettings(data);
            } else {
                // Criar configurações padrão
                const defaultSettings = {
                    user_id: user?.id,
                    primary_color: '#ea580c',
                    secondary_color: '#dc2626',
                    theme_mode: 'light' as const,
                    font_family: 'Inter',
                };

                const { data: newData, error: createError } = await supabase
                    .from('store_visual_settings')
                    .insert([defaultSettings])
                    .select()
                    .single();

                if (createError) throw createError;
                if (newData) setSettings(newData);
            }
        } catch (error) {
            console.error('Error fetching visual settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (file: File, type: 'logo' | 'banner' | 'favicon') => {
        try {
            type === 'logo' ? setUploadingLogo(true) : setUploadingBanner(true);

            const fileExt = file.name.split('.').pop();
            const fileName = `${type}-${user?.id}-${Date.now()}.${fileExt}`;
            const filePath = `store-branding/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('product-images') // Usar o mesmo bucket ou criar um novo
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);

            // Update settings
            const updatedSettings = {
                ...settings,
                [`${type}_url`]: data.publicUrl,
            };

            setSettings(updatedSettings);

            // Save to database
            await handleSave(updatedSettings);
        } catch (error) {
            console.error(`Error uploading ${type}:`, error);
            alert(`Erro ao fazer upload de ${type}!`);
        } finally {
            type === 'logo' ? setUploadingLogo(false) : setUploadingBanner(false);
        }
    };

    const handleSave = async (settingsToSave = settings) => {
        try {
            setSaving(true);

            const { error } = await supabase
                .from('store_visual_settings')
                .upsert({
                    ...settingsToSave,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            console.error('Error saving visual settings:', error);
            alert('Erro ao salvar configurações!');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-orange-500" size={32} />
            </div>
        );
    }

    const menuLink = user ? `${window.location.origin}/#/menu/${user.id}` : '';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Personalização Visual</h2>
                    <p className="text-gray-500 mt-1">Customize a aparência do seu cardápio digital</p>
                </div>
                <button
                    onClick={() => setShowQRGenerator(!showQRGenerator)}
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-black transition-colors"
                >
                    <QrCode size={20} />
                    {showQRGenerator ? 'Ocultar QR Code' : 'Gerar QR Code'}
                </button>
            </div>

            {/* QR Code Generator */}
            {showQRGenerator && (
                <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-2xl p-6 border border-purple-100">
                    <QRCodeGenerator
                        url={menuLink}
                        logoUrl={settings.logo_url}
                        primaryColor={settings.primary_color}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Logo da Loja */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <ImageIcon size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Logo da Loja</h3>
                            <p className="text-xs text-gray-500">Aparece no topo do cardápio e no QR Code</p>
                        </div>
                    </div>

                    <div className="relative">
                        {settings.logo_url ? (
                            <div className="relative group">
                                <img
                                    src={settings.logo_url}
                                    alt="Logo"
                                    className="w-full h-48 object-contain bg-gray-50 rounded-xl border-2 border-gray-200"
                                />
                                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center rounded-xl">
                                    <div className="text-white text-center">
                                        <Upload size={24} className="mx-auto mb-2" />
                                        <span className="text-sm font-bold">Alterar Logo</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], 'logo')}
                                        className="hidden"
                                        disabled={uploadingLogo}
                                    />
                                </label>
                            </div>
                        ) : (
                            <label className="w-full h-48 flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors">
                                <Upload size={32} className="text-gray-400 mb-2" />
                                <span className="text-sm text-gray-500 font-medium">Clique para fazer upload</span>
                                <span className="text-xs text-gray-400 mt-1">PNG, JPG ou SVG (Max 2MB)</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], 'logo')}
                                    className="hidden"
                                    disabled={uploadingLogo}
                                />
                            </label>
                        )}
                        {uploadingLogo && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                                <Loader2 size={32} className="animate-spin text-orange-500" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Banner de Capa */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <ImageIcon size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Banner de Capa</h3>
                            <p className="text-xs text-gray-500">Imagem de fundo do cabeçalho (opcional)</p>
                        </div>
                    </div>

                    <div className="relative">
                        {settings.banner_url ? (
                            <div className="relative group">
                                <img
                                    src={settings.banner_url}
                                    alt="Banner"
                                    className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                                />
                                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center rounded-xl">
                                    <div className="text-white text-center">
                                        <Upload size={24} className="mx-auto mb-2" />
                                        <span className="text-sm font-bold">Alterar Banner</span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], 'banner')}
                                        className="hidden"
                                        disabled={uploadingBanner}
                                    />
                                </label>
                            </div>
                        ) : (
                            <label className="w-full h-48 flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors">
                                <Upload size={32} className="text-gray-400 mb-2" />
                                <span className="text-sm text-gray-500 font-medium">Clique para fazer upload</span>
                                <span className="text-xs text-gray-400 mt-1">PNG ou JPG (1200x400px recomendado)</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], 'banner')}
                                    className="hidden"
                                    disabled={uploadingBanner}
                                />
                            </label>
                        )}
                        {uploadingBanner && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                                <Loader2 size={32} className="animate-spin text-orange-500" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cores do Tema */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Palette size={20} className="text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Cores do Tema</h3>
                        <p className="text-xs text-gray-500">Personalize as cores do seu cardápio</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cor Primária */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Cor Primária</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={settings.primary_color}
                                onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                                className="w-16 h-16 rounded-xl cursor-pointer border-2 border-gray-200"
                            />
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={settings.primary_color}
                                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-sm"
                                    placeholder="#ea580c"
                                />
                                <p className="text-xs text-gray-500 mt-1">Usada em botões e destaques</p>
                            </div>
                        </div>
                    </div>

                    {/* Cor Secundária */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Cor Secundária</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={settings.secondary_color}
                                onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                                className="w-16 h-16 rounded-xl cursor-pointer border-2 border-gray-200"
                            />
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={settings.secondary_color}
                                    onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-sm"
                                    placeholder="#dc2626"
                                />
                                <p className="text-xs text-gray-500 mt-1">Usada em gradientes e acentos</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview das Cores */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs font-bold text-gray-600 mb-3">Preview:</p>
                    <div className="flex gap-3">
                        <div
                            className="flex-1 h-24 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: settings.primary_color }}
                        >
                            Cor Primária
                        </div>
                        <div
                            className="flex-1 h-24 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: settings.secondary_color }}
                        >
                            Cor Secundária
                        </div>
                        <div
                            className="flex-1 h-24 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{
                                background: `linear-gradient(135deg, ${settings.primary_color}, ${settings.secondary_color})`,
                            }}
                        >
                            Gradiente
                        </div>
                    </div>
                </div>
            </div>

            {/* Modo de Tema */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Smartphone size={20} className="text-gray-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Modo de Tema</h3>
                        <p className="text-xs text-gray-500">Escolha entre claro, escuro ou automático</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    {(['light', 'dark', 'auto'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setSettings({ ...settings, theme_mode: mode })}
                            className={`flex-1 p-4 rounded-xl border-2 font-bold transition-all ${settings.theme_mode === mode
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                }`}
                        >
                            {mode === 'light' && '☀️ Claro'}
                            {mode === 'dark' && '🌙 Escuro'}
                            {mode === 'auto' && '🔄 Automático'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Botão Salvar */}
            <div className="flex justify-end">
                <button
                    onClick={() => handleSave()}
                    disabled={saving}
                    className={`px-8 py-4 rounded-xl font-bold text-white flex items-center gap-2 transition-all ${saveSuccess
                        ? 'bg-green-500'
                        : saving
                            ? 'bg-gray-400'
                            : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                        }`}
                >
                    {saving ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Salvando...
                        </>
                    ) : saveSuccess ? (
                        <>
                            <Check size={20} />
                            Salvo!
                        </>
                    ) : (
                        'Salvar Configurações'
                    )}
                </button>
            </div>
        </div>
    );
};

export default StoreVisualSettingsComponent;
