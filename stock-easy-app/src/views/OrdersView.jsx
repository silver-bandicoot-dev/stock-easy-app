import React, { useState } from 'react';
import { ShoppingCart, Plus } from 'lucide-react';
import { Container } from '../components/layout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import EmptyState from '../components/shared/EmptyState';

const OrdersView = ({ 
  products = [], 
  suppliers = {},
  onCreateOrder,
  loading = false 
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="py-8">
      <Container>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Passer Commande
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Créez et gérez vos commandes fournisseurs
            </p>
          </div>
          
          <Button
            variant="primary"
            size="lg"
            icon={Plus}
            onClick={() => setModalOpen(true)}
          >
            Nouvelle Commande
          </Button>
        </div>

        <Card className="p-8">
          <EmptyState
            icon={ShoppingCart}
            title="Créez votre première commande"
            description="Sélectionnez un fournisseur et les produits à commander. Cette fonctionnalité sera complétée dans la Phase 4."
            action={() => setModalOpen(true)}
            actionLabel="Créer une commande"
          />
        </Card>
      </Container>
    </div>
  );
};

export default OrdersView;
