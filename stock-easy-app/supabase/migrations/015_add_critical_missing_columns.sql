-- ============================================
-- Migration 015: Ajout des Colonnes Critiques Manquantes
-- ============================================
-- Cette migration ajoute toutes les colonnes essentielles pour une gestion
-- intelligente des stocks et des informations précises pour les utilisateurs

-- ============================================
-- 1. COLONNES DE CALCUL ET MÉTRIQUES
-- ============================================

DO $$
BEGIN
  -- Stock de sécurité (calculé automatiquement)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'stock_securite'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN stock_securite INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne stock_securite ajoutée';
  END IF;

  -- Autonomie en jours (combien de jours de ventes le stock peut couvrir)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'autonomie_jours'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN autonomie_jours INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne autonomie_jours ajoutée';
  END IF;

  -- Stock maximum recommandé
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'stock_max'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN stock_max INTEGER DEFAULT NULL;
    RAISE NOTICE '✅ Colonne stock_max ajoutée';
  END IF;

  -- Taux de rotation du stock (nombre de fois que le stock est renouvelé par an)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'taux_rotation'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN taux_rotation NUMERIC(10,2) DEFAULT 0;
    RAISE NOTICE '✅ Colonne taux_rotation ajoutée';
  END IF;

  -- Coût de stockage par unité par jour
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'cout_stockage_unitaire'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN cout_stockage_unitaire NUMERIC(10,4) DEFAULT 0.01;
    RAISE NOTICE '✅ Colonne cout_stockage_unitaire ajoutée';
  END IF;

  -- Coût total de stockage
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'cout_stockage_total'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN cout_stockage_total NUMERIC(10,2) DEFAULT 0;
    RAISE NOTICE '✅ Colonne cout_stockage_total ajoutée';
  END IF;

  -- Risque de rupture (0-100)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'risque_rupture'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN risque_rupture INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne risque_rupture ajoutée';
  END IF;

  -- Risque de surstock (0-100)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'risque_surstock'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN risque_surstock INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne risque_surstock ajoutée';
  END IF;

  -- Tendance des ventes (hausse, baisse, stable)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'tendance_ventes'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN tendance_ventes TEXT DEFAULT 'stable';
    RAISE NOTICE '✅ Colonne tendance_ventes ajoutée';
  END IF;

  -- Pourcentage de variation des ventes (sur 30 jours)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'variation_ventes_pct'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN variation_ventes_pct NUMERIC(10,2) DEFAULT 0;
    RAISE NOTICE '✅ Colonne variation_ventes_pct ajoutée';
  END IF;

  -- Marge brute (quantité × marge unitaire)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'marge_brute'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN marge_brute NUMERIC(10,2) DEFAULT 0;
    RAISE NOTICE '✅ Colonne marge_brute ajoutée';
  END IF;

  -- Revenu potentiel (si tout le stock actuel est vendu)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'revenu_potentiel'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN revenu_potentiel NUMERIC(10,2) DEFAULT 0;
    RAISE NOTICE '✅ Colonne revenu_potentiel ajoutée';
  END IF;

  -- Priorité de commande (1-10, 10 étant le plus urgent)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'priorite_commande'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN priorite_commande INTEGER DEFAULT 5;
    RAISE NOTICE '✅ Colonne priorite_commande ajoutée';
  END IF;

  -- Date de dernière vente
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'derniere_vente'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN derniere_vente TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    RAISE NOTICE '✅ Colonne derniere_vente ajoutée';
  END IF;

  -- Date de dernière commande
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'derniere_commande'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN derniere_commande TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    RAISE NOTICE '✅ Colonne derniere_commande ajoutée';
  END IF;

  -- Nombre de commandes en cours
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'commandes_en_cours'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN commandes_en_cours INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne commandes_en_cours ajoutée';
  END IF;

  -- Quantité en transit (commandée mais pas encore reçue)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'qte_en_transit'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN qte_en_transit INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne qte_en_transit ajoutée';
  END IF;

  -- Stock projeté (stock actuel + en transit - ventes projetées)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'stock_projete'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN stock_projete INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne stock_projete ajoutée';
  END IF;

  -- Date estimée de rupture de stock
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'date_rupture_estimee'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN date_rupture_estimee TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    RAISE NOTICE '✅ Colonne date_rupture_estimee ajoutée';
  END IF;

  -- Coefficient de saisonnalité (pour ajuster les prévisions)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'coefficient_saisonnalite'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN coefficient_saisonnalite NUMERIC(10,2) DEFAULT 1.0;
    RAISE NOTICE '✅ Colonne coefficient_saisonnalite ajoutée';
  END IF;

  -- Score de performance global (0-100)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'score_performance'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN score_performance INTEGER DEFAULT 50;
    RAISE NOTICE '✅ Colonne score_performance ajoutée';
  END IF;

  -- Catégorie ABC (A: haute valeur, B: moyenne, C: faible)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'categorie_abc'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN categorie_abc TEXT DEFAULT 'B';
    RAISE NOTICE '✅ Colonne categorie_abc ajoutée';
  END IF;

  -- Fiabilité du fournisseur (0-100)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'fiabilite_fournisseur'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN fiabilite_fournisseur INTEGER DEFAULT 80;
    RAISE NOTICE '✅ Colonne fiabilite_fournisseur ajoutée';
  END IF;

  -- Notes et alertes pour l'utilisateur
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'notes_alertes'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN notes_alertes TEXT DEFAULT NULL;
    RAISE NOTICE '✅ Colonne notes_alertes ajoutée';
  END IF;

