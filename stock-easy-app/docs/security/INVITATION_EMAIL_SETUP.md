# Configuration des emails d'invitation

## 📧 Système d'invitation d'utilisateurs

Le système d'invitation permet aux administrateurs d'inviter de nouveaux collaborateurs à rejoindre leur entreprise sur StockEasy.

## 🔄 Fonctionnement

1. **L'admin clique sur "Inviter"** dans la section Équipe
2. **Remplit le formulaire** avec les informations du collaborateur
3. **Sélectionne le rôle** (Utilisateur, Manager, ou Administrateur)
4. **L'invitation est créée** dans Firestore dans la collection `invitations`
5. **Un email est envoyé** au collaborateur invité (à configurer)

## 📊 Structure de données Firestore

### Collection: `invitations`

```javascript
{
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  role: "user", // "user" | "manager" | "admin"
  companyId: "abc123",
  invitedBy: "userId123",
  invitedByName: "Jane Smith",
  companyName: "Ma Société",
  status: "pending", // "pending" | "accepted" | "expired"
  createdAt: Timestamp,
  expiresAt: Timestamp // 7 jours après la création
}
```

## 📧 Configuration de l'envoi d'emails

### Option 1: Firebase Extensions - Trigger Email

1. **Installer l'extension Firebase**:
   ```bash
   firebase ext:install firebase/firestore-send-email
   ```

2. **Configurer l'extension** avec votre service SMTP (Gmail, SendGrid, etc.)

3. **Créer un template d'email** dans Firestore:
   ```javascript
   // Collection: mail
   {
     to: ['john.doe@example.com'],
     message: {
       subject: 'Invitation à rejoindre StockEasy',
       html: `
         <h1>Vous avez été invité à rejoindre StockEasy</h1>
         <p>${invitedByName} vous a invité à rejoindre ${companyName}</p>
         <p>Votre rôle: ${role}</p>
         <a href="https://stockeasy.app/accept-invite?token=${invitationId}">
           Accepter l'invitation
         </a>
       `
     }
   }
   ```

### Option 2: Cloud Functions

Créer une Cloud Function qui s'exécute lors de la création d'une invitation:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configuration SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});

exports.sendInvitationEmail = functions.firestore
  .document('invitations/{invitationId}')
  .onCreate(async (snap, context) => {
    const invitation = snap.data();
    const invitationId = context.params.invitationId;

    const mailOptions = {
      from: 'StockEasy <noreply@stockeasy.app>',
      to: invitation.email,
      subject: `Invitation à rejoindre ${invitation.companyName} sur StockEasy`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #000; 
              color: #fff; 
              text-decoration: none; 
              border-radius: 8px;
              margin: 20px 0;
            }
            .header { 
              background-color: #000; 
              color: #fff; 
              padding: 20px; 
              text-align: center; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>StockEasy</h1>
            </div>
            <div style="padding: 20px;">
              <h2>Vous avez été invité à rejoindre ${invitation.companyName}</h2>
              
              <p>Bonjour ${invitation.firstName},</p>
              
              <p>${invitation.invitedByName} vous a invité à rejoindre ${invitation.companyName} sur StockEasy.</p>
              
              <p><strong>Votre rôle:</strong> ${getRoleLabel(invitation.role)}</p>
              
              <a href="https://stockeasy.app/accept-invite?token=${invitationId}" class="button">
                Accepter l'invitation
              </a>
              
              <p style="color: #666;">
                Cette invitation expire dans 7 jours.
              </p>
              
              <hr style="margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px;">
                Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Invitation email sent to:', invitation.email);
      
      // Mettre à jour le statut de l'invitation
      await snap.ref.update({
        emailSent: true,
        emailSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending invitation email:', error);
      await snap.ref.update({
        emailSent: false,
        emailError: error.message
      });
    }
  });

function getRoleLabel(role) {
  const roles = {
    'admin': 'Administrateur',
    'manager': 'Manager',
    'user': 'Utilisateur'
  };
  return roles[role] || 'Utilisateur';
}
```

### Option 3: Service externe (SendGrid, Mailgun, etc.)

1. **Installer le SDK**:
   ```bash
   npm install @sendgrid/mail
   ```

2. **Créer une Cloud Function**:
   ```javascript
   const sgMail = require('@sendgrid/mail');
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);

   exports.sendInvitationEmail = functions.firestore
     .document('invitations/{invitationId}')
     .onCreate(async (snap, context) => {
       const invitation = snap.data();
       const invitationId = context.params.invitationId;

       const msg = {
         to: invitation.email,
         from: 'noreply@stockeasy.app',
         templateId: 'd-xxxxxxxxxxxxx', // Template ID de SendGrid
         dynamic_template_data: {
           firstName: invitation.firstName,
           invitedByName: invitation.invitedByName,
           companyName: invitation.companyName,
           role: getRoleLabel(invitation.role),
           acceptUrl: `https://stockeasy.app/accept-invite?token=${invitationId}`
         }
       };

       try {
         await sgMail.send(msg);
         await snap.ref.update({ emailSent: true });
       } catch (error) {
         console.error('Error sending email:', error);
         await snap.ref.update({ emailSent: false, emailError: error.message });
       }
     });
   ```

## 🔗 Page d'acceptation d'invitation

Il faudra créer une page `/accept-invite` qui:

1. Récupère le token de l'invitation
2. Vérifie que l'invitation existe et n'a pas expiré
3. Permet à l'utilisateur de créer son compte
4. Associe l'utilisateur à la bonne entreprise
5. Attribue le bon rôle

## 🔒 Sécurité

- Les invitations expirent après 7 jours
- Seuls les admins peuvent inviter des collaborateurs
- Les tokens d'invitation sont uniques
- Les emails sont validés avant l'envoi

## 📝 Prochaines étapes

1. ✅ Interface d'invitation créée
2. ⏳ Configurer l'envoi d'emails
3. ⏳ Créer la page d'acceptation d'invitation
4. ⏳ Gérer l'expiration des invitations
5. ⏳ Ajouter la gestion des invitations dans le dashboard admin

