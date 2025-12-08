-- ============================================================================
-- Migration 093: Correction de la fonction get_grouped_notifications
-- ============================================================================
-- Description: Restaure la fonction get_grouped_notifications qui retourne
--              une TABLE correctement structurée pour le groupement des notifications,
--              tout en ajoutant le filtrage multi-tenant (company_id).
--
-- Problème résolu: La migration 092 avait écrasé la bonne version qui retournait
--                  une TABLE avec latest_created_at, causant des "Invalid Date" dans l'UI.
-- ============================================================================

-- IMPORTANT: PostgreSQL ne permet pas de changer le type de retour d'une fonction
-- existante (de 'json' vers 'TABLE'). Il faut donc d'abord supprimer l'ancienne.
DROP FUNCTION IF EXISTS public.get_grouped_notifications(integer);

-- Restaurer la fonction correcte avec le filtrage company_id
CREATE OR REPLACE FUNCTION public.get_grouped_notifications(
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  group_id TEXT,
  notification_type TEXT,
  notification_count INTEGER,
  latest_title TEXT,
  latest_message TEXT,
  latest_link TEXT,
  latest_created_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN,
  notification_ids UUID[],
  metadata JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_prefs public.notification_preferences;
  v_group_enabled BOOLEAN;
  v_time_window INTERVAL;
BEGIN
  v_user_id := auth.uid();
  v_company_id := public.get_current_user_company_id();
  
  -- Récupérer les préférences utilisateur
  SELECT * INTO v_prefs
  FROM public.notification_preferences
  WHERE user_id = v_user_id;
  
  v_group_enabled := COALESCE(v_prefs.group_similar_enabled, TRUE);
  v_time_window := COALESCE(v_prefs.group_time_window_minutes, 60) * INTERVAL '1 minute';
  
  IF NOT v_group_enabled THEN
    -- Retourner les notifications sans groupement (avec filtrage company_id)
    RETURN QUERY
    SELECT 
      n.id::TEXT as group_id,
      n.type as notification_type,
      1 as notification_count,
      n.title as latest_title,
      n.message as latest_message,
      n.link as latest_link,
      n.created_at as latest_created_at,
      n.read as is_read,
      ARRAY[n.id] as notification_ids,
      n.metadata
    FROM public.notifications n
    WHERE n.user_id = v_user_id
      AND n.company_id = v_company_id  -- Filtrage multi-tenant ajouté
    ORDER BY n.created_at DESC
    LIMIT p_limit;
  ELSE
    -- Grouper les notifications similaires (avec filtrage company_id)
    RETURN QUERY
    WITH notification_groups AS (
      SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.link,
        n.created_at,
        n.read,
        n.metadata,
        -- Créer une clé de groupe basée sur le type et la fenêtre temporelle
        n.type || '_' || date_trunc('hour', n.created_at)::TEXT as temp_group_key
      FROM public.notifications n
      WHERE n.user_id = v_user_id
        AND n.company_id = v_company_id  -- Filtrage multi-tenant ajouté
    ),
    grouped AS (
      SELECT
        MIN(ng.temp_group_key) as group_id,
        ng.type as notification_type,
        COUNT(*)::INTEGER as notification_count,
        (array_agg(ng.title ORDER BY ng.created_at DESC))[1] as latest_title,
        (array_agg(ng.message ORDER BY ng.created_at DESC))[1] as latest_message,
        (array_agg(ng.link ORDER BY ng.created_at DESC))[1] as latest_link,
        MAX(ng.created_at) as latest_created_at,
        bool_and(ng.read) as is_read,
        array_agg(ng.id ORDER BY ng.created_at DESC) as notification_ids,
        (array_agg(ng.metadata ORDER BY ng.created_at DESC))[1] as metadata
      FROM notification_groups ng
      GROUP BY ng.type, ng.temp_group_key
    )
    SELECT * FROM grouped
    ORDER BY latest_created_at DESC
    LIMIT p_limit;
  END IF;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_grouped_notifications TO authenticated;

-- Commentaire
COMMENT ON FUNCTION public.get_grouped_notifications IS 
'Récupère les notifications groupées de l''utilisateur avec filtrage multi-tenant. Retourne une TABLE structurée avec latest_created_at correctement formaté.';
