import React from 'react';
import LegalLayout from './LegalLayout';

const LegalNotice = () => {
  return (
    <LegalLayout title="Mentions Légales" lastUpdated="30 novembre 2025">
      <h3>Éditeur du site</h3>
      <p>
        Le site et l'application StockEasy sont édités par :<br />
        <strong>Nom de la société :</strong> Orion Corp (à compléter)<br />
        <strong>Siège social :</strong> [Adresse complète]<br />
        <strong>Numéro SIRET :</strong> [Numéro]<br />
        <strong>Directeur de la publication :</strong> [Nom]<br />
        <strong>Email de contact :</strong> contact@stockeasy.app
      </p>

      <h3>Hébergement</h3>
      <p>
        Le site est hébergé par :<br />
        <strong>Vercel Inc.</strong><br />
        340 S Lemon Ave #4133<br />
        Walnut, CA 91789<br />
        États-Unis
      </p>

      <h3>Propriété intellectuelle</h3>
      <p>
        L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. 
        Tous les droits de reproduction sont réservés.
      </p>

      <p className="italic text-sm mt-8 text-gray-500">
        [Veuillez compléter les informations entre crochets avec les détails réels de votre entreprise.]
      </p>
    </LegalLayout>
  );
};

export default LegalNotice;

