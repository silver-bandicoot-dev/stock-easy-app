// Script simple pour vérifier les paramètres dans Supabase
// Usage: VITE_SUPABASE_URL=xxx VITE_SUPABASE_ANON_KEY=xxx node scripts/check-parameters-simple.js

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.log('Utilisez: VITE_SUPABASE_URL=xxx VITE_SUPABASE_ANON_KEY=xxx node scripts/check-parameters-simple.js');
  process.exit(1);
}

// Utiliser fetch directement pour interroger Supabase
async function checkParameters() {
  try {
    console.log('🔍 Vérification des paramètres dans Supabase...\n');
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/parametres?nom_parametre=in.(SeuilSurstockProfond,DeviseDefaut,MultiplicateurDefaut)&order=updated_at.desc`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erreur:', response.status, error);
      return;
    }

    const data = await response.json();
    
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
    console.error('❌ Erreur:', error.message);
  }
}

checkParameters();

