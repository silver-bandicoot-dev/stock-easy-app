import React from 'react';
import LegalLayout from './LegalLayout';

const PrivacyPolicy = () => {
  return (
    <LegalLayout title="Politique de Confidentialité" lastUpdated="30 novembre 2025">
      <p>
        Chez StockEasy, nous prenons la confidentialité de vos données très au sérieux. Cette politique décrit comment nous recueillons, utilisons et protégeons vos informations personnelles.
      </p>

      <h3>1. Collecte des informations</h3>
      <p>
        Nous collectons les informations que vous nous fournissez directement (par exemple lors de l'inscription) ainsi que des données d'utilisation de notre service.
        Cela peut inclure votre nom, adresse email, et les données relatives à votre boutique Shopify nécessaires au fonctionnement de l'application.
      </p>

      <h3>2. Utilisation des données</h3>
      <p>
        Nous utilisons vos données pour :
      </p>
      <ul>
        <li>Fournir et maintenir notre service</li>
        <li>Améliorer et personnaliser votre expérience</li>
        <li>Communiquer avec vous concernant les mises à jour ou le support</li>
      </ul>

      <h3>3. Partage des données</h3>
      <p>
        Nous ne vendons pas vos données personnelles. Nous pouvons partager vos informations avec des tiers uniquement dans le cadre de la fourniture du service (hébergement, analyse) ou si la loi l'exige.
      </p>

      <h3>4. Sécurité</h3>
      <p>
        Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données contre tout accès, modification ou divulgation non autorisés.
      </p>

      <h3>5. Vos droits (RGPD)</h3>
      <p>
        Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, veuillez nous contacter.
      </p>

      <p className="italic text-sm mt-8 text-gray-500">
        [Ceci est un document générique. Veuillez consulter un conseiller juridique pour adapter ce contenu à votre situation spécifique.]
      </p>
    </LegalLayout>
  );
};

export default PrivacyPolicy;

