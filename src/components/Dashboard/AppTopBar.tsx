import { useRef, useState } from 'react';
import {
  Menu, Sun, Moon, ChevronDown, LogOut, Crown, Shield,
  HelpCircle, CircleUser as UserCircle,
} from 'lucide-react';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Page } from './types';

interface AppTopBarProps {
  pageName: string;
  profile: { full_name?: string | null; photo_url?: string | null } | null;
  onMenuOpen: () => void;
  onNavigate: (page: Page) => void;
  onSubscriptionNavigate: () => void;
  onSignOut: () => void;
}

export function AppTopBar({
  pageName,
  profile,
  onMenuOpen,
  onNavigate,
  onSubscriptionNavigate,
  onSignOut,
}: AppTopBarProps) {
  const { preferences, updatePreferences } = useAppPreferences();
  const { isAdmin } = useAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <header className="bg-white/90 dark:bg-[#0B0F1A]/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-white/[0.06] sticky top-0 z-30 h-[57px]">
      <div className="px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuOpen}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 dark:text-gray-400 transition-colors flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight truncate">
            {pageName}
          </h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Theme toggle */}
          <button
            onClick={() => updatePreferences({ theme: preferences.theme === 'dark' ? 'light' : 'dark' })}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors text-gray-500 dark:text-gray-400"
            title={preferences.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {preferences.theme === 'dark' ? (
              <Sun className="w-[18px] h-[18px] text-amber-400" />
            ) : (
              <Moon className="w-[18px] h-[18px]" />
            )}
          </button>

          {/* Profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all duration-150"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md shadow-blue-500/20 ring-2 ring-white dark:ring-[#0B0F1A]">
                {profile?.photo_url ? (
                  <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="hidden sm:block text-[13px] font-semibold text-gray-900 dark:text-white max-w-[120px] truncate">
                {displayName}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#111827] rounded-xl shadow-2xl border border-gray-200/80 dark:border-white/[0.08] py-1.5 overflow-hidden z-20">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                        {profile?.photo_url ? (
                          <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle className="w-4.5 h-4.5 text-white" style={{ width: '18px', height: '18px' }} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="py-1">
                    <DropdownItem
                      icon={<UserCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
                      label="View Profile"
                      onClick={() => { onNavigate('profile'); setDropdownOpen(false); }}
                    />
                    <DropdownItem
                      icon={<Crown className="w-4 h-4 text-amber-400" />}
                      label="Subscription"
                      onClick={() => { onSubscriptionNavigate(); setDropdownOpen(false); }}
                    />
                    {isAdmin && (
                      <DropdownItem
                        icon={<Shield className="w-4 h-4 text-blue-500" />}
                        label="Admin Panel"
                        variant="blue"
                        onClick={() => { navigate('/admin'); setDropdownOpen(false); }}
                      />
                    )}
                    <DropdownItem
                      icon={<HelpCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
                      label="Support"
                      onClick={() => { onNavigate('support'); setDropdownOpen(false); }}
                    />
                  </div>

                  <div className="border-t border-gray-100 dark:border-white/[0.06] py-1">
                    <DropdownItem
                      icon={<LogOut className="w-4 h-4" />}
                      label="Sign Out"
                      variant="danger"
                      onClick={() => { onSignOut(); setDropdownOpen(false); }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

interface DropdownItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'blue' | 'danger';
}

function DropdownItem({ icon, label, onClick, variant = 'default' }: DropdownItemProps) {
  const colorClass =
    variant === 'danger'
      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/[0.08]'
      : variant === 'blue'
        ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/[0.08]'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors ${colorClass}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
