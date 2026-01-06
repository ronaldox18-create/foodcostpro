// ========================================
// WHATSAPP BOT - SERVIDOR BACKEND (ES MODULES)
// Rode: node server/whatsappServer.js
// ========================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';

const app = express();
app.use(cors());
app.use(express.json());

// Verificar variáveis de ambiente
console.log('🔍 Verificando variáveis de ambiente...');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'SET ✅' : 'MISSING ❌');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET ✅' : 'MISSING ❌');
console.log('PORT:', process.env.PORT || '3001');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    console.error('❌ ERRO: Variáveis de ambiente do Supabase não configuradas!');
    console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Railway');
    process.exit(1);
}

// Supabase
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

console.log('✅ Supabase client criado com sucesso!');

// Store ativo de sockets por usuário
const activeSockets = new Map();
const qrCodes = new Map();

// ========================================
// ROTA: INICIAR BOT
// ========================================
app.post('/api/whatsapp/start', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'userId required' });
    }

    try {
        // Se já está rodando, retornar
        if (activeSockets.has(userId)) {
            return res.json({
                success: true,
                message: 'Bot já está rodando',
                status: 'running'
            });
        }

        console.log(`🤖 Iniciando bot para usuário: ${userId}`);

        // Configurar autenticação
        const { state, saveCreds } = await useMultiFileAuthState(`./whatsapp_sessions/${userId}`);
        const { version } = await fetchLatestBaileysVersion();

        // Criar socket
        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            browser: Browsers.macOS('FoodCostPro')
        });

        // Salvar credenciais
        sock.ev.on('creds.update', saveCreds);

        // Monitorar conexão
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            // QR Code gerado
            if (qr) {
                console.log('📱 QR Code gerado!');

                // Converter para imagem base64
                const qrImage = await QRCode.toDataURL(qr);
                qrCodes.set(userId, { qr, qrImage });

                // Salvar no banco
                await supabase
                    .from('whatsapp_bot_config')
                    .update({
                        qr_code: qr,
                        qr_generated_at: new Date().toISOString()
                    })
                    .eq('user_id', userId);
            }

            // Conectado
            if (connection === 'open') {
                console.log('✅ WhatsApp conectado!');

                await supabase
                    .from('whatsapp_bot_config')
                    .update({
                        is_connected: true,
                        connected_at: new Date().toISOString(),
                        qr_code: null
                    })
                    .eq('user_id', userId);

                qrCodes.delete(userId);
            }

            // Desconectado
            if (connection === 'close') {
                const shouldReconnect =
                    lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

                console.log('🔌 Conexão fechada. Reconectar?', shouldReconnect);

                await supabase
                    .from('whatsapp_bot_config')
                    .update({ is_connected: false })
                    .eq('user_id', userId);

                activeSockets.delete(userId);
                qrCodes.delete(userId);

                if (shouldReconnect) {
                    setTimeout(() => {
                        console.log('🔄 Tentando reconectar...');
                        // Reconectar
                    }, 5000);
                }
            }
        });

        // Receber mensagens
        sock.ev.on('messages.upsert', async (m) => {
            const message = m.messages[0];

            if (!message.key.fromMe && message.message) {
                const from = message.key.remoteJid;
                const text = message.message.conversation ||
                    message.message.extendedTextMessage?.text || '';

                console.log(`📥 Mensagem de ${from}: ${text}`);

                // Salvar no banco
                await supabase.from('whatsapp_messages').insert({
                    user_id: userId,
                    customer_phone: from.replace(/\D/g, ''),
                    customer_name: message.pushName || 'Cliente',
                    content: text,
                    direction: 'received'
                });

                // Resposta automática simples
                await sock.sendMessage(from, {
                    text: 'Olá! Recebi sua mensagem. Aguarde um momento! 😊'
                });

                // Salvar resposta
                await supabase.from('whatsapp_messages').insert({
                    user_id: userId,
                    customer_phone: from.replace(/\D/g, ''),
                    customer_name: message.pushName || 'Cliente',
                    content: 'Olá! Recebi sua mensagem. Aguarde um momento! 😊',
                    direction: 'sent'
                });
            }
        });

        // Armazenar socket
        activeSockets.set(userId, sock);

        res.json({
            success: true,
            message: 'Bot iniciado! Aguarde QR Code...',
            status: 'starting'
        });

    } catch (error) {
        console.error('❌ Erro ao iniciar bot:', error);
        res.status(500).json({
            error: 'Erro ao iniciar bot',
            details: error.message
        });
    }
});

// ========================================
// ROTA: OBTER QR CODE
// ========================================
app.get('/api/whatsapp/qr/:userId', (req, res) => {
    const { userId } = req.params;

    const qrData = qrCodes.get(userId);

    if (qrData) {
        res.json({
            success: true,
            qr: qrData.qr,
            qrImage: qrData.qrImage
        });
    } else {
        res.json({ success: false, message: 'QR não disponível. Aguarde...' });
    }
});

// ========================================
// ROTA: STATUS
// ========================================
app.get('/api/whatsapp/status/:userId', async (req, res) => {
    const { userId } = req.params;

    const isRunning = activeSockets.has(userId);
    const hasQR = qrCodes.has(userId);

    // Verificar no banco também
    const { data } = await supabase
        .from('whatsapp_bot_config')
        .select('is_connected, qr_code')
        .eq('user_id', userId)
        .single();

    res.json({
        running: isRunning,
        connected: data?.is_connected || false,
        hasQR: hasQR || !!data?.qr_code,
        qr: data?.qr_code
    });
});

// ========================================
// ROTA: PARAR BOT
// ========================================
app.post('/api/whatsapp/stop', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'userId required' });
    }

    const sock = activeSockets.get(userId);

    if (sock) {
        await sock.logout();
        activeSockets.delete(userId);
        qrCodes.delete(userId);

        await supabase
            .from('whatsapp_bot_config')
            .update({
                is_connected: false,
                is_enabled: false
            })
            .eq('user_id', userId);

        res.json({ success: true, message: 'Bot parado' });
    } else {
        res.json({ success: false, message: 'Bot não estava rodando' });
    }
});

// ========================================
// HEALTH CHECK
// ========================================
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'WhatsApp Bot Server está rodando!',
        activeBots: activeSockets.size
    });
});

// ========================================
// INICIAR SERVIDOR
// ========================================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║  🤖 WhatsApp Bot Server - RODANDO!    ║
    ║  Porta: ${PORT}                           ║
    ║  Status: ✅ Online                     ║
    ║  Health: http://localhost:${PORT}/health  ║
    ╚════════════════════════════════════════╝
    `);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});
