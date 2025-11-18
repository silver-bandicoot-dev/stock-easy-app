-- ============================================
-- Migration: Complete Multi-Tenant Isolation
-- ============================================
-- Objectif: S'assurer que TOUTES les tables sont isolées par company_id
--           Ajouter company_id aux tables manquantes et mettre à jour les policies RLS

BEGIN;

-- ============================================
-- 1. AJOUTER company_id AUX TABLES MANQUANTES
-- ============================================

-- Table order_comments
ALTER TABLE public.order_comments 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_order_comments_company_id ON public.order_comments(company_id);

-- Table notifications
ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON public.notifications(company_id);

-- Table sales_history (si elle existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_history') THEN
    ALTER TABLE public.sales_history 
      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_sales_history_company_id ON public.sales_history(company_id);
  END IF;
END $$;

-- Table articles_commande (si elle existe et n'a pas company_id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'articles_commande') THEN
    -- Vérifier si la colonne existe déjà
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'articles_commande' 
      AND column_name = 'company_id'
    ) THEN
      ALTER TABLE public.articles_commande 
        ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
      
      CREATE INDEX IF NOT EXISTS idx_articles_commande_company_id ON public.articles_commande(company_id);
      
      -- Mettre à jour les company_id existants depuis la commande parente
      UPDATE public.articles_commande ac
      SET company_id = c.company_id
      FROM public.commandes c
      WHERE ac.order_id = c.id
      AND ac.company_id IS NULL;
    END IF;
  END IF;
END $$;

-- ============================================
-- 2. TRIGGERS POUR AUTO-COMPLÉTION company_id
-- ============================================

-- Trigger pour order_comments
DROP TRIGGER IF EXISTS set_company_id_on_order_comments ON public.order_comments;
CREATE TRIGGER set_company_id_on_order_comments
  BEFORE INSERT ON public.order_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

-- Trigger pour notifications
DROP TRIGGER IF EXISTS set_company_id_on_notifications ON public.notifications;
CREATE TRIGGER set_company_id_on_notifications
  BEFORE INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

-- Trigger pour articles_commande (si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'articles_commande') THEN
    DROP TRIGGER IF EXISTS set_company_id_on_articles_commande ON public.articles_commande;
    EXECUTE '
      CREATE TRIGGER set_company_id_on_articles_commande
        BEFORE INSERT ON public.articles_commande
        FOR EACH ROW
        EXECUTE FUNCTION public.auto_set_company_id()';
  END IF;
END $$;

-- ============================================
-- 3. POLICIES RLS STRICTES POUR ORDER_COMMENTS
-- ============================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "allow_authenticated_read_comments" ON public.order_comments;
DROP POLICY IF EXISTS "allow_authenticated_insert_comments" ON public.order_comments;
DROP POLICY IF EXISTS "allow_own_update_comments" ON public.order_comments;
DROP POLICY IF EXISTS "allow_own_delete_comments" ON public.order_comments;

-- Nouvelles policies basées sur company_id
CREATE POLICY "Users can only see their company's order comments"
  ON public.order_comments FOR SELECT
  USING (company_id = public.get_current_user_company_id());

CREATE POLICY "Users can only insert comments for their company"
  ON public.order_comments FOR INSERT
  WITH CHECK (
    company_id = public.get_current_user_company_id()
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can only update their own comments in their company"
  ON public.order_comments FOR UPDATE
  USING (
    company_id = public.get_current_user_company_id()
    AND auth.uid() = user_id
  )
  WITH CHECK (
    company_id = public.get_current_user_company_id()
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can only delete their own comments in their company"
  ON public.order_comments FOR DELETE
  USING (
    company_id = public.get_current_user_company_id()
    AND auth.uid() = user_id
  );

-- ============================================
-- 4. POLICIES RLS STRICTES POUR NOTIFICATIONS
-- ============================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "allow_read_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "allow_update_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "allow_delete_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "allow_insert_notifications" ON public.notifications;

-- Nouvelles policies basées sur company_id
CREATE POLICY "Users can only see notifications for their company"
  ON public.notifications FOR SELECT
  USING (
    company_id = public.get_current_user_company_id()
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can only insert notifications for their company"
  ON public.notifications FOR INSERT
  WITH CHECK (
    company_id = public.get_current_user_company_id()
    AND user_id IN (
      SELECT id FROM public.user_profiles 
      WHERE company_id = public.get_current_user_company_id()
    )
  );

CREATE POLICY "Users can only update their own notifications in their company"
  ON public.notifications FOR UPDATE
  USING (
    company_id = public.get_current_user_company_id()
    AND auth.uid() = user_id
  )
  WITH CHECK (
    company_id = public.get_current_user_company_id()
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can only delete their own notifications in their company"
  ON public.notifications FOR DELETE
  USING (
    company_id = public.get_current_user_company_id()
    AND auth.uid() = user_id
  );

-- ============================================
-- 5. METTRE À JOUR LA FONCTION notify_mentioned_users
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_mentioned_users()
RETURNS TRIGGER AS $$
DECLARE
  v_mentioned_user_id UUID;
  v_author_name TEXT;
  v_order_id TEXT;
  v_company_id UUID;
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id depuis la commande
  SELECT c.company_id INTO v_company_id
  FROM public.commandes c
  WHERE c.id = NEW.order_id;
  
  -- Si pas de company_id, utiliser celui de l'utilisateur actuel
  IF v_company_id IS NULL THEN
    v_company_id := public.get_current_user_company_id();
  END IF;
  
  -- Récupérer le nom de l'auteur du commentaire
  SELECT COALESCE(up.first_name || ' ' || up.last_name, u.email)
  INTO v_author_name
  FROM auth.users u
  LEFT JOIN public.user_profiles up ON up.id = u.id
  WHERE u.id = NEW.user_id
  LIMIT 1;

  v_order_id := NEW.order_id;

  -- Créer une notification pour chaque utilisateur mentionné
  IF NEW.mentioned_users IS NOT NULL THEN
    FOREACH v_mentioned_user_id IN ARRAY NEW.mentioned_users
    LOOP
      -- Ne notifier que les utilisateurs de la même company
      IF EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = v_mentioned_user_id
        AND company_id = v_company_id
      ) THEN
        -- Ne pas notifier l'auteur si il se mentionne lui-même
        IF v_mentioned_user_id != NEW.user_id THEN
          INSERT INTO public.notifications (
            user_id,
            company_id,
            type,
            title,
            message,
            link,
            metadata
          ) VALUES (
            v_mentioned_user_id,
            v_company_id,
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
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. METTRE À JOUR LES company_id EXISTANTS
-- ============================================

-- Mettre à jour order_comments depuis les commandes
UPDATE public.order_comments oc
SET company_id = c.company_id
FROM public.commandes c
WHERE oc.order_id = c.id
AND oc.company_id IS NULL;

-- Mettre à jour notifications depuis user_profiles
UPDATE public.notifications n
SET company_id = up.company_id
FROM public.user_profiles up
WHERE n.user_id = up.id
AND n.company_id IS NULL;

-- ============================================
-- 7. RENDRE company_id OBLIGATOIRE
-- ============================================

-- Après avoir mis à jour les données existantes, rendre company_id obligatoire
ALTER TABLE public.order_comments 
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.notifications 
  ALTER COLUMN company_id SET NOT NULL;

-- ============================================
-- 8. S'ASSURER QUE RLS EST ACTIVÉ
-- ============================================

ALTER TABLE public.order_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. COMMENTAIRES
-- ============================================

COMMENT ON COLUMN public.order_comments.company_id IS 'ID de l''entreprise - garantit l''isolation des données';
COMMENT ON COLUMN public.notifications.company_id IS 'ID de l''entreprise - garantit l''isolation des données';

COMMIT;

