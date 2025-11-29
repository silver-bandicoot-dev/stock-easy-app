# 📧 Spécification : Intégration Gmail & Outlook

> **Statut** : 📋 PLANIFIÉ  
> **Date de création** : 2025-11-28  
> **Dernière mise à jour** : 2025-11-28  
> **Priorité** : Haute (amélioration UX significative)

---

## 📋 Contexte

Actuellement, les marchands peuvent générer des emails de commande ou de réclamation via les modales de StockEasy, mais ils doivent :
1. Copier manuellement le contenu
2. Ouvrir leur client email
3. Coller et envoyer

**Objectif** : Permettre l'envoi direct d'emails depuis l'application via les comptes Gmail ou Outlook des marchands.

### État actuel
- ✅ Génération automatique du contenu email (objet, corps, destinataire)
- ✅ Modales `EmailOrderModal` et `ReclamationEmailModalInline`
- ✅ Bouton "Client email" (mailto:) qui ouvre l'app locale
- ✅ Bouton "Copier" vers le presse-papiers
- ❌ Pas d'envoi direct depuis l'application
- ❌ Pas de connexion aux comptes email des utilisateurs

---

## 🎯 Objectifs

1. **Envoi direct** : Permettre aux marchands d'envoyer des emails sans quitter StockEasy
2. **Identité préservée** : Les emails sont envoyés depuis l'adresse personnelle du marchand
3. **Historique** : Traçabilité des emails envoyés aux fournisseurs
4. **Simplicité** : Configuration "one-click" avec OAuth

---

## 🏗️ Architecture Proposée

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────┐    ┌──────────────────────┐                   │
│  │  EmailOrderModal     │    │  ReclamationModal    │                   │
│  │                      │    │                      │                   │
│  │  [Copier] [Envoyer]  │    │  [Copier] [Envoyer]  │                   │
│  └──────────┬───────────┘    └──────────┬───────────┘                   │
│             │                           │                               │
│             └───────────┬───────────────┘                               │
│                         ▼                                               │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     EmailSendButton                              │   │
│  │                                                                  │   │
│  │  - Vérifie si un provider email est connecté                    │   │
│  │  - Affiche sélection provider si aucun                          │   │
│  │  - Envoie via le bon service                                    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                         │                                               │
└─────────────────────────┼───────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE (Backend)                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Table: user_email_integrations                                  │    │
│  │                                                                  │    │
│  │  - user_id (FK → auth.users)                                    │    │
│  │  - provider ('gmail' | 'outlook')                               │    │
│  │  - email_address                                                 │    │
│  │  - access_token (encrypted)                                     │    │
│  │  - refresh_token (encrypted)                                    │    │
│  │  - token_expires_at                                             │    │
│  │  - connected_at                                                 │    │
│  │  - is_active                                                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Table: email_history                                            │    │
│  │                                                                  │    │
│  │  - id                                                           │    │
│  │  - user_id (FK → auth.users)                                    │    │
│  │  - company_id (FK → companies)                                  │    │
│  │  - type ('order' | 'reclamation' | 'custom')                    │    │
│  │  - recipient_email                                              │    │
│  │  - recipient_name (fournisseur)                                 │    │
│  │  - subject                                                      │    │
│  │  - body_preview (100 chars)                                     │    │
│  │  - related_order_id (FK → orders, nullable)                     │    │
│  │  - sent_at                                                      │    │
│  │  - provider ('gmail' | 'outlook')                               │    │
│  │  - status ('sent' | 'failed')                                   │    │
│  │  - external_message_id                                          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Edge Functions                                                  │    │
│  │                                                                  │    │
│  │  POST /send-email-gmail     → Envoi via Gmail API               │    │
│  │  POST /send-email-outlook   → Envoi via Microsoft Graph API     │    │
│  │  POST /refresh-email-token  → Refresh des tokens expirés        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Flux d'authentification OAuth

### Gmail (Google Cloud)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUX OAUTH GMAIL                                  │
└─────────────────────────────────────────────────────────────────────────┘

1. Utilisateur clique "Connecter Gmail" dans Paramètres > Email
        │
        ▼
2. Redirection vers Google OAuth Consent Screen
   - Scope: https://www.googleapis.com/auth/gmail.send
   - Scope: https://www.googleapis.com/auth/userinfo.email
        │
        ▼
