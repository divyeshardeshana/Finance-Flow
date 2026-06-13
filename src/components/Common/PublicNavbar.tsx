import { useState, useEffect } from 'react';
import { Zap, Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';

export type PublicView = 'home' | 'about' | 'features' | 'use-cases' | 'pricing' | 'faq' | 'blog' | 'contact' | 'privacy';

interface PublicNavbarProps {
  currentView: PublicView;
  onNavigate: (view: PublicView) => void;
  onSignIn: () => void;
}

const navLinks: { label: string; view: PublicView }[] = [
  { label: 'Home', view: 'home' },
  { label: 'Features', view: 'features' },
  { label: 'Use Cases', view: 'use-cases' },
  { label: 'Pricing', view: 'pricing' },
  { label: 'FAQ', view: 'faq' },
  { label: 'Blog', view: 'blog' },
  { label: 'Contact', view: 'contact' },
];

export function PublicNavbar({ currentView, onNavigate, onSignIn }: PublicNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isDarkMode, toggleDarkMode } = useAppPreferences();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 dark:bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/10 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 flex-shrink-0 group"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
                <Zap className="w-4.5 h-4.5 text-white" size={18} />
              </div>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Finance<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">Flow</span>
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ label, view }) => (
              <button
                key={view}
                onClick={() => onNavigate(view)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentView === view
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {label}
                {currentView === view && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-lg bg-blue-50 dark:bg-blue-500/10"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={onSignIn}
              className="hidden sm:flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onSignIn}
              className="px-5 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 dark:shadow-blue-500/30 dark:hover:shadow-blue-400/50"
            >
              Get Started
            </button>
            <button
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="lg:hidden overflow-hidden bg-white/95 dark:bg-[#0B0F1A]/95 backdrop-blur-xl border-t border-gray-200/60 dark:border-white/10"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(({ label, view }) => (
                <button
                  key={view}
                  onClick={() => { onNavigate(view); setMobileOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    currentView === view
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  {label}
                </button>
              ))}
              <div className="pt-2 pb-1 flex flex-col gap-2">
                <button
                  onClick={() => { onSignIn(); setMobileOpen(false); }}
                  className="w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { onSignIn(); setMobileOpen(false); }}
                  className="w-full px-4 py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-600 to-blue-500"
                >
                  Get Started Free
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
