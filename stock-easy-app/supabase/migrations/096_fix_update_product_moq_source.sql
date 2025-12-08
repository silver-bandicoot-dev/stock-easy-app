-- Migration 096: Correction de update_product pour gérer moq_source
-- Le champ moq_source n'était pas mis à jour lors de la modification manuelle du MOQ

-- Recréer la fonction update_product avec support de moq_source
CREATE OR REPLACE FUNCTION public.update_product(p_sku text, p_data jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID;
BEGIN
  v_company_id := get_current_user_company_id();
  
  UPDATE public.produits
  SET 
    nom_produit = COALESCE((p_data->>'nom_produit')::TEXT, nom_produit),
    stock_actuel = COALESCE((p_data->>'stock_actuel')::DECIMAL(10,2), stock_actuel),
    ventes_totales_30j = COALESCE((p_data->>'ventes_totales_30j')::INTEGER, ventes_totales_30j),
    ventes_jour_moy_30j = COALESCE((p_data->>'ventes_jour_moy_30j')::DECIMAL(10,4), ventes_jour_moy_30j),
    multiplicateur_prevision = COALESCE((p_data->>'multiplicateur_prevision')::DECIMAL(10,2), multiplicateur_prevision),
    fournisseur = COALESCE((p_data->>'fournisseur')::TEXT, fournisseur),
    lead_time_days = COALESCE((p_data->>'lead_time_days')::INTEGER, lead_time_days),
    moq = COALESCE((p_data->>'moq')::INTEGER, moq),
    -- ✅ AJOUT: Support de moq_source pour tracer l'origine du MOQ
    moq_source = COALESCE((p_data->>'moq_source')::TEXT, moq_source),
    prix_achat = COALESCE((p_data->>'prix_achat')::DECIMAL(10,2), prix_achat),
    prix_vente = COALESCE((p_data->>'prix_vente')::DECIMAL(10,2), prix_vente),
    stock_secu_custom_jours = COALESCE((p_data->>'stock_secu_custom_jours')::INTEGER, stock_secu_custom_jours),
    point_commande = COALESCE((p_data->>'point_commande')::DECIMAL(10,2), point_commande),
    qte_a_commander = COALESCE((p_data->>'qte_a_commander')::INTEGER, qte_a_commander),
    statut = COALESCE((p_data->>'statut')::TEXT, statut),
    investissement = COALESCE((p_data->>'investissement')::DECIMAL(10,2), investissement),
    sync_source = CASE 
      WHEN (p_data->>'stock_actuel') IS NOT NULL AND (p_data->>'stock_actuel')::DECIMAL(10,2) IS DISTINCT FROM stock_actuel 
      THEN 'manual' 
      ELSE sync_source 
    END,
    -- ✅ AJOUT: Mettre à jour le timestamp
    updated_at = NOW()
  WHERE sku = p_sku
    AND company_id = v_company_id;  -- ✅ FILTRAGE MULTI-TENANT
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Produit non trouvé ou accès non autorisé');
  END IF;
  
  RETURN json_build_object('success', TRUE, 'message', 'Produit mis à jour');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- Vérification que la colonne moq_source existe bien
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'produits' 
    AND column_name = 'moq_source'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN moq_source TEXT;
    COMMENT ON COLUMN public.produits.moq_source IS 'Source du MOQ: manuel, fournisseur_defaut, etc.';
  END IF;
END $$;

COMMENT ON FUNCTION public.update_product(text, jsonb) IS 'Met à jour un produit - inclut moq_source pour tracer l''origine du MOQ';

