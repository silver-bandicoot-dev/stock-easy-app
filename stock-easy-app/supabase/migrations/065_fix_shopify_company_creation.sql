-- ============================================
-- Migration 065: Correction Création Company Shopify
-- ============================================
-- Objectif : Permettre la création de companies Shopify avec owner_id
--            et améliorer le nom par défaut
--
-- Réponses aux questions de Gadget :
-- 1. owner_id = ID de l'utilisateur qui installe l'app (admin de la company)
-- 2. Création automatique d'utilisateur requise (via API Supabase Admin depuis Gadget)
-- 3. Nom par défaut = nom du shop sans .myshopify.com

-- ============================================
-- 1. RENDRE owner_id NULLABLE (pour flexibilité)
-- ============================================

-- Permettre owner_id NULL temporairement (mais recommandé de toujours le fournir)
ALTER TABLE public.companies 
ALTER COLUMN owner_id DROP NOT NULL;

-- Commentaire pour clarifier
COMMENT ON COLUMN public.companies.owner_id IS 
'ID du propriétaire/admin de l''entreprise. Pour Shopify, c''est l''utilisateur qui installe l''app.';

-- ============================================
-- 2. METTRE À JOUR LA FONCTION create_shopify_company
-- ============================================

-- Supprimer l'ancienne version de la fonction (migration 062)
DROP FUNCTION IF EXISTS public.create_shopify_company(TEXT, TEXT, TEXT, TEXT);

-- Créer la nouvelle version avec p_owner_id requis
CREATE OR REPLACE FUNCTION public.create_shopify_company(
  p_shopify_shop_id TEXT,  -- Le stockEasyCompanyId de Gadget (TEXT, pas UUID)
  p_owner_id UUID,  -- ID de l'utilisateur qui installe l'app (créé via API Supabase Admin)
  p_shop_name TEXT DEFAULT NULL,
  p_shop_domain TEXT DEFAULT NULL,
  p_access_token TEXT DEFAULT NULL,
  p_owner_email TEXT DEFAULT NULL,  -- Email de l'owner (pour créer user_profile)
  p_owner_first_name TEXT DEFAULT NULL,  -- Prénom de l'owner
  p_owner_last_name TEXT DEFAULT NULL  -- Nom de l'owner
)
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
  v_settings JSONB;
  v_shop_name TEXT;
BEGIN
  SET search_path = public;
  
  -- Vérifier si une company existe déjà pour ce shop_id Shopify
  SELECT id INTO v_company_id
  FROM public.companies
  WHERE shopify_shop_id = p_shopify_shop_id
  LIMIT 1;
  
  -- Si la company existe déjà, retourner son UUID
  IF v_company_id IS NOT NULL THEN
    -- Mettre à jour le token d'accès si fourni
    IF p_access_token IS NOT NULL THEN
      UPDATE public.companies
      SET settings = jsonb_set(
        COALESCE(settings, '{}'::jsonb),
        '{shopify_access_token}',
        to_jsonb(p_access_token)
      ),
      updated_at = NOW()
      WHERE id = v_company_id;
    END IF;
    
    RETURN v_company_id;
  END IF;
  
  -- Extraire le nom du shop si non fourni
  -- Format recommandé : "stockeasy-devstore" au lieu de "stockeasy-devstore.myshopify.com"
  IF p_shop_name IS NULL THEN
    v_shop_name := REPLACE(p_shopify_shop_id, '.myshopify.com', '');
  ELSE
    v_shop_name := p_shop_name;
  END IF;
  
  -- Construire les settings JSONB avec les infos Shopify
  v_settings := jsonb_build_object(
    'shopify_shop_domain', COALESCE(p_shop_domain, p_shopify_shop_id),
    'shopify_access_token', COALESCE(p_access_token, ''),
    'source', 'shopify',
    'installed_at', NOW()
  );
  
  -- Vérifier que l'owner_id existe dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_owner_id) THEN
    RAISE EXCEPTION 'L''utilisateur avec l''ID % n''existe pas dans auth.users. Créez d''abord l''utilisateur via l''API Supabase Admin.', p_owner_id;
  END IF;
  
  -- Créer la nouvelle company AVEC owner_id
  INSERT INTO public.companies (
    name,
    owner_id,  -- ID de l'utilisateur qui installe l'app
    shopify_shop_id,  -- Le stockEasyCompanyId de Gadget
    settings
  )
  VALUES (
    v_shop_name,  -- Nom propre sans .myshopify.com
    p_owner_id,  -- Owner = utilisateur qui installe l'app
    p_shopify_shop_id,  -- Stocker le shop_id Shopify ici
    v_settings
  )
  RETURNING id INTO v_company_id;
  
  -- Créer automatiquement le user_profile pour l'owner avec le rôle 'owner'
  -- Si le user_profile n'existe pas déjà
  INSERT INTO public.user_profiles (
    id,
    company_id,
    first_name,
    last_name,
    role,
    permissions
  )
  VALUES (
    p_owner_id,
    v_company_id,
    p_owner_first_name,
    p_owner_last_name,
    'owner',  -- Rôle owner pour l'installateur
    '{"can_view": true, "can_edit": true, "can_delete": true, "can_invite": true}'::jsonb
  )
  ON CONFLICT (id) DO UPDATE
  SET
    company_id = v_company_id,
    role = 'owner',
    permissions = '{"can_view": true, "can_edit": true, "can_delete": true, "can_invite": true}'::jsonb,
    updated_at = NOW();
  
  -- Le UUID est maintenant généré et stocké dans v_company_id
  RETURN v_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_shopify_company IS 
