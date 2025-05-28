/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/shared/UserManagementPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../../services/api';
import type { ApiUser, ApiRole, ApiPermission, PaginatedResponse } from '../../types/api';
// import { useAuth } from '../../contexts/AuthContext'; // Not directly needed if usePermissions provides user
import { usePermissions } from '../../hooks/usePermissions';
import DashboardWrapper from '../../components/shared/DashboardWrapper';
import AccessDenied from '../../components/shared/AccessDeniedView';
import UserForm from '../../components/UserManagement/UserForm';
import DeleteConfirmationModal from '../../components/UserManagement/DeleteConfirmationModal';
import StatusBadge from '../../components/UserManagement/StatusBadge';
import { format } from 'date-fns';

import {
    Users, UserPlus, Edit, Trash2, Search, Info, //KeyRound,
    Briefcase, MapPin as LocationPin, UserCog, UserCheck, Shield, AlertTriangle, FileText, Phone, Mail,
    Calendar, Clock, Award, Building, GraduationCap
} from 'lucide-react';

type DisplayUser = ApiUser;
type UserTypeTab = 'parolee' | 'officer' | 'staff';
const TABS_ORDER: UserTypeTab[] = ['parolee', 'officer', 'staff']; // Define order

const UserManagementPage: React.FC = () => {
    // const { user: authUser } = useAuth(); // Get authUser if needed for direct properties like email/ID
    const { permissions, hasRole } = usePermissions(); // permissions is structured, hasRole checks authUser.roles

    const [activeTab, setActiveTab] = useState<UserTypeTab>(TABS_ORDER[0]);
    const [users, setUsers] = useState<DisplayUser[]>([]);
    const [allRoles, setAllRoles] = useState<ApiRole[]>([]);
    const [allPermissions, setAllPermissions] = useState<ApiPermission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paginationMeta, setPaginationMeta] = useState<PaginatedResponse<ApiUser>['meta'] | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingItem, setEditingItem] = useState<ApiUser | null>(null);
    const [deletingItem, setDeletingItem] = useState<ApiUser | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<ApiUser | null>(null);

    // Permission checks from structured permissions object
    const hasViewUserPermission = permissions.users.view;
    const hasUserManagementAccess = hasViewUserPermission || permissions.users.create || permissions.users.edit || permissions.users.delete;
    const canCreateUser = permissions.users.create;
    const canEditUser = permissions.users.edit;
    const canDeleteUser = permissions.users.delete;
    // const canViewDetails = hasViewUserPermission; // Redundant, same as hasViewUserPermission
    const canManageRoleAssignments = permissions.users.assignRoles; // For user form
    const canManageDirectPermissions = permissions.users.assignPermissions; // For user form

    // More specific permission for the "Manage Permissions" button (links to role/permission management section)
    //const canAccessRoleManagement = permissions.roleManagement.manageRoles || permissions.roleManagement.managePermissions;


    const getAvailableTabs = useCallback(() => {
        const determinedTabs: UserTypeTab[] = [];
        // System Administrator should see all tabs by default if they have user view permission
        if (hasRole('System Administrator') && hasViewUserPermission) {
            return TABS_ORDER;
        }
        // Parole Officers can view parolees by default if they have user view permission
        if (hasRole('Parole Officer') && hasViewUserPermission) {
            if (!determinedTabs.includes('parolee')) {
                determinedTabs.push('parolee');
            }
        }
        // If user has general 'view users' permission, allow all standard types
        // This could be refined with more granular view permissions per user type if available (e.g., 'view parolees', 'view officers')
        if (hasViewUserPermission) {
            TABS_ORDER.forEach(t => {
                if (!determinedTabs.includes(t)) determinedTabs.push(t);
            });
        }
        // Ensure tabs are unique and in defined order
        return TABS_ORDER.filter(tab => determinedTabs.includes(tab));
    }, [hasRole, hasViewUserPermission]); // Depends on role check and specific permission

    const availableTabs = useMemo(() => getAvailableTabs(), [getAvailableTabs]);

    useEffect(() => {
        if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
            setActiveTab(availableTabs[0]);
        } else if (availableTabs.length === 0 && hasViewUserPermission) {
            // This case implies they have 'view users' but no tabs were derived,
            // which might mean TABS_ORDER is empty or logic error.
            // For now, if no tabs, UserManagementPage will show AccessDenied.
        }
    }, [availableTabs, activeTab, hasViewUserPermission]);

    useEffect(() => {
        const fetchInitialLookups = async () => {
            // Only fetch if relevant permissions exist (e.g., for create/edit forms)
            if (canCreateUser || canEditUser) {
                try {
                    if (allRoles.length === 0 && (canManageRoleAssignments || permissions.roleManagement.view)) { // Check permission to view roles
                        const rolesResponse = await apiClient.get<{ data: ApiRole[] }>('/admin/roles');
                        // Filter out System Administrator role from assignable roles unless current user is SysAdmin themselves
                        const assignableRoles = hasRole('System Administrator')
                            ? rolesResponse.data.data
                            : rolesResponse.data.data.filter(r => r.name !== 'System Administrator');
                        setAllRoles(assignableRoles);
                    }
                    if (allPermissions.length === 0 && (canManageDirectPermissions || permissions.roleManagement.managePermissions)) { // Check permission to view permissions list
                        const permissionsResponse = await apiClient.get<{ data: ApiPermission[] }>('/admin/permissions/permissions-list');
                        setAllPermissions(permissionsResponse.data.data);
                    }
                } catch (err) {
                    console.error("Failed to fetch roles or permissions:", err);
                    setError(prev => prev || "Failed to load necessary options for user management.");
                }
            }
        };
        fetchInitialLookups();
    }, [canCreateUser, canEditUser, canManageRoleAssignments, canManageDirectPermissions, allRoles.length, allPermissions.length, permissions.roleManagement.view, permissions.roleManagement.managePermissions, hasRole]);

    const fetchData = useCallback(async (page = 1, currentSearchTerm = searchTerm, currentActiveTab = activeTab) => {
        if (!hasViewUserPermission || availableTabs.length === 0 || !availableTabs.includes(currentActiveTab)) {
            setIsLoading(false);
            setUsers([]); // Clear users if no permission or no valid tab
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append('user_type', currentActiveTab);
            params.append('page', page.toString());
            params.append('per_page', '10');
            if (currentSearchTerm.trim()) {
                params.append('search', currentSearchTerm.trim());
            }

            const response = await apiClient.get<PaginatedResponse<ApiUser>>(
                `/admin/users?${params.toString()}`
            );
            setUsers(response.data.data);
            setPaginationMeta(response.data.meta);
            setCurrentPage(response.data.meta.current_page);
        } catch (err: any) {
            console.error("Failed to fetch users:", err);
            setError(err.response?.data?.message || "Failed to load user data.");
            setUsers([]);
            setPaginationMeta(null);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, activeTab, hasViewUserPermission, availableTabs]); // availableTabs ensures re-check if they change

    useEffect(() => {
        if (availableTabs.length > 0 && availableTabs.includes(activeTab)) {
            fetchData(1, searchTerm, activeTab);
            setSelectedItem(null); // Reset selected item when tab or search term changes
        } else if (availableTabs.length === 0 && hasViewUserPermission) {
            // If user has view permission but no tabs are available (e.g. bad config or specific role restrictions)
            // Handled by AccessDenied or empty state.
            setUsers([]);
            setPaginationMeta(null);
            setIsLoading(false);
        }
    }, [activeTab, searchTerm, fetchData, availableTabs, hasViewUserPermission]);


    const handleFormSubmitSuccess = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setEditingItem(null);
        fetchData(paginationMeta?.current_page || 1); // Refetch current page
    };

    const openEditModal = (userItem: ApiUser) => {
        setEditingItem(userItem);
        setShowEditModal(true);
    };

    const openDeleteModal = (userItem: ApiUser) => {
        setDeletingItem(userItem);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingItem || !canDeleteUser) return;
        try {
            await apiClient.delete(`/admin/users/${deletingItem.id}`);
            setShowDeleteModal(false);
            if (selectedItem?.id === deletingItem.id) {
                setSelectedItem(null);
            }
            setDeletingItem(null);
            // If the deleted item was the last on the page, and it's not page 1, fetch previous page
            let pageToFetch = currentPage;
            if (users.length === 1 && currentPage > 1) {
                pageToFetch = currentPage - 1;
            }
            fetchData(pageToFetch, searchTerm, activeTab);
        } catch (err: any) {
            console.error("Delete error:", err);
            setError(err.response?.data?.message || "Failed to delete user.");
        }
    };

    const DetailItem = ({ label, value, icon: Icon }: { label: string, value: React.ReactNode, icon?: React.ElementType }) => (
        <div>
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                {Icon && <Icon size={14} className="mr-1.5" />}
                {label}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value === null || value === undefined || value === '' ? 'N/A' : value}</dd>
        </div>
    );

    if (!hasUserManagementAccess) {
        return <AccessDenied message="You don't have permission to access user management." />;
    }

    if (availableTabs.length === 0) {
        // This message is shown if getAvailableTabs returns empty, implying no user types they can manage/view.
        return <AccessDenied message="You are not configured to manage any user types." />;
    }


    return (
        <DashboardWrapper>
            <div className="flex-1 p-6 ml-64">
                <div className="space-y-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">User Management</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Manage parolees, officers, and staff members</p>
                        </div>
                        <div className="flex space-x-3">

                            {canCreateUser && (
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="primary-button text-sm"
                                >
                                    <UserPlus size={16} className="mr-2" />
                                    Add New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
                    <nav className="flex -mb-px border-b border-gray-200 dark:border-gray-700" aria-label="Tabs">
                        {availableTabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    setSelectedItem(null);
                                    setSearchTerm('');
                                    // setCurrentPage(1); // fetchData will be called by useEffect and reset to page 1
                                }}
                                className={`flex-1 py-3 px-1 text-center border-b-2 font-medium text-sm focus:outline-none rounded-t-md transition-colors
                                    ${activeTab === tab
                                        ? 'border-brand-purple-600 text-brand-purple-600 dark:text-brand-purple-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}s
                            </button>
                        ))}
                    </nav>
                </div>

                {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-md">{error}</div>}

                <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                    <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                </span>
                                <input
                                    type="search"
                                    placeholder={`Search ${activeTab}s...`}
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); /* setCurrentPage(1) will be handled by fetchData */ }}
                                    className="input-style w-full pl-10"
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-grow custom-scrollbar" style={{ maxHeight: 'calc(100vh - 24rem)' }}>
                            {isLoading && users.length === 0 && <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">Loading users...</div>}
                            {!isLoading && users.length === 0 && (
                                <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No {activeTab}s found {searchTerm && `matching "${searchTerm}"`}.
                                </div>
                            )}
                            {users.map((userItem) => (
                                <div
                                    key={userItem.id}
                                    onClick={() => {
                                        if (hasViewUserPermission) { // Check if allowed to view details
                                            setSelectedItem(userItem);
                                        }
                                    }}
                                    className={`p-4 border-b dark:border-gray-700 ${hasViewUserPermission ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'cursor-not-allowed opacity-75'}
                                        ${selectedItem?.id === userItem.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-brand-purple-600' : 'border-l-4 border-transparent'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-gray-100">{userItem.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {activeTab === 'parolee' ? `ID: ${userItem.parolee_profile?.parole_id_number || 'N/A'}` :
                                                    activeTab === 'officer' ? `Badge: ${userItem.officer_profile?.badge_number || 'N/A'}` :
                                                        `Role: ${userItem.rehab_staff_profile?.staff_role || 'N/A'}`}
                                            </p>
                                        </div>
                                        <StatusBadge status={userItem.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {paginationMeta && paginationMeta.last_page > 1 && (
                            <div className="p-4 border-t dark:border-gray-700 flex justify-between items-center text-sm">
                                <button onClick={() => fetchData(currentPage - 1)} disabled={currentPage === 1 || isLoading} className="pagination-button">Previous</button>
                                <span>Page {currentPage} of {paginationMeta.last_page} (Total: {paginationMeta.total})</span>
                                <button onClick={() => fetchData(currentPage + 1)} disabled={currentPage === paginationMeta.last_page || isLoading} className="pagination-button">Next</button>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-lg shadow p-6 min-h-[calc(100vh-10rem)] overflow-y-auto custom-scrollbar">
                        {selectedItem && hasViewUserPermission ? (
                            <div>
                                <div className="flex justify-between items-center mb-4 pb-4 border-b dark:border-gray-700">
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{selectedItem.name}</h2>
                                    <div className="flex space-x-2">
                                        {canEditUser && (
                                            <button
                                                onClick={() => openEditModal(selectedItem)}
                                                className="icon-button text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                                title="Edit User"
                                            >
                                                <Edit size={18} />
                                            </button>
                                        )}
                                        {canDeleteUser && selectedItem.id !== 1 && ( // Assuming user ID 1 is non-deletable superadmin
                                            <button
                                                onClick={() => openDeleteModal(selectedItem)}
                                                className="icon-button text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                                title="Delete User"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <dl className="space-y-4">
                                    <DetailItem label="Email" value={selectedItem.email} icon={Mail} />
                                    <DetailItem label="Phone" value={selectedItem.phone} icon={Phone} />
                                    <DetailItem label="User Type" value={<span className="capitalize">{selectedItem.user_type}</span>} icon={Users} />
                                    <DetailItem label="Status" value={<StatusBadge status={selectedItem.status} />} icon={UserCheck} />
                                    <DetailItem label="Roles" value={selectedItem.roles?.map(r => r.name).join(', ') || 'None'} icon={Shield} />
                                    <DetailItem label="Joined" value={format(new Date(selectedItem.created_at), 'PPp')} icon={Calendar} />
                                    <DetailItem label="Last Updated" value={format(new Date(selectedItem.updated_at), 'PPp')} icon={Clock} />

                                    {selectedItem.user_type === 'parolee' && selectedItem.parolee_profile && (
                                        <>
                                            <hr className="dark:border-gray-700 my-4" />
                                            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Parolee Profile</h4>
                                            <DetailItem label="Parole ID" value={selectedItem.parolee_profile.parole_id_number} icon={FileText} />
                                            <DetailItem label="Imprisonment Date" value={selectedItem.parolee_profile.imprisonment_date ? format(new Date(selectedItem.parolee_profile.imprisonment_date), 'P') : 'N/A'} icon={Calendar} />
                                            <DetailItem label="Release Date" value={selectedItem.parolee_profile.release_date ? format(new Date(selectedItem.parolee_profile.release_date), 'P') : 'N/A'} icon={Calendar} />
                                            <DetailItem label="Expected End Date" value={selectedItem.parolee_profile.expected_end_date ? format(new Date(selectedItem.parolee_profile.expected_end_date), 'P') : 'N/A'} icon={Calendar} />
                                            <DetailItem label="Home Address" value={selectedItem.parolee_profile.home_address} icon={LocationPin} />
                                            {selectedItem.parolee_profile.emergency_contact && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center"><AlertTriangle size={14} className="mr-1.5 text-orange-500" />Emergency Contact</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 pl-5">
                                                        {selectedItem.parolee_profile.emergency_contact.name} ({selectedItem.parolee_profile.emergency_contact.relationship}) - {selectedItem.parolee_profile.emergency_contact.phone}
                                                    </dd>
                                                </div>
                                            )}
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center"><FileText size={14} className="mr-1.5" />Conditions</dt>
                                                {selectedItem.parolee_profile.conditions && Array.isArray(selectedItem.parolee_profile.conditions) && selectedItem.parolee_profile.conditions.length > 0 ? (
                                                    <ul className="mt-1 list-disc list-inside pl-5 space-y-1 text-sm text-gray-900 dark:text-gray-100">
                                                        {selectedItem.parolee_profile.conditions.map((cond, i) => <li key={i}>{cond}</li>)}
                                                    </ul>
                                                ) : <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 pl-5">N/A</dd>}
                                            </div>
                                        </>
                                    )}
                                    {selectedItem.user_type === 'officer' && selectedItem.officer_profile && (
                                        <>
                                            <hr className="dark:border-gray-700 my-4" />
                                            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Officer Profile</h4>
                                            <DetailItem label="Badge Number" value={selectedItem.officer_profile.badge_number} icon={Award} />
                                            <DetailItem label="Rank" value={selectedItem.officer_profile.rank} icon={UserCog} />
                                            <DetailItem label="Department" value={selectedItem.officer_profile.department} icon={Building} />
                                            <DetailItem label="Unit" value={selectedItem.officer_profile.unit || 'N/A'} />
                                            <DetailItem label="Caseload" value={selectedItem.officer_profile.caseload?.toString() || 'N/A'} />
                                        </>
                                    )}
                                    {selectedItem.user_type === 'staff' && selectedItem.rehab_staff_profile && (
                                        <>
                                            <hr className="dark:border-gray-700 my-4" />
                                            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Staff Profile</h4>
                                            <DetailItem label="Staff Role" value={selectedItem.rehab_staff_profile.staff_role} icon={Briefcase} />
                                            <DetailItem label="Department" value={selectedItem.rehab_staff_profile.department} icon={Building} />
                                            <DetailItem label="Specialization" value={selectedItem.rehab_staff_profile.specialization || 'N/A'} />
                                            <DetailItem label="Degree" value={selectedItem.rehab_staff_profile.degree || 'N/A'} icon={GraduationCap} />
                                        </>
                                    )}
                                </dl>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
                                <Info className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                <p className="text-xl font-medium">
                                    {hasViewUserPermission ? "Select a user" : "Details Hidden"}
                                </p>
                                <p className="text-sm">
                                    {hasViewUserPermission
                                        ? "Choose a user from the list to view their details."
                                        : "You don't have permission to view user details."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {showAddModal && canCreateUser && (
                    <UserForm
                        formMode="add"
                        userTypeForForm={activeTab}
                        availableRoles={allRoles}
                        availablePermissions={allPermissions}
                        canManageRoles={canManageRoleAssignments} // Prop for assigning roles to this new user
                        canManagePermissions={canManageDirectPermissions} // Prop for assigning direct perms to this new user
                        canAssignRoles={canManageRoleAssignments} // Add this line
                        canAssignPermissions={canManageDirectPermissions}
                        onSubmitSuccess={handleFormSubmitSuccess}
                        onClose={() => setShowAddModal(false)}
                    />
                )}
                {showEditModal && editingItem && canEditUser && (
                    <UserForm
                        formMode="edit"
                        userTypeForForm={editingItem.user_type as UserTypeTab}
                        initialData={editingItem}
                        availableRoles={allRoles}
                        availablePermissions={allPermissions}
                        canManageRoles={canManageRoleAssignments}
                        canManagePermissions={canManageDirectPermissions}
                        canAssignRoles={canManageRoleAssignments} // Add this line
                        canAssignPermissions={canManageDirectPermissions}
                        onSubmitSuccess={handleFormSubmitSuccess}
                        onClose={() => { setShowEditModal(false); setEditingItem(null); }}
                    />
                )}
                {showDeleteModal && deletingItem && canDeleteUser && (
                    <DeleteConfirmationModal
                        isOpen={showDeleteModal}
                        itemType={deletingItem.user_type}
                        itemName={deletingItem.name}
                        onConfirm={handleDeleteConfirm}
                        onCancel={() => { setShowDeleteModal(false); setDeletingItem(null); }}
                    />
                )}
            </div>
        </DashboardWrapper>
    );
};

export default UserManagementPage;