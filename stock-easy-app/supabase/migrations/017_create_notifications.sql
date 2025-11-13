-- ============================================
-- Migration 017: Système de Notifications
-- ============================================

-- Créer la table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'mention', 'order_update', 'alert', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- URL vers la ressource concernée
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Métadonnées supplémentaires (JSON)
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Contraintes
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = FALSE;

-- Activer Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour notifications
DROP POLICY IF EXISTS "allow_read_own_notifications" ON public.notifications;
CREATE POLICY "allow_read_own_notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "allow_update_own_notifications" ON public.notifications;
CREATE POLICY "allow_update_own_notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "allow_delete_own_notifications" ON public.notifications;
CREATE POLICY "allow_delete_own_notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Politique pour permettre l'insertion de notifications (par le système)
DROP POLICY IF EXISTS "allow_insert_notifications" ON public.notifications;
CREATE POLICY "allow_insert_notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Activer Realtime pour la table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================
-- Fonction pour créer une notification
-- ============================================

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  SET search_path = public;

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

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;

-- ============================================
-- Fonction pour marquer une notification comme lue
-- ============================================

CREATE OR REPLACE FUNCTION public.mark_notification_as_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  SET search_path = public;

  UPDATE public.notifications
  SET read = TRUE
  WHERE id = p_notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.mark_notification_as_read TO authenticated;

-- ============================================
-- Fonction pour marquer toutes les notifications comme lues
-- ============================================

CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read()
RETURNS VOID AS $$
BEGIN
  SET search_path = public;

  UPDATE public.notifications
  SET read = TRUE
  WHERE user_id = auth.uid() AND read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.mark_all_notifications_as_read TO authenticated;

-- ============================================
-- Trigger pour créer des notifications lors des mentions
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
        INSERT INTO public.notifications (
          user_id,
          type,
          title,
          message,
          link,
          metadata
        ) VALUES (
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
          )
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_notify_mentions ON public.order_comments;
CREATE TRIGGER trigger_notify_mentions
  AFTER INSERT ON public.order_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_mentioned_users();

-- Commentaires
COMMENT ON TABLE public.notifications IS 'Notifications utilisateur pour mentions, alertes, etc.';
COMMENT ON COLUMN public.notifications.type IS 'Type de notification: mention, order_update, alert, etc.';
COMMENT ON COLUMN public.notifications.read IS 'Indique si la notification a été lue';
COMMENT ON COLUMN public.notifications.metadata IS 'Données JSON supplémentaires liées à la notification';

DO $$
BEGIN
  RAISE NOTICE '✅ Système de notifications créé avec succès';
END $$;





