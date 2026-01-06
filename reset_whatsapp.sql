-- RESETAR WHATSAPP BOT
-- Execute no Supabase SQL Editor para começar do zero

UPDATE whatsapp_bot_config 
SET 
    is_enabled = false,
    is_connected = false,
    qr_code = null,
    qr_generated_at = null
WHERE user_id IN (
    SELECT id FROM auth.users LIMIT 1
);
