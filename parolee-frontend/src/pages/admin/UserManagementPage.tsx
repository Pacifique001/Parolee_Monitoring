/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/UserManagementPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/api';
import type { ApiUser, ApiRole,ApiPermission } from '../../types/api'; // Adjust path
import AdminLayout from '../../layouts/AdminLayout';
import UserForm from '../../components/UserManagement/UserForm'; // Assuming this is in components/UserManagement/
import DeleteConfirmationModal from '../../components/UserManagement/DeleteConfirmationModal';
import StatusBadge from '../../components/UserManagement/StatusBadge';
import { format } from 'date-fns';

import {
    Users, UserPlus, Edit, Trash2, Search, Info, KeyRound,
    Briefcase, MapPin as LocationPin, UserCog, UserCheck, Shield,  AlertTriangle, FileText, Phone, Mail,
    Calendar, Clock, Award, Building, GraduationCap // Added missing icons
} from 'lucide-react';

// Define a more specific type for what's displayed (same as ApiUser for now)
type DisplayUser = ApiUser;
type UserTypeTab = 'parolee' | 'officer' | 'staff'; // Tabs for user types
const TABS: UserTypeTab[] = ['parolee', 'officer', 'staff'];

const UserManagementPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<UserTypeTab>('parolee');
    const [users, setUsers] = useState<DisplayUser[]>([]);
    const [allRoles, setAllRoles] = useState<ApiRole[]>([]);
    const [allPermissions, setAllPermissions] = useState<ApiPermission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paginationMeta, setPaginationMeta] = useState<any>(null); // For pagination info
    const [currentPage, setCurrentPage] = useState(1);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [editingItem, setEditingItem] = useState<ApiUser | null>(null);
    const [deletingItem, setDeletingItem] = useState<ApiUser | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<ApiUser | null>(null);

  // Fetch roles and permissions once when component mounts
