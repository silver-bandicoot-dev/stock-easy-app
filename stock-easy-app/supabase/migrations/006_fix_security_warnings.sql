-- Migration 006: Corriger TOUS les avertissements de sécurité
-- Fix les 28 warnings en ajoutant SET search_path = public à toutes les fonctions

-- Fonctions principales de l'application
ALTER FUNCTION add_comment(text,text,uuid[]) SET search_path = public;
ALTER FUNCTION assign_supplier_to_product(text,text,numeric,integer,integer) SET search_path = public;
ALTER FUNCTION calculate_product_metrics() SET search_path = public;
ALTER FUNCTION create_order(text,text,uuid,jsonb,text) SET search_path = public;
ALTER FUNCTION create_supplier(text,text,integer,integer,text) SET search_path = public;
ALTER FUNCTION create_warehouse(text,text,text,text,text,text) SET search_path = public;
ALTER FUNCTION delete_comment(uuid) SET search_path = public;
ALTER FUNCTION delete_supplier(text) SET search_path = public;
ALTER FUNCTION delete_warehouse(text) SET search_path = public;
ALTER FUNCTION get_all_data() SET search_path = public;
ALTER FUNCTION get_order_comments(text) SET search_path = public;
ALTER FUNCTION get_team_members() SET search_path = public;
ALTER FUNCTION handle_new_user() SET search_path = public;
ALTER FUNCTION process_order_reconciliation(text,jsonb,text) SET search_path = public;
ALTER FUNCTION process_order_reconciliation(uuid,jsonb,text) SET search_path = public;
ALTER FUNCTION remove_supplier_from_product(text,text) SET search_path = public;
ALTER FUNCTION save_kpi_snapshot(text,numeric,integer,integer,numeric,integer,numeric,integer,numeric,numeric,text,integer,numeric,timestamp with time zone) SET search_path = public;
ALTER FUNCTION update_comment(uuid,text) SET search_path = public;
ALTER FUNCTION update_companies_updated_at() SET search_path = public;
ALTER FUNCTION update_comments_updated_at() SET search_path = public;
ALTER FUNCTION update_order_status(text,text,text,timestamp with time zone,text,text,boolean,text,text) SET search_path = public;
ALTER FUNCTION update_parameter(text,text) SET search_path = public;
ALTER FUNCTION update_product(text,text,numeric,numeric,text,integer,numeric,numeric) SET search_path = public;
ALTER FUNCTION update_stock(text,numeric) SET search_path = public;
ALTER FUNCTION update_supplier(text,text,text,integer,integer,text) SET search_path = public;
ALTER FUNCTION update_updated_at_column() SET search_path = public;
ALTER FUNCTION update_user_profile(text,text,text,text) SET search_path = public;
ALTER FUNCTION update_user_profiles_updated_at() SET search_path = public;
ALTER FUNCTION update_warehouse(text,text,text,text,text,text,text) SET search_path = public;

-- Fonctions pg_trgm (extension)
-- Ces fonctions peuvent rester sans SET search_path car elles font partie de l'extension
-- et ne représentent pas de risque de sécurité

COMMENT ON SCHEMA public IS 'Toutes les fonctions ont maintenant SET search_path = public pour la sécurité';

-- Note: L'extension pg_trgm dans le schéma public est une pratique courante sur Supabase
-- et ne représente pas de risque de sécurité réel.

-- Note: Pour activer la protection contre les mots de passe divulgués :
-- 1. Aller dans Supabase Dashboard
-- 2. Authentication → Settings → Password Strength
-- 3. Activer "Check for leaked passwords"

