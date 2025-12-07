import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Brain, 
  RefreshCw, 
  Bell, 
  BarChart3, 
  Layers, 
  Shield,
  Target,
  ShoppingCart,
  PackageSearch,
  Users,
  MessageSquare,
  Globe,
  FileText,
  Truck,
  Check,
  Clock,
  UserPlus,
  AtSign
} from 'lucide-react';

const Features = () => {
  const { t } = useTranslation();
  
  const mainFeatures = [
    {
      icon: Brain,
      title: t('landing.features.main.aiPredictions.title', "Prévisions de stock IA"),
      subtitle: "MACHINE LEARNING",
      description: t('landing.features.main.aiPredictions.description', "Notre algorithme analyse votre historique de vente pour prédire les ruptures de stock et le surstock avant qu'ils n'arrivent."),
      highlight: t('landing.features.main.aiPredictions.highlight', "Prédictions intelligentes"),
    },
    {
      icon: RefreshCw,
      title: t('landing.features.main.realTimeSync.title', "Sync Shopify temps réel"),
      subtitle: "SHOPIFY INTEGRATION",
      description: t('landing.features.main.realTimeSync.description', "Synchronisation bidirectionnelle automatique avec votre boutique Shopify et vos entrepôts. Vos stocks sont toujours à jour."),
      highlight: t('landing.features.main.realTimeSync.highlight', "< 2 sec de latence"),
    },
    {
      icon: Bell,
      title: t('landing.features.main.smartAlerts.title', "Alertes anti-rupture"),
      subtitle: "NOTIFICATIONS",
      description: t('landing.features.main.smartAlerts.description', "Recevez des alertes de stock bas personnalisées au bon moment pour réapprovisionner. Email, SMS ou in-app."),
      highlight: t('landing.features.main.smartAlerts.highlight', "100% personnalisables"),
    },
  ];

  const secondaryFeatures = [
    { icon: BarChart3, title: t('landing.features.secondary.analytics', "Analytics avancés"), description: t('landing.features.secondary.analyticsDesc', "Tableaux de bord visuels avec KPIs") },
    { icon: Layers, title: t('landing.features.secondary.multiLocation', "Multi-emplacements"), description: t('landing.features.secondary.multiLocationDesc', "Gérez plusieurs entrepôts") },
    { icon: ShoppingCart, title: t('landing.features.secondary.supplierOrders', "Commandes fournisseurs"), description: t('landing.features.secondary.supplierOrdersDesc', "Créez vos bons de commande en 1 clic") },
    { icon: PackageSearch, title: t('landing.features.secondary.orderTracking', "Suivi des commandes"), description: t('landing.features.secondary.orderTrackingDesc', "Suivez vos réceptions fournisseurs") },
    { icon: Users, title: t('landing.features.secondary.collaboration', "Travail collaboratif"), description: t('landing.features.secondary.collaborationDesc', "Invitez votre équipe sur l'app") },
    { icon: MessageSquare, title: t('landing.features.secondary.comments', "Commentaires"), description: t('landing.features.secondary.commentsDesc', "Annotez vos produits en équipe") },
    { icon: Shield, title: t('landing.features.secondary.security', "Sécurité maximale"), description: t('landing.features.secondary.securityDesc', "Conformité RGPD garantie") },
    { icon: Globe, title: t('landing.features.secondary.multilingual', "Multilingue"), description: t('landing.features.secondary.multilingualDesc', "Support FR, EN, ES") },
    { icon: Target, title: t('landing.features.secondary.autoThresholds', "Seuils automatiques"), description: t('landing.features.secondary.autoThresholdsDesc', "Calcul intelligent des stocks min/max") },
  ];

  return (
    <section id="features" className="landing-section bg-white">
      <div className="landing-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="badge badge-neutral mb-4">{t('landing.navbar.features', 'Fonctionnalités')}</span>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            {t('landing.features.title', 'Tout ce dont vous avez besoin pour votre inventaire')}
          </h2>
          <p className="text-[#191919]/60 max-w-lg mx-auto">
            {t('landing.features.subtitle', 'Des outils puissants de gestion de stock conçus pour les marchands Shopify exigeants')}
          </p>
        </motion.div>

        {/* Main Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="card p-8 hover:border-[#191919]/20"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-[#FAFAF7] border border-[#E5E4DF] flex items-center justify-center mb-5">
                <feature.icon size={24} className="text-[#191919]" />
              </div>

              {/* Subtitle */}
              <div className="text-xs font-medium text-[#191919]/40 tracking-wider mb-3">
                {feature.subtitle}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-[#191919] mb-4">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-[#191919]/60 leading-relaxed mb-5">
                {feature.description}
              </p>

              {/* Highlight */}
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span className="text-sm font-medium text-[#059669]">
                  {feature.highlight}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Secondary Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card p-10 mb-20"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {secondaryFeatures.map((feature, index) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-[#FAFAF7] border border-[#E5E4DF] flex items-center justify-center flex-shrink-0">
                  <feature.icon size={18} className="text-[#191919]/70" />
                </div>
                <div>
                  <h4 className="font-medium text-[#191919] mb-1.5">{feature.title}</h4>
                  <p className="text-sm text-[#191919]/50 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Supplier Orders Feature with Visual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 grid lg:grid-cols-2 gap-16 items-center"
        >
          {/* Left - Content */}
          <div className="space-y-8">
            <span className="badge badge-success">{t('landing.features.supplierSection.badge', 'Nouveau')}</span>
            <h3 className="text-2xl md:text-3xl font-semibold text-[#191919]">
              {t('landing.features.supplierSection.title', 'Gestion des commandes fournisseurs')}
            </h3>
            <p className="text-[#191919]/60 leading-relaxed">
              {t('landing.features.supplierSection.description', "Créez, suivez et gérez vos commandes fournisseurs directement depuis l'application. Plus besoin de jongler entre Excel et votre boutique.")}
            </p>
            <ul className="space-y-4">
              {[
                { icon: FileText, text: t('landing.features.supplierSection.items.autoGeneration', "Génération automatique des bons de commande") },
                { icon: Truck, text: t('landing.features.supplierSection.items.deliveryTracking', "Suivi des livraisons en temps réel") },
                { icon: Check, text: t('landing.features.supplierSection.items.oneClickReceive', "Réception et mise à jour du stock en 1 clic") },
                { icon: Clock, text: t('landing.features.supplierSection.items.orderHistory', "Historique complet des commandes") },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] flex items-center justify-center">
                    <item.icon size={16} className="text-[#059669]" />
                  </div>
                  <span className="text-sm text-[#191919]/70">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right - Visual Mockup */}
          <div className="relative">
            <div className="card p-6 shadow-lg">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-[#191919]">{t('landing.features.supplierSection.mockup.title', 'Commandes fournisseurs')}</h4>
                  <p className="text-xs text-[#191919]/50">{t('landing.features.supplierSection.mockup.subtitle', '3 commandes en cours')}</p>
                </div>
                <button className="px-3 py-1.5 bg-[#191919] text-white text-xs rounded-lg flex items-center gap-1">
                  <ShoppingCart size={12} />
                  {t('landing.features.supplierSection.mockup.newOrder', 'Nouvelle commande')}
                </button>
              </div>

              {/* Orders List */}
              <div className="space-y-3">
                {[
                  { ref: "PO-2024-001", supplier: "FournisseurPro", status: t('landing.features.supplierSection.mockup.status.inTransit', "En transit"), statusColor: "blue", items: 12, total: "2 450 €" },
                  { ref: "PO-2024-002", supplier: "StockMax", status: t('landing.features.supplierSection.mockup.status.delivered', "Livrée"), statusColor: "green", items: 8, total: "1 180 €" },
                  { ref: "PO-2024-003", supplier: "EuroSupply", status: t('landing.features.supplierSection.mockup.status.pending', "En attente"), statusColor: "orange", items: 25, total: "4 320 €" },
                ].map((order, i) => (
                  <motion.div
                    key={order.ref}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="p-3 rounded-lg border border-[#E5E4DF] hover:border-[#191919]/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#FAFAF7] flex items-center justify-center">
                          <PackageSearch size={18} className="text-[#191919]/60" />
                        </div>
                        <div>
                <div className="font-medium text-sm text-[#191919]">{order.ref}</div>
                                <div className="text-xs text-[#191919]/50">{order.supplier} · {order.items} {t('landing.features.supplierSection.mockup.items', 'articles')}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs px-2 py-0.5 rounded-full ${
                          order.statusColor === 'green' ? 'bg-[#ECFDF5] text-[#059669]' :
                          order.statusColor === 'blue' ? 'bg-[#EFF6FF] text-[#2563EB]' :
                          'bg-[#FEF3C7] text-[#D97706]'
                        }`}>
                          {order.status}
                        </div>
                        <div className="text-sm font-medium text-[#191919] mt-1">{order.total}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-3 -right-3 bg-white px-3 py-2 rounded-lg border border-[#E5E4DF] shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-[#2563EB]" />
                <span className="text-xs font-medium text-[#191919]">{t('landing.features.supplierSection.mockup.deliveryTomorrow', 'Livraison demain')}</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Collaborative System Feature with Visual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 grid lg:grid-cols-2 gap-16 items-center"
        >
          {/* Left - Visual Mockup */}
          <div className="relative order-2 lg:order-1">
            <div className="card p-6 shadow-lg">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-[#191919]">{t('landing.features.teamSection.mockup.title', 'Équipe & Commentaires')}</h4>
                  <p className="text-xs text-[#191919]/50">{t('landing.features.teamSection.mockup.subtitle', 'Collaborez en temps réel')}</p>
                </div>
                <button className="px-3 py-1.5 bg-[#191919] text-white text-xs rounded-lg flex items-center gap-1">
                  <UserPlus size={12} />
                  {t('landing.features.teamSection.mockup.invite', 'Inviter')}
                </button>
              </div>

              {/* Team Members */}
              <div className="mb-4">
                <div className="text-xs text-[#191919]/50 mb-2">{t('landing.features.teamSection.mockup.teamMembers', "Membres de l'équipe")}</div>
                <div className="flex items-center gap-2">
                  {[
                    { name: "Marie", color: "bg-[#F59E0B]" },
                    { name: "Thomas", color: "bg-[#3B82F6]" },
                    { name: "Sophie", color: "bg-[#10B981]" },
                    { name: "Lucas", color: "bg-[#8B5CF6]" },
                  ].map((member, i) => (
                    <motion.div
                      key={member.name}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-white text-xs font-medium border-2 border-white -ml-2 first:ml-0`}
                    >
                      {member.name[0]}
                    </motion.div>
                  ))}
                  <span className="text-xs text-[#191919]/50 ml-2">{t('landing.features.teamSection.mockup.memberCount', '4 membres')}</span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="border-t border-[#E5E4DF] pt-4">
                <div className="text-xs text-[#191919]/50 mb-3">{t('landing.features.teamSection.mockup.recentComments', 'Commentaires récents')}</div>
                <div className="space-y-3">
                  {[
                    { user: "M", name: "Marie", message: t('landing.features.teamSection.mockup.comment1', "Stock critique sur le SKU-1234, j'ai passé commande ✓"), time: t('landing.features.teamSection.mockup.time2h', "Il y a 2h"), color: "bg-[#F59E0B]" },
                    { user: "T", name: "Thomas", message: t('landing.features.teamSection.mockup.comment2', "@Marie bien reçu, livraison prévue jeudi"), time: t('landing.features.teamSection.mockup.time1h', "Il y a 1h"), color: "bg-[#3B82F6]" },
                  ].map((comment, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.15 }}
                      className="flex gap-3"
                    >
                      <div className={`w-7 h-7 rounded-full ${comment.color} flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}>
                        {comment.user}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[#191919]">{comment.name}</span>
                          <span className="text-xs text-[#191919]/40">{comment.time}</span>
                        </div>
                        <p className="text-xs text-[#191919]/70 mt-0.5">{comment.message}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Input */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 rounded-lg border border-[#E5E4DF] bg-[#FAFAF7] text-xs text-[#191919]/40">
                    {t('landing.features.teamSection.mockup.addComment', 'Ajouter un commentaire...')}
                  </div>
                  <AtSign size={14} className="text-[#191919]/30" />
                </div>
              </div>
            </div>

            {/* Floating notification */}
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-3 -left-3 bg-white px-3 py-2 rounded-lg border border-[#E5E4DF] shadow-sm"
            >
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-[#10B981]" />
                <span className="text-xs font-medium text-[#191919]">{t('landing.features.teamSection.mockup.newComment', 'Nouveau commentaire')}</span>
              </div>
            </motion.div>
          </div>

          {/* Right - Content */}
          <div className="space-y-8 order-1 lg:order-2">
            <span className="badge badge-neutral">{t('landing.features.teamSection.badge', 'Collaboratif')}</span>
            <h3 className="text-2xl md:text-3xl font-semibold text-[#191919]">
              {t('landing.features.teamSection.title', 'Travaillez en équipe, efficacement')}
            </h3>
            <p className="text-[#191919]/60 leading-relaxed">
              {t('landing.features.teamSection.description', 'Invitez vos collaborateurs, partagez des commentaires sur les produits et coordonnez vos actions de réapprovisionnement en temps réel.')}
            </p>
            <ul className="space-y-4">
              {[
                { icon: UserPlus, text: t('landing.features.teamSection.items.inviteMembers', "Invitez des membres avec différents rôles") },
                { icon: MessageSquare, text: t('landing.features.teamSection.items.commentProducts', "Commentez directement sur les produits") },
                { icon: AtSign, text: t('landing.features.teamSection.items.mentionColleagues', "Mentionnez vos collègues pour les notifier") },
                { icon: Users, text: t('landing.features.teamSection.items.trackActivity', "Suivez l'activité de votre équipe") },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-[#F3E8FF] flex items-center justify-center">
                    <item.icon size={16} className="text-[#7C3AED]" />
                  </div>
                  <span className="text-sm text-[#191919]/70">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
