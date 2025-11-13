-- ============================================
-- Migration 012: Corrections RPC et Storage
-- ============================================
-- Correction des erreurs 404 et problèmes de RLS

-- ============================================
-- 1. VÉRIFIER ET CRÉER LES FONCTIONS MANQUANTES
-- ============================================

-- Vérifier si la fonction get_pending_invitations existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'get_pending_invitations'
    ) THEN
        RAISE NOTICE 'Fonction get_pending_invitations non trouvée, création...';
    END IF;
END $$;

-- Recréer toutes les fonctions RPC avec SET search_path
-- (au cas où elles n'auraient pas été créées par la migration 011)

-- Fonction pour récupérer le company_id de l'utilisateur actuel
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SET search_path = public;
  
  SELECT company_id INTO v_company_id
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  RETURN v_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fonction pour inviter un membre
CREATE OR REPLACE FUNCTION public.invite_team_member(
  p_email TEXT,
  p_role TEXT DEFAULT 'member',
  p_permissions JSONB DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_company_id UUID;
  v_invitation_id UUID;
  v_token TEXT;
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id
  v_company_id := public.get_current_user_company_id();
  
  IF v_company_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Vous devez appartenir à une entreprise pour inviter des collaborateurs'
    );
  END IF;
  
  -- Vérifier permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND company_id = v_company_id
    AND (role IN ('owner', 'admin') OR (permissions->>'can_invite')::boolean = TRUE)
  ) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Vous n''avez pas la permission d''inviter des collaborateurs'
    );
  END IF;
  
  -- Vérifier que l'email n'existe pas déjà
  IF EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN auth.users u ON u.id = up.id
    WHERE up.company_id = v_company_id AND u.email = p_email
  ) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Cet utilisateur fait déjà partie de votre entreprise'
    );
  END IF;
  
  -- Annuler les invitations en attente
  UPDATE public.invitations
  SET status = 'cancelled'
  WHERE company_id = v_company_id
    AND email = p_email
    AND status = 'pending';
  
  -- Créer l'invitation
  INSERT INTO public.invitations (
    company_id,
    invited_by_id,
    email,
    role,
    permissions
  )
  VALUES (
    v_company_id,
    auth.uid(),
    LOWER(p_email),
    p_role,
    COALESCE(p_permissions, '{"can_view": true, "can_edit": false, "can_delete": false, "can_invite": false}'::jsonb)
  )
  RETURNING id, token INTO v_invitation_id, v_token;
  
  RETURN json_build_object(
    'success', TRUE,
    'invitation_id', v_invitation_id,
    'token', v_token,
    'email', p_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour accepter une invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_invitation RECORD;
  v_user_id UUID;
BEGIN
  SET search_path = public;
  
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Vous devez être connecté pour accepter une invitation'
    );
  END IF;
  
  -- Récupérer l'invitation
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF v_invitation IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Invitation invalide ou expirée'
    );
  END IF;
  
  -- Vérifier l'email
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = v_user_id AND email = v_invitation.email
  ) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Cette invitation a été envoyée à une autre adresse email'
    );
  END IF;
  
  -- Mettre à jour le profil
  INSERT INTO public.user_profiles (
    id,
    company_id,
    role,
    permissions
  )
  VALUES (
    v_user_id,
    v_invitation.company_id,
    v_invitation.role,
    v_invitation.permissions
  )
  ON CONFLICT (id) DO UPDATE
  SET company_id = v_invitation.company_id,
      role = v_invitation.role,
      permissions = v_invitation.permissions,
      updated_at = NOW();
  
  -- Marquer l'invitation comme acceptée
  UPDATE public.invitations
  SET status = 'accepted',
      accepted_at = NOW()
  WHERE id = v_invitation.id;
  
  RETURN json_build_object(
    'success', TRUE,
    'company_id', v_invitation.company_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer les membres
CREATE OR REPLACE FUNCTION public.get_team_members()
RETURNS JSON AS $$
DECLARE
  v_company_id UUID;
  v_members JSON;
BEGIN
  SET search_path = public;
  
  v_company_id := public.get_current_user_company_id();
  
  IF v_company_id IS NULL THEN
    RETURN '[]'::json;
  END IF;
  
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', up.id,
      'email', u.email,
      'firstName', up.first_name,
      'lastName', up.last_name,
      'photoUrl', up.photo_url,
      'role', up.role,
      'permissions', up.permissions,
      'lastLoginAt', up.last_login_at,
      'createdAt', up.created_at
    )
  ), '[]'::json) INTO v_members
  FROM public.user_profiles up
  JOIN auth.users u ON u.id = up.id
  WHERE up.company_id = v_company_id;
  
  RETURN v_members;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer les invitations en attente
CREATE OR REPLACE FUNCTION public.get_pending_invitations()
RETURNS JSON AS $$
DECLARE
  v_company_id UUID;
  v_invitations JSON;
