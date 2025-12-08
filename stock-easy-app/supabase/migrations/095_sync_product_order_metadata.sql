-- ============================================
-- Migration 095: Synchroniser les métadonnées commandes sur les produits
-- ============================================
-- PROBLÈME: Les colonnes suivantes dans `produits` ne sont jamais mises à jour :
--   - derniere_commande : date de la dernière commande
--   - commandes_en_cours : nombre de commandes en cours (pending/confirmed/shipped)
--   - qte_en_transit : quantité totale en transit (commandes expédiées mais pas reçues)
--
-- SOLUTION:
-- 1. Créer des triggers sur `commandes` et `articles_commande` pour mettre à jour automatiquement
-- 2. Synchroniser toutes les données existantes
-- ============================================

-- ============================================
-- 1. FONCTION DE RECALCUL DES MÉTADONNÉES PRODUIT
-- ============================================

CREATE OR REPLACE FUNCTION public.sync_product_order_metadata(p_sku TEXT, p_company_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_derniere_commande TIMESTAMPTZ;
  v_commandes_en_cours INTEGER;
  v_qte_en_transit INTEGER;
BEGIN
  -- 1. Dernière commande pour ce SKU
  SELECT MAX(c.created_at) INTO v_derniere_commande
  FROM commandes c
  JOIN articles_commande ac ON ac.order_id = c.id AND ac.company_id = c.company_id
  WHERE ac.sku = p_sku 
    AND c.company_id = p_company_id;

  -- 2. Nombre de commandes en cours (pending_confirmation, confirmed, shipped)
  SELECT COUNT(DISTINCT c.id) INTO v_commandes_en_cours
  FROM commandes c
  JOIN articles_commande ac ON ac.order_id = c.id AND ac.company_id = c.company_id
  WHERE ac.sku = p_sku 
    AND c.company_id = p_company_id
    AND c.status IN ('pending_confirmation', 'confirmed', 'shipped');

  -- 3. Quantité en transit (commandes shipped uniquement - pas encore reçues)
  SELECT COALESCE(SUM(ac.quantity), 0) INTO v_qte_en_transit
  FROM commandes c
  JOIN articles_commande ac ON ac.order_id = c.id AND ac.company_id = c.company_id
  WHERE ac.sku = p_sku 
    AND c.company_id = p_company_id
    AND c.status = 'shipped';

  -- Mettre à jour le produit
  UPDATE produits
  SET 
    derniere_commande = v_derniere_commande,
    commandes_en_cours = v_commandes_en_cours,
    qte_en_transit = v_qte_en_transit,
    updated_at = NOW()
  WHERE sku = p_sku 
    AND company_id = p_company_id;
    
END;
$$;

COMMENT ON FUNCTION public.sync_product_order_metadata IS
'Recalcule derniere_commande, commandes_en_cours et qte_en_transit pour un produit donné.';

-- ============================================
-- 2. TRIGGER SUR LES COMMANDES
-- ============================================

CREATE OR REPLACE FUNCTION public.trigger_sync_products_on_order_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sku TEXT;
  v_company_id UUID;
BEGIN
  -- Déterminer le company_id et order_id selon l'opération
  IF TG_OP = 'DELETE' THEN
    v_company_id := OLD.company_id;
    -- Recalculer pour tous les SKUs de cette commande
    FOR v_sku IN 
      SELECT DISTINCT sku FROM articles_commande 
      WHERE order_id = OLD.id AND company_id = v_company_id
    LOOP
      PERFORM sync_product_order_metadata(v_sku, v_company_id);
    END LOOP;
  ELSE
    v_company_id := NEW.company_id;
    -- Recalculer pour tous les SKUs de cette commande
    FOR v_sku IN 
      SELECT DISTINCT sku FROM articles_commande 
      WHERE order_id = NEW.id AND company_id = v_company_id
    LOOP
      PERFORM sync_product_order_metadata(v_sku, v_company_id);
    END LOOP;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_sync_products_on_order ON commandes;

-- Créer le trigger sur INSERT, UPDATE et DELETE
CREATE TRIGGER trigger_sync_products_on_order
  AFTER INSERT OR UPDATE OF status OR DELETE ON commandes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_products_on_order_change();

COMMENT ON FUNCTION public.trigger_sync_products_on_order_change IS
'Synchronise les métadonnées des produits quand une commande est créée, mise à jour ou supprimée.';

-- ============================================
-- 3. TRIGGER SUR LES ARTICLES DE COMMANDE
-- ============================================

CREATE OR REPLACE FUNCTION public.trigger_sync_products_on_article_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM sync_product_order_metadata(OLD.sku, OLD.company_id);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si le SKU a changé, mettre à jour les deux
    IF OLD.sku != NEW.sku THEN
      PERFORM sync_product_order_metadata(OLD.sku, OLD.company_id);
    END IF;
    PERFORM sync_product_order_metadata(NEW.sku, NEW.company_id);
  ELSE -- INSERT
    PERFORM sync_product_order_metadata(NEW.sku, NEW.company_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_sync_products_on_article ON articles_commande;

-- Créer le trigger
CREATE TRIGGER trigger_sync_products_on_article
  AFTER INSERT OR UPDATE OR DELETE ON articles_commande
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_products_on_article_change();

COMMENT ON FUNCTION public.trigger_sync_products_on_article_change IS
'Synchronise les métadonnées des produits quand un article de commande est ajouté, modifié ou supprimé.';

-- ============================================
-- 4. SYNCHRONISATION DE TOUTES LES DONNÉES EXISTANTES
-- ============================================

DO $$
DECLARE
  v_product RECORD;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🔄 Synchronisation des métadonnées de commande pour tous les produits...';
  
  -- Pour chaque produit, recalculer les métadonnées
  FOR v_product IN 
    SELECT DISTINCT p.sku, p.company_id
    FROM produits p
    WHERE p.company_id IS NOT NULL
  LOOP
    PERFORM sync_product_order_metadata(v_product.sku, v_product.company_id);
    v_count := v_count + 1;
  END LOOP;
  
  RAISE NOTICE '✅ % produits synchronisés', v_count;
END $$;

-- ============================================
-- 5. VÉRIFICATION ET STATISTIQUES
-- ============================================

DO $$
DECLARE
  v_products_with_orders INTEGER;
  v_products_with_transit INTEGER;
  v_total_in_transit INTEGER;
BEGIN
  -- Produits qui ont au moins une commande
  SELECT COUNT(*) INTO v_products_with_orders
  FROM produits
  WHERE derniere_commande IS NOT NULL;
  
  -- Produits avec quantité en transit
  SELECT COUNT(*) INTO v_products_with_transit
  FROM produits
  WHERE qte_en_transit > 0;
  
  -- Total quantité en transit
  SELECT COALESCE(SUM(qte_en_transit), 0) INTO v_total_in_transit
  FROM produits;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration 095 appliquée avec succès';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📊 Statistiques après synchronisation:';
  RAISE NOTICE '   - Produits avec commande(s): %', v_products_with_orders;
  RAISE NOTICE '   - Produits avec quantité en transit: %', v_products_with_transit;
  RAISE NOTICE '   - Total unités en transit: %', v_total_in_transit;
  RAISE NOTICE '============================================';
  RAISE NOTICE '🔧 Triggers installés:';
  RAISE NOTICE '   - trigger_sync_products_on_order (sur commandes)';
  RAISE NOTICE '   - trigger_sync_products_on_article (sur articles_commande)';
  RAISE NOTICE '============================================';
END $$;

