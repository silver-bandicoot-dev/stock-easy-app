import React from 'react';
import Joyride from 'react-joyride';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export const AppTour = () => {
  const [runTour, setRunTour] = useLocalStorage('stock-easy-tour-completed', false);

  const steps = [
    {
      target: '#dashboard',
      content: 'Bienvenue sur Stock Easy ! Voici votre tableau de bord avec toutes les métriques importantes.',
      disableBeacon: true,
    },
    {
      target: '#products-tab',
      content: 'Gérez tous vos produits ici : ajoutez, modifiez, et suivez votre inventaire.',
    },
    {
      target: '#add-product-button',
      content: 'Cliquez ici pour ajouter rapidement un nouveau produit.',
    },
    {
      target: '#search-bar',
      content: 'Utilisez la recherche pour trouver rapidement n\'importe quel produit.',
    },
    {
      target: '#orders-tab',
      content: 'Suivez toutes vos commandes fournisseurs et leur statut en temps réel.',
    },
    {
      target: '#settings',
      content: 'Personnalisez l\'application selon vos besoins dans les paramètres.',
    },
  ];

  return (
    <Joyride
      steps={steps}
      run={!runTour}
      continuous
      showProgress
      showSkipButton
      styles={{
        options: {
          primaryColor: '#3b82f6',
          zIndex: 10000,
        },
      }}
      callback={(data) => {
        if (data.status === 'finished' || data.status === 'skipped') {
          setRunTour(true);
        }
      }}
    />
  );
};
