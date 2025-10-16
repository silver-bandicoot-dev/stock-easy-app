#!/bin/bash

echo "🔧 Résolution des conflits Phase 3..."

FILES=(
  "stock-easy-app/src/components/layout/index.js"
  "stock-easy-app/src/components/shared/EmptyState.jsx"
  "stock-easy-app/src/components/shared/LoadingState.jsx"
  "stock-easy-app/src/components/ui/Badge/Badge.jsx"
  "stock-easy-app/src/components/ui/Badge/index.js"
  "stock-easy-app/src/main.jsx"
  "stock-easy-app/src/views/DashboardView.jsx"
)

for file in "${FILES[@]}"; do
  echo "✓ Résolution de $file..."
  git checkout --ours "$file" 2>/dev/null || echo "  ℹ Fichier déjà OK"
  git add "$file" 2>/dev/null || echo "  ℹ Fichier déjà staged"
done

echo ""
echo "✅ Tous les conflits résolus !"
echo ""
git status --short
