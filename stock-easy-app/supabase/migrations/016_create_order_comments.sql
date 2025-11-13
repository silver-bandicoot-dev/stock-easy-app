-- ============================================
-- Migration 016: Table des commentaires de commandes
-- ============================================

-- Créer la table order_comments si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.order_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  mentioned_users UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES public.commandes(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_order_comments_order_id ON public.order_comments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_comments_user_id ON public.order_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_order_comments_created_at ON public.order_comments(created_at);

-- Activer Row Level Security
ALTER TABLE public.order_comments ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour order_comments
DROP POLICY IF EXISTS "allow_authenticated_read_comments" ON public.order_comments;
CREATE POLICY "allow_authenticated_read_comments"
ON public.order_comments
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "allow_authenticated_insert_comments" ON public.order_comments;
CREATE POLICY "allow_authenticated_insert_comments"
ON public.order_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "allow_own_update_comments" ON public.order_comments;
CREATE POLICY "allow_own_update_comments"
ON public.order_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "allow_own_delete_comments" ON public.order_comments;
CREATE POLICY "allow_own_delete_comments"
ON public.order_comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Activer Realtime pour la table
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_comments;

-- Commentaires sur la table
COMMENT ON TABLE public.order_comments IS 'Commentaires sur les commandes avec support des mentions';
COMMENT ON COLUMN public.order_comments.order_id IS 'ID de la commande';
COMMENT ON COLUMN public.order_comments.user_id IS 'ID de l''utilisateur qui a posté le commentaire';
COMMENT ON COLUMN public.order_comments.content IS 'Contenu du commentaire';
COMMENT ON COLUMN public.order_comments.mentioned_users IS 'IDs des utilisateurs mentionnés';

DO $$
BEGIN
  RAISE NOTICE '✅ Table order_comments créée avec succès';
END $$;

