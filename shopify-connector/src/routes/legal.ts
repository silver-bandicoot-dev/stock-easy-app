import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Privacy Policy Page
 * URL publique requise par Shopify App Store
 */
router.get('/privacy', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Politique de Confidentialité - Shopify Connector for StockEasy</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8f9fa;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
          color: #2c3e50;
          font-size: 2.5em;
          margin-bottom: 10px;
          border-bottom: 3px solid #3498db;
          padding-bottom: 10px;
        }
        h2 {
          color: #34495e;
          font-size: 1.8em;
          margin-top: 40px;
          margin-bottom: 15px;
        }
        h3 {
          color: #555;
          font-size: 1.3em;
          margin-top: 25px;
          margin-bottom: 10px;
        }
        p {
          margin-bottom: 15px;
          text-align: justify;
        }
        ul {
          margin: 15px 0 15px 30px;
        }
        li {
          margin-bottom: 8px;
        }
        .meta {
          color: #7f8c8d;
          font-size: 0.9em;
          margin-bottom: 30px;
        }
        .important {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
        }
        .contact {
          background: #e8f4f8;
          border-left: 4px solid #3498db;
          padding: 20px;
          margin: 30px 0;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #7f8c8d;
          font-size: 0.9em;
        }
        a {
          color: #3498db;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Politique de Confidentialité</h1>
        <p class="meta"><strong>Dernière mise à jour :</strong> 22 novembre 2025</p>
        
        <div class="important">
          <strong>📋 En bref :</strong> Cette application synchronise vos données de boutique Shopify avec votre système de gestion d'inventaire StockEasy. Nous ne vendons jamais vos données et respectons strictement le RGPD et les exigences de Shopify.
        </div>
        
        <h2>1. Introduction</h2>
        <p>
          Cette politique de confidentialité décrit comment <strong>Shopify Connector for StockEasy</strong> 
          ("nous", "notre" ou "l'application") collecte, utilise et protège vos informations lorsque vous 
          utilisez notre application Shopify.
        </p>
        <p>
          En installant et en utilisant cette application, vous acceptez les pratiques décrites dans 
          cette politique de confidentialité.
        </p>
        
        <h2>2. Informations que nous collectons</h2>
        
        <h3>2.1 Données de la boutique</h3>
        <p>Lors de l'installation de l'application, nous collectons et traitons les données suivantes de votre boutique Shopify :</p>
        <ul>
          <li><strong>Informations produits :</strong> Noms, SKU, descriptions, prix, images</li>
          <li><strong>Niveaux d'inventaire :</strong> Quantités en stock, emplacements</li>
          <li><strong>Informations de commandes :</strong> Numéros de commande, articles commandés, quantités, prix</li>
          <li><strong>Domaine de la boutique :</strong> URL de votre boutique Shopify</li>
          <li><strong>Token d'accès OAuth :</strong> Pour communiquer avec l'API Shopify (stocké de manière chiffrée)</li>
        </ul>
        
        <h3>2.2 Données techniques</h3>
        <ul>
          <li>Logs de synchronisation et d'erreurs</li>
          <li>Horodatages des événements</li>
          <li>Informations de diagnostic pour le support technique</li>
        </ul>
        
        <h3>2.3 Données que nous NE collectons PAS</h3>
        <p>Nous ne collectons PAS :</p>
        <ul>
          <li>Informations de paiement des clients (cartes de crédit, etc.)</li>
          <li>Mots de passe</li>
          <li>Informations personnelles détaillées des clients (sauf si incluses dans les commandes pour la synchronisation)</li>
        </ul>
        
        <h2>3. Comment nous utilisons vos informations</h2>
        <p>Les informations collectées sont utilisées exclusivement pour :</p>
        <ul>
          <li><strong>Synchronisation d'inventaire :</strong> Maintenir vos niveaux de stock à jour entre Shopify et StockEasy</li>
          <li><strong>Suivi des ventes :</strong> Enregistrer les commandes dans votre historique de ventes StockEasy</li>
          <li><strong>Prévisions :</strong> Alimenter les modèles de prévision de demande dans StockEasy</li>
          <li><strong>Support technique :</strong> Diagnostiquer et résoudre les problèmes</li>
          <li><strong>Amélioration du service :</strong> Optimiser les performances et la fiabilité</li>
        </ul>
        
        <div class="important">
          <strong>⚠️ Important :</strong> Nous n'utilisons JAMAIS vos données pour :
          <ul style="margin-top: 10px;">
            <li>Vendre ou louer à des tiers</li>
            <li>Publicité ciblée</li>
            <li>Profilage ou marketing direct</li>
            <li>Toute utilisation non liée à la synchronisation d'inventaire</li>
          </ul>
        </div>
        
        <h2>4. Partage des données</h2>
        
        <h3>4.1 Avec StockEasy</h3>
        <p>
          Les données synchronisées sont transmises à votre compte <strong>StockEasy</strong>, que vous contrôlez. 
          Ces données restent votre propriété et sont soumises à la politique de confidentialité de StockEasy.
        </p>
        
        <h3>4.2 Avec des tiers</h3>
        <p>Nous partageons des données uniquement avec :</p>
        <ul>
          <li><strong>Supabase :</strong> Infrastructure de base de données (certifié SOC 2 Type II, conforme RGPD)</li>
          <li><strong>Hébergement cloud :</strong> Pour le fonctionnement de l'application</li>
        </ul>
        <p>Tous nos sous-traitants sont soumis à des accords de confidentialité stricts.</p>
        
        <h3>4.3 Obligations légales</h3>
        <p>
          Nous pouvons divulguer vos informations si la loi l'exige ou pour :
        </p>
        <ul>
          <li>Se conformer à une ordonnance judiciaire ou une procédure légale</li>
          <li>Protéger nos droits, notre propriété ou notre sécurité</li>
          <li>Prévenir la fraude ou les abus</li>
        </ul>
        
        <h2>5. Stockage et sécurité des données</h2>
        
        <h3>5.1 Mesures de sécurité</h3>
        <p>Nous mettons en œuvre des mesures de sécurité robustes :</p>
        <ul>
          <li><strong>Chiffrement :</strong> Tous les tokens d'accès sont chiffrés avec AES-256-GCM</li>
          <li><strong>HTTPS :</strong> Toutes les communications sont chiffrées en transit (TLS 1.3)</li>
          <li><strong>Authentification :</strong> Validation HMAC pour tous les webhooks</li>
          <li><strong>Accès restreint :</strong> Principe du moindre privilège pour les accès système</li>
          <li><strong>Logs d'audit :</strong> Traçabilité de toutes les opérations critiques</li>
          <li><strong>Surveillance :</strong> Détection et alertes en cas d'activité suspecte</li>
        </ul>
        
        <h3>5.2 Localisation des données</h3>
        <p>
          Vos données sont stockées dans des centres de données sécurisés situés dans :
        </p>
        <ul>
          <li>Union Européenne (priorité pour les clients EU)</li>
          <li>États-Unis (avec Privacy Shield ou clauses contractuelles types)</li>
        </ul>
        
        <h2>6. Conservation des données</h2>
        
        <h3>6.1 Durée de conservation</h3>
        <ul>
          <li><strong>Pendant l'utilisation :</strong> Tant que l'application est installée sur votre boutique</li>
          <li><strong>Après désinstallation :</strong> Les données de connexion sont supprimées après 48 heures</li>
          <li><strong>Logs de sécurité :</strong> Conservés jusqu'à 90 jours pour audit</li>
        </ul>
        
        <h3>6.2 Suppression automatique</h3>
        <p>
          Conformément aux exigences Shopify GDPR, nous supprimons automatiquement vos données 48 heures 
          après la désinstallation de l'application ou la fermeture de votre boutique.
        </p>
        
        <h2>7. Vos droits (RGPD & CCPA)</h2>
        <p>Conformément au RGPD et au CCPA, vous disposez des droits suivants :</p>
        
        <h3>7.1 Droit d'accès (Article 15 RGPD)</h3>
        <p>Vous pouvez demander une copie de toutes les données que nous détenons sur vous.</p>
        
        <h3>7.2 Droit de rectification (Article 16 RGPD)</h3>
        <p>Vous pouvez demander la correction de données inexactes.</p>
        
        <h3>7.3 Droit à l'effacement (Article 17 RGPD)</h3>
        <p>
          Vous pouvez demander la suppression de vos données en désinstallant l'application. 
          La suppression sera effective sous 48 heures.
        </p>
        
        <h3>7.4 Droit d'opposition (Article 21 RGPD)</h3>
        <p>Vous pouvez vous opposer au traitement de vos données en désinstallant l'application.</p>
        
        <h3>7.5 Droit à la portabilité (Article 20 RGPD)</h3>
        <p>Vous pouvez demander vos données dans un format structuré et lisible par machine.</p>
        
        <h3>7.6 Comment exercer vos droits</h3>
        <p>Pour exercer ces droits, contactez-nous à : <a href="mailto:privacy@stockeasy.com">privacy@stockeasy.com</a></p>
        <p>Nous répondrons dans un délai maximum de 30 jours.</p>
        
        <h2>8. Cookies et technologies similaires</h2>
        <p>
          Notre application n'utilise <strong>PAS</strong> de cookies de suivi ou de publicité. 
          Nous utilisons uniquement des tokens de session nécessaires au fonctionnement de l'application.
        </p>
        
        <h2>9. Conformité Shopify</h2>
        <p>Cette application respecte toutes les exigences de Shopify :</p>
        <ul>
          <li>✅ Webhooks GDPR implémentés (customers/data_request, customers/redact, shop/redact)</li>
          <li>✅ Politique de confidentialité publique et accessible</li>
          <li>✅ Suppression automatique des données après désinstallation</li>
          <li>✅ Validation HMAC de tous les webhooks</li>
          <li>✅ Respect des limites de taux d'API</li>
        </ul>
        
        <h2>10. Modifications de cette politique</h2>
        <p>
          Nous pouvons mettre à jour cette politique de confidentialité occasionnellement. 
          Les modifications seront publiées sur cette page avec une nouvelle date "Dernière mise à jour".
        </p>
        <p>
          Les modifications importantes vous seront notifiées par :
        </p>
        <ul>
          <li>Email (si nous avons votre adresse)</li>
          <li>Notification dans l'application</li>
          <li>Bannière sur cette page</li>
        </ul>
        
        <h2>11. Mineurs</h2>
        <p>
          Notre application est destinée aux entreprises. Nous ne collectons pas sciemment 
          d'informations personnelles d'enfants de moins de 16 ans.
        </p>
        
        <h2>12. Transferts internationaux</h2>
        <p>
          Si vous êtes situé dans l'EEE ou au Royaume-Uni, vos données peuvent être transférées 
          vers des pays en dehors de votre juridiction. Nous assurons ces transferts par :
        </p>
        <ul>
          <li>Clauses contractuelles types de l'UE</li>
          <li>Mécanismes de certification appropriés</li>
          <li>Garanties de protection équivalentes</li>
        </ul>
        
        <div class="contact">
          <h2>13. Nous contacter</h2>
          <p><strong>Pour toute question concernant cette politique de confidentialité :</strong></p>
          <p>
            <strong>Email :</strong> <a href="mailto:privacy@stockeasy.com">privacy@stockeasy.com</a><br>
            <strong>Support :</strong> <a href="mailto:support@stockeasy.com">support@stockeasy.com</a><br>
            <strong>Site web :</strong> <a href="https://stockeasy.app">https://stockeasy.app</a>
          </p>
          <p>
            <strong>Délégué à la protection des données (DPO) :</strong><br>
            Email: <a href="mailto:dpo@stockeasy.com">dpo@stockeasy.com</a>
          </p>
          <p>
            <strong>Adresse postale :</strong><br>
            StockEasy SAS<br>
            [Votre adresse complète]<br>
            [Code postal] [Ville]<br>
            [Pays]
          </p>
        </div>
        
        <h2>14. Autorité de contrôle</h2>
        <p>
          Si vous n'êtes pas satisfait de notre réponse à vos préoccupations en matière de confidentialité, 
          vous avez le droit de déposer une plainte auprès de votre autorité de protection des données locale :
        </p>
        <ul>
          <li><strong>France :</strong> CNIL (Commission Nationale de l'Informatique et des Libertés) - <a href="https://www.cnil.fr">www.cnil.fr</a></li>
          <li><strong>UE :</strong> Liste des autorités : <a href="https://edpb.europa.eu">edpb.europa.eu</a></li>
        </ul>
        
        <div class="footer">
          <p>&copy; 2025 StockEasy. Tous droits réservés.</p>
          <p>
            <a href="/terms">Conditions d'utilisation</a> | 
            <a href="/privacy">Politique de confidentialité</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `);
});

/**
 * Terms of Service Page
 * URL publique requise par Shopify App Store
 */
router.get('/terms', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Conditions d'utilisation - Shopify Connector for StockEasy</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8f9fa;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
          color: #2c3e50;
          font-size: 2.5em;
          margin-bottom: 10px;
          border-bottom: 3px solid #e74c3c;
          padding-bottom: 10px;
        }
        h2 {
          color: #34495e;
          font-size: 1.8em;
          margin-top: 40px;
          margin-bottom: 15px;
        }
        h3 {
          color: #555;
          font-size: 1.3em;
          margin-top: 25px;
          margin-bottom: 10px;
        }
        p {
          margin-bottom: 15px;
          text-align: justify;
        }
        ul {
          margin: 15px 0 15px 30px;
        }
        li {
          margin-bottom: 8px;
        }
        .meta {
          color: #7f8c8d;
          font-size: 0.9em;
          margin-bottom: 30px;
        }
        .important {
          background: #ffe8e8;
          border-left: 4px solid #e74c3c;
          padding: 15px;
          margin: 20px 0;
        }
        .contact {
          background: #e8f4f8;
          border-left: 4px solid #3498db;
          padding: 20px;
          margin: 30px 0;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #7f8c8d;
          font-size: 0.9em;
        }
        a {
          color: #3498db;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Conditions d'Utilisation</h1>
        <p class="meta"><strong>Dernière mise à jour :</strong> 22 novembre 2025</p>
        
        <div class="important">
          <strong>⚠️ Important :</strong> En installant et en utilisant Shopify Connector for StockEasy, 
          vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, 
          veuillez ne pas installer ou utiliser l'application.
        </div>
        
        <h2>1. Acceptation des conditions</h2>
        <p>
          Ces Conditions d'utilisation ("Conditions") constituent un accord légal entre vous 
          ("Utilisateur", "vous" ou "Marchand") et <strong>StockEasy SAS</strong> ("nous", "notre" ou "StockEasy") 
          concernant votre utilisation de l'application <strong>Shopify Connector for StockEasy</strong> ("l'Application").
        </p>
        <p>
          En installant l'Application sur votre boutique Shopify, vous confirmez que :
        </p>
        <ul>
          <li>Vous avez lu et compris ces Conditions</li>
          <li>Vous avez l'autorité légale pour accepter ces Conditions au nom de votre entreprise</li>
          <li>Vous avez au moins 18 ans</li>
        </ul>
        
        <h2>2. Description du service</h2>
        
        <h3>2.1 Fonctionnalités</h3>
        <p>L'Application fournit les services suivants :</p>
        <ul>
          <li><strong>Synchronisation bidirectionnelle :</strong> Entre votre boutique Shopify et StockEasy</li>
          <li><strong>Gestion d'inventaire :</strong> Mise à jour automatique des niveaux de stock</li>
          <li><strong>Suivi des ventes :</strong> Enregistrement des commandes dans l'historique de ventes</li>
          <li><strong>Mapping de produits :</strong> Association automatique entre SKU Shopify et StockEasy</li>
        </ul>
        
        <h3>2.2 Prérequis</h3>
        <p>Pour utiliser l'Application, vous devez :</p>
        <ul>
          <li>Avoir une boutique Shopify active</li>
          <li>Avoir un compte StockEasy actif et valide</li>
          <li>Disposer des permissions appropriées sur les deux plateformes</li>
          <li>Utiliser des SKU uniques et cohérents</li>
        </ul>
        
        <h2>3. Responsabilités de l'utilisateur</h2>
        
        <h3>3.1 Sécurité du compte</h3>
        <p>Vous êtes responsable de :</p>
        <ul>
          <li>Maintenir la confidentialité de vos identifiants de connexion</li>
          <li>Toutes les activités effectuées sous votre compte</li>
          <li>Notifier immédiatement tout accès non autorisé</li>
          <li>Respecter les Conditions d'utilisation de Shopify</li>
        </ul>
        
        <h3>3.2 Exactitude des données</h3>
        <p>Vous garantissez que :</p>
        <ul>
          <li>Les données que vous fournissez sont exactes et à jour</li>
          <li>Vous avez le droit de partager ces données avec l'Application</li>
          <li>Les SKU sont uniques et correctement configurés</li>
          <li>Vous maintenez des sauvegardes appropriées de vos données</li>
        </ul>
        
        <h3>3.3 Utilisation acceptable</h3>
        <p>Vous vous engagez à NE PAS :</p>
        <ul>
          <li>Utiliser l'Application pour des activités illégales</li>
          <li>Tenter de contourner les mesures de sécurité</li>
          <li>Surcharger ou perturber les serveurs de l'Application</li>
          <li>Extraire ou copier des données via des moyens automatisés non autorisés</li>
          <li>Revendre ou redistribuer l'Application sans autorisation</li>
        </ul>
        
        <h2>4. Tarification et paiement</h2>
        
        <h3>4.1 Modèle tarifaire</h3>
        <p>
          L'utilisation de l'Application est soumise aux frais définis dans votre plan d'abonnement StockEasy. 
          Les tarifs actuels sont disponibles sur notre site web.
        </p>
        
        <h3>4.2 Facturation</h3>
        <ul>
          <li>Les frais sont facturés mensuellement ou annuellement selon votre plan</li>
          <li>La facturation commence dès l'activation de l'Application</li>
          <li>Tous les frais sont non remboursables sauf indication contraire</li>
        </ul>
        
        <h3>4.3 Modifications de tarifs</h3>
        <p>
          Nous nous réservons le droit de modifier nos tarifs avec un préavis de 30 jours. 
          Les nouveaux tarifs ne s'appliqueront pas rétroactivement.
        </p>
        
        <h2>5. Propriété intellectuelle</h2>
        
        <h3>5.1 Nos droits</h3>
        <p>
          L'Application, y compris son code source, sa conception, ses logos et sa documentation, 
          est la propriété exclusive de StockEasy et est protégée par les lois sur la propriété intellectuelle.
        </p>
        
        <h3>5.2 Vos droits</h3>
        <p>
          Vous conservez tous les droits sur vos données (produits, commandes, inventaire). 
          Nous ne revendiquons aucun droit de propriété sur vos données.
        </p>
        
        <h3>5.3 Licence d'utilisation</h3>
        <p>
          Nous vous accordons une licence limitée, non exclusive, non transférable et révocable 
          pour utiliser l'Application conformément à ces Conditions.
        </p>
        
        <h2>6. Protection des données</h2>
        <p>
          Notre utilisation de vos données est régie par notre 
          <a href="/privacy">Politique de Confidentialité</a>, qui fait partie intégrante de ces Conditions.
        </p>
        <p>Points clés :</p>
        <ul>
          <li>Conformité RGPD et CCPA</li>
          <li>Chiffrement des données sensibles</li>
          <li>Suppression automatique après désinstallation (48h)</li>
          <li>Pas de vente de données à des tiers</li>
        </ul>
        
        <h2>7. Garanties et limitations</h2>
        
        <h3>7.1 Disponibilité du service</h3>
        <p>
          Nous nous efforçons de maintenir l'Application disponible 99,5% du temps, mais nous ne garantissons pas 
          un accès ininterrompu. Des interruptions peuvent survenir pour :
        </p>
        <ul>
          <li>Maintenance planifiée (avec préavis)</li>
          <li>Urgences ou problèmes de sécurité</li>
          <li>Causes indépendantes de notre volonté</li>
        </ul>
        
        <h3>7.2 Limitation de garantie</h3>
        <div class="important">
          <p><strong>L'Application est fournie "EN L'ÉTAT" et "SELON DISPONIBILITÉ".</strong></p>
          <p>
            Nous déclinons toute garantie, expresse ou implicite, y compris mais sans s'y limiter :
          </p>
          <ul style="margin-top: 10px;">
            <li>Garantie de qualité marchande</li>
            <li>Garantie d'adéquation à un usage particulier</li>
            <li>Garantie de non-violation</li>
            <li>Garantie d'exactitude ou de fiabilité des résultats</li>
          </ul>
        </div>
        
        <h2>8. Limitation de responsabilité</h2>
        
        <div class="important">
          <h3>8.1 Exclusions</h3>
          <p>
            <strong>DANS LA MESURE MAXIMALE AUTORISÉE PAR LA LOI, STOCKEASY NE SERA PAS RESPONSABLE DE :</strong>
          </p>
          <ul style="margin-top: 10px;">
            <li>Perte de profits, revenus ou données</li>
            <li>Perte d'opportunité commerciale</li>
            <li>Dommages indirects, accessoires ou consécutifs</li>
            <li>Dommages résultant de l'utilisation ou de l'impossibilité d'utiliser l'Application</li>
            <li>Erreurs de synchronisation ou perte de données</li>
            <li>Interruptions de service</li>
          </ul>
          
          <h3>8.2 Plafond de responsabilité</h3>
          <p>
            Notre responsabilité totale envers vous ne dépassera <strong>PAS</strong> le montant total 
            que vous avez payé pour l'Application au cours des 12 derniers mois.
          </p>
        </div>
        
        <h3>8.3 Votre responsabilité</h3>
        <p>
          Vous acceptez d'indemniser et de dégager StockEasy de toute réclamation résultant de :
        </p>
        <ul>
          <li>Votre violation de ces Conditions</li>
          <li>Votre violation de lois applicables</li>
          <li>Votre mauvaise utilisation de l'Application</li>
        </ul>
        
        <h2>9. Résiliation</h2>
        
        <h3>9.1 Par vous</h3>
        <p>
          Vous pouvez résilier à tout moment en désinstallant l'Application depuis votre boutique Shopify. 
          Aucun remboursement ne sera effectué pour la période de facturation en cours.
        </p>
        
        <h3>9.2 Par nous</h3>
        <p>
          Nous pouvons suspendre ou résilier votre accès immédiatement si :
        </p>
        <ul>
          <li>Vous violez ces Conditions</li>
          <li>Vous ne payez pas les frais dus</li>
          <li>Votre utilisation pose un risque de sécurité</li>
          <li>Requis par la loi ou par Shopify</li>
        </ul>
        
        <h3>9.3 Effets de la résiliation</h3>
        <p>Après la résiliation :</p>
        <ul>
          <li>Votre accès à l'Application cessera immédiatement</li>
          <li>Vos données de connexion seront supprimées sous 48 heures (GDPR)</li>
          <li>Vous restez responsable de tous les frais encourus avant la résiliation</li>
        </ul>
        
        <h2>10. Modifications de l'Application</h2>
        <p>
          Nous nous réservons le droit de :
        </p>
        <ul>
          <li>Modifier, suspendre ou interrompre l'Application à tout moment</li>
          <li>Ajouter ou supprimer des fonctionnalités</li>
          <li>Mettre à jour ces Conditions (avec notification préalable de 14 jours pour les changements majeurs)</li>
        </ul>
        
        <h2>11. Support et maintenance</h2>
        
        <h3>11.1 Support technique</h3>
        <p>Nous fournissons un support technique via :</p>
        <ul>
          <li>Email : <a href="mailto:support@stockeasy.com">support@stockeasy.com</a></li>
          <li>Documentation en ligne</li>
          <li>Temps de réponse : < 48h ouvrables</li>
        </ul>
        
        <h3>11.2 Maintenance</h3>
        <p>
          Nous effectuons une maintenance régulière. Les maintenances planifiées seront notifiées 
          au moins 24 heures à l'avance sauf en cas d'urgence.
        </p>
        
        <h2>12. Conformité légale</h2>
        
        <h3>12.1 Lois applicables</h3>
        <p>
          Ces Conditions sont régies par les lois françaises, sans égard aux principes 
          de conflits de lois.
        </p>
        
        <h3>12.2 Règlement des litiges</h3>
        <p>
          Tout litige sera soumis à la juridiction exclusive des tribunaux de [Ville, France].
        </p>
        
        <h3>12.3 Conformité Shopify</h3>
        <p>
          Cette Application respecte les 
          <a href="https://www.shopify.com/legal/app-store-partner-program-agreement" target="_blank">
          Conditions du Programme Partenaire Shopify App Store
          </a>.
        </p>
        
        <h2>13. Dispositions générales</h2>
        
        <h3>13.1 Intégralité de l'accord</h3>
        <p>
          Ces Conditions constituent l'intégralité de l'accord entre vous et StockEasy 
          concernant l'Application.
        </p>
        
        <h3>13.2 Divisibilité</h3>
        <p>
          Si une disposition de ces Conditions est jugée invalide, les autres dispositions 
          resteront pleinement en vigueur.
        </p>
        
        <h3>13.3 Renonciation</h3>
        <p>
          Le fait de ne pas exercer un droit prévu par ces Conditions ne constitue pas 
          une renonciation à ce droit.
        </p>
        
        <h3>13.4 Cession</h3>
        <p>
          Vous ne pouvez pas céder ces Conditions sans notre consentement écrit préalable. 
          Nous pouvons céder ces Conditions à tout moment.
        </p>
        
        <h3>13.5 Force majeure</h3>
        <p>
          Nous ne serons pas responsables des retards ou défaillances causés par des événements 
          indépendants de notre volonté raisonnable (catastrophes naturelles, guerres, pannes Internet, etc.).
        </p>
        
        <h2>14. Contact et notifications</h2>
        
        <div class="contact">
          <h3>Pour nous contacter</h3>
          <p>
            <strong>Email support :</strong> <a href="mailto:support@stockeasy.com">support@stockeasy.com</a><br>
            <strong>Email légal :</strong> <a href="mailto:legal@stockeasy.com">legal@stockeasy.com</a><br>
            <strong>Site web :</strong> <a href="https://stockeasy.app">https://stockeasy.app</a>
          </p>
          <p>
            <strong>Adresse postale :</strong><br>
            StockEasy SAS<br>
            [Votre adresse complète]<br>
            [Code postal] [Ville]<br>
            France
          </p>
          <p>
            <strong>SIRET :</strong> [Votre numéro SIRET]<br>
            <strong>TVA :</strong> [Votre numéro TVA]
          </p>
        </div>
        
        <h2>15. Acceptation des Conditions</h2>
        <p>
          <strong>En installant l'Application, vous reconnaissez avoir lu, compris et accepté ces Conditions d'utilisation.</strong>
        </p>
        <p>
          Si vous avez des questions concernant ces Conditions, veuillez nous contacter avant d'installer l'Application.
        </p>
        
        <div class="footer">
          <p>&copy; 2025 StockEasy SAS. Tous droits réservés.</p>
          <p>
            <a href="/terms">Conditions d'utilisation</a> | 
            <a href="/privacy">Politique de confidentialité</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `);
});

export { router as legalRouter };


