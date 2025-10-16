import React, { useState } from 'react';
import { Settings, Package, Truck, Link } from 'lucide-react';
import { Container } from '../components/layout';
import { Card } from '../components/ui/Card';
import LoadingState from '../components/shared/LoadingState';

const SettingsView = ({ 
  loading = false,
  seuilSurstock,
  onUpdateSeuil,
  devise,
  onUpdateDevise,
  multiplicateur,
  onUpdateMultiplicateur,
}) => {
  const [activeSubTab, setActiveSubTab] = useState('general');

  if (loading) {
    return <LoadingState message="Chargement des paramètres..." />;
  }

  return (
    <div className="py-8">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Paramètres
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Configuration de l'application
          </p>
        </div>

        {/* Sub Tabs */}
        <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 mb-6 overflow-x-auto">
          {[
            { id: 'general', label: 'Général', icon: Settings },
            { id: 'products', label: 'Produits', icon: Package },
            { id: 'suppliers', label: 'Fournisseurs', icon: Truck },
            { id: 'mapping', label: 'Mapping', icon: Link },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap border-b-2
                  ${isActive 
                    ? 'text-primary-600 dark:text-primary-400 border-primary-600' 
                    : 'text-neutral-600 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-neutral-100'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <Card>
          <div className="p-6">
            {activeSubTab === 'general' && (
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  Paramètres Généraux
                </h2>
                
                <div className="space-y-6">
                  {/* Devise */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Devise par défaut
                    </label>
                    <select
                      value={devise}
                      onChange={(e) => onUpdateDevise(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>

                  {/* Seuil Surstock */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Seuil de surstock profond (jours)
                    </label>
                    <input
                      type="number"
                      value={seuilSurstock}
                      onChange={(e) => onUpdateSeuil(Number(e.target.value))}
                      className="w-full px-4 py-2.5 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      Au-delà de ce nombre de jours de stock, un produit est considéré en surstock
                    </p>
                  </div>

                  {/* Multiplicateur */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Multiplicateur par défaut
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={multiplicateur}
                      onChange={(e) => onUpdateMultiplicateur(Number(e.target.value))}
                      className="w-full px-4 py-2.5 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      Coefficient appliqué aux calculs de réapprovisionnement
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'products' && (
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  Paramètres Produits
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Configuration des produits et du stock (à venir dans Phase 4)
                </p>
              </div>
            )}

            {activeSubTab === 'suppliers' && (
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  Gestion des Fournisseurs
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Créer et gérer vos fournisseurs (à venir dans Phase 4)
                </p>
              </div>
            )}

            {activeSubTab === 'mapping' && (
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  Mapping Produits-Fournisseurs
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Associer vos produits aux fournisseurs (à venir dans Phase 4)
                </p>
              </div>
            )}
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default SettingsView;
