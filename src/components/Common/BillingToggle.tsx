interface BillingToggleProps {
  isAnnual: boolean;
  onToggle: (isAnnual: boolean) => void;
  annualDiscount?: number;
}

export function BillingToggle({ isAnnual, onToggle, annualDiscount }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
        Monthly
      </span>
      <button
        onClick={() => onToggle(!isAnnual)}
        className="relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        style={{ backgroundColor: isAnnual ? '#2563eb' : '#cbd5e1' }}
        aria-label="Toggle billing period"
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            isAnnual ? 'translate-x-8' : 'translate-x-1'
          }`}
        />
      </button>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
          Annual
        </span>
        {annualDiscount && annualDiscount > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
            Save {annualDiscount}%
          </span>
        )}
      </div>
    </div>
  );
}