useEffect(() => {
    const fetchInitialLookups = async () => {
        try {
            // Fetch Roles
            if (allRoles.length === 0) {
                const rolesResponse = await apiClient.get<{ data: ApiRole[] }>('/admin/roles'); // Your API endpoint for roles
                setAllRoles(rolesResponse.data.data.filter(r => r.name !== 'System Administrator'));
            }
            // Fetch Permissions
            if (allPermissions.length === 0) {
                // Use the endpoint from RoleController@allPermissions or PermissionController@index
                const permissionsResponse = await apiClient.get<{ data: ApiPermission[] }>('/admin/permissions-list'); // Or '/admin/permissions'
                setAllPermissions(permissionsResponse.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch roles or permissions:", err);
            setError(prev => prev || "Failed to load necessary options for user management.");
        }
    };
    fetchInitialLookups();
}, [allRoles.length, allPermissions.length]); // Dependencies to run once when empty


const fetchData = useCallback(async (page = 1, currentSearchTerm = searchTerm, currentActiveTab = activeTab) => {
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

        const usersResponse = await apiClient.get<{ data: ApiUser[]; meta: any; links: any }>(
            `/admin/users?${params.toString()}`
        );
        setUsers(usersResponse.data.data);
        setPaginationMeta(usersResponse.data.meta);
        setCurrentPage(usersResponse.data.meta.current_page);
    } catch (err: any) {
        console.error("Failed to fetch users:", err);
        setError(err.response?.data?.message || "Failed to load user data.");
    } finally {
        setIsLoading(false);
    }
}, [activeTab, searchTerm]); // Empty dependency array for fetchData, parameters will be passed

// Main useEffect to trigger user data fetching
useEffect(() => {
    fetchData(1, searchTerm, activeTab);
    setSelectedItem(null);
}, [activeTab, searchTerm, fetchData]);

    useEffect(() => {
        if (selectedItem) {
            console.log('Selected Item:', selectedItem);
            console.log('User Type:', selectedItem.user_type);
            console.log('Parolee Profile:', selectedItem.parolee_profile);
        }
    }, [selectedItem]);

    const handleFormSubmitSuccess = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setEditingItem(null);
        fetchData(currentPage); // Refetch current page data after add/edit
    };

    const openEditModal = (user: ApiUser) => {
        setEditingItem(user);
        setShowEditModal(true);
    };

   const openDeleteModal = (user: ApiUser) => {
        setDeletingItem(user);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingItem) return;
        // Set a temporary loading state for the delete button if desired
        //setDeletingInProgress(true);
        try {
            await apiClient.delete(`/admin/users/${deletingItem.id}`);
            setShowDeleteModal(false);
            // If the deleted item was selected, clear selection
            if (selectedItem?.id === deletingItem.id) {
                setSelectedItem(null);
            }
            setDeletingItem(null);
            fetchData(currentPage, searchTerm, activeTab); // Refetch data
        } catch (err: any) {
            console.error("Delete error:", err);
            setError(err.response?.data?.message || "Failed to delete user.");
            // Optionally keep modal open on error by not calling setShowDeleteModal(false) here
        } finally {
            // setDeletingInProgress(false);
        }
    };

    const DetailItem = ({ label, value, icon: Icon }: { label: string, value: React.ReactNode, icon?: React.ElementType }) => (
        <div>
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                {Icon && <Icon size={14} className="mr-1.5" />}
                {label}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value || 'N/A'}</dd>
        </div>
    );

    return (
        <AdminLayout>
            <title>User Management - Parole Monitoring Admin</title>
            <div className="flex-1 p-6 ml-64">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">User Management</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Manage parolees, officers, and staff members</p>
                    </div>
                    <div className="flex space-x-3">
                        <button className="secondary-button text-sm">
                            <KeyRound size={16} className="mr-2" /> Manage Permissions
                        </button> 
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="primary-button text-sm" // Use global button styles
                        >
                            <UserPlus size={16} className="mr-2" />
                            Add New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
                    <nav className="flex -mb-px border-b border-gray-200 dark:border-gray-700" aria-label="Tabs">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setSelectedItem(null); setSearchTerm(''); setCurrentPage(1); }}
                                className={`w-1/3 py-3 px-1 text-center border-b-2 font-medium text-sm focus:outline-none rounded-t-md
                                    ${activeTab === tab
                                        ? 'border-brand-purple-admin text-brand-purple-admin dark:text-brand-purple-light'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}s
                            </button>
                        ))}
                    </nav>
                </div>

                {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}

                <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                    {/* Left Pane: User List (Wider) */}
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
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1);}}
                                    className="input-style w-full pl-10" // Assuming input-style is global
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
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => {
                                        console.log('Clicked user:', user);
                                        setSelectedItem(user);
                                    }}
                                    className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50
                                        ${selectedItem?.id === user.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-brand-purple-admin' : 'border-l-4 border-transparent'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-gray-100">{user.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {activeTab === 'parolee' ? `ID: ${user.parolee_profile?.parole_id_number || 'N/A'}` :
                                                 activeTab === 'officer' ? `Badge: ${user.officer_profile?.badge_number || 'N/A'}` :
                                                 `Role: ${user.rehab_staff_profile?.staff_role || 'N/A'}`}
                                            </p>
                                        </div>
                                        <StatusBadge status={user.status as any} />
                                    </div>
                                </div>
                            ))}
                        </div>
                         {/* Pagination for User List */}
                        {paginationMeta && paginationMeta.last_page > 1 && (
                            <div className="p-4 border-t dark:border-gray-700 flex justify-between items-center text-sm">
                                <button onClick={() => fetchData(currentPage - 1)} disabled={currentPage === 1 || isLoading} className="pagination-button">Previous</button>
                                <span>Page {currentPage} of {paginationMeta.last_page}</span>
                                <button onClick={() => fetchData(currentPage + 1)} disabled={currentPage === paginationMeta.last_page || isLoading} className="pagination-button">Next</button>
                            </div>
                        )}
                    </div>

                    {/* Right Pane: User Details (Wider) */}
                    <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-lg shadow p-6 min-h-[calc(100vh-10rem)] overflow-y-auto custom-scrollbar">
                        {selectedItem ? (
                            <div>
                                <div className="flex justify-between items-center mb-4 pb-4 border-b dark:border-gray-700">
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{selectedItem.name}</h2>
                                    <div className="flex space-x-2">
                                        <button onClick={() => openEditModal(selectedItem)} className="icon-button text-blue-600 dark:text-blue-400" title="Edit User"><Edit size={18} /></button>
                                        {selectedItem.id !== 1 && /* Basic check for primary admin */
                                          <button onClick={() => openDeleteModal(selectedItem)} className="icon-button text-red-600 dark:text-red-400" title="Delete User"><Trash2 size={18} /></button>
                                        }
                                    </div>
                                </div>
                                <dl className="space-y-4">
                                    <DetailItem label="Email" value={selectedItem.email} icon={Mail} />
                                    <DetailItem label="Phone" value={selectedItem.phone} icon={Phone} />
                                    <DetailItem label="User Type" value={<span className="capitalize">{selectedItem.user_type}</span>} icon={Users} />
                                    <DetailItem label="Status" value={<StatusBadge status={selectedItem.status as any} />} icon={UserCheck} />
                                    <DetailItem label="Roles" value={selectedItem.roles?.map(r => r.name).join(', ') || 'None'} icon={Shield} />
                                    <DetailItem label="Joined" value={format(new Date(selectedItem.created_at), 'PPp')} icon={Calendar} />
                                    <DetailItem label="Last Updated" value={format(new Date(selectedItem.updated_at), 'PPp')} icon={Clock} />

                                    {/* Parolee Profile Details */}
                                    {selectedItem.user_type === 'parolee' && selectedItem.parolee_profile && (
                                        <>
                                            <hr className="dark:border-gray-700 my-4"/>
                                            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Parolee Profile</h4>
                                            <DetailItem label="Parole ID" value={selectedItem.parolee_profile.parole_id_number} icon={FileText} />
                                            <DetailItem label="Imprisonment Date" value={selectedItem.parolee_profile.imprisonment_date ? format(new Date(selectedItem.parolee_profile.imprisonment_date), 'P') : 'N/A'} icon={Calendar}/>
                                            <DetailItem label="Release Date" value={selectedItem.parolee_profile.release_date ? format(new Date(selectedItem.parolee_profile.release_date), 'P') : 'N/A'} icon={Calendar}/>
                                            <DetailItem label="Expected End Date" value={selectedItem.parolee_profile.expected_end_date ? format(new Date(selectedItem.parolee_profile.expected_end_date), 'P') : 'N/A'} icon={Calendar}/>
                                            <DetailItem label="Home Address" value={selectedItem.parolee_profile.home_address} icon={LocationPin} />
                                            {selectedItem.parolee_profile.emergency_contact && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center"><AlertTriangle size={14} className="mr-1.5 text-orange-500"/>Emergency Contact</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 pl-5">
                                                        {selectedItem.parolee_profile.emergency_contact.name} ({selectedItem.parolee_profile.emergency_contact.relationship}) - {selectedItem.parolee_profile.emergency_contact.phone}
                                                    </dd>
                                                </div>
                                            )}
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center"><FileText size={14} className="mr-1.5"/>Conditions</dt>
                                                {selectedItem.parolee_profile.conditions && Array.isArray(selectedItem.parolee_profile.conditions) && selectedItem.parolee_profile.conditions.length > 0 ? (
                                                    <ul className="mt-1 list-disc list-inside pl-5 space-y-1 text-sm text-gray-900 dark:text-gray-100">
                                                        {selectedItem.parolee_profile.conditions.map((cond, i) => <li key={i}>{cond}</li>)}
                                                    </ul>
                                                ) : <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 pl-5">N/A</dd>}
                                            </div>
                                            {/* TODO: Assessments section */}
                                        </>
                                    )}
                                    {/* Officer Profile Details */}
                                    {selectedItem.user_type === 'officer' && selectedItem.officer_profile && (
                                        <>
                                            <hr className="dark:border-gray-700 my-4"/>
                                            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Officer Profile</h4>
                                            <DetailItem label="Badge Number" value={selectedItem.officer_profile.badge_number} icon={Award} />
                                            <DetailItem label="Rank" value={selectedItem.officer_profile.rank} icon={UserCog} />
                                            <DetailItem label="Department" value={selectedItem.officer_profile.department} icon={Building} />
                                            <DetailItem label="Unit" value={selectedItem.officer_profile.unit} />
                                            <DetailItem label="Caseload" value={selectedItem.officer_profile.caseload?.toString()} />
                                        </>
                                    )}
                                    {/* Staff Profile Details */}
                                    {selectedItem.user_type === 'staff' && selectedItem.rehab_staff_profile && (
                                        <>
                                            <hr className="dark:border-gray-700 my-4"/>
                                            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Staff Profile</h4>
                                            <DetailItem label="Staff Role" value={selectedItem.rehab_staff_profile.staff_role} icon={Briefcase} />
                                            <DetailItem label="Department" value={selectedItem.rehab_staff_profile.department} icon={Building} />
                                            <DetailItem label="Specialization" value={selectedItem.rehab_staff_profile.specialization} />
                                            <DetailItem label="Degree" value={selectedItem.rehab_staff_profile.degree} icon={GraduationCap}/>
                                        </>
                                    )}
                                </dl>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
                                <Info className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                <p className="text-xl font-medium">Select a user</p>
                                <p className="text-sm">Choose a user from the list to view their details.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modals */}
                {showAddModal && (
                    <UserForm
                        formMode="add"
                        userTypeForForm={activeTab}
                        availableRoles={allRoles}
                        availablePermissions={allPermissions} // If adding direct permissions on create
                        onSubmitSuccess={handleFormSubmitSuccess}
                        onClose={() => setShowAddModal(false)}
                    />
                )}
                {showEditModal && editingItem && (
                    <UserForm
                        formMode="edit"
                        userTypeForForm={editingItem.user_type as UserTypeTab}
                        initialData={editingItem}
                        availableRoles={allRoles}
                        availablePermissions={allPermissions}
                        //userDirectPermissions={editingItem.all_permissions?.map(p => p.name)}
                        onSubmitSuccess={handleFormSubmitSuccess}
                        onClose={() => { setShowEditModal(false); setEditingItem(null); }}
                    />
                )}
                {showDeleteModal && deletingItem && (
                    <DeleteConfirmationModal
                        isOpen={showDeleteModal} // Pass isOpen prop
                        itemType={deletingItem.user_type}
                        itemName={deletingItem.name}
                        onConfirm={handleDeleteConfirm}
                        onCancel={() => { setShowDeleteModal(false); setDeletingItem(null); }}
                    />
                )}
            </div>
        </AdminLayout>
    );
};

export default UserManagementPage;