END $$;

-- ============================================
-- 2. INDEX POUR AMÉLIORER LES PERFORMANCES
-- ============================================

-- Index sur les colonnes de recherche et filtrage fréquentes
CREATE INDEX IF NOT EXISTS idx_produits_risque_rupture ON public.produits(risque_rupture);
CREATE INDEX IF NOT EXISTS idx_produits_priorite_commande ON public.produits(priorite_commande);
CREATE INDEX IF NOT EXISTS idx_produits_categorie_abc ON public.produits(categorie_abc);
CREATE INDEX IF NOT EXISTS idx_produits_tendance_ventes ON public.produits(tendance_ventes);
CREATE INDEX IF NOT EXISTS idx_produits_autonomie_jours ON public.produits(autonomie_jours);
CREATE INDEX IF NOT EXISTS idx_produits_qte_a_commander ON public.produits(qte_a_commander);
CREATE INDEX IF NOT EXISTS idx_produits_derniere_vente ON public.produits(derniere_vente);
CREATE INDEX IF NOT EXISTS idx_produits_date_rupture_estimee ON public.produits(date_rupture_estimee);

-- Index composite pour les requêtes complexes
CREATE INDEX IF NOT EXISTS idx_produits_statut_risque ON public.produits(statut, risque_rupture);

-- Index company_id uniquement si la colonne existe (pour multi-tenant)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'company_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_produits_company_priorite ON public.produits(company_id, priorite_commande);
    RAISE NOTICE '✅ Index company_id créé';
  ELSE
    RAISE NOTICE '⚠️  Colonne company_id non présente, index ignoré';
  END IF;
END $$;

-- ============================================
-- 3. FONCTION DE CALCUL AMÉLIORÉE
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_advanced_product_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_sales_per_day NUMERIC;
  v_lead_time INTEGER;
  v_current_stock INTEGER;
  v_moq INTEGER;
  v_security_stock INTEGER;
  v_reorder_point INTEGER;
  v_qty_to_order INTEGER;
  v_days_of_stock INTEGER;
  v_buffer_days INTEGER := 7;
  v_max_stock INTEGER;
  v_stockout_risk INTEGER;
  v_overstock_risk INTEGER;
  v_storage_cost NUMERIC;
  v_potential_revenue NUMERIC;
  v_gross_margin NUMERIC;
  v_rotation_rate NUMERIC;
  v_priority INTEGER;
  v_projected_stock INTEGER;
  v_stockout_date TIMESTAMP;
  v_performance_score INTEGER;
