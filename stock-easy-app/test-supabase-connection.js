#!/usr/bin/env node

/**
 * Script de test complet de connexion Supabase
 * Tests de lecture et d'écriture des paramètres généraux
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement depuis .env.local
const envPath = join(__dirname, '.env.local');
try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch (e) {
  console.warn('⚠️  Fichier .env.local non trouvé, utilisation des variables d\'environnement système');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Configuration Supabase:');
console.log('   URL:', supabaseUrl ? '✅ Définie' : '❌ Manquante');
console.log('   Anon Key:', supabaseAnonKey ? '✅ Définie' : '❌ Manquante');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes!');
  console.error('   Vérifiez votre fichier .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonction de test
async function testSupabaseConnection() {
  console.log('🧪 === TEST COMPLET DE CONNEXION SUPABASE ===\n');

  try {
    // Test 1: Vérifier la connexion de base
    console.log('📡 Test 1: Connexion de base...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.log('⚠️  Aucune session active (normal si non connecté)');
    } else {
      console.log('✅ Session:', session ? 'Active' : 'Aucune');
    }
    console.log('');

    // Test 2: Lire la table parametres directement
    console.log('📖 Test 2: Lecture de la table parametres...');
    const { data: parametres, error: parametresError } = await supabase
      .from('parametres')
      .select('*');
    
    if (parametresError) {
      console.error('❌ Erreur lecture parametres:', parametresError.message);
    } else {
      console.log('✅ Paramètres récupérés:', parametres);
    }
    console.log('');

    // Test 3: Tester get_all_data RPC
    console.log('🔧 Test 3: Appel RPC get_all_data...');
    const { data: allData, error: allDataError } = await supabase.rpc('get_all_data');
    
    if (allDataError) {
      console.error('❌ Erreur RPC get_all_data:', allDataError.message);
    } else {
      console.log('✅ Données récupérées:');
      console.log('   - Produits:', allData?.products?.length || 0);
      console.log('   - Commandes:', allData?.orders?.length || 0);
      console.log('   - Fournisseurs:', allData?.suppliers?.length || 0);
      console.log('   - Paramètres:', allData?.parameters ? 'Présents' : 'Absents');
      if (allData?.parameters) {
        console.log('   - Valeurs des paramètres:', allData.parameters);
      }
    }
    console.log('');

    // Test 4: Lister toutes les fonctions RPC disponibles
    console.log('🔍 Test 4: Fonctions RPC disponibles...');
    const { data: functions, error: functionsError } = await supabase
      .rpc('pg_catalog.pg_proc')
      .select('proname');
    
    if (functionsError) {
      console.log('⚠️  Impossible de lister les fonctions (permissions limitées)');
    } else {
      console.log('✅ Fonctions disponibles:', functions);
    }
    console.log('');

    // Test 5: Tenter une mise à jour d'un paramètre
    console.log('✏️  Test 5: Mise à jour d\'un paramètre (test écriture)...');
    
    // D'abord, vérifier si update_parameter existe
    try {
      const { data: updateResult, error: updateError } = await supabase.rpc('update_parameter', {
        p_param_name: 'DeviseDefaut',
        p_param_value: 'EUR'
      });
      
      if (updateError) {
        console.error('❌ Erreur update_parameter:', updateError.message);
        console.log('   → La fonction RPC n\'existe probablement pas');
      } else {
        console.log('✅ Paramètre mis à jour:', updateResult);
      }
    } catch (e) {
      console.error('❌ Exception lors de l\'appel update_parameter:', e.message);
    }
    console.log('');

    // Test 6: Mise à jour directe via UPDATE SQL
    console.log('💾 Test 6: Mise à jour directe (UPDATE SQL)...');
    const { data: updateDirect, error: updateDirectError } = await supabase
      .from('parametres')
      .update({ valeur: 'EUR' })
      .eq('nom_parametre', 'DeviseDefaut')
      .select();
    
    if (updateDirectError) {
      console.error('❌ Erreur UPDATE direct:', updateDirectError.message);
    } else {
      console.log('✅ Paramètre mis à jour directement:', updateDirect);
    }
    console.log('');

    // Test 7: Vérification finale - relire les paramètres
    console.log('🔄 Test 7: Vérification finale des paramètres...');
    const { data: parametresFinal, error: parametresFinalError } = await supabase
      .from('parametres')
      .select('*');
    
    if (parametresFinalError) {
      console.error('❌ Erreur lecture finale:', parametresFinalError.message);
    } else {
      console.log('✅ Paramètres actuels dans la base:');
      parametresFinal?.forEach(param => {
        console.log(`   - ${param.nom_parametre}: ${param.valeur}`);
      });
    }
    console.log('');

    // Résumé
    console.log('📊 === RÉSUMÉ DES TESTS ===');
    console.log('Test 1 (Session):', '✅');
    console.log('Test 2 (Lecture parametres):', parametresError ? '❌' : '✅');
    console.log('Test 3 (RPC get_all_data):', allDataError ? '❌' : '✅');
    console.log('Test 4 (Liste fonctions):', functionsError ? '⚠️' : '✅');
    console.log('Test 5 (RPC update_parameter):', '❌ Fonction manquante');
    console.log('Test 6 (UPDATE direct):', updateDirectError ? '❌' : '✅');
    console.log('Test 7 (Vérification):', parametresFinalError ? '❌' : '✅');
    console.log('');

    console.log('🎯 CONCLUSION:');
    if (updateDirectError && parametresError) {
      console.log('❌ PROBLÈME MAJEUR: Impossible de lire ou écrire les paramètres');
      console.log('   → Vérifiez les permissions RLS sur la table parametres');
      console.log('   → Vérifiez que vous êtes authentifié');
    } else if (updateDirectError) {
      console.log('⚠️  PROBLÈME PARTIEL: Lecture OK, écriture KO');
      console.log('   → Les policies RLS autorisent SELECT mais pas UPDATE');
      console.log('   → La fonction update_parameter n\'existe pas dans Supabase');
    } else {
      console.log('✅ Connexion fonctionnelle');
      console.log('   → Il manque la fonction RPC update_parameter');
      console.log('   → Il faut l\'ajouter au service supabaseApiService.js');
    }

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
  }
}

// Exécuter les tests
testSupabaseConnection().catch(console.error);

