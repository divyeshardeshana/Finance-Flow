import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { translate } from '../lib/translations';
import { convertCurrency, formatCurrency } from '../lib/currency';

interface AppPreferences {
  currency: string;
  language: string;
  theme: 'light' | 'dark';
}

interface AppPreferencesContextType {
  preferences: AppPreferences;
  updatePreferences: (prefs: Partial<AppPreferences>) => Promise<void>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  t: (key: string) => string;
  formatAmount: (amount: number, fromCurrency?: string) => string;
  convertAmount: (amount: number, fromCurrency?: string) => number;
}

const AppPreferencesContext = createContext<AppPreferencesContextType | undefined>(undefined);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<AppPreferences>(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    return {
      currency: 'USD',
      language: 'en',
      theme: savedTheme || 'light',
    };
  });

  useEffect(() => {
    loadPreferences();
  }, [user]);

  useEffect(() => {
    if (preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (!user) {
      localStorage.setItem('theme', preferences.theme);
    }
  }, [preferences.theme, user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('currency, language, theme')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setPreferences({
          currency: data.currency || 'USD',
          language: data.language || 'en',
          theme: data.theme || 'light',
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const updatePreferences = async (prefs: Partial<AppPreferences>) => {
    const newPreferences = { ...preferences, ...prefs };
    setPreferences(newPreferences);

    if (user) {
      try {
        await supabase
          .from('user_profiles')
          .update(prefs)
          .eq('id', user.id);
      } catch (error) {
        console.error('Error updating preferences:', error);
      }
    }
  };

  const isDarkMode = preferences.theme === 'dark';

  const toggleDarkMode = () => {
    updatePreferences({ theme: isDarkMode ? 'light' : 'dark' });
  };

  const t = (key: string): string => {
    return translate(key, preferences.language);
  };

  const formatAmount = (amount: number, fromCurrency: string = 'USD'): string => {
    const converted = convertCurrency(amount, fromCurrency, preferences.currency);
    return formatCurrency(converted, preferences.currency);
  };

  const convertAmount = (amount: number, fromCurrency: string = 'USD'): number => {
    return convertCurrency(amount, fromCurrency, preferences.currency);
  };

  return (
    <AppPreferencesContext.Provider
      value={{ preferences, updatePreferences, isDarkMode, toggleDarkMode, t, formatAmount, convertAmount }}
    >
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);
  if (context === undefined) {
    throw new Error('useAppPreferences must be used within an AppPreferencesProvider');
  }
  return context;
}
