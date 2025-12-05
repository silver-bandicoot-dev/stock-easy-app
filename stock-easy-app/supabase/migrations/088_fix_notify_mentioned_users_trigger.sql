-- ============================================
-- Migration 088: Correction du trigger notify_mentioned_users
-- ============================================
-- Problème: Le trigger référence user_profiles.user_id qui n'existe pas
-- La colonne correcte est user_profiles.id
-- Erreur: 'column "user_id" does not exist'

BEGIN;

-- Recréer la fonction avec la bonne colonne (id au lieu de user_id)
CREATE OR REPLACE FUNCTION public.notify_mentioned_users()
RETURNS TRIGGER AS $$
DECLARE
  v_mentioned_user_id UUID;
  v_author_name TEXT;
  v_order_id TEXT;
BEGIN
  SET search_path = public;

  -- Récupérer le nom de l'auteur du commentaire
  -- CORRECTION: utiliser id au lieu de user_id dans user_profiles
  SELECT COALESCE(first_name || ' ' || last_name, email)
  INTO v_author_name
  FROM public.user_profiles
  WHERE id = NEW.user_id
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
          '/app/orders?order=' || v_order_id,
          jsonb_build_object(
            'comment_id', NEW.id,
            'order_id', v_order_id,
            'author_id', NEW.user_id,
            'author_name', v_author_name
          ),
          'mention_' || v_order_id || '_' || NEW.user_id,
          1
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 088 terminée - Trigger notify_mentioned_users corrigé';
END $$;

