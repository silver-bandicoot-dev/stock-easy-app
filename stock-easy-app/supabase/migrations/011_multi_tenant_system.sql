-- ============================================
-- Migration 011: Système Multi-Tenant Complet
-- ============================================
-- Objectif : Permettre à chaque entreprise d'avoir ses propres données
--            et de gérer ses collaborateurs avec un système d'invitation

-- ============================================
-- 1. TABLES DU SYSTÈME MULTI-TENANT
-- ============================================

-- Table des entreprises
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Paramètres de l'entreprise
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Informations supplémentaires
  industry TEXT,
  size TEXT, -- 'small', 'medium', 'large'
  country TEXT,
  timezone TEXT DEFAULT 'Europe/Paris'
);

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Informations personnelles
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  language TEXT DEFAULT 'fr',
  
  -- Rôle dans l'entreprise
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  
  -- Permissions
  permissions JSONB DEFAULT '{"can_view": true, "can_edit": false, "can_delete": false, "can_invite": false}'::jsonb,
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Table des invitations
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invited_by_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations de l'invitation
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  permissions JSONB DEFAULT '{"can_view": true, "can_edit": false, "can_delete": false, "can_invite": false}'::jsonb,
  
  -- Token sécurisé pour l'invitation
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(company_id, email, status)
);

-- ============================================
-- 2. INDEX POUR PERFORMANCES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON public.user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_company_id ON public.invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

-- ============================================
-- 3. AJOUTER company_id AUX TABLES EXISTANTES
-- ============================================

-- Ajouter company_id aux produits
ALTER TABLE public.produits 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_produits_company_id ON public.produits(company_id);

-- Ajouter company_id aux fournisseurs
ALTER TABLE public.fournisseurs 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_fournisseurs_company_id ON public.fournisseurs(company_id);

-- Ajouter company_id aux commandes
ALTER TABLE public.commandes 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_commandes_company_id ON public.commandes(company_id);

-- Ajouter company_id aux warehouses
ALTER TABLE public.warehouses 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_warehouses_company_id ON public.warehouses(company_id);

-- Ajouter company_id aux paramètres
ALTER TABLE public.parametres 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_parametres_company_id ON public.parametres(company_id);

-- Ajouter company_id aux SKU fournisseurs
ALTER TABLE public.sku_fournisseurs 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_sku_fournisseurs_company_id ON public.sku_fournisseurs(company_id);

-- Ajouter company_id aux snapshots KPI
ALTER TABLE public.kpi_snapshots 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_company_id ON public.kpi_snapshots(company_id);

-- ============================================
-- 4. FONCTIONS RPC POUR LE MULTI-TENANT
-- ============================================

-- Fonction pour créer une entreprise lors de l'inscription
CREATE OR REPLACE FUNCTION public.create_company_for_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
BEGIN
  SET search_path = public;
  
  -- Créer une nouvelle entreprise pour l'utilisateur
  INSERT INTO public.companies (name, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', (NEW.email)::text || '''s Company'),
    NEW.id
  )
  RETURNING id INTO new_company_id;
  
  -- Créer le profil utilisateur avec le rôle owner
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

-- Trigger pour créer automatiquement une entreprise lors de l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_company_for_user();

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

-- Fonction pour inviter un collaborateur
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
  
  -- Récupérer le company_id de l'utilisateur actuel
  v_company_id := public.get_current_user_company_id();
  
  IF v_company_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Vous devez appartenir à une entreprise pour inviter des collaborateurs'
    );
  END IF;
  
  -- Vérifier que l'utilisateur a la permission d'inviter
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
  
  -- Vérifier que l'email n'est pas déjà utilisé dans cette entreprise
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
  
  -- Annuler les invitations en attente pour cet email
  UPDATE public.invitations
  SET status = 'cancelled'
  WHERE company_id = v_company_id
    AND email = p_email
    AND status = 'pending';
  
  -- Créer la nouvelle invitation
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
  
  -- Vérifier que l'email correspond
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = v_user_id AND email = v_invitation.email
  ) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Cette invitation a été envoyée à une autre adresse email'
    );
  END IF;
  
  -- Mettre à jour ou créer le profil utilisateur
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