BEGIN
  SET search_path = public;

  -- ============================================
  -- RÉCUPÉRATION DES VALEURS DE BASE
  -- ============================================
  v_sales_per_day := COALESCE(NEW.ventes_jour_ajustees, 0);
  v_lead_time := COALESCE(NEW.lead_time_days, 30);
  v_current_stock := COALESCE(NEW.stock_actuel, 0);
  v_moq := COALESCE(NEW.moq, 1);

  -- ============================================
  -- 1. STOCK DE SÉCURITÉ
  -- ============================================
  IF NEW.stock_secu_custom_jours IS NOT NULL AND NEW.stock_secu_custom_jours > 0 THEN
    v_security_stock := CEIL(v_sales_per_day * NEW.stock_secu_custom_jours);
  ELSE
    v_security_stock := GREATEST(1, CEIL(v_sales_per_day * v_lead_time * 0.2));
  END IF;
  NEW.stock_securite := v_security_stock;

  -- ============================================
  -- 2. POINT DE COMMANDE
  -- ============================================
  IF v_sales_per_day > 0 THEN
    v_reorder_point := CEIL((v_sales_per_day * v_lead_time) + v_security_stock);
  ELSE
    v_reorder_point := v_moq;
  END IF;
  v_reorder_point := GREATEST(v_reorder_point, v_moq);
  NEW.point_commande := v_reorder_point;

  -- ============================================
  -- 3. STOCK MAXIMUM RECOMMANDÉ
  -- ============================================
  -- Stock max = Point de commande + (MOQ × 1.5) pour éviter le surstock
  v_max_stock := v_reorder_point + CEIL(v_moq * 1.5);
  NEW.stock_max := v_max_stock;

  -- ============================================
  -- 4. QUANTITÉ À COMMANDER
  -- ============================================
  IF v_current_stock <= v_reorder_point THEN
    v_qty_to_order := v_reorder_point - v_current_stock + CEIL(v_sales_per_day * v_buffer_days);
    v_qty_to_order := GREATEST(v_qty_to_order, 0);
    
    IF v_moq > 0 AND v_qty_to_order > 0 THEN
      v_qty_to_order := CEIL(v_qty_to_order::NUMERIC / v_moq) * v_moq;
    END IF;
    
    IF v_qty_to_order > 0 AND v_qty_to_order < v_moq THEN
      v_qty_to_order := v_moq;
    END IF;
  ELSE
    v_qty_to_order := 0;
  END IF;
  NEW.qte_a_commander := COALESCE(v_qty_to_order, 0);

  -- ============================================
  -- 5. AUTONOMIE EN JOURS
  -- ============================================
  IF v_sales_per_day > 0 THEN
    v_days_of_stock := FLOOR(v_current_stock / v_sales_per_day);
  ELSE
    v_days_of_stock := 999;
  END IF;
  NEW.autonomie_jours := v_days_of_stock;

  -- ============================================
  -- 6. RISQUE DE RUPTURE (0-100)
  -- ============================================
  IF v_days_of_stock = 0 THEN
    v_stockout_risk := 100;
  ELSIF v_days_of_stock <= v_lead_time * 0.5 THEN
    v_stockout_risk := 80;
  ELSIF v_days_of_stock <= v_lead_time THEN
    v_stockout_risk := 50;
  ELSIF v_days_of_stock <= v_lead_time * 1.5 THEN
    v_stockout_risk := 20;
  ELSE
    v_stockout_risk := 0;
  END IF;
  NEW.risque_rupture := v_stockout_risk;

  -- ============================================
  -- 7. RISQUE DE SURSTOCK (0-100)
  -- ============================================
  IF v_sales_per_day > 0 THEN
    IF v_current_stock >= v_max_stock * 1.5 THEN
      v_overstock_risk := 100;
    ELSIF v_current_stock >= v_max_stock * 1.2 THEN
      v_overstock_risk := 70;
    ELSIF v_current_stock >= v_max_stock THEN
      v_overstock_risk := 40;
    ELSIF v_current_stock >= v_reorder_point * 1.5 THEN
      v_overstock_risk := 20;
    ELSE
      v_overstock_risk := 0;
    END IF;
  ELSE
    -- Pas de ventes = surstock probable
    v_overstock_risk := CASE WHEN v_current_stock > 0 THEN 80 ELSE 0 END;
  END IF;
  NEW.risque_surstock := v_overstock_risk;

  -- ============================================
  -- 8. COÛT DE STOCKAGE
  -- ============================================
  v_storage_cost := v_current_stock * COALESCE(NEW.cout_stockage_unitaire, 0.01);
  NEW.cout_stockage_total := v_storage_cost;

  -- ============================================
  -- 9. REVENU POTENTIEL & MARGE BRUTE
  -- ============================================
  v_potential_revenue := v_current_stock * COALESCE(NEW.prix_vente, 0);
  NEW.revenu_potentiel := v_potential_revenue;
  
  v_gross_margin := v_current_stock * COALESCE(NEW.marge_unitaire, 0);
  NEW.marge_brute := v_gross_margin;

  -- ============================================
  -- 10. TAUX DE ROTATION
  -- ============================================
  -- Nombre de fois que le stock est renouvelé par an
  IF v_current_stock > 0 AND v_sales_per_day > 0 THEN
    v_rotation_rate := (v_sales_per_day * 365) / v_current_stock;
  ELSE
    v_rotation_rate := 0;
  END IF;
  NEW.taux_rotation := v_rotation_rate;

  -- ============================================
  -- 11. PRIORITÉ DE COMMANDE (1-10)
  -- ============================================
  -- Basée sur le risque de rupture et les ventes
  IF v_stockout_risk >= 80 THEN
    v_priority := 10;
  ELSIF v_stockout_risk >= 50 THEN
    v_priority := 8;
  ELSIF v_qty_to_order > 0 THEN
    v_priority := 6;
  ELSIF v_stockout_risk >= 20 THEN
    v_priority := 4;
  ELSE
    v_priority := 2;
  END IF;
  
  -- Augmenter la priorité pour les produits à haute marge
  IF NEW.marge_unitaire > 20 AND v_qty_to_order > 0 THEN
    v_priority := LEAST(10, v_priority + 2);
  END IF;
  
  NEW.priorite_commande := v_priority;

  -- ============================================
  -- 12. STOCK PROJETÉ
  -- ============================================
  -- Stock actuel + en transit - ventes projetées sur le lead time
  v_projected_stock := v_current_stock + COALESCE(NEW.qte_en_transit, 0) - 
                       CEIL(v_sales_per_day * v_lead_time);
  NEW.stock_projete := v_projected_stock;

  -- ============================================
  -- 13. DATE DE RUPTURE ESTIMÉE
  -- ============================================
  IF v_sales_per_day > 0 AND v_current_stock > 0 THEN
    v_stockout_date := NOW() + (v_days_of_stock || ' days')::INTERVAL;
    NEW.date_rupture_estimee := v_stockout_date;
  ELSE
    NEW.date_rupture_estimee := NULL;
  END IF;

  -- ============================================
  -- 14. SCORE DE PERFORMANCE (0-100)
  -- ============================================
  -- Score basé sur plusieurs facteurs
  v_performance_score := 50; -- Score de base
  
  -- Bonus: taux de rotation élevé
  IF v_rotation_rate > 10 THEN
    v_performance_score := v_performance_score + 20;
  ELSIF v_rotation_rate > 5 THEN
    v_performance_score := v_performance_score + 10;
  END IF;
  
  -- Bonus: marge élevée
  IF NEW.marge_unitaire > 20 THEN
    v_performance_score := v_performance_score + 15;
  ELSIF NEW.marge_unitaire > 10 THEN
    v_performance_score := v_performance_score + 10;
  END IF;
  
  -- Malus: risque de rupture
  v_performance_score := v_performance_score - (v_stockout_risk / 5);
  
  -- Malus: risque de surstock
  v_performance_score := v_performance_score - (v_overstock_risk / 5);
  
  -- Limiter entre 0 et 100
  v_performance_score := GREATEST(0, LEAST(100, v_performance_score));
  NEW.score_performance := v_performance_score;

  -- ============================================
  -- 15. CATÉGORIE ABC
  -- ============================================
  -- Basée sur le revenu potentiel
  IF v_potential_revenue > 10000 THEN
    NEW.categorie_abc := 'A';
  ELSIF v_potential_revenue > 3000 THEN
    NEW.categorie_abc := 'B';
  ELSE
    NEW.categorie_abc := 'C';
  END IF;

  -- ============================================
  -- 16. GÉNÉRER DES ALERTES AUTOMATIQUES
  -- ============================================
  NEW.notes_alertes := NULL; -- Réinitialiser
  
  IF v_stockout_risk >= 80 THEN
    NEW.notes_alertes := '🚨 CRITIQUE: Risque de rupture imminent! Commander en urgence.';
  ELSIF v_stockout_risk >= 50 THEN
    NEW.notes_alertes := '⚠️ ATTENTION: Stock faible. Planifier une commande rapidement.';
  ELSIF v_overstock_risk >= 70 THEN
    NEW.notes_alertes := '📦 SURSTOCK: Stock excessif. Réduire les commandes futures.';
  ELSIF v_rotation_rate < 2 AND v_current_stock > 0 THEN
    NEW.notes_alertes := '⏸️ ROTATION LENTE: Envisager une promotion ou réduire le stock.';
  END IF;

  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. APPLIQUER LE NOUVEAU TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS trigger_calculate_metrics ON public.produits;
