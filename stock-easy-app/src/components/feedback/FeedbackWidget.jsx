import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Star } from 'lucide-react';
import Button from '../ui/Button/Button';
import { toast } from 'sonner';

export const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!feedback.trim()) {
      toast.error('Veuillez écrire un commentaire');
      return;
    }

    try {
      // Envoyer à votre API/service
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          feedback,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      });

      setSubmitted(true);
      toast.success('Merci pour votre retour !');
      
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setRating(0);
        setFeedback('');
      }, 2000);
    } catch (err) {
      toast.error('Erreur lors de l\'envoi');
      console.error(err);
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Donner votre avis"
      >
        <MessageCircle size={20} />
      </motion.button>

      {/* Modal de feedback */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Merci !
                  </h3>
                  <p className="text-gray-500">
                    Votre retour nous aide à améliorer Stock Easy
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Votre avis compte
                    </h2>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comment évaluez-vous Stock Easy ?
                      </label>
                      <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="p-1 transition-transform hover:scale-110"
                          >
                            <Star
                              size={32}
                              className={
                                star <= rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Feedback text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Que pouvons-nous améliorer ?
                      </label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Partagez vos suggestions, bugs rencontrés, ou fonctionnalités souhaitées..."
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" variant="primary">
                      Envoyer mon avis
                    </Button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
