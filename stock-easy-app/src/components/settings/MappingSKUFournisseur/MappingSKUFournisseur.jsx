import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  Package,
  Save,
  RotateCcw,
  Search,
  PackagePlus,
  PackageMinus,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { ImagePreview } from '../../ui/ImagePreview';
import * as supabaseApi from '../../../services/supabaseApiService';

const normalizeText = (value = '') =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const cloneAssignments = (source = {}) => {
  const cloned = {};
  Object.entries(source).forEach(([supplierName, skus]) => {
    cloned[supplierName] = new Set(skus);
  });
  return cloned;
};

const buildAssignmentsFromProducts = (products = [], suppliers = {}) => {
  const map = {};
  Object.keys(suppliers).forEach((supplierName) => {
    map[supplierName] = new Set();
  });

  products.forEach((product) => {
    if (product?.supplier && map[product.supplier]) {
      map[product.supplier].add(product.sku);
    }
  });

  return map;
};

const getFirstSupplierKey = (suppliers = {}) => Object.keys(suppliers)[0] ?? '';

const formatDateTime = (date) => {
  if (!date) return 'Jamais';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  } catch (error) {
    return date.toLocaleString();
  }
};

export function MappingSKUFournisseur({
  products = [],
  suppliers = {},
  onSaveSupplierMapping,
  isSaving = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [draggedSku, setDraggedSku] = useState(null);
  const [savingSupplier, setSavingSupplier] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [initialAssignments, setInitialAssignments] = useState(() =>
    buildAssignmentsFromProducts(products, suppliers)
  );
  const [assignments, setAssignments] = useState(() =>
    cloneAssignments(initialAssignments)
  );
  const [selectedSupplier, setSelectedSupplier] = useState(() =>
    getFirstSupplierKey(suppliers)
  );

  useEffect(() => {
    const next = buildAssignmentsFromProducts(products, suppliers);
    setInitialAssignments(next);
    setLastSavedAt(new Date());
  }, [products, suppliers]);

  useEffect(() => {
    setAssignments(cloneAssignments(initialAssignments));
  }, [initialAssignments]);

  useEffect(() => {
    if (!selectedSupplier || !suppliers[selectedSupplier]) {
      setSelectedSupplier(getFirstSupplierKey(suppliers));
    }
  }, [selectedSupplier, suppliers]);

  const suppliersList = useMemo(() => {
    return Object.values(suppliers).sort((a, b) =>
      a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
    );
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    const normalized = normalizeText(supplierSearch);
    if (!normalized) return suppliersList;
    return suppliersList.filter((supplier) =>
      normalizeText(`${supplier.name} ${supplier.email ?? ''}`).includes(normalized)
    );
  }, [suppliersList, supplierSearch]);

  const assignmentBySku = useMemo(() => {
    const lookup = {};
    Object.entries(assignments).forEach(([supplierName, skuSet]) => {
      skuSet.forEach((sku) => {
        lookup[sku] = supplierName;
      });
    });
    return lookup;
  }, [assignments]);

  const supplierDiffs = useMemo(() => {
    const diffs = {};
    Object.keys(assignments).forEach((supplierName) => {
      const initialSet = initialAssignments[supplierName] ?? new Set();
      const currentSet = assignments[supplierName] ?? new Set();
      const added = [];
      const removed = [];

      currentSet.forEach((sku) => {
        if (!initialSet.has(sku)) {
          added.push(sku);
        }
      });

      initialSet.forEach((sku) => {
        if (!currentSet.has(sku)) {
          removed.push(sku);
        }
      });

      diffs[supplierName] = {
        added,
        removed,
        hasChanges: added.length > 0 || removed.length > 0
      };
    });
    return diffs;
  }, [assignments, initialAssignments]);

  const globalChangeSummary = useMemo(() => {
    let added = 0;
    let removed = 0;

    Object.values(supplierDiffs).forEach((diff) => {
      added += diff.added.length;
      removed += diff.removed.length;
    });

    return {
      added,
      removed,
      hasChanges: added > 0 || removed > 0
    };
  }, [supplierDiffs]);

  const selectedSupplierDiff =
    supplierDiffs[selectedSupplier] ?? { added: [], removed: [], hasChanges: false };
  const selectedSupplierData = suppliers[selectedSupplier];
  const hasUnsavedChangesForSupplier = selectedSupplierDiff.hasChanges;

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const assignedCount = Object.values(assignments).reduce(
      (acc, skuSet) => acc + skuSet.size,
      0
    );
    const unassignedCount = Math.max(totalProducts - assignedCount, 0);

    return {
      total: totalProducts,
      assigned: assignedCount,
      unassigned: unassignedCount
    };
  }, [products.length, assignments]);

  const filterBySearch = useCallback(
    (collection) => {
      if (!searchTerm) return collection;
      const normalized = normalizeText(searchTerm);
      return collection.filter((item) => {
        const searchable = `${item.sku} ${item.name ?? ''}`;
        return normalizeText(searchable).includes(normalized);
      });
    },
    [searchTerm]
  );

  const assignedProducts = useMemo(() => {
    if (!selectedSupplier) return [];
    const skus = assignments[selectedSupplier] ?? new Set();
    const items = products.filter((product) => skus.has(product.sku));
    return filterBySearch(items);
  }, [assignments, selectedSupplier, products, filterBySearch]);

  const availableProducts = useMemo(() => {
    const items = products.filter((product) => !assignmentBySku[product.sku]);
    return filterBySearch(items);
  }, [products, assignmentBySku, filterBySearch]);

  const showAssignedColumn = statusFilter !== 'unassigned';
  const showAvailableColumn = statusFilter !== 'assigned';

  const filteredAssignedProducts = showAssignedColumn ? assignedProducts : [];
  const filteredAvailableProducts = showAvailableColumn ? availableProducts : [];

  const handleAssignSku = useCallback(
    (sku) => {
      if (!selectedSupplier || !sku) return;

      setAssignments((prev) => {
        const next = cloneAssignments(prev);

        Object.entries(next).forEach(([, skuSet]) => {
          skuSet.delete(sku);
        });

        if (!next[selectedSupplier]) {
          next[selectedSupplier] = new Set();
        }

        next[selectedSupplier].add(sku);
        return next;
      });
    },
    [selectedSupplier]
  );

  const handleUnassignSku = useCallback(
    (sku) => {
      if (!selectedSupplier || !sku) return;

      setAssignments((prev) => {
        const next = cloneAssignments(prev);
        next[selectedSupplier]?.delete(sku);
        return next;
      });
    },
    [selectedSupplier]
  );

  const handleDragStart = (sku, origin) => (event) => {
    event.dataTransfer.setData('text/plain', sku);
    event.dataTransfer.effectAllowed = origin === 'available' ? 'copyMove' : 'move';
    setDraggedSku(sku);
  };

  const handleDragEnd = () => {
    setDraggedSku(null);
  };

  const handleDropToAssigned = (event) => {
    event.preventDefault();
    const sku = event.dataTransfer.getData('text/plain');
    handleAssignSku(sku);
    setDraggedSku(null);
  };

  const handleDropToAvailable = (event) => {
    event.preventDefault();
    const sku = event.dataTransfer.getData('text/plain');
    handleUnassignSku(sku);
    setDraggedSku(null);
  };

  const handleSave = async () => {
    if (
      !onSaveSupplierMapping ||
      !selectedSupplier ||
      !(assignments[selectedSupplier] instanceof Set)
    ) {
      return;
    }

    const payloadSkus = Array.from(assignments[selectedSupplier] ?? new Set());

    try {
      setSavingSupplier(selectedSupplier);
      await onSaveSupplierMapping(selectedSupplier, payloadSkus);
      setInitialAssignments((prev) => {
        const next = cloneAssignments(prev);
        next[selectedSupplier] = new Set(payloadSkus);
        return next;
      });
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du mapping fournisseur:', error);
    } finally {
      setSavingSupplier('');
    }
  };

  const handleUpdateProductMoq = useCallback(async (product, rawValue) => {
    const parsed = Number(rawValue);
    const moq = Number.isFinite(parsed) && parsed > 0 ? parsed : null;

    try {
      const result = await supabaseApi.updateProduct(product.sku, {
        // Seul le MOQ est mis à jour, les autres champs restent inchangés côté SQL
        moq,
        // Marquer que le MOQ est modifié manuellement par l'utilisateur
        moq_source: 'manuel'
      });

      if (!result.success) {
        throw new Error(result.error || 'Échec de la mise à jour du MOQ produit');
      }

      console.log('✅ MOQ produit mis à jour manuellement', { sku: product.sku, moq, moq_source: 'manuel' });
    } catch (error) {
      console.error('❌ Erreur mise à jour MOQ produit:', error);
    }
  }, []);

  const handleBulkSyncMoqFromSupplier = useCallback(async () => {
    if (!selectedSupplier) return;

    const skusSet = assignments[selectedSupplier] ?? new Set();
    if (!skusSet.size) return;

    const productsToSync = products.filter(
      (p) => skusSet.has(p.sku) && (!p.moq || p.moq <= 0) && p.supplier === selectedSupplier
    );

    if (!productsToSync.length) {
      console.log('ℹ️ Aucun produit à synchroniser pour le fournisseur', selectedSupplier);
      return;
    }

    console.log('🔄 Synchronisation des MOQ depuis le fournisseur pour', {
      supplier: selectedSupplier,
      count: productsToSync.length
    });

    try {
      await Promise.all(
        productsToSync.map((p) =>
          supabaseApi.syncProductMoqFromSupplier(p.sku, selectedSupplier, false)
        )
      );
      console.log('✅ Synchronisation des MOQ terminée pour', selectedSupplier);
    } catch (error) {
      console.error('❌ Erreur synchronisation MOQ en masse:', error);
    }
  }, [assignments, products, selectedSupplier]);

  const handleReset = () => {
    if (!selectedSupplier) return;
    setAssignments((prev) => {
      const next = cloneAssignments(prev);
      next[selectedSupplier] = new Set(initialAssignments[selectedSupplier] ?? []);
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSupplierSearch('');
  };

  const hasActiveFilters =
    Boolean(searchTerm) || statusFilter !== 'all' || Boolean(supplierSearch);

  if (!Object.keys(suppliers).length) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-6 text-center space-y-4">
        <Users className="w-8 h-8 mx-auto text-neutral-400" />
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-neutral-800">
            Aucun fournisseur disponible
          </h3>
          <p className="text-sm text-neutral-500">
            Ajoutez des fournisseurs dans l’onglet dédié pour commencer le mapping des
            produits.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-neutral-900">
              🔗 Mapping Produits ↔ Fournisseurs
            </h3>
            <p className="text-sm text-neutral-500">
              Organisez vos catalogues à grande échelle : recherche avancée, filtres et
              glisser-déposer pour assister rapidement vos équipes.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="text-xs text-neutral-500">
              Dernière sauvegarde :{' '}
              <span className="font-medium text-neutral-700">{formatDateTime(lastSavedAt)}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 mt-6 sm:grid-cols-4">
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <div className="text-sm text-neutral-500">Total produits</div>
            <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <div className="text-sm text-neutral-500">Assignés</div>
            <div className="text-2xl font-bold text-emerald-600">{stats.assigned}</div>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <div className="text-sm text-neutral-500">À assigner</div>
            <div className="text-2xl font-bold text-amber-600">{stats.unassigned}</div>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <div className="text-sm text-neutral-500">Modifs en attente</div>
            <div
              className={`text-2xl font-bold ${
                globalChangeSummary.hasChanges ? 'text-amber-600' : 'text-neutral-400'
              }`}
            >
              {globalChangeSummary.added + globalChangeSummary.removed}
            </div>
            {globalChangeSummary.hasChanges && (
              <p className="text-xs text-neutral-500 mt-2">
                +{globalChangeSummary.added} / -{globalChangeSummary.removed}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Rechercher un produit par SKU ou nom…"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Statut
          </span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
          >
            <option value="all">Assignés & disponibles</option>
            <option value="assigned">Assignés uniquement</option>
            <option value="unassigned">Disponibles uniquement</option>
          </select>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetFilters}
          disabled={!hasActiveFilters}
        >
          Réinitialiser les filtres
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_1fr]">
        <aside className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-600 uppercase tracking-wide">
                <Users className="w-4 h-4" />
                Fournisseurs
              </div>
              <span className="text-xs text-neutral-400">
                {filteredSuppliers.length}/{suppliersList.length}
              </span>
            </div>

            <div className="px-4 py-3 border-b border-neutral-100">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={supplierSearch}
                  onChange={(event) => setSupplierSearch(event.target.value)}
                  placeholder="Filtrer les fournisseurs…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                />
              </div>
            </div>

            <ul
              className="max-h-[460px] overflow-y-auto divide-y divide-neutral-100"
              data-testid="supplier-list"
            >
              {filteredSuppliers.length === 0 ? (
                <li className="px-4 py-10 text-sm text-neutral-400 text-center">
                  Aucun fournisseur ne correspond à votre recherche.
                </li>
              ) : (
                filteredSuppliers.map((supplier) => {
                  const isSelected = supplier.name === selectedSupplier;
                  const assignedCountForSupplier = assignments[supplier.name]?.size ?? 0;
                  const diff = supplierDiffs[supplier.name] ?? {
                    added: [],
                    removed: [],
                    hasChanges: false
                  };

                  return (
                    <li key={supplier.name}>
                      <button
                        type="button"
                        onClick={() => setSelectedSupplier(supplier.name)}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          isSelected
                            ? 'bg-neutral-900 text-white'
                            : 'hover:bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{supplier.name}</span>
                          <div className="flex items-center gap-2">
                            {diff.hasChanges && (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide ${
                                  isSelected ? 'text-amber-100' : 'text-amber-600'
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                À sauvegarder
                              </span>
                            )}
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-neutral-200 text-neutral-600'
                              }`}
                            >
                              {assignedCountForSupplier}
                            </span>
                          </div>
                        </div>
                        {supplier.email && (
                          <p
                            className={`text-xs mt-2 ${
                              isSelected ? 'text-white/80' : 'text-neutral-500'
                            }`}
                          >
                            {supplier.email}
                          </p>
                        )}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </aside>

        <section className="space-y-4">
          {selectedSupplier ? (
            <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
              <header className="px-5 py-4 border-b border-neutral-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-neutral-600" />
                    <h4 className="text-base font-semibold text-neutral-900">
                      Produits attribués à {selectedSupplier}
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-neutral-500">
                    {selectedSupplierData?.email && (
                      <span>Email : {selectedSupplierData.email}</span>
                    )}
                    {selectedSupplierData?.leadTimeDays !== undefined &&
                      selectedSupplierData?.leadTimeDays !== null && (
                        <span>Délai : {selectedSupplierData.leadTimeDays} j</span>
                      )}
                    {selectedSupplierData?.moq !== undefined &&
                      selectedSupplierData?.moq !== null && (
                        <span>MOQ : {selectedSupplierData.moq}</span>
                      )}
                    {selectedSupplierDiff.hasChanges && (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <AlertCircle className="w-3.5 h-3.5" />
                        +{selectedSupplierDiff.added.length} / -
                        {selectedSupplierDiff.removed.length}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={RotateCcw}
                    onClick={handleReset}
                    disabled={!hasUnsavedChangesForSupplier}
                  >
                    Réinitialiser
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Save}
                    onClick={handleSave}
                    loading={savingSupplier === selectedSupplier || isSaving}
                    disabled={!hasUnsavedChangesForSupplier}
                  >
                    Sauvegarder
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleBulkSyncMoqFromSupplier}
                    disabled={!selectedSupplier}
                  >
                    Synchroniser les MOQ depuis le fournisseur
                  </Button>
                </div>
              </header>

              <div
                className={`px-5 py-4 ${
                  showAssignedColumn && showAvailableColumn
                    ? 'grid gap-4 md:grid-cols-2'
                    : 'space-y-4'
                }`}
              >
                {showAssignedColumn && (
                  <div
                    className={`rounded-xl border-2 border-dashed transition-colors ${
                      draggedSku && !assignmentBySku[draggedSku]
                        ? 'border-neutral-900 bg-neutral-900/5'
                        : 'border-neutral-200'
                    }`}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDropToAssigned}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50 rounded-t-xl">
                      <div className="flex items-center gap-2">
                        <PackagePlus className="w-4 h-4 text-neutral-600" />
                        <span className="text-sm font-semibold text-neutral-700">
                          Produits assignés ({filteredAssignedProducts.length})
                        </span>
                      </div>
                    </div>
                    <ul
                      className="max-h-[440px] overflow-y-auto divide-y divide-neutral-100"
                      data-testid="assigned-products-list"
                    >
                      {filteredAssignedProducts.length === 0 ? (
                        <li className="px-4 py-6 text-sm text-neutral-400 text-center">
                          Aucun produit n’est assigné à ce fournisseur pour le moment.
                        </li>
                      ) : (
                        filteredAssignedProducts.map((product) => (
                          <li
                            key={product.sku}
                            draggable
                            onDragStart={handleDragStart(product.sku, 'assigned')}
                            onDragEnd={handleDragEnd}
                            className="px-4 py-3 flex items-center justify-between gap-3 bg-white"
                          >
                            <div className="flex items-center gap-3">
                              {product.imageUrl ? (
                                <ImagePreview
                                  src={product.imageUrl}
                                  alt={product.name}
                                  thumbClassName="w-9 h-9 rounded-md object-cover flex-shrink-0 bg-neutral-200"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-md bg-neutral-200 flex items-center justify-center text-xs text-neutral-600 flex-shrink-0">
                                  {product.name?.charAt(0) || '?'}
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-semibold text-neutral-800">
                                  {product.name ?? 'Produit sans nom'}
                                </div>
                                <div className="text-xs text-neutral-500">
                                  {product.sku}
                                </div>
                                <div className="text-xs text-neutral-400 mt-1">
                                  Stock actuel : {product.stock ?? 0}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-xs text-neutral-500">
                                MOQ produit
                              </div>
                              <input
                                type="number"
                                min="1"
                                defaultValue={product.moq ?? ''}
                                onBlur={(event) =>
                                  handleUpdateProductMoq(product, event.target.value)
                                }
                                className="w-20 px-2 py-1 border border-neutral-200 rounded text-right text-sm"
                              />
                              <div className="text-[10px] text-neutral-400">
                                Source : {product.moqSource || 'non défini'}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={PackageMinus}
                              onClick={() => handleUnassignSku(product.sku)}
                              aria-label={`Retirer ${product.sku} de ${selectedSupplier}`}
                            >
                              Retirer
                            </Button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}

                {showAvailableColumn && (
                  <div
                    className={`rounded-xl border-2 border-dashed transition-colors ${
                      draggedSku && assignmentBySku[draggedSku] === selectedSupplier
                        ? 'border-amber-600 bg-amber-50/50'
                        : 'border-neutral-200'
                    }`}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDropToAvailable}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50 rounded-t-xl">
                      <div className="flex items-center gap-2">
                        <PackageMinus className="w-4 h-4 text-neutral-600" />
                        <span className="text-sm font-semibold text-neutral-700">
                          Produits disponibles ({filteredAvailableProducts.length})
                        </span>
                      </div>
                    </div>
                    <ul
                      className="max-h-[440px] overflow-y-auto divide-y divide-neutral-100"
                      data-testid="available-products-list"
                    >
                      {filteredAvailableProducts.length === 0 ? (
                        <li className="px-4 py-6 text-sm text-neutral-400 text-center">
                          Tous les produits sont assignés. Glissez un produit depuis la
                          liste voisine pour le libérer.
                        </li>
                      ) : (
                        filteredAvailableProducts.map((product) => (
                          <li
                            key={product.sku}
                            draggable
                            onDragStart={handleDragStart(product.sku, 'available')}
                            onDragEnd={handleDragEnd}
                            className="px-4 py-3 flex items-center justify-between gap-3 bg-white"
                          >
                            <div className="flex items-center gap-3">
                              {product.imageUrl ? (
                                <ImagePreview
                                  src={product.imageUrl}
                                  alt={product.name}
                                  thumbClassName="w-9 h-9 rounded-md object-cover flex-shrink-0 bg-neutral-200"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-md bg-neutral-200 flex items-center justify-center text-xs text-neutral-600 flex-shrink-0">
                                  {product.name?.charAt(0) || '?'}
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-semibold text-neutral-800">
                                  {product.name ?? 'Produit sans nom'}
                                </div>
                                <div className="text-xs text-neutral-500">
                                  {product.sku}
                                </div>
                                <div className="text-xs text-neutral-400 mt-1">
                                  Stock actuel : {product.stock ?? 0}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={PackagePlus}
                              onClick={() => handleAssignSku(product.sku)}
                              aria-label={`Assigner ${product.sku} à ${selectedSupplier}`}
                              disabled={!selectedSupplier}
                            >
                              Assigner
                            </Button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-12 text-center space-y-3">
              <Package className="w-8 h-8 text-neutral-400 mx-auto" />
              <h4 className="text-lg font-semibold text-neutral-800">
                Sélectionnez un fournisseur pour commencer
              </h4>
              <p className="text-sm text-neutral-500">
                Utilisez la colonne de gauche pour choisir un fournisseur et gérer son
                catalogue.
              </p>
            </div>
          )}
        </section>
      </div>

      {globalChangeSummary.hasChanges && (
        <div className="sticky bottom-4 z-10">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-lg px-5 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-800">
                Modifications en attente : {globalChangeSummary.added} ajout(s) ·{' '}
                {globalChangeSummary.removed} retrait(s)
              </p>
              <p className="text-xs text-neutral-500">
              Pensez à sauvegarder chaque fournisseur modifié.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={Save}
                onClick={handleSave}
                loading={savingSupplier === selectedSupplier || isSaving}
                disabled={!selectedSupplier || !hasUnsavedChangesForSupplier}
              >
                Sauvegarder {selectedSupplier ? `(${selectedSupplier})` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

