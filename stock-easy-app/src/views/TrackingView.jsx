import React, { useState } from 'react';
import { Truck, Package, CheckCircle } from 'lucide-react';
import { Container } from '../components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge/Badge';

const TrackingView = ({ orders = [], loading = false }) => {
  const [trackTabSection, setTrackTabSection] = useState('en_cours_commande');

  // Grouper les commandes par statut
  const groupedOrders = {
    en_cours_commande: orders.filter(o => o.status === 'confirmed' || o.status === 'preparing'),
    en_transit: orders.filter(o => o.status === 'shipped'),
    recues: orders.filter(o => o.status === 'delivered'),
  };

  return (
    <div className="py-8">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Suivi & Gestion
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Suivez vos commandes et faites la réconciliation
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 mb-6 overflow-x-auto">
          {[
            { id: 'en_cours_commande', label: 'En cours', count: groupedOrders.en_cours_commande.length },
            { id: 'en_transit', label: 'En transit', count: groupedOrders.en_transit.length },
            { id: 'recues', label: 'Reçues', count: groupedOrders.recues.length },
          ].map(tab => {
            const isActive = trackTabSection === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setTrackTabSection(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap border-b-2
                  ${isActive 
                    ? 'text-primary-600 dark:text-primary-400 border-primary-600' 
                    : 'text-neutral-600 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-neutral-100'
                  }
                `}
              >
                {tab.label}
                {tab.count > 0 && (
                  <Badge variant="primary" size="sm">
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-4">
          {groupedOrders[trackTabSection].length === 0 ? (
            <Card className="p-8">
              <div className="text-center">
                <Package className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Aucune commande
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Aucune commande dans cette catégorie pour le moment. La fonctionnalité complète sera disponible dans la Phase 4.
                </p>
              </div>
            </Card>
          ) : (
            groupedOrders[trackTabSection].map(order => (
              <Card key={order.id} hoverable>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                        Commande #{order.id}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {order.supplier} - {order.items?.length || 0} produits
                      </p>
                    </div>
                    <Badge variant="primary">
                      {order.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </Container>
    </div>
  );
};

export default TrackingView;
