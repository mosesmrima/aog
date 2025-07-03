'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Heart, 
  Users, 
  Settings, 
  Shield, 
  Menu, 
  X,
  LogOut,
  FileText,
  ChevronDown,
  ChevronRight,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/components/providers/auth-provider';
import { signOut } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// Fixed navigation items (non-department specific)
const baseNavigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
];

const adminNavigation = [
  {
    name: 'Audit Logs',
    href: '/admin/audit',
    icon: FileText,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Admin Panel',
    href: '/admin',
    icon: Shield,
  },
];

interface Department {
  id: string;
  name: string;
  description: string | null;
}

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isOtherDepartmentsOpen, setIsOtherDepartmentsOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, description')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get user's assigned departments
  const userDepartments = user?.departments || [];
  
  // Get primary department (for direct navigation)
  const primaryDepartment = departments.find(dept => userDepartments.includes(dept.name));
  
  // Get other departments (for dropdown)
  const otherDepartments = departments.filter(dept => !userDepartments.includes(dept.name));

  const getDepartmentRoute = (deptName: string) => {
    // Map department names to routes
    switch (deptName) {
      case 'Registrar of Marriages':
        return '/marriages';
      case 'Registrar of Societies':
        return '/societies';
      case 'Legal Affairs':
        return '/legal';
      case 'Administration':
        return '/administration';
      default:
        return `/department/${deptName.toLowerCase().replace(/\s+/g, '-')}`;
    }
  };

  const getDepartmentIcon = (deptName: string) => {
    switch (deptName) {
      case 'Registrar of Marriages':
        return Heart;
      case 'Registrar of Societies':
        return Users;
      case 'Legal Affairs':
        return Shield;
      case 'Administration':
        return Settings;
      default:
        return Database;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">OAG Portal</h2>
            <p className="text-xs text-gray-500">Data Management</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {/* Base Navigation */}
        {baseNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200',
                isActive
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}

        {/* Primary Department (if user has one) */}
        {primaryDepartment && (
          <Link
            href={getDepartmentRoute(primaryDepartment.name)}
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              'flex items-center justify-between px-3 py-2 rounded-lg transition-colors duration-200',
              pathname === getDepartmentRoute(primaryDepartment.name) || pathname.startsWith(getDepartmentRoute(primaryDepartment.name) + '/')
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <div className="flex items-center space-x-3">
              {(() => {
                const Icon = getDepartmentIcon(primaryDepartment.name);
                return <Icon className="h-5 w-5" />;
              })()}
              <span className="font-medium">{primaryDepartment.name}</span>
            </div>
          </Link>
        )}

        {/* Other Departments Dropdown */}
        {otherDepartments.length > 0 && (
          <Collapsible open={isOtherDepartmentsOpen} onOpenChange={setIsOtherDepartmentsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5" />
                <span className="font-medium">Other Departments</span>
              </div>
              {isOtherDepartmentsOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {otherDepartments.map((dept) => {
                const route = getDepartmentRoute(dept.name);
                const isActive = pathname === route || pathname.startsWith(route + '/');
                const Icon = getDepartmentIcon(dept.name);
                
                return (
                  <Link
                    key={dept.id}
                    href={route}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center justify-between pl-8 pr-3 py-2 rounded-lg transition-colors duration-200 text-sm',
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-4 w-4" />
                      <span>{dept.name}</span>
                    </div>
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Admin Navigation */}
        {user?.is_admin && (
          <>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-2">
                Administration
              </p>
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200',
                      isActive
                        ? 'bg-purple-500 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {user && (
        <div className="p-4 border-t border-white/10">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-800">{user.full_name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            {user.is_admin && (
              <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full mt-1">
                Admin
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white/80 backdrop-blur-lg border-r border-white/20 shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative flex flex-col w-64 h-full bg-white/95 backdrop-blur-lg shadow-xl"
          >
            <SidebarContent />
          </motion.aside>
        </div>
      )}
    </>
  );
}