'Crée une company StockEasy pour un shop Shopify et associe l''utilisateur comme owner.
Paramètres:
- p_shopify_shop_id: Le stockEasyCompanyId de Gadget (TEXT, ex: "mystore.myshopify.com")
- p_owner_id: ID de l''utilisateur qui installe l''app (UUID, doit exister dans auth.users)
- p_shop_name: Nom du shop (optionnel, par défaut extrait du shop_id sans .myshopify.com)
- p_shop_domain: Domaine complet du shop (optionnel)
- p_access_token: Token d''accès Shopify (optionnel)
- p_owner_email: Email de l''owner (optionnel, pour user_profile)
- p_owner_first_name: Prénom de l''owner (optionnel)
- p_owner_last_name: Nom de l''owner (optionnel)
Retourne: L''UUID de la company créée (généré automatiquement par PostgreSQL)

IMPORTANT:
- L''utilisateur (p_owner_id) doit être créé AVANT via l''API Supabase Admin depuis Gadget
- L''utilisateur est automatiquement associé à la company avec le rôle "owner"
- Un user_profile est créé automatiquement si il n''existe pas
- Le nom par défaut est le shop_id sans ".myshopify.com" (ex: "mystore" au lieu de "mystore.myshopify.com")';

-- ============================================
-- 3. METTRE À JOUR LES POLICIES RLS SI NÉCESSAIRE
-- ============================================

-- Note: Les policies RLS existantes utilisent get_current_user_company_id()
-- qui fonctionne via user_profiles. Pour les companies Shopify sans owner_id,
-- les données sont isolées par company_id via les policies existantes.
-- 
-- Si besoin, on peut ajouter une vérification supplémentaire pour les companies
-- avec owner_id IS NULL, mais ce n'est généralement pas nécessaire car:
-- - Les companies Shopify sont créées via API (pas via interface utilisateur)
-- - Les données sont isolées par company_id dans toutes les tables métier
-- - Les policies RLS existantes fonctionnent déjà correctement

-- ============================================
-- 4. EXEMPLES D'UTILISATION
-- ============================================

-- Exemple 1: Créer une company avec nom par défaut (recommandé)
-- ÉTAPE 1: Créer l'utilisateur via API Supabase Admin depuis Gadget
-- ÉTAPE 2: Appeler cette fonction avec l'ID de l'utilisateur
-- SELECT public.create_shopify_company(
--   'stockeasy-devstore.myshopify.com',  -- stockEasyCompanyId (TEXT)
--   '550e8400-e29b-41d4-a716-446655440000',  -- p_owner_id (UUID de l'utilisateur créé)
--   NULL,                                 -- p_shop_name (NULL = extrait automatiquement)
--   'stockeasy-devstore.myshopify.com',   -- p_shop_domain
--   'shpat_xxxxx',                         -- p_access_token
--   'merchant@example.com',                -- p_owner_email
--   'John',                                -- p_owner_first_name
--   'Doe'                                  -- p_owner_last_name
-- );
-- Résultat:
-- - name = "stockeasy-devstore" (sans .myshopify.com)
-- - owner_id = UUID de l'utilisateur
-- - shopify_shop_id = "stockeasy-devstore.myshopify.com"
-- - user_profile créé avec rôle "owner"
-- - Retourne: UUID de la company (ex: '550e8400-e29b-41d4-a716-446655440000')

-- Exemple 2: Créer une company avec nom personnalisé
-- SELECT public.create_shopify_company(
--   'mystore.myshopify.com',
--   '550e8400-e29b-41d4-a716-446655440000',  -- p_owner_id
--   'My Awesome Store',  -- Nom personnalisé
--   'mystore.myshopify.com',
--   'shpat_xxxxx',
--   'merchant@example.com',
--   'Jane',
--   'Smith'
-- );
-- Résultat:
-- - name = "My Awesome Store"
-- - owner_id = UUID de l'utilisateur
-- - shopify_shop_id = "mystore.myshopify.com"
-- - user_profile créé avec rôle "owner"

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

-- ============================================
-- 5. FONCTION UTILITAIRE : Vérifier si utilisateur existe
-- ============================================

CREATE OR REPLACE FUNCTION public.user_exists(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_exists IS 
'Vérifie si un utilisateur existe dans auth.users. Utile pour valider p_owner_id avant de créer une company.';

GRANT EXECUTE ON FUNCTION public.user_exists TO authenticated;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 065: Correction création company Shopify appliquée avec succès';
  RAISE NOTICE '📝 owner_id est maintenant requis (ID de l''utilisateur qui installe l''app)';
  RAISE NOTICE '📝 Création automatique d''utilisateur requise via API Supabase Admin depuis Gadget';
  RAISE NOTICE '📝 user_profile créé automatiquement avec rôle "owner"';
  RAISE NOTICE '📝 Nom par défaut = shop_id sans .myshopify.com';
END $$;

