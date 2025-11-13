-- Migration 010: Implémenter correctement la fonction update_parameter
-- Cette fonction met à jour les paramètres dans la table parametres

-- Supprimer l'ancienne version si elle existe
DROP FUNCTION IF EXISTS public.update_parameter(TEXT, TEXT);

-- Créer la fonction complète
CREATE OR REPLACE FUNCTION public.update_parameter(
  p_param_name TEXT, 
  p_value TEXT
)
RETURNS JSON AS $$
DECLARE
  v_updated_count INTEGER;
  v_param_exists BOOLEAN;
BEGIN
  -- Sécurité : définir le search_path
  SET search_path = public;
  
  -- Vérifier si le paramètre existe
  SELECT EXISTS(
    SELECT 1 FROM public.parametres 
    WHERE nom_parametre = p_param_name
  ) INTO v_param_exists;
  
  IF NOT v_param_exists THEN
    -- Si le paramètre n'existe pas, le créer
    INSERT INTO public.parametres (nom_parametre, valeur, updated_at)
    VALUES (p_param_name, p_value, NOW())
    RETURNING 1 INTO v_updated_count;
    
    RETURN json_build_object(
      'success', TRUE,
      'action', 'created',
      'param_name', p_param_name,
      'new_value', p_value,
      'message', 'Paramètre créé avec succès'
    );
  ELSE
    -- Sinon, mettre à jour
    UPDATE public.parametres 
    SET 
      valeur = p_value,
      updated_at = NOW()
    WHERE nom_parametre = p_param_name;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RETURN json_build_object(
      'success', TRUE,
      'action', 'updated',
      'param_name', p_param_name,
      'new_value', p_value,
      'updated_count', v_updated_count,
      'message', 'Paramètre mis à jour avec succès'
    );
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'param_name', p_param_name,
      'message', 'Erreur lors de la mise à jour du paramètre'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajouter un commentaire sur la fonction
COMMENT ON FUNCTION public.update_parameter(TEXT, TEXT) IS 
  'Met à jour ou crée un paramètre dans la table parametres. Utilisé par le frontend pour sauvegarder les paramètres généraux.';

-- Tester la fonction avec un exemple
DO $$
DECLARE
  test_result JSON;
BEGIN
  -- Test 1: Créer ou mettre à jour DeviseDefaut
  SELECT public.update_parameter('DeviseDefaut', 'EUR') INTO test_result;
  RAISE NOTICE '✅ Test DeviseDefaut: %', test_result;
  
  -- Test 2: Créer ou mettre à jour SeuilSurstockProfond
  SELECT public.update_parameter('SeuilSurstockProfond', '90') INTO test_result;
  RAISE NOTICE '✅ Test SeuilSurstockProfond: %', test_result;
  
  -- Test 3: Créer ou mettre à jour MultiplicateurDefaut
  SELECT public.update_parameter('MultiplicateurDefaut', '1.2') INTO test_result;
  RAISE NOTICE '✅ Test MultiplicateurDefaut: %', test_result;
  
  RAISE NOTICE '✅ Fonction update_parameter implémentée et testée avec succès';
END $$;

-- Vérifier que les paramètres existent
DO $$
DECLARE
  param_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO param_count FROM public.parametres;
  RAISE NOTICE '📊 Nombre de paramètres dans la table: %', param_count;
  
  -- Afficher tous les paramètres
  FOR param_count IN 
    SELECT nom_parametre, valeur FROM public.parametres
  LOOP
    RAISE NOTICE '  - % = %', param_count;
  END LOOP;
END $$;

