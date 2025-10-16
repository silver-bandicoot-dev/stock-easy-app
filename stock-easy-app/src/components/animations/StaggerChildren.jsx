import { motion } from 'framer-motion';
import React from 'react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const StaggerChildren = ({ children }) => (
  <motion.div variants={container} initial="hidden" animate="show">
    {React.Children.map(children, child => (
      <motion.div variants={item}>
        {child}
      </motion.div>
    ))}
  </motion.div>
);
