import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Store, 
  Truck, 
  Link as LinkIcon, 
  ShoppingBag, 
  X,
  PartyPopper
} from 'lucide-react';

/**
 * Composant Checklist d'Onboarding
 * Guide les nouveaux utilisateurs vers le succès
 */
export const OnboardingChecklist = ({ 
  hasSuppliers = false, 
  hasMappedProducts = false, 
  hasOrders = false,
  onDismiss,
  onNavigate // Fonction de navigation: (tab, subTab?) => void
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Étapes de la checklist
  const steps = [
    {
      id: 'connect',
      title: t('onboarding.steps.connect.title'),
      description: t('onboarding.steps.connect.description'),
      icon: Store,
      isCompleted: true, // Toujours vrai si on est là
      actionLabel: t('onboarding.steps.connect.action'),
      link: null
    },
    {
      id: 'suppliers',
      title: t('onboarding.steps.suppliers.title'),
      description: t('onboarding.steps.suppliers.description'),
      icon: Truck,
      isCompleted: hasSuppliers,
      actionLabel: t('onboarding.steps.suppliers.action'),
      link: 'suppliers' // ID de l'onglet à ouvrir (à gérer par le parent)
    },
    {
      id: 'mapping',
      title: t('onboarding.steps.mapping.title'),
      description: t('onboarding.steps.mapping.description'),
      icon: LinkIcon,
      isCompleted: hasMappedProducts,
      actionLabel: t('onboarding.steps.mapping.action'),
      link: 'mapping'
    },
    {
      id: 'order',
      title: t('onboarding.steps.order.title'),
      description: t('onboarding.steps.order.description'),
      icon: ShoppingBag,
      isCompleted: hasOrders,
      actionLabel: t('onboarding.steps.order.action'),
      link: 'orders'
    }
  ];

  // Calcul du pourcentage
  useEffect(() => {
    const completed = steps.filter(s => s.isCompleted).length;
    setCompletionPercentage((completed / steps.length) * 100);
  }, [hasSuppliers, hasMappedProducts, hasOrders]);

  // Si tout est terminé, on peut proposer de fermer
  const allCompleted = completionPercentage === 100;

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-[#E5E4DF] rounded-xl shadow-sm overflow-hidden mb-6"
    >
      {/* Header de la checklist */}
      <div className="p-4 flex items-center justify-between bg-[#FAFAF7] border-b border-[#E5E4DF]">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E5E4DF"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={allCompleted ? "#10B981" : "#191919"}
                strokeWidth="3"
                strokeDasharray={`${completionPercentage}, 100`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-[#191919]">
              {Math.round(completionPercentage)}%
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-[#191919]">
              {allCompleted ? t('onboarding.titleCompleted') : t('onboarding.title')}
            </h3>
            <p className="text-xs text-[#666663]">
              {allCompleted 
                ? t('onboarding.descriptionCompleted')
                : t('onboarding.description')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-[#E5E4DF] rounded-lg transition-colors text-[#666663]"
          >
            <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
          <button
            onClick={() => {
              setIsVisible(false);
              if (onDismiss) onDismiss();
            }}
            className="p-1.5 hover:bg-[#E5E4DF] rounded-lg transition-colors text-[#666663]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Corps de la checklist */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-[#E5E4DF]">
              {steps.map((step, index) => (
                <div 
                  key={step.id}
                  className={`p-4 flex items-center gap-4 transition-colors ${
                    step.isCompleted ? 'bg-white opacity-70' : 'bg-white hover:bg-[#FAFAF7]'
                  }`}
                >
                  {/* Icône de statut */}
                  <div className="shrink-0">
                    {step.isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
                    ) : (
                      <Circle className="w-6 h-6 text-[#E5E4DF]" />
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <step.icon className={`w-4 h-4 ${step.isCompleted ? 'text-[#666663]' : 'text-[#191919]'}`} />
                      <h4 className={`font-medium ${step.isCompleted ? 'text-[#666663] line-through' : 'text-[#191919]'}`}>
                        {step.title}
                      </h4>
                    </div>
                    <p className="text-sm text-[#666663] ml-6 mt-0.5">
                      {step.description}
                    </p>
                  </div>

                  {/* Action (si pas terminé) */}
                  {!step.isCompleted && step.link && onNavigate && (
                    <button
                      onClick={() => onNavigate(step.link)}
                      className="px-3 py-1.5 text-xs font-medium text-[#191919] bg-white border border-[#E5E4DF] rounded-lg hover:bg-[#FAFAF7] hover:border-[#191919] transition-all whitespace-nowrap shadow-sm"
                    >
                      {step.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Footer de célébration si tout est fini */}
            {allCompleted && (
              <div className="p-4 bg-green-50 flex items-center gap-3 text-green-800 text-sm">
                <PartyPopper className="w-5 h-5" />
                <span>
                  {t('onboarding.congratulations')}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

