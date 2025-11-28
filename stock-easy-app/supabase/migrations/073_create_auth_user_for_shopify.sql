-- ============================================
-- Migration 073: Fonction pour créer un utilisateur Shopify
-- ============================================
-- Objectif : Créer automatiquement un utilisateur auth.users 
--            quand un marchand installe l'app Shopify
--
-- Cette fonction est appelée depuis Gadget lors de l'installation

-- ============================================
-- 1. FONCTION POUR CRÉER L'UTILISATEUR AUTH
-- ============================================

CREATE OR REPLACE FUNCTION public.create_auth_user_for_shopify(
  p_email TEXT,
  p_shopify_shop_id TEXT,
  p_shop_name TEXT DEFAULT NULL,
  p_owner_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_existing_user_id UUID;
  v_random_password TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  SET search_path = public;
  
  -- Vérifier si un utilisateur existe déjà avec cet email
  SELECT id INTO v_existing_user_id
  FROM auth.users
  WHERE email = LOWER(p_email)
  LIMIT 1;
  
  -- Si l'utilisateur existe déjà, retourner son ID
  IF v_existing_user_id IS NOT NULL THEN
    RETURN v_existing_user_id;
  END IF;
  
  -- Générer un mot de passe aléatoire temporaire (l'utilisateur devra le réinitialiser)
  v_random_password := encode(gen_random_bytes(32), 'base64');
  
  -- Extraire prénom et nom si fournis
  IF p_owner_name IS NOT NULL AND p_owner_name != '' THEN
    v_first_name := split_part(p_owner_name, ' ', 1);
    v_last_name := NULLIF(substring(p_owner_name from position(' ' in p_owner_name) + 1), '');
  ELSE
    v_first_name := COALESCE(p_shop_name, split_part(p_shopify_shop_id, '.', 1));
    v_last_name := NULL;
  END IF;
  
  -- Créer l'utilisateur dans auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    LOWER(p_email),
    crypt(v_random_password, gen_salt('bf')),
    NOW(), -- Email confirmé automatiquement (vient de Shopify)
    jsonb_build_object(
      'provider', 'shopify',
      'providers', ARRAY['shopify'],
      'shopify_shop_id', p_shopify_shop_id
    ),
    jsonb_build_object(
      'first_name', v_first_name,
      'last_name', v_last_name,
      'shop_name', p_shop_name,
      'shopify_shop_id', p_shopify_shop_id,
      'source', 'shopify_app_install'
    ),
    NOW(),
    NOW(),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex')
  )
  RETURNING id INTO v_user_id;
  
  -- Créer aussi l'entrée dans auth.identities (requis par Supabase)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_user_id,
    LOWER(p_email),
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', LOWER(p_email),
      'email_verified', true,
      'shopify_shop_id', p_shopify_shop_id
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  );
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_auth_user_for_shopify IS 
'Crée un utilisateur auth.users pour un marchand Shopify lors de l''installation de l''app.
L''email est automatiquement confirmé (vient de Shopify = source fiable).
L''utilisateur devra réinitialiser son mot de passe via "Mot de passe oublié" pour accéder à Stockeasy.

Paramètres:
- p_email: Email du marchand (depuis Shopify)
- p_shopify_shop_id: ID du shop Shopify (ex: "mystore.myshopify.com")
- p_shop_name: Nom du shop (optionnel)
- p_owner_name: Nom complet du propriétaire (optionnel)

Retourne: UUID de l''utilisateur créé (ou existant si email déjà utilisé)';

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.create_auth_user_for_shopify TO service_role;

-- ============================================
-- 2. VERIFICATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 073: Fonction create_auth_user_for_shopify créée';
  RAISE NOTICE '📝 Cette fonction crée un utilisateur auth.users lors de l''installation Shopify';
  RAISE NOTICE '📝 L''utilisateur devra utiliser "Mot de passe oublié" pour définir son mot de passe';
END $$;