BEGIN
  SET search_path = public;
  
  v_company_id := public.get_current_user_company_id();
  
  IF v_company_id IS NULL THEN
    RETURN '[]'::json;
  END IF;
  
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', i.id,
      'email', i.email,
      'role', i.role,
      'status', i.status,
      'createdAt', i.created_at,
      'expiresAt', i.expires_at,
      'token', i.token,
      'invitedBy', json_build_object(
        'id', up.id,
        'firstName', up.first_name,
        'lastName', up.last_name,
        'email', u.email
      )
    )
  ), '[]'::json) INTO v_invitations
  FROM public.invitations i
  LEFT JOIN public.user_profiles up ON up.id = i.invited_by_id
  LEFT JOIN auth.users u ON u.id = up.id
  WHERE i.company_id = v_company_id
    AND i.status = 'pending'
    AND i.expires_at > NOW();
  
  RETURN v_invitations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour révoquer une invitation
CREATE OR REPLACE FUNCTION public.revoke_invitation(p_invitation_id UUID)
RETURNS JSON AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SET search_path = public;
  
  v_company_id := public.get_current_user_company_id();
  
  IF v_company_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Vous devez appartenir à une entreprise'
    );
  END IF;
  
  -- Vérifier que l'invitation appartient à la même entreprise
  IF NOT EXISTS (
    SELECT 1 FROM public.invitations
    WHERE id = p_invitation_id AND company_id = v_company_id
  ) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Invitation non trouvée'
    );
  END IF;
  
  -- Annuler l'invitation
  UPDATE public.invitations
  SET status = 'cancelled'
  WHERE id = p_invitation_id;
  
  RETURN json_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour retirer un membre
CREATE OR REPLACE FUNCTION public.remove_team_member(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_company_id UUID;
  v_target_role TEXT;
BEGIN
  SET search_path = public;
  
  v_company_id := public.get_current_user_company_id();
  
  IF v_company_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Vous devez appartenir à une entreprise'
    );
  END IF;
  
  -- Récupérer le rôle de la cible
  SELECT role INTO v_target_role
  FROM public.user_profiles
  WHERE id = p_user_id AND company_id = v_company_id;
  
  IF v_target_role IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Utilisateur non trouvé dans votre entreprise'
    );
  END IF;
  
  -- Ne pas permettre de retirer le owner
  IF v_target_role = 'owner' THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Impossible de retirer le propriétaire de l''entreprise'
    );
  END IF;
  
  -- Vérifier permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND company_id = v_company_id
    AND role IN ('owner', 'admin')
  ) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Vous n''avez pas la permission de retirer des membres'
    );
  END IF;
  
  -- Retirer l'utilisateur
  UPDATE public.user_profiles
  SET company_id = NULL,
      role = 'member',
      permissions = '{"can_view": true, "can_edit": false, "can_delete": false, "can_invite": false}'::jsonb,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN json_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. VÉRIFIER LES TABLES
-- ============================================

-- S'assurer que les tables existent
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb,
  industry TEXT,
  size TEXT,
  country TEXT,
  timezone TEXT DEFAULT 'Europe/Paris'
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  language TEXT DEFAULT 'fr',
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  permissions JSONB DEFAULT '{"can_view": true, "can_edit": false, "can_delete": false, "can_invite": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invited_by_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  permissions JSONB DEFAULT '{"can_view": true, "can_edit": false, "can_delete": false, "can_invite": false}'::jsonb,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 3. INDEX
-- ============================================

CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON public.user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_company_id ON public.invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

-- ============================================
-- 4. RLS POLICIES
-- ============================================

-- Activer RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Policies pour companies
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users can view their own company"
  ON public.companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can update their company" ON public.companies;
CREATE POLICY "Owners can update their company"
  ON public.companies FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Policies pour user_profiles
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.user_profiles;
CREATE POLICY "Users can view profiles in their company"
  ON public.user_profiles FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
    )
    OR id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Policies pour invitations
DROP POLICY IF EXISTS "Users can view invitations for their company" ON public.invitations;
CREATE POLICY "Users can view invitations for their company"
  ON public.invitations FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
    )
  );

-- ============================================
-- 5. TRIGGER POUR AUTO-CRÉATION COMPANY
-- ============================================

CREATE OR REPLACE FUNCTION public.create_company_for_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
BEGIN
  SET search_path = public;
  
  -- Créer une entreprise
  INSERT INTO public.companies (name, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', (NEW.email)::text || '''s Company'),
    NEW.id
  )
  RETURNING id INTO new_company_id;
  
  -- Créer le profil
  INSERT INTO public.user_profiles (
    id,
    company_id,
    first_name,
    last_name,
    role,
    permissions
  )
  VALUES (
    NEW.id,
    new_company_id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'owner',
    '{"can_view": true, "can_edit": true, "can_delete": true, "can_invite": true}'::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_company_for_user();

-- ============================================
-- 6. COMMENTAIRES
-- ============================================

COMMENT ON FUNCTION public.get_pending_invitations IS 'Récupère les invitations en attente pour l''entreprise actuelle';
COMMENT ON FUNCTION public.invite_team_member IS 'Invite un nouveau membre dans l''équipe';
COMMENT ON FUNCTION public.accept_invitation IS 'Accepte une invitation via son token';
COMMENT ON FUNCTION public.revoke_invitation IS 'Annule une invitation en attente';
COMMENT ON FUNCTION public.remove_team_member IS 'Retire un membre de l''équipe';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

