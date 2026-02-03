import { useState, useEffect } from 'react';
import { FoodAnalysis } from '@/lib/vision';

export interface MealEntry {
  id: string;
  timestamp: number;
  image: string; // base64
  analysis: FoodAnalysis;
}

const STORAGE_KEY = 'snapcoach_history_v1';

export function useMealHistory() {
  const [history, setHistory] = useState<MealEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const logMeal = (analysis: FoodAnalysis, image: string) => {
    const newEntry: MealEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      image,
      analysis
    };
    
    const updated = [newEntry, ...history];
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newEntry;
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { history, logMeal, clearHistory };
}