3. Utilisateur autorise l'application
        │
        ▼
4. Google redirige vers /auth/callback/gmail?code=XXX
        │
        ▼
5. Edge Function échange le code contre access_token + refresh_token
        │
        ▼
6. Tokens chiffrés et stockés dans user_email_integrations
        │
        ▼
7. UI mise à jour : "Gmail connecté ✓" avec badge email
```

### Outlook (Microsoft Graph)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUX OAUTH OUTLOOK                                │
└─────────────────────────────────────────────────────────────────────────┘

1. Utilisateur clique "Connecter Outlook" dans Paramètres > Email
        │
        ▼
2. Redirection vers Microsoft OAuth (Azure AD)
   - Scope: Mail.Send
   - Scope: User.Read
        │
        ▼
3. Utilisateur autorise l'application
        │
        ▼
4. Microsoft redirige vers /auth/callback/outlook?code=XXX
        │
        ▼
5. Edge Function échange le code contre access_token + refresh_token
        │
        ▼
6. Tokens chiffrés et stockés dans user_email_integrations
        │
        ▼
7. UI mise à jour : "Outlook connecté ✓" avec badge email
```

---

## 📊 Schéma de base de données

### Migration Supabase

```sql
-- Migration: XXX_create_email_integrations.sql

-- ================================================
-- Table pour stocker les connexions email OAuth
-- ================================================
CREATE TABLE public.user_email_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Provider info
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  email_address TEXT NOT NULL,
  display_name TEXT,
  
  -- Tokens (chiffrés via pgcrypto)
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false, -- Provider par défaut pour cet utilisateur
  
  -- Metadata
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  last_token_refresh_at TIMESTAMPTZ,
  
  -- Contraintes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un utilisateur ne peut avoir qu'une connexion par provider
  UNIQUE (user_id, provider)
);

-- Index
CREATE INDEX idx_user_email_integrations_user ON user_email_integrations(user_id);
CREATE INDEX idx_user_email_integrations_active ON user_email_integrations(user_id, is_active) WHERE is_active = true;

-- RLS
ALTER TABLE user_email_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_integrations" ON user_email_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_manage_own_integrations" ON user_email_integrations
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE user_email_integrations IS 'Stocke les connexions OAuth Gmail/Outlook des utilisateurs';

-- ================================================
-- Table historique des emails envoyés
-- ================================================
CREATE TABLE public.email_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Type d'email
  email_type TEXT NOT NULL CHECK (email_type IN ('order', 'reclamation', 'custom')),
  
  -- Destinataire
  recipient_email TEXT NOT NULL,
  recipient_name TEXT, -- Nom du fournisseur
  supplier_id TEXT, -- Référence au fournisseur
  
  -- Contenu
  subject TEXT NOT NULL,
  body_preview TEXT, -- Premiers 200 caractères
  
  -- Relation optionnelle avec une commande
  related_order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- Envoi
  provider TEXT CHECK (provider IN ('gmail', 'outlook', 'mailto')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  
  -- ID externe (Gmail messageId ou Outlook id)
  external_message_id TEXT,
  
  -- Erreur si échec
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_email_history_company ON email_history(company_id);
CREATE INDEX idx_email_history_user ON email_history(user_id);
CREATE INDEX idx_email_history_order ON email_history(related_order_id);
CREATE INDEX idx_email_history_sent_at ON email_history(sent_at DESC);

-- RLS
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_company_email_history" ON email_history
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "users_can_create_email_history" ON email_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE email_history IS 'Historique des emails envoyés aux fournisseurs';

-- ================================================
-- Fonction pour compter les emails récents
-- ================================================
CREATE OR REPLACE FUNCTION get_recent_email_stats(
  p_company_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_sent BIGINT,
  by_type JSONB,
  by_supplier JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_sent,
    jsonb_object_agg(
      COALESCE(email_type, 'unknown'), 
      type_count
    ) as by_type,
    jsonb_object_agg(
      COALESCE(recipient_name, recipient_email), 
      supplier_count
    ) as by_supplier
  FROM (
    SELECT 
      email_type,
      COUNT(*) as type_count,
      recipient_name,
      COUNT(*) as supplier_count
    FROM email_history
    WHERE company_id = p_company_id
      AND sent_at >= NOW() - (p_days || ' days')::INTERVAL
      AND status = 'sent'
    GROUP BY email_type, recipient_name
  ) sub;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🖥️ Composants Frontend

### 1. Page de configuration email (Paramètres)

```jsx
// src/components/settings/EmailIntegrationSettings/EmailIntegrationSettings.jsx

