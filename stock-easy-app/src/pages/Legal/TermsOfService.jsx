import React from 'react';
import LegalLayout from './LegalLayout';

const TermsOfService = () => {
  return (
    <LegalLayout title="Conditions Générales d'Utilisation (CGU)" lastUpdated="30 novembre 2025">
      <p>Bienvenue sur StockEasy.</p>
      <p>
        Les présentes conditions générales d'utilisation régissent votre utilisation de notre application et de nos services.
        En accédant ou en utilisant StockEasy, vous acceptez d'être lié par ces conditions.
      </p>

      <h3>1. Acceptation des conditions</h3>
      <p>
        En utilisant notre service, vous confirmez que vous acceptez ces conditions d'utilisation et que vous vous engagez à les respecter.
        Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser notre service.
      </p>

      <h3>2. Accès au service</h3>
      <p>
        Nous nous réservons le droit de retirer ou de modifier le service que nous fournissons sans préavis.
        Nous ne serons pas responsables si, pour quelque raison que ce soit, notre site est indisponible à tout moment ou pour toute période.
      </p>

      <h3>3. Compte utilisateur</h3>
      <p>
        Pour utiliser certaines fonctionnalités, vous devrez peut-être créer un compte. Vous êtes responsable de maintenir la confidentialité de vos informations de connexion
        et de toutes les activités qui se produisent sous votre compte.
      </p>

      <h3>4. Propriété intellectuelle</h3>
      <p>
        Le contenu, les fonctionnalités et les caractéristiques de StockEasy sont et resteront la propriété exclusive de StockEasy et de ses concédants de licence.
      </p>

      <p className="italic text-sm mt-8 text-gray-500">
        [Ceci est un document générique. Veuillez consulter un conseiller juridique pour adapter ce contenu à votre situation spécifique.]
      </p>
    </LegalLayout>
  );
};

export default TermsOfService;

