import { useState } from 'react';
import {
  Home, Receipt, TrendingUp, Target, PiggyBank, FileText, X,
  MessageCircle, Activity, Lightbulb, Bell, Wallet,
  Calendar, ChevronLeft, Zap, Crown, CreditCard,
  BarChart3, Bot, BookOpen, ScrollText,
} from 'lucide-react';

import { useSubscription } from '../../contexts/SubscriptionContext';
import type { Page } from './types';

interface NavItem {
  id: Page;
  name: string;
  icon: React.ElementType;
  featureKey: string | null;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface AppSidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  t: (key: string) => string;
}

const navGroups: NavGroup[] = [
  {
    label: 'Finance',
    items: [
      { id: 'home', name: 'Dashboard', icon: Home, featureKey: null },
      { id: 'transactions', name: 'Transactions', icon: Receipt, featureKey: null },
      { id: 'budget', name: 'Budget', icon: PiggyBank, featureKey: null },
      { id: 'reports', name: 'Reports', icon: BarChart3, featureKey: 'advanced_reports' },
      { id: 'savings', name: 'Savings Goals', icon: Target, featureKey: null },
    ],
  },
  {
    label: 'Planning',
    items: [
      { id: 'investment', name: 'Investment', icon: TrendingUp, featureKey: 'advanced_investments' },
      { id: 'networth', name: 'Net Worth', icon: Wallet, featureKey: 'net_worth_tracker' },
      { id: 'retirement', name: 'Retirement', icon: Calendar, featureKey: 'retirement_planning' },
      { id: 'estate', name: 'Estate Planning', icon: ScrollText, featureKey: 'estate_planning' },
      { id: 'bills', name: 'Bill Reminders', icon: Bell, featureKey: 'bill_reminders' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { id: 'predictions', name: 'Expense Prediction', icon: Activity, featureKey: 'expense_predictions' },
      { id: 'stockprediction', name: 'Stock Prediction', icon: TrendingUp, featureKey: 'stock_predictions' },
      { id: 'assistant', name: 'Financial Assistant', icon: Bot, featureKey: 'financial_assistant' },
      { id: 'recommendations', name: 'AI Recommendations', icon: Lightbulb, featureKey: 'ai_recommendations' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { id: 'literacy', name: 'Learning Challenge', icon: BookOpen, featureKey: null },
    ],
  },
  {
    label: 'Support',
    items: [
      { id: 'support', name: 'Support', icon: MessageCircle, featureKey: null },
      { id: 'knowledge-base', name: 'Knowledge Base', icon: FileText, featureKey: null },
    ],
  },
];

export function AppSidebar({
  currentPage,
  onNavigate,
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
}: AppSidebarProps) {
  const { hasFeatureAccess } = useSubscription();

  const handleNav = (page: Page) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-[#0B0F1A] border-r border-gray-200/80 dark:border-white/[0.06] transform transition-all duration-300 ease-in-out flex flex-col ${
          sidebarCollapsed ? 'w-[68px]' : 'w-[240px]'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo Header */}
        <div
          className={`flex items-center border-b border-gray-200/80 dark:border-white/[0.06] flex-shrink-0 h-[57px] ${
            sidebarCollapsed ? 'px-3 justify-center' : 'px-4'
          }`}
        >
          {sidebarCollapsed ? (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0 hover:shadow-blue-500/40 transition-shadow"
              title="Expand sidebar"
            >
              <Zap style={{ width: '16px', height: '16px' }} className="text-white" />
            </button>
          ) : (
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                <Zap style={{ width: '16px', height: '16px' }} className="text-white" />
              </div>
              <span className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight whitespace-nowrap">
                Finance<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">Flow</span>
              </span>
            </div>
          )}

          {!sidebarCollapsed && (
            <>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all flex-shrink-0"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-thin">
          <nav className={`${sidebarCollapsed ? 'px-2 space-y-0.5' : 'px-2'}`}>
            {navGroups.map((group, groupIdx) => (
              <div key={group.label} className={groupIdx > 0 && !sidebarCollapsed ? 'mt-1 pt-1 border-t border-gray-100 dark:border-white/[0.04]' : ''}>
                {!sidebarCollapsed && (
                  <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                    {group.label}
                  </p>
                )}
                {sidebarCollapsed && groupIdx > 0 && (
                  <div className="my-1.5 h-px bg-gray-100 dark:bg-white/[0.04]" />
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    const isLocked = item.featureKey ? !hasFeatureAccess(item.featureKey) : false;

                    if (isLocked) return null;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNav(item.id)}
                        title={sidebarCollapsed ? item.name : undefined}
                        className={`relative w-full flex items-center rounded-lg transition-all duration-150 group ${
                          sidebarCollapsed ? 'px-2.5 py-2.5 justify-center' : 'px-3 py-2.5 gap-3'
                        } ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-500/[0.12] text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <Icon
                          className={`flex-shrink-0 transition-all ${
                            sidebarCollapsed ? 'w-[18px] h-[18px]' : 'w-[16px] h-[16px]'
                          } ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`}
                        />
                        {!sidebarCollapsed && (
                          <>
                            <span
                              className={`text-[13px] font-medium flex-1 text-left tracking-tight ${
                                isActive ? 'text-blue-600 dark:text-blue-400' : ''
                              }`}
                            >
                              {item.name}
                            </span>
                          </>
                        )}
                        {isActive && (
                          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-l-full bg-gradient-to-b from-blue-500 to-cyan-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
