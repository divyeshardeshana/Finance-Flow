import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  DollarSign,
  Ticket,
  MessageSquare,
  HelpCircle,
  Settings,
  BarChart3,
  X,
  LogOut,
  Shield,
  Tag,
  Users,
  Zap,
  ChevronLeft,
  Menu,
  ArrowLeft,
  Landmark,
  TrendingUp,
  SearchCheck,
  BookOpen,
  Mail,
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  permission?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, permission: 'all' },
  { name: 'User Management', path: '/admin/users', icon: Users, permission: 'manage_users' },
  { name: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard, permission: 'view_subscriptions' },
  { name: 'Payments', path: '/admin/payments', icon: DollarSign, permission: 'view_payments' },
  { name: 'Support Tickets', path: '/admin/tickets', icon: Ticket, permission: 'view_tickets' },
  { name: 'Quiz Management', path: '/admin/quizzes', icon: MessageSquare, permission: 'view_quizzes' },
  { name: 'FAQ Management', path: '/admin/faqs', icon: HelpCircle, permission: 'view_faqs' },
  { name: 'Reports', path: '/admin/reports', icon: BarChart3, permission: 'view_reports' },
  { name: 'Pricing Page', path: '/admin/pricing', icon: Tag, permission: 'manage_settings' },
  { name: 'Feature Management', path: '/admin/features', icon: Settings, permission: 'manage_settings' },
  { name: 'Retirement Management', path: '/admin/retirement-management', icon: Landmark, permission: 'manage_settings' },
  { name: 'Investment Management', path: '/admin/investment-management', icon: TrendingUp, permission: 'manage_settings' },
  { name: 'SEO Management', path: '/admin/seo', icon: SearchCheck, permission: 'manage_settings' },
  { name: 'Blog Management', path: '/admin/blog', icon: BookOpen, permission: 'manage_settings' },
  { name: 'Email Management', path: '/admin/email', icon: Mail, permission: 'manage_settings' },
  { name: 'Settings', path: '/admin/settings', icon: Settings, permission: 'manage_settings' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { adminRole, hasPermission, logActivity } = useAdmin();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const filteredNavItems = navItems.filter(
    (item) => item.permission === 'all' || hasPermission(item.permission as any)
  );

  const handleSignOut = async () => {
    await logActivity('admin_logout');
    await signOut();
    navigate('/signin');
  };

  const currentPageName = navItems.find((item) => item.path === location.pathname)?.name || 'Admin Panel';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#080C14] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-[#0B0F1A] border-r border-gray-200/80 dark:border-white/[0.06] transform transition-all duration-300 ease-in-out flex flex-col ${
          sidebarCollapsed ? 'w-[68px]' : 'w-[240px]'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div
          className={`flex items-center border-b border-gray-200/80 dark:border-white/[0.06] flex-shrink-0 h-[57px] ${
            sidebarCollapsed ? 'px-3 justify-center' : 'px-4'
          }`}
        >
          {sidebarCollapsed ? (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow"
              title="Expand sidebar"
            >
              <Zap style={{ width: '16px', height: '16px' }} className="text-white" />
            </button>
          ) : (
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                <Zap style={{ width: '16px', height: '16px' }} className="text-white" />
              </div>
              <div className="min-w-0">
                <span className="text-[14px] font-bold text-gray-900 dark:text-white tracking-tight block whitespace-nowrap">
                  Finance<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">Flow</span>
                </span>
                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">
                  Admin Panel
                </span>
              </div>
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
                className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06] flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          <nav className={`${sidebarCollapsed ? 'px-2' : 'px-2'} space-y-0.5`}>
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`relative w-full flex items-center rounded-lg transition-all duration-150 ${
                    sidebarCollapsed ? 'px-2.5 py-2.5 justify-center' : 'px-3 py-2.5 gap-3'
                  } ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-500/[0.12] text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon
                    className={`flex-shrink-0 ${sidebarCollapsed ? 'w-[18px] h-[18px]' : 'w-[16px] h-[16px]'} ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : ''
                    }`}
                  />
                  {!sidebarCollapsed && (
                    <span className={`text-[13px] font-medium tracking-tight ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                      {item.name}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-l-full bg-gradient-to-b from-blue-500 to-cyan-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom */}
        <div className={`border-t border-gray-200/80 dark:border-white/[0.06] flex-shrink-0 ${sidebarCollapsed ? 'p-2 space-y-1' : 'p-2.5 space-y-1'}`}>
          {!sidebarCollapsed && adminRole && (
            <div className="px-3 py-2 mb-1">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Logged in as</p>
              <p className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 capitalize mt-0.5">
                {adminRole.replace('_', ' ')}
              </p>
            </div>
          )}

          <button
            onClick={() => navigate('/dashboard')}
            title={sidebarCollapsed ? 'Back to User View' : undefined}
            className={`w-full flex items-center rounded-lg transition-all duration-150 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/[0.08] ${
              sidebarCollapsed ? 'px-2.5 py-2.5 justify-center' : 'px-3 py-2.5 gap-3'
            }`}
          >
            <ArrowLeft className={`flex-shrink-0 ${sidebarCollapsed ? 'w-[18px] h-[18px]' : 'w-[16px] h-[16px]'}`} />
            {!sidebarCollapsed && <span className="text-[13px] font-medium">Back to App</span>}
          </button>

          <button
            onClick={handleSignOut}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center rounded-lg transition-all duration-150 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/[0.08] ${
              sidebarCollapsed ? 'px-2.5 py-2.5 justify-center' : 'px-3 py-2.5 gap-3'
            }`}
          >
            <LogOut className={`flex-shrink-0 ${sidebarCollapsed ? 'w-[18px] h-[18px]' : 'w-[16px] h-[16px]'}`} />
            {!sidebarCollapsed && <span className="text-[13px] font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]'
        } min-h-screen flex flex-col`}
      >
        {/* Top bar */}
        <header className="bg-white/90 dark:bg-[#0B0F1A]/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-white/[0.06] sticky top-0 z-30 h-[57px]">
          <div className="px-4 sm:px-6 h-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 dark:text-gray-400 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex w-6 h-6 rounded-md bg-blue-500/10 items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                  {currentPageName}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {adminRole && (
                <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-500/[0.08] border border-blue-200/60 dark:border-blue-500/20 rounded-full">
                  <Shield className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 capitalize">
                    {adminRole.replace('_', ' ')}
                  </span>
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-[#080C14]">
          {children}
        </main>
      </div>
    </div>
  );
}
