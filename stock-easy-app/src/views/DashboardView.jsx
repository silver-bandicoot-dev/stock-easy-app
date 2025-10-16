import React from 'react';
import { Container } from '../components/layout';
import DashboardStats from '../components/features/Dashboard/DashboardStats';
import LoadingState from '../components/shared/LoadingState';

const DashboardView = ({ products = [], loading = false }) => {
  if (loading) {
    return <LoadingState message="Chargement du dashboard..." />;
  }
  
  return (
    <div className="py-8">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Dashboard
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Vue d'ensemble de votre stock et de vos commandes
          </p>
        </div>
        
        <DashboardStats products={products} />
        
        {/* Ajoutez d'autres sections ici */}
      </Container>
    </div>
  );
};

export default DashboardView;
