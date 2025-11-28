-- ============================================
-- Migration 077: Améliorations du Système de Notifications
-- - Préférences utilisateur
-- - Déduplication (cooldowns)
-- - Support email digest
-- ============================================

-- ============================================
-- 1. Table des préférences de notification
-- ============================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- Préférences par type de notification (in-app)
  mention_enabled BOOLEAN DEFAULT TRUE,
  ml_alert_enabled BOOLEAN DEFAULT TRUE,
  ml_weekly_enabled BOOLEAN DEFAULT TRUE,
  ml_recommendation_enabled BOOLEAN DEFAULT TRUE,
  stock_alert_enabled BOOLEAN DEFAULT TRUE,
  order_update_enabled BOOLEAN DEFAULT TRUE,
  
  -- Préférences email
  email_enabled BOOLEAN DEFAULT FALSE,
  email_frequency TEXT DEFAULT 'daily' CHECK (email_frequency IN ('instant', 'daily', 'weekly', 'never')),
  email_mention_enabled BOOLEAN DEFAULT TRUE,
  email_ml_alert_enabled BOOLEAN DEFAULT TRUE,
  email_digest_hour INTEGER DEFAULT 9 CHECK (email_digest_hour >= 0 AND email_digest_hour <= 23),
  email_digest_day INTEGER DEFAULT 1 CHECK (email_digest_day >= 0 AND email_digest_day <= 6), -- 0=Dim, 1=Lun
  
  -- Groupement
  group_similar_enabled BOOLEAN DEFAULT TRUE,
  group_time_window_minutes INTEGER DEFAULT 60,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_user_prefs FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_preferences" ON public.notification_preferences;
CREATE POLICY "users_read_own_preferences"
ON public.notification_preferences FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_preferences" ON public.notification_preferences;
CREATE POLICY "users_update_own_preferences"
ON public.notification_preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_preferences" ON public.notification_preferences;
CREATE POLICY "users_insert_own_preferences"
ON public.notification_preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. Table de cooldowns pour déduplication
-- ============================================
CREATE TABLE IF NOT EXISTS public.notification_cooldowns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  dedup_key TEXT NOT NULL, -- Clé unique pour identifier le contexte (ex: sku, order_id)
  last_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  count INTEGER DEFAULT 1, -- Nombre de fois que cette notif aurait été envoyée
  
  CONSTRAINT fk_user_cooldown FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_type_key UNIQUE (user_id, notification_type, dedup_key)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_cooldowns_user_type ON public.notification_cooldowns(user_id, notification_type);
CREATE INDEX IF NOT EXISTS idx_cooldowns_last_sent ON public.notification_cooldowns(last_sent_at);

