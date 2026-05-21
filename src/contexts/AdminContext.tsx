import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

export type AdminRole = 'super_admin' | 'billing_manager' | 'support_agent' | 'content_manager' | 'read_only' | null;

export type Permission =
  | 'all'
  | 'view_users'
  | 'edit_users'
  | 'view_subscriptions'
  | 'manage_subscriptions'
  | 'view_payments'
  | 'process_refunds'
  | 'view_tickets'
  | 'manage_tickets'
  | 'view_faqs'
  | 'manage_faqs'
  | 'view_quizzes'
  | 'manage_quizzes'
  | 'view_reports'
  | 'view_blog'
  | 'manage_blog'
  | 'manage_settings';

interface AdminContextType {
  isAdmin: boolean;
  adminRole: AdminRole;
  permissions: Permission[];
  loading: boolean;
  hasPermission: (permission: Permission) => boolean;
  logActivity: (actionType: string, targetType?: string, targetId?: string, details?: any) => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setAdminRole(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin, admin_role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.is_admin && profile.admin_role) {
        setIsAdmin(true);
        setAdminRole(profile.admin_role as AdminRole);

        const { data: roleData } = await supabase
          .from('admin_roles')
          .select('permissions')
          .eq('role_name', profile.admin_role)
          .eq('is_active', true)
          .maybeSingle();

        if (roleData?.permissions) {
          setPermissions(roleData.permissions as Permission[]);
        }
      } else {
        setIsAdmin(false);
        setAdminRole(null);
        setPermissions([]);
      }
    } catch (error) {
      console.error('Error loading admin status:', error);
      setIsAdmin(false);
      setAdminRole(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminStatus();
  }, [user]);

  const hasPermission = (permission: Permission): boolean => {
    if (!isAdmin) return false;
    if (permissions.includes('all')) return true;
    return permissions.includes(permission);
  };

  const logActivity = async (
    actionType: string,
    targetType?: string,
    targetId?: string,
    details?: any
  ): Promise<void> => {
    if (!user || !isAdmin) return;

    try {
      await supabase.from('admin_activity_log').insert({
        admin_user_id: user.id,
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        action_details: details || {},
      });
    } catch (error) {
      console.error('Error logging admin activity:', error);
    }
  };

  const refreshAdminStatus = async () => {
    setLoading(true);
    await loadAdminStatus();
  };

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        adminRole,
        permissions,
        loading,
        hasPermission,
        logActivity,
        refreshAdminStatus,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
