import { motion } from 'framer-motion';

export const AnimatedButton = ({ children, ...props }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    {...props}
  >
    {children}
  </motion.button>
);
