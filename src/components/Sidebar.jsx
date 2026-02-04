import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Settings,
  BarChart3,
  FileText,
  Users,
  UserCheck,
  Badge,
  Download,
  UserPlus,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ isMobile = false, onClose = null }) => {
  const { isPlatformAdmin, isCompanyAdmin } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: false,
      roles: ['platform_admin', 'company_admin']
    },
    {
      name: 'Companies',
      href: '/companies',
      icon: Building2,
      current: false,
      roles: ['platform_admin']
    },
    {
      name: 'Leads',
      href: '/leads',
      icon: Users,
      current: false,
      roles: ['platform_admin', 'company_admin']
    },
    {
      name: 'Visitors',
      href: '/visitors',
      icon: Eye,
      current: false,
      roles: ['platform_admin']
    },
    {
      name: 'Employees',
      href: '/employees',
      icon: UserPlus,
      current: false,
      roles: ['company_admin']
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      current: false,
      roles: ['company_admin']
    },
    {
      name: 'Company Admin',
      href: '/company-admin',
      icon: UserCheck,
      current: false,
      roles: ['platform_admin']
    },
    {
      name: 'Company Analytics',
      href: '/company-analytics',
      icon: BarChart3,
      current: false,
      roles: ['platform_admin']
    },
    {
      name: 'Audit Logs',
      href: '/audit-logs',
      icon: FileText,
      current: false,
      roles: ['platform_admin']
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      current: false,
      roles: ['platform_admin', 'company_admin']
    }
  ];

  const filteredNavigation = navigation.filter(item => {
    if (isPlatformAdmin) return item.roles.includes('platform_admin');
    if (isCompanyAdmin) return item.roles.includes('company_admin');
    return false;
  });

  return (
    <div className={isMobile ? "flex flex-col" : "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col"}>
      {/* Sidebar component */}
      <div className={`flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 ${
        isMobile ? "pt-6" : "shadow-sm border-r border-gray-200"
      }`}>
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          {isMobile && onClose && (
            <button
              type="button"
              className="mr-2 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ExpoLead</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {filteredNavigation.map((item) => (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      onClick={isMobile ? onClose : undefined}
                      className={({ isActive }) =>
                        `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors ${
                          isActive
                            ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                            : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50'
                        }`
                      }
                    >
                      <item.icon
                        className="h-6 w-6 shrink-0"
                        aria-hidden="true"
                      />
                      {item.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;