DROP TRIGGER IF EXISTS trigger_calculate_advanced_metrics ON public.produits;

CREATE TRIGGER trigger_calculate_advanced_metrics
  BEFORE INSERT OR UPDATE ON public.produits
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_advanced_product_metrics();

COMMENT ON TRIGGER trigger_calculate_advanced_metrics ON public.produits IS 
'Calcule automatiquement TOUTES les métriques avancées pour une gestion intelligente des stocks';

-- ============================================
-- 5. RECALCULER TOUS LES PRODUITS
-- ============================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.produits;
  
  RAISE NOTICE '🔄 Recalcul de % produit(s) avec les nouvelles métriques...', v_count;
  
  UPDATE public.produits
  SET updated_at = COALESCE(updated_at, NOW());
  
  RAISE NOTICE '✅ % produit(s) recalculé(s) avec succès!', v_count;
END $$;

-- ============================================
-- 6. AFFICHER UN EXEMPLE
-- ============================================

DO $$
DECLARE
  v_sample RECORD;
BEGIN
  SELECT 
    sku,
    nom_produit,
    stock_actuel,
    autonomie_jours,
    risque_rupture,
    risque_surstock,
    priorite_commande,
    qte_a_commander,
    score_performance,
    categorie_abc,
    notes_alertes
  INTO v_sample
  FROM public.produits
  WHERE ventes_jour_ajustees > 0
  ORDER BY priorite_commande DESC
  LIMIT 1;
  
  IF v_sample IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '📊 EXEMPLE DE PRODUIT AVEC NOUVELLES MÉTRIQUES:';
    RAISE NOTICE '═══════════════════════════════════════════════';
    RAISE NOTICE 'SKU: %', v_sample.sku;
    RAISE NOTICE 'Produit: %', v_sample.nom_produit;
    RAISE NOTICE 'Stock actuel: %', v_sample.stock_actuel;
    RAISE NOTICE 'Autonomie: % jours', v_sample.autonomie_jours;
    RAISE NOTICE 'Risque rupture: %/100', v_sample.risque_rupture;
    RAISE NOTICE 'Risque surstock: %/100', v_sample.risque_surstock;
    RAISE NOTICE 'Priorité: %/10', v_sample.priorite_commande;
    RAISE NOTICE 'Qté à commander: %', v_sample.qte_a_commander;
    RAISE NOTICE 'Score performance: %/100', v_sample.score_performance;
    RAISE NOTICE 'Catégorie ABC: %', v_sample.categorie_abc;
    IF v_sample.notes_alertes IS NOT NULL THEN
      RAISE NOTICE 'Alerte: %', v_sample.notes_alertes;
    END IF;
    RAISE NOTICE '═══════════════════════════════════════════════';
  END IF;
