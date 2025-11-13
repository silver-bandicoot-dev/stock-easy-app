import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import api from '../../services/apiAdapter';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../shared/Button';

/**
 * Composant de test de connexion Supabase
 * Teste tous les aspects de la connexion frontend-backend
 */
export function SupabaseConnectionTest() {
  const [tests, setTests] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentParametres, setCurrentParametres] = useState(null);

  const addTest = (name, status, message, data = null) => {
    setTests(prev => [...prev, { name, status, message, data, timestamp: new Date() }]);
  };

  const runTests = async () => {
    setTests([]);
    setIsRunning(true);

    try {
      // Test 1: Vérifier la configuration Supabase
      addTest(
        'Configuration Supabase',
        'running',
        'Vérification de la configuration...'
      );
      
      const hasConfig = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
      addTest(
        'Configuration Supabase',
        hasConfig ? 'success' : 'error',
        hasConfig 
          ? `URL: ${import.meta.env.VITE_SUPABASE_URL.substring(0, 30)}...`
          : 'Variables d\'environnement manquantes'
      );

      if (!hasConfig) {
        setIsRunning(false);
        return;
      }

      // Test 2: Vérifier la session utilisateur
      addTest('Session utilisateur', 'running', 'Vérification de la session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      addTest(
        'Session utilisateur',
        session ? 'success' : 'warning',
        session 
          ? `Utilisateur connecté: ${session.user.email}`
          : 'Aucune session active',
        { session }
      );

      // Test 3: Lire la table parametres directement
      addTest('Lecture table parametres', 'running', 'SELECT sur la table...');
      const { data: parametres, error: parametresError } = await supabase
        .from('parametres')
        .select('*');
      
      if (parametresError) {
        addTest('Lecture table parametres', 'error', parametresError.message);
      } else {
        setCurrentParametres(parametres);
        addTest(
          'Lecture table parametres',
          'success',
          `${parametres?.length || 0} paramètres trouvés`,
          { parametres }
        );
      }

      // Test 4: Tester get_all_data RPC
      addTest('RPC get_all_data', 'running', 'Appel de la fonction RPC...');
      try {
        const allData = await api.getAllData();
        addTest(
          'RPC get_all_data',
          'success',
          `Données chargées: ${allData?.products?.length || 0} produits, ${allData?.orders?.length || 0} commandes`,
          { 
            productsCount: allData?.products?.length,
            ordersCount: allData?.orders?.length,
            suppliersCount: allData?.suppliers?.length,
            parametersIncluded: !!allData?.parameters
          }
        );
      } catch (error) {
        addTest('RPC get_all_data', 'error', error.message);
      }

      // Test 5: Tester update_parameter avec RPC
      addTest('RPC update_parameter', 'running', 'Test de mise à jour...');
      try {
        const result = await api.updateParameter('DeviseDefaut', 'EUR');
        addTest(
          'RPC update_parameter',
          result.success ? 'success' : 'error',
          result.success 
            ? 'Fonction RPC fonctionne correctement'
            : `Erreur: ${result.error}`,
          { result }
        );
      } catch (error) {
        addTest('RPC update_parameter', 'error', error.message);
      }

      // Test 6: Vérifier si le paramètre a été mis à jour
      addTest('Vérification UPDATE', 'running', 'Relecture des paramètres...');
      const { data: parametresAfter, error: parametresAfterError } = await supabase
        .from('parametres')
        .select('*');
      
      if (parametresAfterError) {
        addTest('Vérification UPDATE', 'error', parametresAfterError.message);
      } else {
        const deviseParam = parametresAfter?.find(p => p.nom_parametre === 'DeviseDefaut');
        addTest(
          'Vérification UPDATE',
          deviseParam?.valeur === 'EUR' ? 'success' : 'warning',
          deviseParam 
            ? `DeviseDefaut = ${deviseParam.valeur}`
            : 'Paramètre DeviseDefaut non trouvé',
          { parametresAfter }
        );
        setCurrentParametres(parametresAfter);
      }

      // Test 7: Test UPDATE SQL direct
      addTest('UPDATE SQL direct', 'running', 'Test de mise à jour directe...');
      const testValue = `TEST_${Date.now()}`;
      const { data: updateResult, error: updateError } = await supabase
        .from('parametres')
        .update({ valeur: testValue })
        .eq('nom_parametre', 'DeviseDefaut')
        .select();
      
      if (updateError) {
        addTest(
          'UPDATE SQL direct',
          'error',
          `Erreur: ${updateError.message}`,
          { error: updateError }
        );
      } else {
        addTest(
          'UPDATE SQL direct',
          'success',
          `UPDATE réussi: valeur = ${testValue}`,
          { updateResult }
        );
      }

      // Test 8: Lister les policies RLS
      addTest('Policies RLS', 'running', 'Vérification des permissions...');
      const { data: policies, error: policiesError } = await supabase
        .rpc('pg_policies')
        .select('*');
      
      if (policiesError) {
        addTest('Policies RLS', 'warning', 'Impossible de lire les policies (normal si pas admin)');
      } else {
        addTest('Policies RLS', 'success', `${policies?.length || 0} policies trouvées`);
      }

    } catch (error) {
      addTest('Test fatal', 'error', error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'running': return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'running': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-lg border-2 border-[#E5E4DF] p-6">
        <h1 className="text-2xl font-bold text-[#2D3648] mb-4 flex items-center gap-3">
          🔌 Test de Connexion Supabase
        </h1>
        
        <p className="text-gray-600 mb-6">
          Ce composant teste la connexion entre le frontend et le backend Supabase, 
          en particulier la lecture et l'écriture des paramètres généraux.
        </p>

        <Button
          onClick={runTests}
          disabled={isRunning}
          icon={RefreshCw}
          variant="primary"
          className="mb-6"
        >
          {isRunning ? 'Tests en cours...' : 'Lancer les tests'}
        </Button>

        {tests.length > 0 && (
          <div className="space-y-3">
            {tests.map((test, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${getStatusColor(test.status)} transition-all`}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(test.status)}
                  <div className="flex-1">
                    <div className="font-semibold text-[#2D3648]">{test.name}</div>
                    <div className="text-sm text-gray-700 mt-1">{test.message}</div>
                    {test.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          Voir les détails
                        </summary>
                        <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto max-h-40">
                          {JSON.stringify(test.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {currentParametres && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-[#E5E4DF] p-6">
          <h2 className="text-xl font-bold text-[#2D3648] mb-4">
            📋 Paramètres actuels dans la base
          </h2>
          <div className="space-y-2">
            {currentParametres.map((param) => (
              <div
                key={param.id || param.nom_parametre}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-[#2D3648]">{param.nom_parametre}</span>
                <span className="text-gray-600 font-mono text-sm">{param.valeur}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-2">💡 Diagnostic</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Si "Lecture table parametres" échoue → Problème de permissions RLS</li>
          <li>Si "RPC get_all_data" échoue → Fonction RPC manquante ou mal configurée</li>
          <li>Si "RPC update_parameter" échoue → Fonction RPC manquante ou pas d'accès UPDATE</li>
          <li>Si "UPDATE SQL direct" échoue → Policies RLS bloquent les UPDATE</li>
          <li>Si UPDATE réussit mais les données ne changent pas → Vérifier les triggers ou constraints</li>
        </ul>
      </div>
    </div>
  );
}

export default SupabaseConnectionTest;

