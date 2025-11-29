import { motion } from 'framer-motion';
import { Star, ExternalLink } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      quote: "stockeasy a transformé notre gestion de stock. Nous avons réduit nos ruptures de 40% dès le premier mois.",
      author: "Marc Dubois",
      role: "CEO",
      company: "FashionStore.fr",
      avatar: "M",
      stats: "-40% ruptures",
    },
    {
      quote: "La synchronisation avec Shopify est parfaite. Je gagne 3 heures par semaine que je consacrais avant aux mises à jour manuelles.",
      author: "Sophie Martin",
      role: "Fondatrice",
      company: "BeautéBio",
      avatar: "S",
      stats: "3h/sem gagnées",
    },
    {
      quote: "Le support est exceptionnel. Une question à 23h, réponse en 10 minutes.",
      author: "Thomas Leroy",
      role: "Directeur E-commerce",
      company: "SportMax",
      avatar: "T",
      stats: "Support 24/7",
    },
    {
      quote: "J'ai testé plusieurs solutions. stockeasy est de loin la plus intuitive. Mes équipes l'ont adoptée en moins d'une journée.",
      author: "Julie Chen",
      role: "COO",
      company: "TechGadgets",
      avatar: "J",
      stats: "Setup < 1 jour",
    },
  ];

  const metrics = [
    { value: "500+", label: "Marchands actifs" },
    { value: "2M+", label: "SKUs gérés" },
    { value: "4.9/5", label: "Note moyenne" },
  ];

  return (
    <section id="testimonials" className="landing-section bg-white">
      <div className="landing-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="badge badge-neutral mb-4">Témoignages</span>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Ils nous font confiance
          </h2>
        </motion.div>

        {/* Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-3 gap-6 mb-12"
        >
          {metrics.map((metric) => (
            <div key={metric.label} className="text-center card p-6">
              <div className="text-2xl md:text-3xl font-semibold text-[#191919] stat-number">
                {metric.value}
              </div>
              <div className="text-sm text-[#191919]/50 mt-1">{metric.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="card p-6"
            >
              {/* Quote */}
              <p className="text-[#191919]/80 leading-relaxed mb-6">
                "{testimonial.quote}"
              </p>

              {/* Stats Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] mb-4">
                <Star size={12} className="text-amber-500" fill="#F59E0B" />
                <span className="text-xs text-[#059669] font-medium">
                  {testimonial.stats}
                </span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E5E4DF] flex items-center justify-center text-sm font-medium text-[#191919]">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-medium text-[#191919]">{testimonial.author}</div>
                  <div className="text-sm text-[#191919]/50">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Shopify Reviews Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <a
            href="https://apps.shopify.com/stockeasy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-lg card hover:border-[#191919]/20 transition-colors"
          >
            <span className="text-amber-500">★★★★★</span>
            <span className="text-sm text-[#191919]/70">Voir les avis sur Shopify App Store</span>
            <ExternalLink size={14} className="text-[#191919]/40" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
