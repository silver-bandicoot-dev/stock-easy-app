import React, { useState, useMemo } from 'react';
import { Search, Filter, Package, AlertCircle, Eye } from 'lucide-react';
import { Container } from '../components/layout';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge/Badge';
import ProductCard from '../components/features/Products/ProductCard';
import LoadingState from '../components/shared/LoadingState';
import EmptyState from '../components/shared/EmptyState';
import { useDebounce } from '../hooks';

const ProductsView = ({ products = [], loading = false, onUpdateProduct, currency = 'EUR' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, healthy, warning, urgent
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filtres et recherche
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filtre par recherche
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query)
      );
    }

    // Filtre par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.healthStatus === filterStatus);
    }

    return filtered;
  }, [products, debouncedSearch, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const urgent = products.filter(p => p.healthStatus === 'urgent').length;
    const warning = products.filter(p => p.healthStatus === 'warning').length;
    const healthy = products.filter(p => p.healthStatus === 'healthy').length;
    
    return { urgent, warning, healthy, total: products.length };
  }, [products]);

  if (loading) {
    return <LoadingState message="Chargement des produits..." />;
  }

  return (
    <div className="py-8">
      <Container>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Gestion des Produits
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {stats.total} produits au total
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {stats.total}
                  </p>
                </div>
                <Package className="w-8 h-8 text-primary-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                    Urgent
                  </p>
                  <p className="text-2xl font-bold text-danger-600">
                    {stats.urgent}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-danger-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                    Attention
                  </p>
                  <p className="text-2xl font-bold text-warning-600">
                    {stats.warning}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-warning-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                    Bon niveau
                  </p>
                  <p className="text-2xl font-bold text-success-600">
                    {stats.healthy}
                  </p>
                </div>
                <Package className="w-8 h-8 text-success-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setFilterStatus('all')}
                >
                  Tous
                </Button>
                <Button
                  variant={filterStatus === 'urgent' ? 'danger' : 'outline'}
                  size="md"
                  onClick={() => setFilterStatus('urgent')}
                >
                  Urgent
                </Button>
                <Button
                  variant={filterStatus === 'warning' ? 'warning' : 'outline'}
                  size="md"
                  onClick={() => setFilterStatus('warning')}
                >
                  Attention
                </Button>
                <Button
                  variant={filterStatus === 'healthy' ? 'success' : 'outline'}
                  size="md"
                  onClick={() => setFilterStatus('healthy')}
                >
                  Bon
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Aucun produit trouvé"
            description="Essayez de modifier vos filtres ou votre recherche"
            action={() => {
              setSearchQuery('');
              setFilterStatus('all');
            }}
            actionLabel="Réinitialiser les filtres"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.sku}
                product={product}
                onEdit={onUpdateProduct}
                currency={currency}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
};

export default ProductsView;
