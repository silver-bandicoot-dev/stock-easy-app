import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export const FloatingActionButton = ({ onClick, icon: Icon = Plus }) => (
  <motion.button
    onClick={onClick}
    className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center z-40"
    whileHover={{ scale: 1.1, rotate: 90 }}
    whileTap={{ scale: 0.9 }}
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
  >
    <Icon size={24} />
  </motion.button>
);
