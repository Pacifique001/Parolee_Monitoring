/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Users, Layout, Activity, Map, Database, 
  Cpu, FileText, AlertTriangle, Settings,
  Shield, Bell, MessageCircle, UserCheck,
  Calendar, BarChart2, Clock
} from 'react-feather';
import type { UserPermissions } from '../../types/api';
import { Brain } from 'lucide-react';

interface NavigationItem {
  to: string;
  icon: any;
  label: string;
  permissionCheck: (permissions: UserPermissions) => boolean;
  children?: NavigationItem[];
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
  permissionCheck?: (permissions: UserPermissions) => boolean;
}

interface NavigationProps {
  permissions: UserPermissions;
  isCollapsed?: boolean;
  portalType?: 'admin' | 'officer' | 'staff';
}

export const UnifiedNavigation: React.FC<NavigationProps> = ({ 
  permissions,
  isCollapsed = false,
  portalType = 'admin'
}) => {
  const location = useLocation();

  // Define navigation sections based on user permissions
  const navigationSections: NavigationSection[] = [
    // Admin Portal Section
    {
      title: 'Admin Portal',
      permissionCheck: (perms) => perms.portal_access.admin,
      items: [
        {
          to: '/admin/dashboard',
          icon: Layout,
          label: 'Dashboard',
          permissionCheck: (perms) => perms.dashboards.view_admin_dashboard
        },
        {
          to: '/admin/users',
          icon: Users,
          label: 'User Management',
          permissionCheck: (perms) => perms.users.view
        },
        {
          to: '/admin/roles',
          icon: Shield,
          label: 'Roles & Permissions',
          permissionCheck: (perms) => perms.users.assignRoles || perms.users.assignPermissions
        }
      ]
    },
    // Data Management Section
    {
      title: 'Data Management',
      items: [
        {
          to: '/data/iot',
          icon: Database,
          label: 'IoT Devices',
          permissionCheck: (perms) => perms.data_management.iot.view
        },
        {
          to: '/data/ai',
          icon: Brain,
          label: 'AI Analytics',
          permissionCheck: (perms) => perms.data_management.ai.view
        },
        {
          to: '/data/biometric',
          icon: Activity,
          label: 'Biometric Data',
          permissionCheck: (perms) => perms.data_management.iot.view
        },
        {
          to: '/data/reports',
          icon: BarChart2,
          label: 'Reports',
          permissionCheck: (perms) => perms.data_management.reports.view
        }
      ]
    },
    // Monitoring Section
    {
      title: 'Monitoring',
      items: [
        {
          to: '/monitoring/alerts',
          icon: AlertTriangle,
          label: 'Alerts',
          permissionCheck: (perms) => perms.iot.viewAlerts || perms.geofences.viewAlerts
        },
        {
          to: '/monitoring/geofence',
          icon: Map,
          label: 'Geofence',
          permissionCheck: (perms) => perms.geofences.manage || perms.geofences.assign
        },
        {
          to: '/monitoring/assessments',
          icon: UserCheck,
          label: 'Assessments',
          permissionCheck: (perms) => perms.assessments.view
        }
      ]
    },
    // Communication Section
    {
      title: 'Communication',
      items: [
        {
          to: '/messages',
          icon: MessageCircle,
          label: 'Messages',
          permissionCheck: () => true // Adjust based on your actual message permissions
        },
        {
          to: '/notifications',
          icon: Bell,
          label: 'Notifications',
          permissionCheck: () => true // Adjust based on your actual notification permissions
        }
      ]
    },
    // Settings Section
    {
      title: 'Settings',
      items: [
        {
          to: '/settings',
          icon: Settings,
          label: 'System Settings',
          permissionCheck: (perms) => perms.portal_access.admin // Only admin can access settings
        }
      ]
    }
  ];

  // Filter navigation sections based on portalType
  const filteredSections = navigationSections
    .filter(section => {
      if (portalType === 'officer') {
        return ['Monitoring', 'Communication', 'Reports'].includes(section.title);
      }
      // Add other portal type filters as needed
      return true;
    })
    .filter(section => {
      // Check section permission if exists
      if (section.permissionCheck) {
        return section.permissionCheck(permissions);
      }
      return true;
    });

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className={`h-full bg-white dark:bg-gray-800 border-r dark:border-gray-700 
      overflow-y-auto overflow-x-hidden ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-4">
        {!isCollapsed && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              Navigation
            </h3>
          </div>
        )}

        {filteredSections.map((section, index) => {
          // Filter items based on permissions
          const sectionItems = section.items.filter(item => 
            item.permissionCheck(permissions)
          );

          // Don't show section if no items are visible or section permission check fails
          if (sectionItems.length === 0 || 
              (section.permissionCheck && !section.permissionCheck(permissions))) {
            return null;
          }

          return (
            <div key={index} className="mb-6">
              {!isCollapsed && (
                <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1">
                {sectionItems.map((item, itemIndex) => (
                  <NavItem
                    key={itemIndex}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive(item.to)}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
};

// NavItem component
const NavItem = ({ 
    to, 
    icon: Icon, 
    label, 
    isActive,
    isCollapsed 
}: {
    to: string;
    icon: any;
    label: string;
    isActive: boolean;
    isCollapsed: boolean;
}) => (
    <li>
        <Link
            to={to}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors
                ${isActive
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }
                ${isCollapsed ? 'justify-center' : ''}`
            }
            title={isCollapsed ? label : undefined}
        >
            <Icon size={18} className={isCollapsed ? '' : 'mr-3'} />
            {!isCollapsed && <span>{label}</span>}
        </Link>
    </li>
);

export default UnifiedNavigation;