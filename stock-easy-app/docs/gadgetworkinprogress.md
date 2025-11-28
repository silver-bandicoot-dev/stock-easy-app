Contexte complet de l'intégration Shopify - StockEasy
🎯 Objectif du projet
Créer une intégration bidirectionnelle entre Shopify et StockEasy (une application de gestion d'inventaire externe) avec synchronisation en temps réel des produits, inventaires et commandes.

🏗️ Architecture mise en place
Applications impliquées
Gadget (stockeasy-app) - Application intermédiaire qui orchestre les synchronisations
Shopify - Plateforme e-commerce source
StockEasy (Supabase) - Application de gestion d'inventaire cible
Flux de données
Shopify ←→ Gadget (cette app) ←→ StockEasy (Supabase)
✅ Ce qui a été implémenté
1.
Modèles de données Gadget
productMapping
(table de correspondance produits)
Rôle : Mapper les produits Shopify ↔ StockEasy
Champs clés :
shopifyProductId, shopifyVariantId, shopifyInventoryItemId
stockEasySku (identifiant produit dans StockEasy)
shopifySku (SKU Shopify)
syncSource : origine de la création (shopify/stockeasy/manual)
lastSyncedAt : date dernière synchro
shop : relation avec le magasin Shopify (tenancy)
Contrainte : shopifyVariantId unique par shop
syncLog
(logs de synchronisation)
Rôle : Traçabilité complète de tous les événements de synchro
Champs clés :
direction : shopify_to_stockeasy / stockeasy_to_shopify
entity : product / inventory / order / webhook / api_call
operation : create / update / delete / sync / error
status : success / error / pending / skipped
message : description de l'événement
payload : données JSON complètes
processingTimeMs : performance tracking
webhookTopic : topic Shopify si applicable
shop : relation avec le magasin (tenancy)
2.
Structure Supabase (StockEasy)
Table
companies
sql
- id (uuid, PK)
- name (text)
- shopify_shop_id (text) -- Lien avec Gadget shopifyShop.id
Table
products
sql
- id (uuid, PK)
- company_id (uuid, FK → companies)
- sku (text, unique par company)
- name (text)
- stock (integer)
- minimum_stock (integer)
- location (text)
Table
sales_history
sql
- id (uuid, PK)
- company_id (uuid, FK → companies)
- sku (text, FK → products.sku)
- sale_date (date)
- quantity (integer)
- revenue (decimal)
- source (text) -- 'shopify', 'manual', etc.
- metadata (jsonb) -- shopify_order_id, shopify_line_item_id, etc.
- created_at (timestamp)
3.
Synchronisations implémentées
A. Produits Shopify → StockEasy
Action : syncShopifyProducts (global action)

Déclenchement : Manuel (API)
Logique :
Récupère tous les produits Shopify du shop
Pour chaque variant :
Vérifie si un mapping existe
Si non : crée le produit dans Supabase + crée le mapping
Si oui : met à jour le produit
Log tout dans syncLog
Gestion des erreurs : Continue même si un produit échoue
B. Inventaire Shopify → StockEasy
Action : syncShopifyInventory (global action)

Déclenchement : Manuel (API)
Logique :
Récupère les inventory levels Shopify
Agrège par inventory_item_id (somme des quantités de toutes les locations)
Met à jour le stock dans Supabase via le mapping
Log les erreurs si mapping manquant
Action : syncInitialInventoryFromShopify (global action)

Déclenchement : Manuel (à l'installation du shop)
Logique : Même que ci-dessus mais pour setup initial
C. Inventaire StockEasy → Shopify (webhook)
Route : POST /api/supabase-webhook/stock-update

Déclenchement : Webhook Supabase sur UPDATE products
Logique :
Reçoit { company_id, sku, new_stock }
Trouve le shop via shopifyShop.stockEasyCompanyId = company_id
Trouve le mapping via SKU
Appelle l'API Shopify pour mettre à jour l'inventaire
Log dans syncLog
Sécurité : Vérifie l'API key interne (STOCKEASY_INTERNAL_API_KEY)
Webhook Supabase configuré :

sql
CREATE TRIGGER notify_stock_update
AFTER UPDATE ON products
FOR EACH ROW
WHEN (OLD.stock IS DISTINCT FROM NEW.stock)
EXECUTE FUNCTION supabase_functions.http_request(
  'https://stockeasy-app--development.gadget.app/api/supabase-webhook/stock-update',
  'POST',
  '{"Content-Type":"application/json","x-api-key":"<STOCKEASY_INTERNAL_API_KEY>"}',
  '{}',
  json_build_object('company_id', NEW.company_id, 'sku', NEW.sku, 'new_stock', NEW.stock)::text
);
D. Commandes Shopify → StockEasy (sales_history)
3 points d'entrée implémentés :

1. Webhook temps réel :
shopifyOrder/actions/create.js
Déclenchement : Webhook Shopify orders/create
Logique :
Pour chaque line item de la commande :
Trouve le mapping via variantId
Si mapping existe :
Insère dans sales_history :
sku = mapping.stockEasySku
quantity = lineItem.currentQuantity
revenue = price * quantity
sale_date = date de la commande (UTC)
metadata = { shopify_order_id, shopify_line_item_id }
Si pas de mapping : log dans syncLog comme "skipped"
Log global de l'opération
2. Action manuelle :
syncOrdersToSupabase
Déclenchement : Manuel (API)
Paramètres :
shopId (obligatoire)
syncSince (optionnel, défaut = 7 jours)
Logique : Même que le webhook mais pour une période donnée
Use case : Rattrapage de commandes manquées, migration initiale
3. Cron automatique :
scheduledOrderSync
Déclenchement : Cron (toutes les 6 heures)
Logique :
Pour chaque shop installé :
Récupère les commandes des 24 dernières heures
Insère dans sales_history (même logique)
Continue même si un shop échoue
Objectif : Filet de sécurité en cas de webhooks manqués
E. Locations Shopify → StockEasy
Action : syncShopifyLocations (global action)

Logique :
Crée la table locations dans Supabase si elle n'existe pas
Synchro UPSERT de toutes les locations actives
Log des résultats
4.
Actions utilitaires
testShopInstallation
Vérifie la connexion Shopify
Vérifie la connexion Supabase
Vérifie l'existence de la company dans Supabase
Teste les scopes Shopify
generateTestOrders
Crée des commandes de test dans Shopify
Utile pour tester le flux complet
updateShopifyInventory
Permet de mettre à jour manuellement l'inventaire Shopify
Prend SKU + nouvelle quantité
5.
Client Supabase centralisé
Fichier : api/lib/supabase.js

JavaScript
export const getSupabaseClient = () => {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
};

export const getCompanyIdByShopId = async (shopId) => {
  // Trouve company_id via shopifyShop.stockEasyCompanyId
};

export const insertSalesHistory = async (salesData) => {
  // Insert batch avec gestion d'erreur
};
6.
Configuration Shopify
Scopes OAuth demandés :
write_inventory - Modifier l'inventaire
write_locations - Gérer les locations
write_orders - Créer des commandes de test
write_products - Modifier les produits
read_products - Lire les produits
read_orders - Lire les commandes
read_inventory - Lire l'inventaire
Webhooks enregistrés automatiquement :
orders/create, orders/updated
products/create, products/update, products/delete
inventory_items/create, inventory_items/update, inventory_items/delete
inventory_levels/connect, inventory_levels/update, inventory_levels/disconnect
locations/create, locations/update, locations/activate, locations/deactivate, locations/delete
🚧 Problèmes actuels / Points bloquants
1.
Doublons potentiels dans sales_history
Problème : Pas de contrainte unique sur la table
Risque :
Un webhook reçu 2 fois = 2 insertions
Cron + webhook sur même commande = 2 insertions
Impact : Fausse les rapports de ventes
Solution proposée : Ajouter contrainte SQL (voir todo)
2.
Commandes annulées/remboursées non gérées
Problème : Pas de webhook orders/cancelled ni refunds/create
Impact : Les ventes annulées restent comptabilisées
Solutions proposées :
Option 1 : Entrées négatives dans sales_history
Option 2 : Colonne cancelled boolean
3.
Modifications de commandes non suivies
Problème : Si une commande Shopify est modifiée (qty, prix, items), sales_history n'est pas mis à jour
Webhook manquant : orders/updated pas exploité pour ce cas
Solution : Implémenter une stratégie de delete + re-insert
4.
Timezone non géré pour les dates de vente
Problème : Toutes les dates sont en UTC
Impact : Commande à 23h30 UTC le 10/11 = 01h30 le 11/11 en Europe → fausse les rapports quotidiens
Données disponibles : shopifyShop.timezone existe déjà
Solution : Utiliser luxon pour convertir
5.
Produits non mappés invisibles
Problème : Si un produit Shopify n'a pas de mapping, il est skippé silencieusement
Impact : Perte de ventes dans les rapports
Logs : Actuellement seulement dans syncLog
Solution : Dashboard ou alertes email
6.
Validation des données insuffisante
Problème : Pas de check sur :
Valeurs négatives (quantity, revenue)
SKU vides
company_id inexistant
Impact : Données corrompues possibles dans Supabase
7.
Performance sur gros volumes
Problème : Insertions batch non transactionnelles
Limite : Timeout Gadget à 15s
Risque : Si 1000+ commandes/heure, peut échouer
Solution : Background actions + RPC Supabase
📋 Ce qui reste à faire (priorisé)
Priorité HAUTE 🔴
Contrainte unique sur sales_history

Empêcher les doublons
SQL fourni dans les todos
Gestion des annulations/remboursements

Implémenter webhook orders/cancelled
Décider : entrées négatives vs soft delete
Tester avec commandes réelles
Validation des données

Ajouter checks avant insertion
Contrainte FK sur company_id
Messages d'erreur clairs
Priorité MOYENNE 🟡
Timezone pour sale_date

Installer luxon
Modifier calcul de date dans tous les flux
Tester cohérence avec rapports Shopify
Tracking des modifications de commandes

Exploiter webhook orders/updated
Stratégie delete + re-insert
Dashboard produits non mappés

Table unmappedProduct OU
Page frontend avec liste + bouton "Créer mapping"
Priorité BASSE 🟢
Optimisation performance

Background actions pour gros volumes
Transactions SQL (RPC)
Monitoring/métriques
Alertes email

Email quotidien si produits non mappés
Email si échec de synchro
🔑 Variables d'environnement requises
env
SUPABASE_URL=https://jqlofxbngcpoxkfalsfr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
STOCKEASY_INTERNAL_API_KEY=3333245176cb202ab9f34ef1399f98eb9cf30591a587308ac1005053e9ca15d9
🧪 Tests à effectuer
Scénarios critiques non testés :
Double webhook : Simuler 2x le même orders/create → vérifier doublons
Commande annulée : Annuler une commande Shopify → vérifier sales_history
Modification commande : Éditer qty d'un line item → vérifier synchro
1000 commandes simultanées : Tester la charge
Produit sans mapping : Commander un produit non mappé → vérifier logs
Changement timezone : Commande à minuit UTC → vérifier date sale
📁 Fichiers clés à connaître
Backend (Gadget)
api/lib/supabase.js - Client Supabase centralisé
api/models/shopifyOrder/actions/create.js - Webhook temps réel commandes
api/actions/syncOrdersToSupabase.js - Synchro manuelle commandes
api/actions/scheduledOrderSync.js - Cron automatique
api/routes/supabase-webhook/POST-stock-update.js - Webhook StockEasy → Shopify
api/actions/syncShopifyProducts.js - Synchro produits
api/actions/syncShopifyInventory.js - Synchro inventaire
Modèles
productMapping - Table de correspondance
syncLog - Logs de synchro
shopifyShop - Contient stockEasyCompanyId (lien avec Supabase)
💡 Décisions d'architecture importantes
Pourquoi 3 flux pour les commandes ?

Webhook = temps réel
Cron = filet de sécurité
Manuel = migration/rattrapage
Pourquoi productMapping ?

SKU Shopify ≠ SKU StockEasy
Permet mapping flexible
Supporte plusieurs shops
Pourquoi syncLog détaillé ?

Débogage facile
Audit trail complet
Permet analytics des synchros
Pourquoi Supabase ?

StockEasy utilise déjà Supabase
Webhooks natifs (triggers SQL)
RLS pour sécurité
🎓 Concepts Gadget utilisés
Tenancy : Chaque shop isolé via shop belongsTo
Background actions : api.enqueue() pour tâches longues
Connections : connections.shopify pour API Shopify
Global actions : Logique non liée à un record spécifique
Model actions : Hooks sur événements Shopify (create/update)
Routes : /api/supabase-webhook/* pour webhooks externes
Cron : Scheduler trigger sur scheduledOrderSync
Voilà le contexte complet ! Cette documentation devrait permettre à Cursor (ou tout autre développeur) de comprendre exactement où nous en sommes et ce qu'il reste à faire. 🚀

Gravatar for jory.cherief@gmail.com
Tu as oublie le fait que nous avons une boucle infinie non resolue au niveau des stocks. le point de donnee stock_actuel. souviens toi

⚠️ PROBLÈME CRITIQUE : Boucle infinie de synchronisation des stocks
Tu as absolument raison ! Voici le problème majeur que j'ai oublié de mentionner :

🔄 Description du problème de boucle infinie
Le cycle vicieux actuel :
1. Stock change dans StockEasy (Supabase)
   ↓
2. Webhook Supabase déclenche → Gadget route /stock-update
   ↓
3. Gadget met à jour l'inventaire Shopify via API
   ↓
4. Shopify déclenche webhook inventory_levels/update
   ↓
5. Gadget reçoit le webhook → shopifyInventoryLevel/actions/update.js
   ↓
6. ??? Que faire ici ???
   - Si on met à jour Supabase → retour à l'étape 1 (BOUCLE INFINIE ♾️)
   - Si on ne fait rien → Supabase et Shopify désynchronisés
📊 Schéma du problème
┌─────────────┐                    ┌─────────────┐
│   Supabase  │◄──────────────────►│   Shopify   │
│  (StockEasy)│                    │             │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ Webhook                          │ Webhook
       │ stock change                     │ inventory_levels/update
       │                                  │
       ▼                                  ▼
   ┌───────────────────────────────────────┐
   │            Gadget                     │
   │  /stock-update  ←→  inventoryLevel   │
   └───────────────────────────────────────┘
            ↺ BOUCLE INFINIE ↺
🔍 Analyse du code actuel
1.
Route /supabase-webhook/stock-update
(StockEasy → Shopify)
JavaScript
// api/routes/supabase-webhook/POST-stock-update.js
export default async function route({ request, reply, api, logger, connections }) {
  // 1. Reçoit { company_id, sku, new_stock }
  // 2. Trouve le shop et le mapping
  // 3. Appelle Shopify API pour mettre à jour l'inventaire
  
  await shopify.graphql(`
    mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
      inventorySetQuantities(input: $input) {
        inventoryAdjustmentGroup { id }
      }
    }
  `, { /* ... */ });
  
  // ⚠️ Cela déclenche le webhook Shopify inventory_levels/update
}
2.
Action Shopify inventoryLevel/update.js
(Shopify → ???)
JavaScript
// api/models/shopifyInventoryLevel/actions/update.js
import { applyParams, save } from "gadget-server";