END $$;

-- ============================================
-- FIN DE LA MIGRATION 015
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 015 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 COLONNES AJOUTÉES:';
  RAISE NOTICE '   ✅ Métriques de calcul: stock_securite, autonomie_jours, stock_max';
  RAISE NOTICE '   ✅ Risques: risque_rupture, risque_surstock';
  RAISE NOTICE '   ✅ Coûts: cout_stockage_unitaire, cout_stockage_total';
  RAISE NOTICE '   ✅ Revenus: revenu_potentiel, marge_brute';
  RAISE NOTICE '   ✅ Performance: taux_rotation, score_performance, categorie_abc';
  RAISE NOTICE '   ✅ Prévisions: stock_projete, date_rupture_estimee';
  RAISE NOTICE '   ✅ Priorités: priorite_commande';
  RAISE NOTICE '   ✅ Logistique: qte_en_transit, commandes_en_cours';
  RAISE NOTICE '   ✅ Dates: derniere_vente, derniere_commande';
  RAISE NOTICE '   ✅ Analytique: tendance_ventes, variation_ventes_pct, coefficient_saisonnalite';
  RAISE NOTICE '   ✅ Qualité: fiabilite_fournisseur';
  RAISE NOTICE '   ✅ Alertes: notes_alertes';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Votre application de gestion intelligente des stocks est maintenant complète!';
END $$;
