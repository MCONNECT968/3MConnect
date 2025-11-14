import { useState, useEffect } from 'react';
import { getFromLocalStorage, saveToLocalStorage } from '../utils/localStorage';

// Custom hook for using localStorage with React state
function useLocalStorage<T>(key: string, initialValue: T) {
  // Get initial value from localStorage or use provided initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    return getFromLocalStorage<T>(key, initialValue);
  });

  // Update localStorage when state changes
  useEffect(() => {
    saveToLocalStorage(key, storedValue);
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}

export default useLocalStorage;