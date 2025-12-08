# Template Email Magic Link - Stockeasy (Version Optimisée)

## Problème identifié
L'image ne s'affiche pas car :
1. Les clients email bloquent souvent les images externes par défaut
2. La syntaxe Supabase peut nécessiter des variables spécifiques
3. Les attributs HTML peuvent ne pas être correctement interprétés

## Solution : Template optimisé avec URL absolue

Ce template utilise une URL absolue avec tous les attributs nécessaires pour maximiser la compatibilité.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAF7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAFAF7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header avec Logo -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #E5E4DF;">
              <!-- Image avec attributs optimisés pour email -->
              <img 
                src="https://stock-easy-app.vercel.app/logos/stockeasy-logo.jpg" 
                alt="Stockeasy Logo" 
                width="48" 
                height="48"
                style="display: block; margin: 0 auto 12px auto; border-radius: 8px; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; max-width: 48px; height: auto;"
                border="0"
              />
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #191919;">stockeasy</h1>
            </td>
          </tr>
          
          <!-- Contenu principal -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #191919; text-align: center;">
                Bienvenue ! 🎉
              </h2>
              
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #666663; text-align: center;">
                Votre compte Stockeasy a été créé suite à l'installation de l'application sur votre boutique Shopify.
              </p>
              
              <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #666663; text-align: center;">
                Cliquez sur le bouton ci-dessous pour accéder à votre tableau de bord :
              </p>
              
              <!-- Bouton CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" 
                       style="display: inline-block; 
                              background-color: #191919; 
                              color: #FFFFFF; 
                              padding: 14px 32px; 
                              font-size: 15px; 
                              font-weight: 600; 
                              text-decoration: none; 
                              border-radius: 8px;
                              box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      Accéder à Stockeasy →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Info expiration -->
              <p style="margin: 32px 0 0 0; font-size: 13px; color: #999; text-align: center;">
                ⏱️ Ce lien est valide pendant 24 heures.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #FAFAF7; border-top: 1px solid #E5E4DF; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #999; text-align: center;">
                Gérez votre inventaire intelligemment avec Stockeasy.
              </p>
              <p style="margin: 0; font-size: 12px; color: #BBB; text-align: center;">
                Si vous n'avez pas installé cette application, ignorez cet email.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## Différences avec la version précédente

1. **Formatage de la balise `<img>`** : Formatée sur plusieurs lignes pour une meilleure lisibilité
2. **Attributs supplémentaires** : `max-width: 48px; height: auto;` pour une meilleure responsivité
3. **Alt text amélioré** : "Stockeasy Logo" au lieu de "Stockeasy"

## Alternative : Utiliser un service de CDN

Si l'image ne s'affiche toujours pas, vous pouvez :

1. **Uploader l'image sur un CDN** (Cloudinary, Imgix, etc.)
2. **Utiliser Supabase Storage** pour héberger l'image
3. **Convertir en PNG** au lieu de JPG (parfois mieux supporté)

## Vérification de l'URL

L'URL `https://stock-easy-app.vercel.app/logos/stockeasy-logo.jpg` est accessible et retourne un HTTP 200.

## Instructions

1. Connectez-vous à votre dashboard Supabase
2. Allez dans **Authentication > Email Templates**
3. Sélectionnez **Magic Link**
4. Copiez le template HTML ci-dessus dans l'éditeur
5. **Important** : Vérifiez que la syntaxe `{{ .ConfirmationURL }}` est correcte (c'est la variable Supabase)
6. Sauvegardez les modifications
7. Testez en envoyant un email magic link de test

## Dépannage

Si l'image ne s'affiche toujours pas :

1. **Vérifiez les logs Supabase** : Authentication > Logs pour voir s'il y a des erreurs
2. **Testez l'URL directement** : Ouvrez `https://stock-easy-app.vercel.app/logos/stockeasy-logo.jpg` dans un navigateur
3. **Vérifiez les paramètres email** : Assurez-vous que les images ne sont pas bloquées dans votre client email
4. **Essayez un autre format** : Convertir le logo en PNG ou SVG

