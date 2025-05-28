// src/hooks/usePermissions.ts
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { UserPermissions } from '../types/api'; // Keep this for return type clarity

export const usePermissions = () => {
  const { 
    user, 
    permissions: contextPermissions, // This is the structured UserPermissions object
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    hasRole 
  } = useAuth();

  // The structured permissions object is taken directly from AuthContext
  const permissions: UserPermissions = contextPermissions;

  // Re-export permission check functions from AuthContext for convenience
  const can = hasPermission;             // Checks a single raw permission string
  const canAny = hasAnyPermission;     // Checks if user has any of an array of raw permission strings
  const canAll = hasAllPermissions;    // Checks if user has all of an array of raw permission strings

  const memoizedIsAdmin = useMemo(() => {
    if (!user) return false;
    return hasRole('System Administrator') || permissions.portal_access.admin;
  }, [user, hasRole, permissions.portal_access.admin]);

  const memoizedIsOfficer = useMemo(() => {
     if (!user) return false;
    return hasRole('Parole Officer') || permissions.portal_access.officer;
  }, [user, hasRole, permissions.portal_access.officer]);

  const memoizedIsStaff = useMemo(() => {
    if (!user) return false;
    const staffRoles = ['Case Manager', 'Support Staff'];
    return staffRoles.some(role => hasRole(role)) || permissions.portal_access.staff;
  }, [user, hasRole, permissions.portal_access.staff]);

  return {
    permissions,    // The structured UserPermissions object
    can,
    canAny,
    canAll,
    hasRole,        // Expose hasRole directly too
    isAdmin: memoizedIsAdmin,
    isOfficer: memoizedIsOfficer,
    isStaff: memoizedIsStaff,
    // Deprecated, use `can`, `canAny`, `canAll` or structured `permissions` object
    // oldCan: hasPermission, // (permissionName: string) => boolean - old name
    // oldHasAnyPermission: hasAnyPermission, // (permissionNames: string[]) => boolean - old name
    // oldHasAllPermissions: hasAllPermissions, // (permissionNames: string[]) => boolean - old name
  };
};