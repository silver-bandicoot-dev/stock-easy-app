-- ============================================
-- Migration 043: Champs de contacts fournisseurs
-- ============================================

-- Ajout de champs dédiés aux contacts commerciaux et réclamations
ALTER TABLE public.fournisseurs
ADD COLUMN IF NOT EXISTS commercial_contact_name text,
ADD COLUMN IF NOT EXISTS commercial_contact_email text,
ADD COLUMN IF NOT EXISTS commercial_contact_phone text,
ADD COLUMN IF NOT EXISTS reclamation_contact_name text,
ADD COLUMN IF NOT EXISTS reclamation_contact_email text,
ADD COLUMN IF NOT EXISTS reclamation_contact_phone text,
ADD COLUMN IF NOT EXISTS reclamation_contact_role text,
ADD COLUMN IF NOT EXISTS contact_notes text;

COMMENT ON COLUMN public.fournisseurs.commercial_contact_name IS 'Nom du contact commercial principal (commandes, devis)';
COMMENT ON COLUMN public.fournisseurs.commercial_contact_email IS 'Email du contact commercial principal (commandes, devis)';
COMMENT ON COLUMN public.fournisseurs.commercial_contact_phone IS 'Téléphone du contact commercial principal (commandes, devis)';

COMMENT ON COLUMN public.fournisseurs.reclamation_contact_name IS 'Nom du contact réclamations / SAV';
COMMENT ON COLUMN public.fournisseurs.reclamation_contact_email IS 'Email du contact réclamations (qualité, logistique, service client)';
COMMENT ON COLUMN public.fournisseurs.reclamation_contact_phone IS 'Téléphone du contact réclamations';
COMMENT ON COLUMN public.fournisseurs.reclamation_contact_role IS 'Rôle du contact réclamations (Qualité, Logistique, Service Client, Autre)';

COMMENT ON COLUMN public.fournisseurs.contact_notes IS 'Notes et historique sur les contacts (réactivité, délais de réponse, préférences)';


