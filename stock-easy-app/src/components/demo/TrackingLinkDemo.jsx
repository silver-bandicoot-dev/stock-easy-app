import React from 'react';
import { ExternalLink } from 'lucide-react';
import { formatTrackingUrl, getTrackingLinkText, isValidUrl } from '../utils/trackingUtils';

/**
 * Composant de démonstration pour tester les liens de tracking
 */
export const TrackingLinkDemo = () => {
  const trackingUrls = [
    'https://www.ups.com/track?trackingNumber=1Z999AA1234567890',
    'https://www.fedex.com/fedextrack/?trknbr=1234567890',
    'https://www.dhl.com/fr-fr/home/tracking.html?trackingNumber=1234567890',
    'https://www.chronopost.fr/tracking-colis',
    'https://www.colissimo.fr/outils/suivre-vos-envois',
    'invalid-url',
    'ups.com/track?trackingNumber=1Z999AA1234567890' // URL sans https
  ];

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Démonstration des liens de tracking</h3>
      
      {trackingUrls.map((url, index) => (
        <div key={index} className="border rounded p-3">
          <div className="text-sm text-gray-600 mb-2">
            URL originale: <code className="bg-gray-100 px-1 rounded">{url}</code>
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            URL formatée: <code className="bg-gray-100 px-1 rounded">{formatTrackingUrl(url)}</code>
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            Valide: <span className={isValidUrl(formatTrackingUrl(url)) ? 'text-green-600' : 'text-red-600'}>
              {isValidUrl(formatTrackingUrl(url)) ? 'Oui' : 'Non'}
            </span>
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            Texte du lien: <code className="bg-gray-100 px-1 rounded">{getTrackingLinkText(url)}</code>
          </div>
          
          {isValidUrl(formatTrackingUrl(url)) && (
            <a 
              href={formatTrackingUrl(url)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              {getTrackingLinkText(url)}
            </a>
          )}
        </div>
      ))}
    </div>
  );
};
