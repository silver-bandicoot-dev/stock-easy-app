import React, { useState } from 'react';
import { SearchBar } from './SearchBar';
import { Package, User, ShoppingCart } from 'lucide-react';

/**
 * Page de démo pour tester la SearchBar en isolation
 * Accessible via une route dédiée (ex: /demo/search)
 */
export const SearchBarDemo = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectionHistory, setSelectionHistory] = useState([]);

  const handleSelect = (item) => {
    setSelectedItem(item);
    setSelectionHistory((prev) => [
      {
        ...item,
        timestamp: new Date().toLocaleTimeString('fr-FR'),
      },
      ...prev.slice(0, 9), // Garder les 10 derniers
    ]);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'product':
        return <Package className="w-5 h-5 text-primary-500" />;
      case 'supplier':
        return <User className="w-5 h-5 text-success-500" />;
      case 'order':
        return <ShoppingCart className="w-5 h-5 text-warning-500" />;
      default:
        return <Package className="w-5 h-5 text-neutral-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            🔍 SearchBar Demo
          </h1>
          <p className="text-neutral-600">
            Testez la barre de recherche intelligente avec autocomplétion
          </p>
        </div>

        {/* SearchBar principale */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-sm font-semibold text-neutral-700 mb-3 uppercase tracking-wider">
            Barre de recherche
          </h2>
          <SearchBar onSelect={handleSelect} />

          {/* Instructions */}
          <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <h3 className="text-xs font-bold text-primary-900 mb-2 uppercase">
              💡 Instructions
            </h3>
            <ul className="text-xs text-primary-800 space-y-1">
              <li>• Tapez au moins 2 caractères pour lancer la recherche</li>
              <li>• Utilisez <kbd className="px-1 py-0.5 bg-white border border-primary-300 rounded text-[10px] font-mono">Cmd/Ctrl + K</kbd> pour focus</li>
              <li>• Naviguez avec <kbd className="px-1 py-0.5 bg-white border border-primary-300 rounded text-[10px] font-mono">↑</kbd> <kbd className="px-1 py-0.5 bg-white border border-primary-300 rounded text-[10px] font-mono">↓</kbd></li>
              <li>• Sélectionnez avec <kbd className="px-1 py-0.5 bg-white border border-primary-300 rounded text-[10px] font-mono">Enter</kbd></li>
              <li>• Fermez avec <kbd className="px-1 py-0.5 bg-white border border-primary-300 rounded text-[10px] font-mono">Échap</kbd></li>
            </ul>
          </div>
        </div>

        {/* Élément sélectionné */}
        {selectedItem && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 animate-slide-up">
            <h2 className="text-sm font-semibold text-neutral-700 mb-3 uppercase tracking-wider">
              📦 Élément sélectionné
            </h2>
            <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="shrink-0">
                {selectedItem.image ? (
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.title}
                    className="w-16 h-16 object-cover rounded border border-neutral-300"
                  />
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center bg-neutral-200 rounded">
                    {getTypeIcon(selectedItem.type)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-neutral-500 uppercase px-2 py-1 bg-white rounded border border-neutral-300">
                    {selectedItem.type}
                  </span>
                  <span className="text-xs text-neutral-500">
                    ID: {selectedItem.id}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-1">
                  {selectedItem.title}
                </h3>
                <p className="text-sm text-neutral-600 mb-2">
                  {selectedItem.subtitle}
                </p>
                {selectedItem.meta && (
                  <p className="text-xs text-neutral-500">
                    {selectedItem.meta}
                  </p>
                )}
              </div>
            </div>

            {/* Données brutes (debug) */}
            <details className="mt-4">
              <summary className="text-xs font-semibold text-neutral-600 cursor-pointer hover:text-neutral-900">
                🔍 Voir les données brutes (JSON)
              </summary>
              <pre className="mt-2 p-3 bg-neutral-900 text-green-400 text-xs rounded overflow-x-auto">
                {JSON.stringify(selectedItem.data, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Historique des sélections */}
        {selectionHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider">
                📜 Historique des sélections
              </h2>
              <button
                onClick={() => setSelectionHistory([])}
                className="text-xs text-danger-600 hover:text-danger-700 font-semibold"
              >
                Effacer
              </button>
            </div>
            <div className="space-y-2">
              {selectionHistory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-primary-300 transition-colors"
                >
                  <div className="shrink-0">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-neutral-900 truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-neutral-600 truncate">
                      {item.subtitle}
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500 shrink-0">
                    {item.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-neutral-500">
          <p>
            Stock Easy • SearchBar Component •{' '}
            <a
              href="https://github.com"
              className="text-primary-600 hover:underline"
            >
              Documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};