import React, { useState, useEffect } from 'react';
import { Mail, Check, X, RefreshCw, Settings, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

export function EmailIntegrationSettings() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);

  // Charger les intégrations existantes
  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    const { data } = await supabase
      .from('user_email_integrations')
      .select('*')
      .eq('is_active', true);
    setIntegrations(data || []);
    setLoading(false);
  };

  const connectProvider = async (provider) => {
    setConnecting(provider);
    
    // Générer l'URL OAuth
    const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
    
    if (provider === 'gmail') {
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email',
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent'
      });
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    } else if (provider === 'outlook') {
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'Mail.Send User.Read offline_access',
        response_type: 'code'
      });
      window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
    }
  };

  const disconnectProvider = async (integrationId) => {
    const { error } = await supabase
      .from('user_email_integrations')
      .update({ is_active: false })
      .eq('id', integrationId);
    
    if (!error) {
      toast.success('Compte déconnecté');
      loadIntegrations();
    }
  };

  const setAsPrimary = async (integrationId) => {
    // Désactiver tous les primary
    await supabase
      .from('user_email_integrations')
      .update({ is_primary: false })
      .neq('id', integrationId);
    
    // Activer celui-ci
    await supabase
      .from('user_email_integrations')
      .update({ is_primary: true })
      .eq('id', integrationId);
    
    toast.success('Compte défini par défaut');
    loadIntegrations();
  };

  const gmailIntegration = integrations.find(i => i.provider === 'gmail');
  const outlookIntegration = integrations.find(i => i.provider === 'outlook');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Comptes email connectés
        </h3>
        <p className="text-sm text-neutral-600">
          Connectez votre compte Gmail ou Outlook pour envoyer des emails 
          directement depuis StockEasy.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Gmail */}
        <EmailProviderCard
          provider="gmail"
          name="Gmail"
          logo="/logos/gmail.webp"
          integration={gmailIntegration}
          connecting={connecting === 'gmail'}
          onConnect={() => connectProvider('gmail')}
          onDisconnect={() => disconnectProvider(gmailIntegration?.id)}
          onSetPrimary={() => setAsPrimary(gmailIntegration?.id)}
        />

        {/* Outlook */}
        <EmailProviderCard
          provider="outlook"
          name="Outlook"
          logo="/logos/outlook.png"
          integration={outlookIntegration}
          connecting={connecting === 'outlook'}
          onConnect={() => connectProvider('outlook')}
          onDisconnect={() => disconnectProvider(outlookIntegration?.id)}
          onSetPrimary={() => setAsPrimary(outlookIntegration?.id)}
        />
      </div>

      {/* Historique des emails */}
      <div className="mt-8 pt-6 border-t border-neutral-200">
        <h4 className="font-medium text-neutral-900 mb-4">
          Emails récemment envoyés
        </h4>
        <EmailHistoryList />
      </div>
    </div>
  );
}

function EmailProviderCard({ 
  provider, 
  name, 
  logo, 
  integration, 
  connecting,
  onConnect, 
  onDisconnect,
  onSetPrimary 
}) {
  const isConnected = !!integration;

  return (
    <div className={`
      p-5 rounded-xl border-2 transition-all
      ${isConnected 
        ? 'border-success-200 bg-success-50' 
        : 'border-neutral-200 bg-white hover:border-neutral-300'
      }
    `}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt={name} className="w-10 h-10 object-contain" />
          <div>
            <h4 className="font-semibold text-neutral-900">{name}</h4>
            {isConnected && (
              <p className="text-sm text-neutral-600">
                {integration.email_address}
              </p>
            )}
          </div>
        </div>
        {isConnected && (
          <span className="flex items-center gap-1 text-xs font-medium text-success-700 bg-success-100 px-2 py-1 rounded-full">
            <Check className="w-3 h-3" />
            Connecté
          </span>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-2">
          {integration.is_primary ? (
            <span className="text-xs text-primary-600 font-medium">
              ★ Compte par défaut
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSetPrimary}
              className="text-neutral-600"
            >
              Définir par défaut
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Trash2}
              onClick={onDisconnect}
              className="text-danger-600 border-danger-200 hover:bg-danger-50"
            >
              Déconnecter
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="primary"
          size="sm"
          icon={Mail}
          onClick={onConnect}
          loading={connecting}
          className="w-full"
        >
          Connecter {name}
        </Button>
      )}
    </div>
  );
}
```

### 2. Bouton d'envoi d'email intelligent

```jsx
// src/components/ui/EmailSendButton/EmailSendButton.jsx