export const run = async ({ params, record }) => {
  applyParams(params, record);
  await save(record);
};

// ⚠️ ACTUELLEMENT : Ne fait rien d'autre que sauvegarder dans Gadget
// ❓ QUESTION : Doit-on mettre à jour Supabase ici ?
//    → Si OUI = boucle infinie
//    → Si NON = désynchronisation si quelqu'un modifie manuellement dans Shopify
🚨 Scénarios problématiques
Scénario 1 : Modification manuelle dans Shopify Admin
1. Marchand change stock dans Shopify Admin (50 → 30)
2. Webhook inventory_levels/update → Gadget
3. Gadget NE met PAS à jour Supabase (pour éviter la boucle)
4. ❌ RÉSULTAT : Shopify = 30, StockEasy = 50 (DÉSYNCHRONISÉ)
Scénario 2 : Modification dans StockEasy
1. Utilisateur change stock dans StockEasy (50 → 30)
2. Webhook Supabase → Gadget → Shopify API (30)
3. Shopify webhook → Gadget
4. Si Gadget met à jour Supabase (30) → Webhook Supabase
5. ♾️ BOUCLE (même si valeur identique)
✅ Solutions possibles
Solution 1 : Flag "source de vérité" (RECOMMANDÉE)
Ajouter un champ lastModifiedBy dans le flux :

