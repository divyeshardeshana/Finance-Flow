import { forwardRef } from 'react';

interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function FormField({ label, error, hint, required, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>}
      {hint && !error && <p className="text-[12px] text-gray-400 dark:text-gray-600">{hint}</p>}
    </div>
  );
}

export const AppInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, trailingIcon, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            {...props}
            className={`
              w-full bg-white dark:bg-white/[0.04] border rounded-xl text-[13px] text-gray-900 dark:text-white
              placeholder:text-gray-400 dark:placeholder:text-gray-600
              transition-all duration-150
              ${error
                ? 'border-red-300 dark:border-red-500/40 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-200 dark:border-white/[0.1] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500'
              }
              ${icon ? 'pl-9' : 'pl-3.5'}
              ${trailingIcon ? 'pr-9' : 'pr-3.5'}
              py-2.5
              outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `}
          />
          {trailingIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {trailingIcon}
            </div>
          )}
        </div>
        {error && <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>}
        {hint && !error && <p className="text-[12px] text-gray-400 dark:text-gray-600">{hint}</p>}
      </div>
    );
  }
);

AppInput.displayName = 'AppInput';

export const AppSelect = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, children, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          {...props}
          className={`
            w-full bg-white dark:bg-white/[0.04] border rounded-xl text-[13px] text-gray-900 dark:text-white
            px-3.5 py-2.5 outline-none transition-all duration-150
            ${error
              ? 'border-red-300 dark:border-red-500/40 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-200 dark:border-white/[0.1] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
        >
          {children}
        </select>
        {error && <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>}
        {hint && !error && <p className="text-[12px] text-gray-400 dark:text-gray-600">{hint}</p>}
      </div>
    );
  }
);

AppSelect.displayName = 'AppSelect';

export const AppTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          {...props}
          className={`
            w-full bg-white dark:bg-white/[0.04] border rounded-xl text-[13px] text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-600
            px-3.5 py-2.5 outline-none transition-all duration-150 resize-none
            ${error
              ? 'border-red-300 dark:border-red-500/40 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-200 dark:border-white/[0.1] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
        />
        {error && <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>}
        {hint && !error && <p className="text-[12px] text-gray-400 dark:text-gray-600">{hint}</p>}
      </div>
    );
  }
);

AppTextarea.displayName = 'AppTextarea';

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function AppButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: AppButtonProps) {
  const sizeClasses = {
    sm: 'px-3.5 py-2 text-[12px]',
    md: 'px-4 py-2.5 text-[13px]',
    lg: 'px-5 py-3 text-[14px]',
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0',
    secondary:
      'bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.07]',
    danger:
      'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-0.5 active:translate-y-0',
    ghost:
      'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-semibold
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {loading ? (
        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
