import { X, Crown, Check, Zap } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { getTierDisplayName } from '../../lib/subscriptionHelpers';

const featureDescriptions: Record<string, { title: string; description: string; requiredTier: 'paid' | 'premium' }> = {
  financial_assistant: {
    title: 'AI Financial Assistant',
    description: 'Chat with an AI assistant that analyzes your finances and answers money questions in real time',
    requiredTier: 'paid',
  },
  expense_prediction: {
    title: 'Expense Prediction',
    description: 'AI-powered predictions for your upcoming expenses based on spending patterns',
    requiredTier: 'paid',
  },
  ai_recommendations: {
    title: 'AI Recommendations',
    description: 'Personalized financial recommendations and actionable insights powered by AI',
    requiredTier: 'paid',
  },
  price_comparison: {
    title: 'Price Comparison',
    description: 'Compare prices across stores and find the best deals to stretch your budget further',
    requiredTier: 'paid',
  },
  bill_reminders: {
    title: 'Bill Reminders & Notifications',
    description: 'Never miss a bill payment with automatic reminders and browser notifications',
    requiredTier: 'paid',
  },
  split_transactions: {
    title: 'Split Transactions',
    description: 'Split expenses across multiple categories for detailed tracking',
    requiredTier: 'paid',
  },
  support_tickets: {
    title: 'Priority Support',
    description: 'Get dedicated support with ticketing system and knowledge base access',
    requiredTier: 'paid',
  },
  advanced_goals: {
    title: 'Advanced Goal Planning',
    description: 'Set milestones, categorize goals, and get automatic contribution suggestions',
    requiredTier: 'paid',
  },
  advanced_reports: {
    title: 'Advanced Reports & Export',
    description: 'Generate comprehensive reports and export to PDF, CSV, or Excel',
    requiredTier: 'paid',
  },
  stock_prediction: {
    title: 'Stock Prediction',
    description: 'AI-powered stock market analysis and price predictions across global exchanges',
    requiredTier: 'premium',
  },
  net_worth_tracker: {
    title: 'Net Worth Tracker',
    description: 'Track all your assets and liabilities with automatic updates for stocks and crypto',
    requiredTier: 'premium',
  },
  advanced_investments: {
    title: 'Advanced Investment Tracking',
    description: 'Monitor portfolio performance with time-weighted returns and benchmark comparisons',
    requiredTier: 'premium',
  },
  retirement_planning: {
    title: 'Retirement Planning',
    description: 'Run Monte Carlo simulations and get personalized retirement strategies',
    requiredTier: 'premium',
  },
  estate_planning: {
    title: 'Estate Planning Dashboard',
    description: 'Securely store documents, manage beneficiaries, and plan your legacy',
    requiredTier: 'premium',
  },
};

const paidFeatures = [
  'AI Financial Assistant',
  'Expense Prediction',
  'AI Recommendations',
  'Price Comparison',
  'Bill Reminders & Notifications',
  'Split Transactions',
  'Priority Support Tickets',
  'Advanced Goal Planning (10 goals)',
  'Advanced Reports & Export (PDF, CSV, Excel)',
];

const premiumFeatures = [
  ...paidFeatures,
  'Stock Prediction (Global Exchanges)',
  'Net Worth Tracker with Live Updates',
  'Advanced Investment Tracking',
  'Retirement Planning with Monte Carlo',
  'Estate Planning Dashboard',
  'Encrypted Document Storage',
];

interface UpgradePromptProps {
  onNavigateToSubscription?: () => void;
}

export function UpgradePrompt({ onNavigateToSubscription }: UpgradePromptProps = {}) {
  const { upgradePromptFeature, closeUpgradePrompt, tier } = useSubscription();

  if (!upgradePromptFeature) return null;

  const handleUpgradeClick = () => {
    closeUpgradePrompt();
    if (onNavigateToSubscription) {
      onNavigateToSubscription();
    }
  };

  const feature = featureDescriptions[upgradePromptFeature];
  if (!feature) return null;

  const showPaidPlan = feature.requiredTier === 'paid' && tier === 'free';
  const showPremiumPlan = feature.requiredTier === 'premium';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upgrade Required</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unlock premium features</p>
            </div>
          </div>
          <button
            onClick={closeUpgradePrompt}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-700 dark:text-gray-300">{feature.description}</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {showPaidPlan && (
              <div className="border-2 border-blue-500 rounded-xl p-6 relative dark:bg-gray-800">
                <div className="absolute -top-3 left-6 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  RECOMMENDED
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Paid Plan</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">$9.99</span>
                    <span className="text-gray-600 dark:text-gray-400">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">or $99.99/year (save 17%)</p>
                </div>
                <ul className="space-y-3 mb-6">
                  {paidFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleUpgradeClick}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Upgrade Plan
                </button>
              </div>
            )}

            {showPremiumPlan && (
              <div className="border-2 border-purple-500 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 relative">
                <div className="absolute -top-3 left-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  BEST VALUE
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Premium Plan</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">$19.99</span>
                    <span className="text-gray-600 dark:text-gray-400">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">or $199.99/year (save 17%)</p>
                </div>
                <ul className="space-y-3 mb-6">
                  {premiumFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleUpgradeClick}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Upgrade Plan
                </button>
              </div>
            )}

            {!showPremiumPlan && tier === 'paid' && (
              <div className="border-2 border-purple-500 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 relative">
                <div className="absolute -top-3 left-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  UPGRADE
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Premium Plan</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">$19.99</span>
                    <span className="text-gray-600 dark:text-gray-400">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">or $199.99/year (save 17%)</p>
                </div>
                <ul className="space-y-3 mb-6">
                  {premiumFeatures.slice(paidFeatures.length).map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleUpgradeClick}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Upgrade Plan
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All plans include a 14-day free trial. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