-- Fonction pour récupérer les membres de l'équipe
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
      'invitedBy', json_build_object(
        'id', up.id,
        'firstName', up.first_name,
        'lastName', up.last_name,
        'email', u.email
      )
    )
  ), '[]'::json) INTO v_invitations
  FROM public.invitations i
  JOIN public.user_profiles up ON up.id = i.invited_by_id
  JOIN auth.users u ON u.id = up.id
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

-- Fonction pour retirer un membre de l'équipe
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
  
  -- Vérifier que l'utilisateur à retirer fait partie de la même entreprise
  SELECT role INTO v_target_role
  FROM public.user_profiles
  WHERE id = p_user_id AND company_id = v_company_id;
  
  IF v_target_role IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Utilisateur non trouvé dans votre entreprise'
    );
  END IF;
  
  -- Ne pas permettre de retirer le propriétaire
  IF v_target_role = 'owner' THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Impossible de retirer le propriétaire de l''entreprise'
    );
  END IF;
  
  -- Vérifier les permissions
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
  
  -- Retirer l'utilisateur (mettre company_id à NULL)
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
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Activer RLS sur toutes les tables
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
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (id = auth.uid())
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

-- Policies pour les tables métier (produits, commandes, etc.)
-- Ces policies garantissent que chaque entreprise ne voit que ses données

DROP POLICY IF EXISTS "Users can only see their company's products" ON public.produits;
CREATE POLICY "Users can only see their company's products"
  ON public.produits FOR ALL
  USING (
    company_id = public.get_current_user_company_id()
    OR company_id IS NULL -- Pour la compatibilité avec les données existantes
  );

DROP POLICY IF EXISTS "Users can only see their company's suppliers" ON public.fournisseurs;
CREATE POLICY "Users can only see their company's suppliers"
  ON public.fournisseurs FOR ALL
  USING (
    company_id = public.get_current_user_company_id()
    OR company_id IS NULL
  );

DROP POLICY IF EXISTS "Users can only see their company's orders" ON public.commandes;
CREATE POLICY "Users can only see their company's orders"
  ON public.commandes FOR ALL
  USING (
    company_id = public.get_current_user_company_id()
    OR company_id IS NULL
  );

DROP POLICY IF EXISTS "Users can only see their company's warehouses" ON public.warehouses;
CREATE POLICY "Users can only see their company's warehouses"
  ON public.warehouses FOR ALL
  USING (
    company_id = public.get_current_user_company_id()
    OR company_id IS NULL
  );

DROP POLICY IF EXISTS "Users can only see their company's parameters" ON public.parametres;
CREATE POLICY "Users can only see their company's parameters"
  ON public.parametres FOR ALL
  USING (
    company_id = public.get_current_user_company_id()
    OR company_id IS NULL
  );

DROP POLICY IF EXISTS "Users can only see their company's sku_suppliers" ON public.sku_fournisseurs;
CREATE POLICY "Users can only see their company's sku_suppliers"
  ON public.sku_fournisseurs FOR ALL
  USING (
    company_id = public.get_current_user_company_id()
    OR company_id IS NULL
  );

DROP POLICY IF EXISTS "Users can only see their company's kpi_snapshots" ON public.kpi_snapshots;
CREATE POLICY "Users can only see their company's kpi_snapshots"
  ON public.kpi_snapshots FOR ALL
  USING (
    company_id = public.get_current_user_company_id()
    OR company_id IS NULL
  );

-- ============================================
-- 6. TRIGGERS POUR AUTO-COMPLÉTION company_id
-- ============================================

-- Fonction générique pour ajouter company_id automatiquement
CREATE OR REPLACE FUNCTION public.auto_set_company_id()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SET search_path = public;
  
  -- Si company_id n'est pas défini, le récupérer depuis le user_profile
  IF NEW.company_id IS NULL THEN
    v_company_id := public.get_current_user_company_id();
    NEW.company_id := v_company_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appliquer le trigger sur toutes les tables métier
DROP TRIGGER IF EXISTS set_company_id_on_produits ON public.produits;
CREATE TRIGGER set_company_id_on_produits
  BEFORE INSERT ON public.produits
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

DROP TRIGGER IF EXISTS set_company_id_on_fournisseurs ON public.fournisseurs;
CREATE TRIGGER set_company_id_on_fournisseurs
  BEFORE INSERT ON public.fournisseurs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

DROP TRIGGER IF EXISTS set_company_id_on_commandes ON public.commandes;
CREATE TRIGGER set_company_id_on_commandes
  BEFORE INSERT ON public.commandes
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

