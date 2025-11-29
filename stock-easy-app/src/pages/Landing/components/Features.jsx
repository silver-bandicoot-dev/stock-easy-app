import { motion } from 'framer-motion';
import { 
  Brain, 
  RefreshCw, 
  Bell, 
  BarChart3, 
  Layers, 
  Shield,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';

const Features = () => {
  const mainFeatures = [
    {
      icon: Brain,
      title: "Prévisions de stock IA",
      subtitle: "MACHINE LEARNING",
      description: "Notre algorithme analyse votre historique de vente pour prédire les ruptures de stock et le surstock avant qu'ils n'arrivent.",
      highlight: "99.9% de précision",
    },
    {
      icon: RefreshCw,
      title: "Sync Shopify temps réel",
      subtitle: "SHOPIFY INTEGRATION",
      description: "Synchronisation bidirectionnelle automatique avec votre boutique Shopify et vos entrepôts. Vos stocks sont toujours à jour.",
      highlight: "< 2 sec de latence",
    },
    {
      icon: Bell,
      title: "Alertes anti-rupture",
      subtitle: "NOTIFICATIONS",
      description: "Recevez des alertes de stock bas personnalisées au bon moment pour réapprovisionner. Email, SMS ou in-app.",
      highlight: "100% personnalisables",
    },
  ];

  const secondaryFeatures = [
    { icon: BarChart3, title: "Analytics avancés", description: "Tableaux de bord visuels avec KPIs" },
    { icon: Layers, title: "Multi-emplacements", description: "Gérez plusieurs entrepôts" },
    { icon: Shield, title: "Sécurité maximale", description: "Conformité RGPD garantie" },
    { icon: Zap, title: "Performance", description: "Ultra-rapide, même avec 100k+ SKUs" },
    { icon: Target, title: "Seuils automatiques", description: "Calcul intelligent des stocks min/max" },
    { icon: TrendingUp, title: "Rapports d'inventaire", description: "Exportez vos données en un clic" },
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
          <span className="badge badge-neutral mb-4">Fonctionnalités</span>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Tout ce dont vous avez besoin pour votre inventaire
          </h2>
          <p className="text-[#191919]/60 max-w-lg mx-auto">
            Des outils puissants de gestion de stock conçus pour les marchands Shopify exigeants
          </p>
        </motion.div>

        {/* Main Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="card p-6 hover:border-[#191919]/20"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-[#FAFAF7] border border-[#E5E4DF] flex items-center justify-center mb-4">
                <feature.icon size={24} className="text-[#191919]" />
              </div>

              {/* Subtitle */}
              <div className="text-xs font-medium text-[#191919]/40 tracking-wider mb-2">
                {feature.subtitle}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-[#191919] mb-3">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-[#191919]/60 leading-relaxed mb-4">
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
          className="card p-8"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {secondaryFeatures.map((feature, index) => (
              <div key={feature.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#FAFAF7] border border-[#E5E4DF] flex items-center justify-center flex-shrink-0">
                  <feature.icon size={18} className="text-[#191919]/70" />
                </div>
                <div>
                  <h4 className="font-medium text-[#191919] mb-0.5">{feature.title}</h4>
                  <p className="text-sm text-[#191919]/50">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <blockquote className="text-xl md:text-2xl text-[#191919]/80 italic max-w-2xl mx-auto">
            "Nous avons réduit nos ruptures de stock de <span className="font-semibold not-italic">40%</span> le premier mois."
          </blockquote>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E5E4DF] flex items-center justify-center text-sm font-medium text-[#191919]">
              M
            </div>
            <div className="text-left">
              <div className="font-medium text-[#191919]">Marc Dubois</div>
              <div className="text-sm text-[#191919]/50">CEO, FashionStore.fr</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
