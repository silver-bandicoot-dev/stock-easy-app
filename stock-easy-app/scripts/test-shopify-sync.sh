#!/bin/bash
# =============================================================================
# Script de test pour la synchronisation Stockeasy → Shopify
# =============================================================================
# 
# Ce script teste le flux complet de mise à jour de stock vers Shopify via Gadget.
# Il vérifie :
# 1. OPTIONS (CORS preflight)
# 2. POST avec authentification
# 3. Analyse détaillée de la réponse
#
# Usage:
#   ./test-shopify-sync.sh [environment] [sku] [quantity]
#
# Environnements:
#   - development (par défaut) : https://stockeasy-app--development.gadget.app
#   - production : https://stockeasy-app.gadget.app
#
# =============================================================================

set -e

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration par défaut
ENVIRONMENT=${1:-development}
SKU_TO_TEST=${2:-sku-managed-1}
QUANTITY_TO_SET=${3:-100}
COMPANY_ID="8307b1da-639d-4ec5-a845-a47a8ca387ba"
ORIGIN="http://localhost:5174"

# Déterminer l'URL de base selon l'environnement
if [ "$ENVIRONMENT" == "production" ]; then
    BASE_URL="https://stockeasy-app.gadget.app"
    echo -e "${BLUE}🌐 Environnement: PRODUCTION${NC}"
else
    BASE_URL="https://stockeasy-app--development.gadget.app"
    echo -e "${YELLOW}🔧 Environnement: DEVELOPMENT${NC}"
fi

# Récupérer la clé API depuis .env.local
ENV_FILE="$(dirname "$0")/../.env.local"
if [ -f "$ENV_FILE" ]; then
    API_KEY=$(grep VITE_GADGET_INTERNAL_API_KEY "$ENV_FILE" | cut -d '=' -f2)
    if [ -z "$API_KEY" ]; then
        echo -e "${RED}❌ VITE_GADGET_INTERNAL_API_KEY non trouvée dans .env.local${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Clé API chargée depuis .env.local${NC}"
else
    echo -e "${RED}❌ Fichier .env.local non trouvé à: $ENV_FILE${NC}"
    echo -e "${YELLOW}💡 Créez le fichier avec:${NC}"
    echo "   VITE_GADGET_API_URL=$BASE_URL"
    echo "   VITE_GADGET_INTERNAL_API_KEY=votre_cle_api"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📋 Configuration du test${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "URL:        $BASE_URL"
echo "Company ID: $COMPANY_ID"
echo "SKU:        $SKU_TO_TEST"
echo "Quantité:   $QUANTITY_TO_SET"
echo "Origin:     $ORIGIN"
echo ""

# =============================================================================
# TEST 1: OPTIONS (CORS Preflight)
# =============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🔒 TEST 1: CORS Preflight (OPTIONS)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

OPTIONS_RESPONSE=$(curl -s -w "\n%{http_code}" -X OPTIONS "$BASE_URL/update-shopify-inventory" \
    -H "Origin: $ORIGIN" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -D /dev/stderr 2>&1)

OPTIONS_STATUS=$(echo "$OPTIONS_RESPONSE" | tail -n1)
OPTIONS_HEADERS=$(echo "$OPTIONS_RESPONSE" | head -n -1)

if [ "$OPTIONS_STATUS" == "204" ] || [ "$OPTIONS_STATUS" == "200" ]; then
    echo -e "${GREEN}✅ CORS preflight réussi (HTTP $OPTIONS_STATUS)${NC}"
    
    # Vérifier les headers CORS
    if echo "$OPTIONS_HEADERS" | grep -qi "access-control-allow-origin"; then
        echo -e "${GREEN}   ✓ Access-Control-Allow-Origin présent${NC}"
    else
        echo -e "${YELLOW}   ⚠ Access-Control-Allow-Origin manquant${NC}"
    fi
else
    echo -e "${RED}❌ CORS preflight échoué (HTTP $OPTIONS_STATUS)${NC}"
    echo "$OPTIONS_HEADERS"
fi

echo ""

# =============================================================================
# TEST 2: POST (Mise à jour réelle)
# =============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📤 TEST 2: Mise à jour d'inventaire (POST)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PAYLOAD=$(cat <<EOF
{
  "company_id": "$COMPANY_ID",
  "updates": [
    {
      "sku": "$SKU_TO_TEST",
      "stock_actuel": $QUANTITY_TO_SET
    }
  ]
}
EOF
)

