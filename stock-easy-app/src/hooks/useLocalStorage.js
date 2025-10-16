import { useState, useEffect } from 'react';

export const useLocalStorage = (key, initialValue) => {
  // État pour stocker notre valeur
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Récupérer depuis le localStorage
      const item = window.localStorage.getItem(key);
      // Parser le JSON stocké ou retourner initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // Mettre à jour localStorage quand la valeur change
  const setValue = (value) => {
    try {
      // Permettre que value soit une fonction comme useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};
