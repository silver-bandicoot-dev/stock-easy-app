# Template Email Magic Link - Stockeasy

## ✅ Problème résolu
Le logo ne s'affichait pas dans l'email magic link car les clients email bloquent souvent les images externes.

## ✅ Solution validée
**Utiliser l'image encodée en base64 compacte directement dans le template** (voir `EMAIL_TEMPLATE_MAGIC_LINK_COMPACT.md`)

Cette solution garantit que le logo s'affichera toujours, même si les images externes sont bloquées.

**✅ TESTÉ ET FONCTIONNEL** - La version compacte (96x96px, 2.7KB) fonctionne parfaitement.

## Solution alternative (non recommandée)
Utiliser l'URL absolue avec HTTPS et ajouter des attributs pour améliorer la compatibilité avec les clients email (moins fiable - images externes souvent bloquées).

## Template HTML corrigé

Copiez ce template dans votre dashboard Supabase : **Authentication > Email Templates > Magic Link**

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
              <img src="https://stock-easy-app.vercel.app/logos/stockeasy-logo.jpg" 
                   alt="Stockeasy" 
                   width="48" 
                   height="48"
                   style="display: block; margin: 0 auto 12px auto; border-radius: 8px; border: none; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;"
                   border="0" />
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

## Modifications apportées

1. **Attributs ajoutés à la balise `<img>`** :
   - `border="0"` : Évite les bordures dans certains clients email
   - `style` amélioré avec `border: none; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;` pour une meilleure compatibilité

2. **URL du logo** : 
   - Utilise `https://stock-easy-app.vercel.app/logos/stockeasy-logo.jpg` (vérifiée et accessible)

## ⚠️ Instructions pour appliquer

**IMPORTANT** : Utilisez le template de `EMAIL_TEMPLATE_MAGIC_LINK_COMPACT.md` qui contient l'image base64 compacte. C'est la version qui fonctionne.

1. Connectez-vous à votre dashboard Supabase
2. Allez dans **Authentication > Email Templates**
3. Sélectionnez **Magic Link**
4. Copiez le template HTML de `EMAIL_TEMPLATE_MAGIC_LINK_COMPACT.md` dans l'éditeur
5. Sauvegardez les modifications

## Alternative : Utiliser un CDN ou héberger l'image

Si le logo ne s'affiche toujours pas, vous pouvez :
- Utiliser un service de CDN (Cloudinary, Imgix, etc.)
- Encoder l'image en base64 (mais cela augmente la taille de l'email)
- Héberger l'image sur un domaine dédié pour les emails

## Vérification

Après avoir appliqué le template, testez en envoyant un email magic link de test depuis Supabase.