Dans Supabase (
products
table) :
sql
ALTER TABLE products 
ADD COLUMN last_modified_by TEXT; -- 'shopify' | 'stockeasy' | 'gadget'
ADD COLUMN last_modified_at TIMESTAMP DEFAULT NOW();
Dans Gadget (
productMapping
model) :
Ajouter un champ lastSyncDirection :

"supabase_to_shopify"
"shopify_to_supabase"
"bidirectional"
Logique :
Route /stock-update (Supabase → Shopify) :

JavaScript
// 1. Avant de mettre à jour Shopify
await supabase
  .from('products')
  .update({ 
    last_modified_by: 'gadget_sync_from_supabase',
    last_modified_at: new Date().toISOString()
  })
  .eq('sku', sku);

// 2. Mettre à jour le mapping
await api.productMapping.update(mappingId, {
  lastSyncDirection: 'supabase_to_shopify',
  lastSyncedAt: new Date()
});

// 3. Appeler Shopify API
Action inventoryLevel/update.js (Shopify → Supabase) :

JavaScript
export const onSuccess = async ({ record, api, logger }) => {
  // 1. Récupérer le mapping
  const mapping = await api.productMapping.findFirst({
    filter: { 
      shopifyInventoryItemId: { equals: record.inventoryItemId },
      shopId: { equals: record.shopId }
    }
  });
  
  if (!mapping) return; // Pas de mapping = pas de synchro
  
  // 2. ⚠️ VÉRIFIER LA DIRECTION DE SYNCHRO
  const timeSinceLastSync = Date.now() - new Date(mapping.lastSyncedAt).getTime();
  const wasRecentlySyncedFromSupabase = 
    mapping.lastSyncDirection === 'supabase_to_shopify' &&
    timeSinceLastSync < 30000; // 30 secondes
  
  if (wasRecentlySyncedFromSupabase) {
    logger.info('Skipping Supabase update - this change came from Supabase');
    return; // ✅ ÉVITE LA BOUCLE
  }
  
  // 3. Sinon, c'est une modification manuelle Shopify → synchro vers Supabase
  const supabase = getSupabaseClient();
  await supabase
    .from('products')
    .update({ 
      stock: record.available,
      last_modified_by: 'shopify',
      last_modified_at: new Date().toISOString()
    })
    .eq('sku', mapping.stockEasySku);
  
  await api.productMapping.update(mapping.id, {
    lastSyncDirection: 'shopify_to_supabase',
    lastSyncedAt: new Date()
  });
};
Solution 2 : Désactiver temporairement le webhook Supabase
JavaScript
// Dans /stock-update route
// 1. Désactiver le trigger Supabase
await supabase.rpc('disable_stock_webhook_for', { p_sku: sku });

