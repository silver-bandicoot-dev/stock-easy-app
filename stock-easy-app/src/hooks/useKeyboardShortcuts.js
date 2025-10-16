import { useEffect } from 'react';

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Créer une clé basée sur les modificateurs
      const key = [
        event.ctrlKey && 'ctrl',
        event.shiftKey && 'shift',
        event.altKey && 'alt',
        event.key.toLowerCase()
      ].filter(Boolean).join('+');

      const shortcut = shortcuts[key];
      if (shortcut) {
        event.preventDefault();
        shortcut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
