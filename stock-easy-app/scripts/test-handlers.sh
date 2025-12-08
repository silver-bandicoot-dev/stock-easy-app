#!/bin/bash

# Script pour exécuter tous les tests des handlers
# Usage: npm run test:handlers

echo "🧪 Exécution de tous les tests des handlers..."
echo ""

# Couleurs pour la sortie
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Exécuter les tests des handlers
echo -e "${BLUE}📋 Tests des handlers de paramètres...${NC}"
npm test -- src/handlers/__tests__/parameterHandlers.test.js --run

echo ""
echo -e "${BLUE}📋 Tests des handlers de commandes...${NC}"
npm test -- src/handlers/__tests__/orderHandlers.test.js --run

echo ""
echo -e "${BLUE}📋 Tests des handlers de réconciliation...${NC}"
npm test -- src/handlers/__tests__/reconciliationHandlers.test.js --run

echo ""
echo -e "${GREEN}✅ Tous les tests des handlers sont terminés !${NC}"




