// 2. Mettre à jour Shopify

// 3. Réactiver le trigger après 30s
setTimeout(async () => {
  await supabase.rpc('enable_stock_webhook_for', { p_sku: sku });
}, 30000);
Problème : Complexe, risque de trigger non réactivé si crash.

Solution 3 : Comparaison de valeurs (SIMPLE mais FRAGILE)
JavaScript
// Dans inventoryLevel/update.js
export const onSuccess = async ({ record, api }) => {
  const mapping = await api.productMapping.findFirst({...});
  
  const supabase = getSupabaseClient();
  const { data: product } = await supabase
    .from('products')
    .select('stock')
    .eq('sku', mapping.stockEasySku)
    .single();
  
  // ✅ Ne met à jour que si différent
  if (product.stock !== record.available) {
    await supabase
      .from('products')
      .update({ stock: record.available })
      .eq('sku', mapping.stockEasySku);
  }
};
Problème : Ne résout pas complètement la boucle (trigger Supabase se déclenche quand même si valeur change).

Solution 4 : Désactiver webhook Shopify inventory_levels/update
Action : Ne PAS écouter le webhook inventory_levels/update.

Conséquence :

✅ Pas de boucle
❌ Modifications manuelles Shopify ne sont JAMAIS synchronisées vers StockEasy
Acceptable SI : StockEasy est considéré comme la SEULE source de vérité.