echo -e "${YELLOW}📦 Payload:${NC}"
echo "$PAYLOAD" | jq . 2>/dev/null || echo "$PAYLOAD"
echo ""

POST_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/update-shopify-inventory" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Origin: $ORIGIN" \
    -d "$PAYLOAD")

POST_STATUS=$(echo "$POST_RESPONSE" | tail -n1)
POST_BODY=$(echo "$POST_RESPONSE" | head -n -1)

echo -e "${YELLOW}📥 Réponse (HTTP $POST_STATUS):${NC}"
echo "$POST_BODY" | jq . 2>/dev/null || echo "$POST_BODY"
echo ""

# Analyser la réponse
if [ "$POST_STATUS" == "200" ]; then
    SUCCESS=$(echo "$POST_BODY" | jq -r '.success' 2>/dev/null)
    PROCESSED=$(echo "$POST_BODY" | jq -r '.processed' 2>/dev/null)
    ERRORS=$(echo "$POST_BODY" | jq -r '.errors' 2>/dev/null)
    SKIPPED=$(echo "$POST_BODY" | jq -r '.skipped' 2>/dev/null)
    
    if [ "$SUCCESS" == "true" ]; then
        echo -e "${GREEN}✅ Requête réussie !${NC}"
        echo -e "   Traités:  $PROCESSED"
        echo -e "   Erreurs:  $ERRORS"
        echo -e "   Ignorés:  $SKIPPED"
        
        if [ "$PROCESSED" == "0" ] && [ "$SKIPPED" -gt "0" ]; then
            echo ""
            echo -e "${YELLOW}⚠️  ATTENTION: Aucun SKU traité, $SKIPPED ignorés${NC}"
            echo -e "${YELLOW}   Vérifiez que le productMapping existe pour le SKU '$SKU_TO_TEST'${NC}"
        fi
        
        if [ "$ERRORS" != "0" ] && [ "$ERRORS" != "null" ]; then
            echo ""
            echo -e "${RED}⚠️  ATTENTION: $ERRORS erreurs détectées${NC}"
            echo -e "${RED}   Consultez les logs Gadget pour plus de détails${NC}"
        fi
    else
        echo -e "${RED}❌ La requête a échoué${NC}"
    fi
elif [ "$POST_STATUS" == "401" ]; then
    echo -e "${RED}❌ Non autorisé (401) - Vérifiez votre clé API${NC}"
elif [ "$POST_STATUS" == "404" ]; then
    echo -e "${RED}❌ Shop non trouvé (404) - Vérifiez le company_id${NC}"
elif [ "$POST_STATUS" == "500" ]; then
    echo -e "${RED}❌ Erreur serveur (500) - Consultez les logs Gadget${NC}"
else
    echo -e "${RED}❌ Erreur inattendue (HTTP $POST_STATUS)${NC}"
fi

echo ""

# =============================================================================
# INSTRUCTIONS DE DÉBOGAGE
# =============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🔍 Prochaines étapes de débogage${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. 📊 Consultez les logs Gadget:"
echo "   https://stockeasy-app.gadget.app/logs?environment=$ENVIRONMENT"
echo ""
echo "2. 🔎 Vérifiez les données dans Gadget:"
echo "   - shopifyShop: stockEasyCompanyId = '$COMPANY_ID'"
echo "   - shopifyShop: defaultLocationId doit être configuré"
echo "   - productMapping: stockEasySku = '$SKU_TO_TEST'"
echo "   - productMapping: shopifyInventoryItemId doit être correct"
echo ""
echo "3. 📝 Vérifiez les syncLogs pour ce SKU"
echo ""
echo "4. 🛍️ Vérifiez dans Shopify Admin:"
echo "   - Le produit '$SKU_TO_TEST' existe"
echo "   - L'inventaire est tracké (Track quantity = ON)"
echo "   - L'emplacement par défaut a du stock assigné"
echo ""