DROP TRIGGER IF EXISTS set_company_id_on_warehouses ON public.warehouses;
CREATE TRIGGER set_company_id_on_warehouses
  BEFORE INSERT ON public.warehouses
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

DROP TRIGGER IF EXISTS set_company_id_on_parametres ON public.parametres;
CREATE TRIGGER set_company_id_on_parametres
  BEFORE INSERT ON public.parametres
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

DROP TRIGGER IF EXISTS set_company_id_on_sku_fournisseurs ON public.sku_fournisseurs;
CREATE TRIGGER set_company_id_on_sku_fournisseurs
  BEFORE INSERT ON public.sku_fournisseurs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

DROP TRIGGER IF EXISTS set_company_id_on_kpi_snapshots ON public.kpi_snapshots;
CREATE TRIGGER set_company_id_on_kpi_snapshots
  BEFORE INSERT ON public.kpi_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

-- ============================================
-- 7. FONCTION POUR METTRE À JOUR get_all_data
-- ============================================

-- Mettre à jour get_all_data pour filtrer par company_id
CREATE OR REPLACE FUNCTION public.get_all_data()
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_company_id UUID;
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id de l'utilisateur actuel
  v_company_id := public.get_current_user_company_id();
  
  SELECT json_build_object(
    'products', (
      SELECT COALESCE(json_agg(row_to_json(p)), '[]'::json) 
      FROM public.produits p 
      WHERE p.company_id = v_company_id OR p.company_id IS NULL
    ),
    'suppliers', (
      SELECT COALESCE(json_agg(row_to_json(f)), '[]'::json) 
      FROM public.fournisseurs f 
      WHERE f.company_id = v_company_id OR f.company_id IS NULL
    ),
    'warehouses', (
      SELECT COALESCE(json_agg(row_to_json(w)), '[]'::json) 
      FROM public.warehouses w 
      WHERE w.company_id = v_company_id OR w.company_id IS NULL
    ),
    'orders', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', c.id,
          'supplier', c.supplier,
          'warehouseId', c.warehouse_id,
          'status', c.status,
          'total', c.total,
          'createdAt', c.created_at,
          'eta', c.eta,
          'confirmedAt', c.confirmed_at,
          'shippedAt', c.shipped_at,
          'receivedAt', c.received_at,
          'completedAt', c.completed_at,
          'trackingNumber', c.tracking_number,
          'trackingUrl', c.tracking_url,
          'hasDiscrepancy', c.has_discrepancy,
          'damageReport', c.damage_report,
          'notes', c.notes,
          'items', (SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json) FROM public.articles_commande a WHERE a.order_id = c.id)
        )
      ), '[]'::json)
      FROM public.commandes c
      WHERE c.company_id = v_company_id OR c.company_id IS NULL
    ),
    'parameters', (
      SELECT COALESCE(json_agg(row_to_json(param)), '[]'::json) 
      FROM public.parametres param 
      WHERE param.company_id = v_company_id OR param.company_id IS NULL
    ),
    'skuSuppliers', (
      SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json) 
      FROM public.sku_fournisseurs s 
      WHERE s.company_id = v_company_id OR s.company_id IS NULL
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. COMMENTAIRES
-- ============================================

COMMENT ON TABLE public.companies IS 'Table des entreprises pour le système multi-tenant';
COMMENT ON TABLE public.user_profiles IS 'Profils utilisateurs avec rôles et permissions par entreprise';
COMMENT ON TABLE public.invitations IS 'Invitations pour rejoindre une entreprise';

COMMENT ON FUNCTION public.invite_team_member IS 'Invite un nouveau membre dans l''équipe (admin/owner uniquement)';
COMMENT ON FUNCTION public.accept_invitation IS 'Accepte une invitation via son token';
COMMENT ON FUNCTION public.get_team_members IS 'Récupère tous les membres de l''équipe de l''entreprise actuelle';
COMMENT ON FUNCTION public.get_pending_invitations IS 'Récupère les invitations en attente pour l''entreprise actuelle';
COMMENT ON FUNCTION public.revoke_invitation IS 'Annule une invitation en attente';
COMMENT ON FUNCTION public.remove_team_member IS 'Retire un membre de l''équipe (admin/owner uniquement)';
COMMENT ON FUNCTION public.get_current_user_company_id IS 'Retourne le company_id de l''utilisateur actuel (utilisé dans les RLS)';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

