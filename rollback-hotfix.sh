#!/bin/bash

##############################################################################
# SCRIPT DE ROLLBACK SÉCURISÉ
# Créé le: 2025-10-17
# Objectif: Revenir au commit stable 62c2d289 (Button component)
##############################################################################

set -e  # Arrêter en cas d'erreur

echo "========================================="
echo "🔄 SCRIPT DE ROLLBACK SÉCURISÉ"
echo "========================================="
echo ""

# Vérifier que nous sommes dans un dépôt git
if [ ! -d .git ]; then
    echo "❌ ERREUR: Ce script doit être exécuté à la racine du dépôt git"
    exit 1
fi

# Variables
COMMIT_CIBLE="62c2d289ba5ec383648a82f46275c57506b57989"
BRANCH_HOTFIX="hotfix/rollback-to-stable-button-component"
BACKUP_BRANCH="backup-avant-rollback-$(date +%Y%m%d-%H%M%S)"

echo "📊 Configuration:"
echo "  - Commit cible: $COMMIT_CIBLE"
echo "  - Branche hotfix: $BRANCH_HOTFIX"
echo "  - Branche backup: $BACKUP_BRANCH"
echo ""

# ÉTAPE 1: Créer une branche de backup
echo "📦 ÉTAPE 1/5: Création de la branche de backup..."
git branch "$BACKUP_BRANCH"
echo "✅ Branche de backup créée: $BACKUP_BRANCH"
echo ""

# ÉTAPE 2: Afficher ce qui sera perdu
echo "⚠️  ÉTAPE 2/5: Voici ce qui sera annulé:"
echo "----------------------------------------"
git log --oneline "$COMMIT_CIBLE..HEAD"
echo ""
echo "📝 Fichiers modifiés: 65 fichiers, +9489 lignes"
echo ""
read -p "❓ Voulez-vous continuer? (oui/non): " CONFIRMATION

if [ "$CONFIRMATION" != "oui" ]; then
    echo "❌ Opération annulée par l'utilisateur"
    exit 0
fi

# ÉTAPE 3: Créer la branche hotfix depuis le commit stable
echo ""
echo "🔧 ÉTAPE 3/5: Création de la branche hotfix..."
git checkout -b "$BRANCH_HOTFIX" "$COMMIT_CIBLE"
echo "✅ Branche hotfix créée et checkout effectué"
echo ""

# ÉTAPE 4: Pusher la branche hotfix
echo "📤 ÉTAPE 4/5: Push de la branche hotfix vers origin..."
git push origin "$BRANCH_HOTFIX"
echo "✅ Branche hotfix pushée avec succès"
echo ""

# ÉTAPE 5: Instructions pour le merge dans main
echo "========================================="
echo "✅ HOTFIX CRÉÉ AVEC SUCCÈS!"
echo "========================================="
echo ""
echo "📋 PROCHAINES ÉTAPES (À FAIRE APRÈS TEST):"
echo ""
echo "1. Tester la branche hotfix:"
echo "   git checkout $BRANCH_HOTFIX"
echo "   # Tester l'application..."
echo ""
echo "2. Si tout est OK, merger dans main:"
echo "   git checkout main"
echo "   git merge $BRANCH_HOTFIX"
echo "   git push origin main"
echo ""
echo "3. En cas de problème, revenir à la branche de backup:"
echo "   git checkout $BACKUP_BRANCH"
echo ""
echo "⚠️  IMPORTANT: Ne supprimez pas la branche $BACKUP_BRANCH"
echo "   avant d'être sûr que tout fonctionne correctement!"
echo ""
echo "========================================="