import React, { useState, useEffect } from 'react';
import { Send, Mail, Copy, ExternalLink, Check, ChevronDown } from 'lucide-react';
import { Button } from '../Button';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import emailService from '../../../services/emailService';

/**
 * Bouton intelligent d'envoi d'email
 * - Si un provider est connecté → Envoi direct
 * - Sinon → Menu avec options (copier, mailto, connecter)
 */
export function EmailSendButton({
  to,
  subject,
  body,
  emailType = 'custom',
  relatedOrderId = null,
  supplierName = null,
  onSent,
  disabled = false,
  className = ''
}) {
  const [integration, setIntegration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Charger l'intégration email active
  useEffect(() => {
    const loadIntegration = async () => {
      const { data } = await supabase
        .from('user_email_integrations')
        .select('*')
        .eq('is_active', true)
        .eq('is_primary', true)
        .single();
      
      setIntegration(data);
      setLoading(false);
    };
    loadIntegration();
  }, []);

  const handleDirectSend = async () => {
    if (!integration) return;
    
    setSending(true);
    try {
      // Appeler l'Edge Function pour envoyer
      const { data, error } = await supabase.functions.invoke(
        `send-email-${integration.provider}`,
        {
          body: { to, subject, body }
        }
      );

      if (error) throw error;

      // Enregistrer dans l'historique
      await supabase.from('email_history').insert({
        email_type: emailType,
        recipient_email: to,
        recipient_name: supplierName,
        subject,
        body_preview: body.substring(0, 200),
        related_order_id: relatedOrderId,
        provider: integration.provider,
        status: 'sent',
        external_message_id: data.messageId
      });

      toast.success('Email envoyé avec succès !');
      onSent?.();
    } catch (error) {
      console.error('Erreur envoi email:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
      
      // Enregistrer l'échec
      await supabase.from('email_history').insert({
        email_type: emailType,
        recipient_email: to,
        recipient_name: supplierName,
        subject,
        body_preview: body.substring(0, 200),
        related_order_id: relatedOrderId,
        provider: integration.provider,
        status: 'failed',
        error_message: error.message
      });
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async () => {
    const fullEmail = emailService.buildEmailContent(to, subject, body);
    const success = await emailService.copyToClipboard(fullEmail);
    if (success) {
      toast.success('Email copié dans le presse-papiers');
    }
    setShowMenu(false);
  };

  const handleMailto = () => {
    emailService.openEmailClient(to, subject, body);
    setShowMenu(false);
  };

  // Si un provider est connecté → Bouton d'envoi direct
  if (integration) {
    return (
      <div className="relative">
        <Button
          variant="primary"
          icon={Send}
          onClick={handleDirectSend}
          loading={sending}
          disabled={disabled || sending}
          className={className}
        >
          Envoyer via {integration.provider === 'gmail' ? 'Gmail' : 'Outlook'}
        </Button>
        
        {/* Menu déroulant pour alternatives */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="absolute right-0 top-0 h-full px-2 border-l border-primary-400 hover:bg-primary-700 rounded-r-lg"
        >
          <ChevronDown className="w-4 h-4 text-white" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 min-w-[180px] z-10">
            <button
              onClick={handleCopy}
              className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copier l'email
            </button>
            <button
              onClick={handleMailto}
              className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Ouvrir client email
            </button>
          </div>
        )}
      </div>
    );
  }

  // Pas de provider connecté → Menu avec options
  return (
    <div className="relative">
      <Button
        variant="primary"
        icon={Mail}
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled}
        className={className}
      >
        Envoyer l'email
      </Button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 min-w-[240px] z-10">
          <div className="px-4 py-2 border-b border-neutral-100">
            <p className="text-xs text-neutral-500">
              Connectez un compte email pour envoyer directement
            </p>
          </div>
          
          <button
            onClick={handleCopy}
            className="w-full px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3"
          >
            <Copy className="w-5 h-5 text-neutral-400" />
            <div>
              <div className="font-medium">Copier l'email</div>
              <div className="text-xs text-neutral-500">Dans le presse-papiers</div>
            </div>
          </button>
          
          <button
            onClick={handleMailto}
            className="w-full px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3"
          >
            <ExternalLink className="w-5 h-5 text-neutral-400" />
            <div>
              <div className="font-medium">Ouvrir client email</div>
              <div className="text-xs text-neutral-500">Outlook, Apple Mail, etc.</div>
            </div>
          </button>

          <div className="border-t border-neutral-100 mt-2 pt-2">
            <button
              onClick={() => window.location.href = '/settings?tab=email'}
              className="w-full px-4 py-3 text-left text-sm text-primary-600 hover:bg-primary-50 flex items-center gap-3"
            >
              <Mail className="w-5 h-5" />
              <div>
                <div className="font-medium">Connecter Gmail ou Outlook</div>
                <div className="text-xs text-primary-400">Configuration rapide</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## ⚙️ Edge Functions Supabase

### Gmail - Envoi d'email

```typescript
// supabase/functions/send-email-gmail/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '')
    );
    if (authError || !user) {
      throw new Error('Non autorisé');
    }

    // Récupérer l'intégration Gmail
    const { data: integration } = await supabase
      .from('user_email_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'gmail')
      .eq('is_active', true)
      .single();

    if (!integration) {
      throw new Error('Aucune intégration Gmail trouvée');
    }

    // Vérifier/rafraîchir le token
    let accessToken = await decryptToken(integration.access_token_encrypted);
    
    if (new Date(integration.token_expires_at) < new Date()) {
      // Token expiré, le rafraîchir
      accessToken = await refreshGmailToken(
        await decryptToken(integration.refresh_token_encrypted)
      );
      
      // Mettre à jour en base
      await supabase
        .from('user_email_integrations')
        .update({
          access_token_encrypted: await encryptToken(accessToken),
          token_expires_at: new Date(Date.now() + 3600000), // +1h
          last_token_refresh_at: new Date()
        })
        .eq('id', integration.id);
    }

    // Préparer le payload
    const { to, subject, body } = await req.json();
    
    // Créer le message au format RFC 2822
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      '',
      body
    ].join('\r\n');

    // Encoder en base64url
    const encodedMessage = btoa(message)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Envoyer via Gmail API
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: encodedMessage })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erreur Gmail API');
    }

    const result = await response.json();

    // Mettre à jour last_used_at
    await supabase
      .from('user_email_integrations')
      .update({ last_used_at: new Date() })
      .eq('id', integration.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur send-email-gmail:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function refreshGmailToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error('Échec du refresh token Gmail');
  }
  
  return data.access_token;
}

// Fonctions de chiffrement (à implémenter avec pgcrypto ou autre)
async function decryptToken(encrypted: string): Promise<string> {
  // TODO: Implémenter le déchiffrement
  return encrypted;
}

async function encryptToken(token: string): Promise<string> {
  // TODO: Implémenter le chiffrement
  return token;
}
```

### Outlook - Envoi d'email

```typescript
// supabase/functions/send-email-outlook/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ... (même structure que Gmail, avec Microsoft Graph API)

serve(async (req) => {
  // ... authentification identique ...

  try {
    // Récupérer l'intégration Outlook
    const { data: integration } = await supabase
      .from('user_email_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'outlook')
      .eq('is_active', true)
      .single();

    // ... vérification token ...

    const { to, subject, body } = await req.json();

    // Envoyer via Microsoft Graph API
    const response = await fetch(
      'https://graph.microsoft.com/v1.0/me/sendMail',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            subject,
            body: {
              contentType: 'Text',
              content: body
            },
            toRecipients: [
              { emailAddress: { address: to } }
            ]
          }
        })
      }
    );

    // ... gestion réponse ...
    
  } catch (error) {
    // ...
  }
});
```

---

## 🎨 Design UI/UX

### Modal Email avec nouveau bouton

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📧 Email de commande                                           [X]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ 📦 Fournisseur: TextilePro France                                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌──────────────────────────┐  ┌──────────────────────────┐            │
│  │ Articles                 │  │ Montant total             │            │
│  │ 🔢 12                    │  │ 💶 2,450.00 €             │            │
│  └──────────────────────────┘  └──────────────────────────┘            │
│                                                                          │
│  Destinataire                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ commercial@textilepro.fr                                     ✓    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Objet                                                                  │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Commande de réapprovisionnement - TextilePro France               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Message                                                                │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Bonjour Marie,                                                     │ │
│  │                                                                    │ │
│  │ Nous souhaitons passer une commande de réapprovisionnement...     │ │
│  │ ...                                                                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│    [Annuler]    [Créer sans email]    [Envoyer via Gmail ▼]            │
│                                        └─────────────────────┘          │
│                                        │ Envoyer via Gmail   │          │
│                                        │──────────────────────│          │
│                                        │ Envoyer via Outlook  │          │
│                                        │ Copier l'email       │          │
│                                        │ Client email local   │          │
│                                        └──────────────────────┘          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Badge de connexion dans le header

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🏭 StockEasy     [Dashboard] [Stock] [Commandes] ...       [🔔] [👤]  │
│                                                                          │
│                                    Si Gmail connecté :                   │
│                                    [📧 Gmail ✓]                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Checklist d'implémentation

### Phase 1 : Backend & Configuration

- [ ] Créer l'application Google Cloud Console
  - [ ] Activer Gmail API
  - [ ] Configurer OAuth 2.0 credentials
  - [ ] Ajouter redirect URIs
- [ ] Créer l'application Azure AD (Microsoft)
  - [ ] Enregistrer l'application
  - [ ] Configurer les permissions Mail.Send
  - [ ] Ajouter redirect URIs
- [ ] Migration Supabase
  - [ ] Table `user_email_integrations`
  - [ ] Table `email_history`
  - [ ] RLS policies
- [ ] Edge Functions Supabase
  - [ ] `send-email-gmail`
  - [ ] `send-email-outlook`
  - [ ] `oauth-callback-gmail`
  - [ ] `oauth-callback-outlook`
  - [ ] `refresh-email-token`

### Phase 2 : Frontend

- [ ] Composant `EmailIntegrationSettings`
- [ ] Composant `EmailSendButton`
- [ ] Composant `EmailHistoryList`
- [ ] Modifier `EmailOrderModal` pour utiliser `EmailSendButton`
- [ ] Modifier `ReclamationEmailModalInline` pour utiliser `EmailSendButton`
- [ ] Pages de callback OAuth (`/auth/callback/gmail`, `/auth/callback/outlook`)
- [ ] Badge de connexion email dans le header
- [ ] Section "Email" dans les paramètres

### Phase 3 : Tests & Documentation

- [ ] Tests unitaires composants
- [ ] Tests E2E flux OAuth
- [ ] Tests envoi email
- [ ] Documentation utilisateur
- [ ] Guide de configuration OAuth

---

## 🔒 Sécurité

### Tokens OAuth

1. **Chiffrement** : Tous les tokens sont chiffrés en base avec `pgcrypto`
2. **Refresh automatique** : Les tokens expirés sont rafraîchis automatiquement
3. **RLS** : Chaque utilisateur ne peut voir que ses propres intégrations
4. **Scope minimal** : Seuls les scopes nécessaires sont demandés (gmail.send, Mail.Send)

### Variables d'environnement

```env
# .env.local (frontend)
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
VITE_MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Supabase Edge Functions Secrets
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET=xxxxx
TOKEN_ENCRYPTION_KEY=xxxx
```

---

## 📚 Ressources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Send Message](https://developers.google.com/gmail/api/reference/rest/v1/users.messages/send)
- [Microsoft Graph Mail.Send](https://learn.microsoft.com/en-us/graph/api/user-sendmail)
- [Azure AD OAuth 2.0](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## 🚀 Évolutions futures

1. **Templates d'emails personnalisables** par marchand
2. **Pièces jointes** (bons de commande PDF)
3. **Suivi des réponses** (via Gmail/Outlook threads)
4. **Emails automatiques** (rappels, confirmations)
5. **Multi-destinataires** (CC, BCC)
6. **Signatures HTML** personnalisées

---

*Document créé le 28 novembre 2025*  
*Statut : En attente de validation*