🎯 Recommandation finale
SOLUTION 1 + désactivation conditionnelle du webhook
Ajouter les champs de tracking :

productMapping.lastSyncDirection
productMapping.lastSyncedAt
products.last_modified_by (Supabase)
Logique intelligente :

Route /stock-update : Marque la direction avant de mettre à jour Shopify
Action inventoryLevel/update :
Vérifie si changement récent vient de Supabase → SKIP
Sinon → Met à jour Supabase
Fenêtre de déduplication : 30 secondes

Logs détaillés pour debug :

JavaScript
logger.info({
  action: 'inventory_sync_decision',
  direction: mapping.lastSyncDirection,
  timeSinceLastSync,
  decision: 'skip' | 'sync_to_supabase'
});
📝 TODO CRITIQUE à ajouter
⚠️ Résoudre la boucle infinie de synchronisation des stocks (incomplete)
Problème :

Modification StockEasy → Shopify → Webhook → ??? → Boucle potentielle
Modifications manuelles Shopify non synchronisées vers StockEasy
Solution à implémenter :

Ajouter champs de tracking :

JavaScript
// productMapping model
- lastSyncDirection (enum: supabase_to_shopify, shopify_to_supabase)
- lastSyncedAt (dateTime)
Modifier shopifyInventoryLevel/actions/update.js :

Vérifier si changement récent vient de Supabase
Si oui → SKIP mise à jour Supabase
Si non → Synchroniser vers Supabase
Modifier /stock-update route :

Marquer la direction avant mise à jour Shopify
Log la décision
Tests critiques :

Modifier stock dans StockEasy → vérifier pas de boucle
Modifier stock dans Shopify Admin → vérifier synchro vers StockEasy
Modifier 2x rapidement → vérifier pas de conflit
Priorité : 🔴 CRITIQUE - Bloque la production

