import { useEffect } from 'react';
import { Loader2, Lock } from 'lucide-react';

interface AccessDeniedModalProps {
  featureName: string;
  requiredTier: string;
  onClose: () => void;
  onRedirect: () => void;
}

export function AccessDeniedModal({
  featureName,
  requiredTier,
  onClose,
  onRedirect,
}: AccessDeniedModalProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRedirect();
      onClose();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onRedirect, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 relative">
            <Lock className="w-10 h-10 text-white" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-t-transparent animate-spin" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Restricted</h2>

          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This feature requires a <span className="font-semibold text-blue-600 dark:text-blue-400 capitalize">{requiredTier}</span> subscription.
          </p>

          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Feature: <span className="font-semibold">{featureName}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-sm font-medium">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
