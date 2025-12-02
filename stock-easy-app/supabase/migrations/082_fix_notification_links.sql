-- ============================================
-- Migration 082: Correction des liens de notifications
-- Mise à jour du trigger de mentions pour utiliser le bon format d'URL
-- Les liens doivent utiliser /app/orders?order=... au lieu de /track?order=...
-- ============================================

-- Mettre à jour la fonction de notification des mentions
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
        -- Utiliser la fonction v2 avec déduplication et le bon format de lien
        PERFORM public.create_notification_v2(
          v_mentioned_user_id,
          'mention',
          'Vous avez été mentionné',
          v_author_name || ' vous a mentionné dans un commentaire',
          '/app/orders?order=' || v_order_id,  -- Format corrigé
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

-- Mettre à jour les liens existants dans les notifications (optionnel)
-- Ceci corrige les anciennes notifications avec des liens /track?order=...
UPDATE public.notifications
SET link = REPLACE(link, '/track?order=', '/app/orders?order=')
WHERE link LIKE '/track?order=%';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 082: Liens de notifications corrigés';
END $$;

