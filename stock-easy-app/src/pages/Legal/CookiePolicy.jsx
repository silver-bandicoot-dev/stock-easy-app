import React from 'react';
import LegalLayout from './LegalLayout';

const CookiePolicy = () => {
  return (
    <LegalLayout title="Politique de Cookies" lastUpdated="30 novembre 2025">
      <p>
        Cette politique explique comment StockEasy utilise les cookies et technologies similaires pour vous reconnaître lorsque vous visitez notre site ou utilisez notre application.
      </p>

      <h3>Qu'est-ce qu'un cookie ?</h3>
      <p>
        Un cookie est un petit fichier texte stocké sur votre ordinateur ou appareil mobile lorsque vous visitez un site web. Les cookies sont largement utilisés pour faire fonctionner les sites web ou les rendre plus efficaces.
      </p>

      <h3>Comment nous utilisons les cookies</h3>
      <p>
        Nous utilisons des cookies pour plusieurs raisons :
      </p>
      <ul>
        <li><strong>Cookies essentiels :</strong> Nécessaires au fonctionnement technique du site (ex: maintenir votre session connectée).</li>
        <li><strong>Cookies analytiques :</strong> Pour comprendre comment les visiteurs interagissent avec notre site et améliorer nos services.</li>
        <li><strong>Cookies de préférence :</strong> Pour mémoriser vos choix (langue, devise, etc.).</li>
      </ul>

      <h3>Gestion des cookies</h3>
      <p>
        Vous pouvez contrôler et/ou supprimer les cookies comme vous le souhaitez. Vous pouvez supprimer tous les cookies déjà présents sur votre ordinateur et paramétrer la plupart des navigateurs pour qu'ils les bloquent.
      </p>

      <p className="italic text-sm mt-8 text-gray-500">
        [Ceci est un document générique. Veuillez consulter un conseiller juridique pour adapter ce contenu à votre situation spécifique.]
      </p>
    </LegalLayout>
  );
};

export default CookiePolicy;

