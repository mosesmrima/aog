'use client';

import { useState } from 'react';
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
  Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/components/providers/auth-provider';
import { signOut } from '@/lib/auth';
import { cn } from '@/lib/utils';

// Main navigation items
const baseNavigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Organization overview'
  },
];

// Department navigation items - all departments shown prominently
const departmentNavigation = [
  {
    name: 'Marriages',
    href: '/departments/marriages',
    icon: Heart,
    description: 'Marriage registrations and certificates',
    fullName: 'Registrar of Marriages'
  },
  {
    name: 'Legal Affairs',
    href: '/departments/legal-affairs',
    icon: Scale,
    description: 'Government cases and litigation',
    fullName: 'Legal Affairs'
  },
  {
    name: 'Societies',
    href: '/departments/societies',
    icon: Users,
    description: 'Society registrations and compliance',
    fullName: 'Registrar of Societies'
  },
  {
    name: 'Public Trustees',
    href: '/departments/public-trustees',
    icon: Scale,
    description: 'Deceased estates and public trustee records',
    fullName: 'Public Trustees'
  },
  {
    name: 'Administration',
    href: '/departments/administration',
    icon: Settings,
    description: 'Administrative and support functions',
    fullName: 'Administration'
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

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminSectionOpen, setIsAdminSectionOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
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
        {/* Main Dashboard */}
        {baseNavigation.map((item) => {
          const isActive = pathname === item.href;
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
              <div>
                <span className="font-medium">{item.name}</span>
                <div className="text-xs opacity-75">{item.description}</div>
              </div>
            </Link>
          );
        })}

        {/* Department Navigation */}
        <div className="pt-4 mt-4 border-t border-gray-200">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Departments
          </div>
          {departmentNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <div key={item.name}>
                <Link
                  href={item.name === 'Public Trustees' ? item.href : `${item.href}/dashboard`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 group',
                    isActive
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <div className="flex-1">
                    <span className="font-medium">{item.name}</span>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform",
                    isActive ? "rotate-90" : ""
                  )} />
                </Link>
                
                {/* Sub-navigation for active department */}
                {isActive && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.name !== 'Public Trustees' && (
                      <Link
                        href={`${item.href}/dashboard`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'block px-3 py-1 rounded text-sm transition-colors duration-200',
                          pathname === `${item.href}/dashboard`
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        Dashboard
                      </Link>
                    )}
                    {item.name === 'Public Trustees' && (
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'block px-3 py-1 rounded text-sm transition-colors duration-200',
                          pathname === item.href
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        Overview
                      </Link>
                    )}
                    <Link
                      href={`${item.href}/manage`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'block px-3 py-1 rounded text-sm transition-colors duration-200',
                        pathname === `${item.href}/manage`
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      Manage Data
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Admin Navigation */}
        {user?.is_admin && (
          <Collapsible open={isAdminSectionOpen} onOpenChange={setIsAdminSectionOpen}>
            <div className="pt-4 mt-4 border-t border-gray-200">
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5" />
                  <span className="font-medium text-xs uppercase tracking-wider">Administration</span>
                </div>
                {isAdminSectionOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
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
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}
      </nav>

      {/* User Info & Sign Out */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.full_name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.full_name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
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