-- RLS
ALTER TABLE public.notification_cooldowns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_manage_own_cooldowns" ON public.notification_cooldowns;
CREATE POLICY "allow_manage_own_cooldowns"
ON public.notification_cooldowns FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. Table pour les emails en attente (digest)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notification_email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  email_type TEXT DEFAULT 'digest' CHECK (email_type IN ('instant', 'digest')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_user_email_queue FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index
CREATE INDEX IF NOT EXISTS idx_email_queue_user_status ON public.notification_email_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON public.notification_email_queue(scheduled_at) WHERE status = 'pending';

-- RLS
ALTER TABLE public.notification_email_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_read_own_email_queue" ON public.notification_email_queue;
CREATE POLICY "allow_read_own_email_queue"
ON public.notification_email_queue FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- 4. Fonctions utilitaires
-- ============================================

-- Fonction pour obtenir ou créer les préférences utilisateur
CREATE OR REPLACE FUNCTION public.get_or_create_notification_preferences()
RETURNS public.notification_preferences AS $$
DECLARE
  v_prefs public.notification_preferences;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;
  
  -- Essayer de récupérer les préférences existantes
  SELECT * INTO v_prefs
  FROM public.notification_preferences
  WHERE user_id = v_user_id;
  
  -- Si pas trouvé, créer les préférences par défaut
  IF v_prefs IS NULL THEN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (v_user_id)
    RETURNING * INTO v_prefs;
  END IF;
  
  RETURN v_prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_or_create_notification_preferences TO authenticated;

-- Fonction pour vérifier le cooldown avant d'envoyer une notification
CREATE OR REPLACE FUNCTION public.check_notification_cooldown(
  p_user_id UUID,
  p_type TEXT,
  p_dedup_key TEXT,
  p_cooldown_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_sent TIMESTAMP WITH TIME ZONE;
  v_cooldown_period INTERVAL;
BEGIN
  v_cooldown_period := (p_cooldown_hours || ' hours')::INTERVAL;
  
  -- Chercher le dernier envoi
  SELECT last_sent_at INTO v_last_sent
  FROM public.notification_cooldowns
  WHERE user_id = p_user_id
    AND notification_type = p_type
    AND dedup_key = p_dedup_key;
  
  -- Si pas trouvé ou cooldown expiré, autoriser
  IF v_last_sent IS NULL OR (NOW() - v_last_sent) > v_cooldown_period THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_notification_cooldown TO authenticated;

-- Fonction pour enregistrer un envoi de notification (met à jour le cooldown)
CREATE OR REPLACE FUNCTION public.record_notification_sent(
  p_user_id UUID,
  p_type TEXT,
  p_dedup_key TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.notification_cooldowns (user_id, notification_type, dedup_key, last_sent_at, count)
  VALUES (p_user_id, p_type, p_dedup_key, NOW(), 1)
  ON CONFLICT (user_id, notification_type, dedup_key)
  DO UPDATE SET 
    last_sent_at = NOW(),
    count = public.notification_cooldowns.count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.record_notification_sent TO authenticated;

-- Fonction améliorée pour créer une notification avec vérification des préférences
CREATE OR REPLACE FUNCTION public.create_notification_v2(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_dedup_key TEXT DEFAULT NULL,
  p_cooldown_hours INTEGER DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_prefs public.notification_preferences;
  v_type_enabled BOOLEAN;
  v_can_send BOOLEAN;
BEGIN
  -- Récupérer les préférences
  SELECT * INTO v_prefs
  FROM public.notification_preferences
  WHERE user_id = p_user_id;
  
  -- Si pas de préférences, utiliser les valeurs par défaut (tout activé)
  IF v_prefs IS NULL THEN
    v_type_enabled := TRUE;
  ELSE
    -- Vérifier si le type est activé
    v_type_enabled := CASE p_type
      WHEN 'mention' THEN v_prefs.mention_enabled
      WHEN 'ml_alert' THEN v_prefs.ml_alert_enabled
      WHEN 'ml_weekly' THEN v_prefs.ml_weekly_enabled
      WHEN 'ml_recommendation' THEN v_prefs.ml_recommendation_enabled
      WHEN 'stock_alert' THEN v_prefs.stock_alert_enabled
      WHEN 'order_update' THEN v_prefs.order_update_enabled
      ELSE TRUE -- Types non configurés sont activés par défaut
    END;
  END IF;
  
  -- Si le type est désactivé, ne pas créer
  IF NOT v_type_enabled THEN
    RETURN NULL;
  END IF;
  
  -- Vérifier le cooldown si une clé de déduplication est fournie
  IF p_dedup_key IS NOT NULL THEN
    v_can_send := public.check_notification_cooldown(p_user_id, p_type, p_dedup_key, p_cooldown_hours);
    
    IF NOT v_can_send THEN
      -- Incrémenter le compteur mais ne pas créer la notification
      PERFORM public.record_notification_sent(p_user_id, p_type, p_dedup_key);
      RETURN NULL;
    END IF;
  END IF;
  
  -- Créer la notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    link,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_link,
    p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  -- Enregistrer l'envoi pour le cooldown
  IF p_dedup_key IS NOT NULL THEN
    PERFORM public.record_notification_sent(p_user_id, p_type, p_dedup_key);
  END IF;
  
  -- Ajouter à la queue email si nécessaire
  IF v_prefs IS NOT NULL AND v_prefs.email_enabled THEN
    INSERT INTO public.notification_email_queue (user_id, notification_id, email_type, scheduled_at)
    VALUES (
      p_user_id,
      v_notification_id,
      CASE 
        WHEN v_prefs.email_frequency = 'instant' THEN 'instant'
        ELSE 'digest'
      END,
      CASE
        WHEN v_prefs.email_frequency = 'instant' THEN NOW()
        ELSE NULL -- Sera traité par le job de digest
      END
    );
  END IF;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_notification_v2 TO authenticated;

-- Fonction pour obtenir les notifications groupées
CREATE OR REPLACE FUNCTION public.get_grouped_notifications(
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  group_id TEXT,
  notification_type TEXT,
  notification_count INTEGER,
  latest_title TEXT,
  latest_message TEXT,
  latest_link TEXT,
  latest_created_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN,
  notification_ids UUID[],
  metadata JSONB
) AS $$
DECLARE
  v_user_id UUID;
  v_prefs public.notification_preferences;
  v_group_enabled BOOLEAN;
  v_time_window INTERVAL;
BEGIN
  v_user_id := auth.uid();
  
  -- Récupérer les préférences
  SELECT * INTO v_prefs
  FROM public.notification_preferences
  WHERE user_id = v_user_id;
  
  v_group_enabled := COALESCE(v_prefs.group_similar_enabled, TRUE);
  v_time_window := COALESCE(v_prefs.group_time_window_minutes, 60) * INTERVAL '1 minute';
  
  IF NOT v_group_enabled THEN
    -- Retourner les notifications sans groupement
    RETURN QUERY
    SELECT 
      n.id::TEXT as group_id,
      n.type as notification_type,
      1 as notification_count,
      n.title as latest_title,
      n.message as latest_message,
      n.link as latest_link,
      n.created_at as latest_created_at,
      n.read as is_read,
      ARRAY[n.id] as notification_ids,
      n.metadata
    FROM public.notifications n
    WHERE n.user_id = v_user_id
    ORDER BY n.created_at DESC
    LIMIT p_limit;
  ELSE
    -- Grouper les notifications similaires
    RETURN QUERY
    WITH notification_groups AS (
      SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.link,
        n.created_at,
        n.read,
        n.metadata,
        -- Créer une clé de groupe basée sur le type et la fenêtre temporelle
        n.type || '_' || date_trunc('hour', n.created_at)::TEXT as temp_group_key
      FROM public.notifications n
      WHERE n.user_id = v_user_id
    ),
    grouped AS (
      SELECT
        MIN(ng.temp_group_key) as group_id,
        ng.type as notification_type,
        COUNT(*)::INTEGER as notification_count,
        (array_agg(ng.title ORDER BY ng.created_at DESC))[1] as latest_title,
        (array_agg(ng.message ORDER BY ng.created_at DESC))[1] as latest_message,
        (array_agg(ng.link ORDER BY ng.created_at DESC))[1] as latest_link,
        MAX(ng.created_at) as latest_created_at,
        bool_and(ng.read) as is_read,
        array_agg(ng.id ORDER BY ng.created_at DESC) as notification_ids,
        (array_agg(ng.metadata ORDER BY ng.created_at DESC))[1] as metadata
      FROM notification_groups ng
      GROUP BY ng.type, ng.temp_group_key
    )
    SELECT * FROM grouped
    ORDER BY latest_created_at DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_grouped_notifications TO authenticated;

-- Fonction pour nettoyer les vieux cooldowns (à appeler périodiquement)
CREATE OR REPLACE FUNCTION public.cleanup_old_cooldowns(p_days INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.notification_cooldowns
  WHERE last_sent_at < NOW() - (p_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Mise à jour du trigger de mentions pour utiliser v2
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_mentioned_users()
RETURNS TRIGGER AS $$
DECLARE
  v_mentioned_user_id UUID;
  v_author_name TEXT;
  v_order_id TEXT;
BEGIN
  SET search_path = public;

  -- Récupérer le nom de l'auteur du commentaire
  SELECT COALESCE(first_name || ' ' || last_name, email)
  INTO v_author_name
  FROM public.user_profiles
  WHERE user_id = NEW.user_id
  LIMIT 1;

  -- Si pas trouvé dans user_profiles, utiliser l'email de auth
  IF v_author_name IS NULL THEN
    SELECT email INTO v_author_name
    FROM auth.users
    WHERE id = NEW.user_id;
  END IF;

  v_order_id := NEW.order_id;

  -- Créer une notification pour chaque utilisateur mentionné
  IF NEW.mentioned_users IS NOT NULL THEN
    FOREACH v_mentioned_user_id IN ARRAY NEW.mentioned_users
    LOOP
      -- Ne pas notifier l'auteur si il se mentionne lui-même
      IF v_mentioned_user_id != NEW.user_id THEN
        -- Utiliser la nouvelle fonction v2 avec déduplication
        PERFORM public.create_notification_v2(
          v_mentioned_user_id,
          'mention',
          'Vous avez été mentionné',
          v_author_name || ' vous a mentionné dans un commentaire',
          '/track?order=' || v_order_id,
          jsonb_build_object(
            'comment_id', NEW.id,
            'order_id', v_order_id,
            'author_id', NEW.user_id,
            'author_name', v_author_name
          ),
          'mention_' || v_order_id || '_' || NEW.user_id, -- dedup_key
          1 -- cooldown_hours (1h pour les mentions)
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE public.notification_preferences IS 'Préférences de notification par utilisateur';
COMMENT ON TABLE public.notification_cooldowns IS 'Table de déduplication pour éviter le spam de notifications';
COMMENT ON TABLE public.notification_email_queue IS 'Queue des emails de notification à envoyer';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 077: Améliorations des notifications appliquées';
END $$;

