-- =====================================================
-- MIGRAÇÃO AVANÇADA: Sistema de Horários Completo
-- =====================================================

-- 1. Adicionar campos de pausa e tipo de serviço na tabela business_hours
ALTER TABLE public.business_hours 
  ADD COLUMN IF NOT EXISTS pause_start time,
  ADD COLUMN IF NOT EXISTS pause_end time,
  ADD COLUMN IF NOT EXISTS service_type text DEFAULT 'all' CHECK (service_type IN ('all', 'delivery', 'pickup'));

-- Comentários
COMMENT ON COLUMN public.business_hours.pause_start IS 'Início do intervalo (pausa para almoço, etc)';
COMMENT ON COLUMN public.business_hours.pause_end IS 'Fim do intervalo';
COMMENT ON COLUMN public.business_hours.service_type IS 'Tipo de serviço: all (delivery+balcão), delivery (só entrega), pickup (só balcão)';

-- =====================================================
-- 2. TABELA DE HORÁRIOS ESPECIAIS (Feriados/Eventos)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.special_hours (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid references auth.users NOT NULL,
  date date NOT NULL,
  name text NOT NULL, -- Ex: "Natal", "Ano Novo", "Aniversário da Loja"
  is_open boolean DEFAULT false,
  open_time time,
  close_time time,
  pause_start time,
  pause_end time,
  service_type text DEFAULT 'all' CHECK (service_type IN ('all', 'delivery', 'pickup')),
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date, service_type)
);

ALTER TABLE public.special_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own special hours" 
  ON public.special_hours 
  FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view special hours" 
  ON public.special_hours 
  FOR SELECT 
  USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS special_hours_user_id_idx ON public.special_hours(user_id);
CREATE INDEX IF NOT EXISTS special_hours_date_idx ON public.special_hours(date);

COMMENT ON TABLE public.special_hours IS 'Horários especiais para feriados, eventos, etc';

-- =====================================================
-- 3. TABELA DE PREFERÊNCIAS DE NOTIFICAÇÃO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid references auth.users NOT NULL UNIQUE,
  notify_on_open boolean DEFAULT false, -- Notificar quando abrir
  notify_on_close_soon boolean DEFAULT false, -- Notificar 30 min antes de fechar
  notify_customers_on_open boolean DEFAULT false, -- Notificar clientes quando abrir
  notification_methods jsonb DEFAULT '["app"]'::jsonb, -- app, email, whatsapp
  advance_notice_minutes integer DEFAULT 30,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences" 
  ON public.notification_preferences 
  FOR ALL 
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.notification_preferences IS 'Preferências de notificações relacionadas a horários';

-- =====================================================
-- 4. TABELA DE NOTIFICAÇÕES ENVIADAS (Log)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_log (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid references auth.users NOT NULL,
  notification_type text NOT NULL, -- 'store_opened', 'store_closing_soon', etc
  sent_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  status text DEFAULT 'sent', -- sent, failed, pending
  message text,
  metadata jsonb
);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification log" 
  ON public.notification_log 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS notification_log_user_id_idx ON public.notification_log(user_id);
CREATE INDEX IF NOT EXISTS notification_log_sent_at_idx ON public.notification_log(sent_at);

-- =====================================================
-- 5. FUNÇÃO PARA VERIFICAR SE ESTÁ ABERTO (AVANÇADA)
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_store_open(
  p_user_id uuid,
  p_check_time timestamp with time zone DEFAULT now(),
  p_service_type text DEFAULT 'all'
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_day_of_week integer;
  v_current_date date;
  v_current_time time;
  v_special special_hours%ROWTYPE;
  v_regular business_hours%ROWTYPE;
  v_result jsonb;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_check_time);
  v_current_date := p_check_time::date;
  v_current_time := p_check_time::time;
  
  -- 1. Verificar horários especiais primeiro (prioridade)
  SELECT * INTO v_special
  FROM public.special_hours
  WHERE user_id = p_user_id
    AND date = v_current_date
    AND (service_type = p_service_type OR service_type = 'all' OR p_service_type = 'all')
  LIMIT 1;
  
  IF FOUND THEN
    -- Usar horário especial
    IF NOT v_special.is_open THEN
      RETURN jsonb_build_object(
        'is_open', false,
        'reason', 'special_closed',
        'message', 'Fechado hoje - ' || v_special.name
      );
    END IF;
    
    -- Verificar se está dentro do horário especial
    IF v_current_time >= v_special.open_time AND v_current_time <= v_special.close_time THEN
      -- Verificar pausa
      IF v_special.pause_start IS NOT NULL AND v_special.pause_end IS NOT NULL THEN
        IF v_current_time >= v_special.pause_start AND v_current_time < v_special.pause_end THEN
          RETURN jsonb_build_object(
            'is_open', false,
            'reason', 'pause',
            'message', 'Em pausa até ' || v_special.pause_end::text
          );
        END IF;
      END IF;
      
      RETURN jsonb_build_object(
        'is_open', true,
        'reason', 'special_open',
        'message', v_special.name || ' - Aberto até ' || v_special.close_time::text
      );
    END IF;
  END IF;
  
  -- 2. Verificar horários regulares
  SELECT * INTO v_regular
  FROM public.business_hours
  WHERE user_id = p_user_id
    AND day_of_week = v_day_of_week
    AND (service_type = p_service_type OR service_type = 'all' OR p_service_type = 'all')
  LIMIT 1;
  
  IF NOT FOUND OR NOT v_regular.is_open THEN
    RETURN jsonb_build_object(
      'is_open', false,
      'reason', 'regular_closed',
      'message', 'Fechado hoje'
    );
  END IF;
  
  -- Verificar horário regular
  IF v_current_time >= v_regular.open_time AND v_current_time <= v_regular.close_time THEN
    -- Verificar pausa
    IF v_regular.pause_start IS NOT NULL AND v_regular.pause_end IS NOT NULL THEN
      IF v_current_time >= v_regular.pause_start AND v_current_time < v_regular.pause_end THEN
        RETURN jsonb_build_object(
          'is_open', false,
          'reason', 'pause',
          'message', 'Em pausa até ' || v_regular.pause_end::text
        );
      END IF;
    END IF;
    
    RETURN jsonb_build_object(
      'is_open', true,
      'reason', 'regular_open',
      'message', 'Aberto até ' || v_regular.close_time::text
    );
  END IF;
  
  -- Fechado fora do horário
  RETURN jsonb_build_object(
    'is_open', false,
    'reason', 'outside_hours',
    'message', 'Fechado - Abre às ' || v_regular.open_time::text
  );
END;
$$;

COMMENT ON FUNCTION public.is_store_open IS 'Verifica se a loja está aberta considerando horários especiais, pausas e tipo de serviço';

-- =====================================================
-- 6. DADOS INICIAIS
-- =====================================================

-- Inserir preferências padrão para usuários existentes
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.notification_preferences 
  WHERE notification_preferences.user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Exemplos de horários especiais comuns (Natal, Ano Novo)
-- Usuários podem editar/deletar depois
-- INSERT INTO public.special_hours (user_id, date, name, is_open)
-- SELECT 
--   u.id,
--   '2025-12-25'::date,
--   'Natal',
--   false
-- FROM auth.users u
-- WHERE NOT EXISTS (
--   SELECT 1 FROM special_hours sh 
--   WHERE sh.user_id = u.id AND sh.date = '2025-12-25'
-- );

COMMENT ON SCHEMA public IS 'Sistema completo de horários com pausas, feriados e notificações';
