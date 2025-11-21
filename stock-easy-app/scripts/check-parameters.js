// Script pour vérifier les paramètres dans Supabase
// Usage: node scripts/check-parameters.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkParameters() {
  try {
    console.log('🔍 Vérification des paramètres dans Supabase...\n');
    
    const { data, error } = await supabase
      .from('parametres')
      .select('nom_parametre, valeur, updated_at, company_id')
      .in('nom_parametre', ['SeuilSurstockProfond', 'DeviseDefaut', 'MultiplicateurDefaut'])
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur lors de la récupération des paramètres:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️ Aucun paramètre trouvé');
      return;
    }

    console.log('📊 Paramètres actuels dans Supabase:\n');
    
    // Grouper par nom_parametre et prendre le plus récent
    const latestParams = {};
    data.forEach(param => {
      const name = param.nom_parametre;
      if (!latestParams[name] || new Date(param.updated_at) > new Date(latestParams[name].updated_at)) {
        latestParams[name] = param;
      }
    });

    const paramsToCheck = {
      'SeuilSurstockProfond': 'Seuil Surstock Profond',
      'DeviseDefaut': 'Devise par défaut',
      'MultiplicateurDefaut': 'Multiplicateur par défaut'
    };

    Object.entries(paramsToCheck).forEach(([key, label]) => {
      const param = latestParams[key];
      if (param) {
        console.log(`✅ ${label}:`);
        console.log(`   Valeur: ${param.valeur}`);
        console.log(`   Dernière mise à jour: ${new Date(param.updated_at).toLocaleString('fr-FR')}`);
        console.log(`   Company ID: ${param.company_id || 'N/A'}\n`);
      } else {
        console.log(`⚠️ ${label}: Non trouvé\n`);
      }
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkParameters();

