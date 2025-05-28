/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Save, X } from 'lucide-react';
import type {
    UserFormData,
    ApiUser,
    ApiRole,
    ApiPermission,
    ApiParoleeProfile,
    ApiOfficerProfile,
    ApiRehabStaffProfile
} from '../../types/api'; // Adjust path as necessary
import apiClient from '../../services/api'; // Adjust path as necessary

interface UserFormProps {
    formMode: 'add' | 'edit';
    userTypeForForm: 'parolee' | 'officer' | 'staff' | 'admin';
    initialData?: ApiUser | null;
    availableRoles: ApiRole[];
    availablePermissions: ApiPermission[];
    canManageRoles: boolean;
    canManagePermissions: boolean;
    canAssignRoles: boolean;
    canAssignPermissions: boolean;
    onSubmitSuccess: () => void;
    onClose: () => void;
}

const getInitialFormData = (
    mode: 'add' | 'edit',
    intendedUserType: 'parolee' | 'officer' | 'staff' | 'admin',
    initialApiData?: ApiUser | null
): UserFormData => {
    const baseParoleeProfile: Partial<ApiParoleeProfile> = { parole_id_number: '', conditions: [], emergency_contact: { name: '', phone: '', relationship: '' }, imprisonment_date: '', release_date: '', expected_end_date: '', home_address: '', current_risk_level: '', assessment_notes: '' };
    const baseOfficerProfile: Partial<ApiOfficerProfile> = { badge_number: '', rank: '', department: '', unit: '', caseload: 0 };
    const baseRehabStaffProfile: Partial<ApiRehabStaffProfile> = { staff_role: '', department: '', specialization: '', degree: '' };

    if (mode === 'edit' && initialApiData) {
        return {
            id: initialApiData.id,
            name: initialApiData.name || '',
            email: initialApiData.email || '',
            phone: initialApiData.phone || '',
            user_type: initialApiData.user_type,
            status: initialApiData.status,
            roles: initialApiData.roles?.map(role => role.name) || [],
            directPermissions: initialApiData.direct_permissions?.map(p => p.name) || [],
            all_permissions:  initialApiData.all_permissions?.map(p => p.name) || [] , // Use direct_permissions from API
            password: '',
            password_confirmation: '',
            parolee_profile: { ...baseParoleeProfile, ...initialApiData.parolee_profile },
            officer_profile: { ...baseOfficerProfile, ...initialApiData.officer_profile },
            rehab_staff_profile: { ...baseRehabStaffProfile, ...initialApiData.rehab_staff_profile },
        };
    }

    return {
        name: '', email: '', phone: '',
        user_type: intendedUserType, status: 'pending', roles: [],
        directPermissions: [],
        all_permissions:[],
        password: '', password_confirmation: '',
        parolee_profile: baseParoleeProfile,
        officer_profile: baseOfficerProfile,
        rehab_staff_profile: baseRehabStaffProfile,
    };
};

const UserForm: React.FC<UserFormProps> = ({
    formMode,
    userTypeForForm,
    initialData,
    availableRoles,
    availablePermissions,
    onSubmitSuccess,
    onClose,
}) => {
    const formInitUserType = formMode === 'edit' && initialData ? initialData.user_type : userTypeForForm;
    const [formData, setFormData] = useState<UserFormData>(
        getInitialFormData(formMode, formInitUserType, initialData)
    );
    const [errors, setErrors] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const typeForReInit = formMode === 'edit' && initialData ? initialData.user_type : userTypeForForm;
        setFormData(getInitialFormData(formMode, typeForReInit, initialData));
        setErrors({});
    }, [initialData, formMode, userTypeForForm]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileInputChange = (
        profileType: 'parolee_profile' | 'officer_profile' | 'rehab_staff_profile',
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        const isCaseload = profileType === 'officer_profile' && name === 'caseload';
        setFormData(prev => ({
            ...prev,
            [profileType]: {
                ...(prev[profileType] as object || {}),
                [name]: isCaseload ? (parseInt(value, 10) || 0) : value,
            },
        }));
    };

    const handleEmergencyContactChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            parolee_profile: {
                ...(prev.parolee_profile || { parole_id_number: '' }),
                emergency_contact: {
                    ...(prev.parolee_profile?.emergency_contact || { name: '', phone: '', relationship: '' }),
                    [name]: value,
                }
            } as ApiParoleeProfile
        }));
    };

    const handleRoleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            roles: checked
                ? [...(prev.roles || []), value]
                : (prev.roles || []).filter(roleName => roleName !== value),
        }));
    };

    const handleDirectPermissionChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            directPermissions: checked
                ? [...(prev.directPermissions || []), value]
                : (prev.directPermissions || []).filter(permissionName => permissionName !== value),
        }));
    };

    const handleConditionsChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const conditionsArray = e.target.value.split('\n').map(c => c.trim()).filter(c => c);
        setFormData(prev => ({
            ...prev,
            parolee_profile: {
                ...(prev.parolee_profile || { parole_id_number: '' }),
                conditions: conditionsArray,
            } as ApiParoleeProfile,
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        const payload: any = {
            name: formData.name, email: formData.email, phone: formData.phone,
            user_type: formData.user_type, status: formData.status,
            roles: formData.roles || [],
        };

        if (formMode === 'add' || (formMode === 'edit' && formData.password && formData.password.length > 0)) {
            payload.password = formData.password;
            payload.password_confirmation = formData.password_confirmation;
        }

        if (formData.user_type === 'parolee' && formData.parolee_profile && Object.values(formData.parolee_profile).some(val => val !== '' && !(Array.isArray(val) && val.length === 0))) {
            payload.parolee_profile = formData.parolee_profile;
        }
        if (formData.user_type === 'officer' && formData.officer_profile && Object.values(formData.officer_profile).some(val => val !== '' && val !== 0)) {
            payload.officer_profile = formData.officer_profile;
        }
        if (formData.user_type === 'staff' && formData.rehab_staff_profile && Object.values(formData.rehab_staff_profile).some(val => val !== '')) {
            payload.rehab_staff_profile = formData.rehab_staff_profile;
        }

        const directPermissionsToSync = formData.directPermissions || [];

        try {
            let userApiResponse;
            if (formMode === 'add') {
                userApiResponse = await apiClient.post<{ data: ApiUser }>('/admin/users', payload);
            } else if (formData.id) {
                userApiResponse = await apiClient.put<{ data: ApiUser }>(`/admin/users/${formData.id}`, payload);
            } else {
                throw new Error("Form data is missing ID for edit mode.");
            }

            if (userApiResponse?.data?.data?.id && directPermissionsToSync !== undefined) {
                await apiClient.post(`/admin/users/${userApiResponse.data.data.id}/permissions`, { permissions: directPermissionsToSync });
            }
            onSubmitSuccess();
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ form: error.response?.data?.message || 'An unexpected error occurred.' });
            }
            console.error("Form submission error:", error.response?.data || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const userTypesForSelect: UserFormData['user_type'][] = ['parolee', 'officer', 'staff', 'admin'];
    const userStatuses: ApiUser['status'][] = ['active', 'pending', 'suspended', 'inactive', 'high_risk', 'violation'];
    const assignableRoles = availableRoles.filter(role => role.name !== 'System Administrator');
    const errMessageStyle = "text-xs text-red-500 mt-1";
    const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-brand-purple-admin focus:border-brand-purple-admin sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400";


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl custom-scrollbar">
                <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                        {formMode === 'edit' ? 'Edit' : 'Add New'} {formData.user_type.charAt(0).toUpperCase() + formData.user_type.slice(1)}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" aria-label="Close modal">
                        <X size={24} />
                    </button>
                </div>

                {errors.form && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900/50 rounded-md" role="alert">{errors.form}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* User Account Fieldset */}
                    <fieldset>
                        <legend className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">User Account Details</legend>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className={inputStyle} />
                                    {errors.name && <p className={errMessageStyle}>{Array.isArray(errors.name) ? errors.name[0] : errors.name}</p>}
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address <span className="text-red-500">*</span></label>
                                    <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} required className={inputStyle} />
                                    {errors.email && <p className={errMessageStyle}>{Array.isArray(errors.email) ? errors.email[0] : errors.email}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                                    <input type="tel" name="phone" id="phone" value={formData.phone ?? ''} onChange={handleInputChange} className={inputStyle} />
                                    {errors.phone && <p className={errMessageStyle}>{Array.isArray(errors.phone) ? errors.phone[0] : errors.phone}</p>}
                                </div>
                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status <span className="text-red-500">*</span></label>
                                    <select name="status" id="status" value={formData.status} onChange={handleInputChange} required className={inputStyle}>
                                        {userStatuses.map(s => <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>)}
                                    </select>
                                    {errors.status && <p className={errMessageStyle}>{Array.isArray(errors.status) ? errors.status[0] : errors.status}</p>}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="user_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">User Type <span className="text-red-500">*</span></label>
                                <select name="user_type" id="user_type" value={formData.user_type} onChange={handleInputChange} required className={inputStyle} disabled={formMode === 'edit'}>
                                    {userTypesForSelect.map(type => <option key={type} value={type} className="capitalize">{type}</option>)}
                                </select>
                                {formMode === 'edit' && <p className="text-xs text-gray-500 mt-1">User type cannot be changed after creation to maintain profile integrity.</p>}
                                {errors.user_type && <p className={errMessageStyle}>{Array.isArray(errors.user_type) ? errors.user_type[0] : errors.user_type}</p>}
                            </div>
                            {formMode === 'add' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label htmlFor="password_add" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password <span className="text-red-500">*</span></label><input type="password" name="password" id="password_add" value={formData.password || ''} onChange={handleInputChange} required className={inputStyle} />{errors.password && <p className={errMessageStyle}>{Array.isArray(errors.password) ? errors.password[0] : errors.password}</p>}</div>
                                    <div><label htmlFor="password_confirmation_add" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password <span className="text-red-500">*</span></label><input type="password" name="password_confirmation" id="password_confirmation_add" value={formData.password_confirmation || ''} onChange={handleInputChange} required className={inputStyle} /></div>
                                </div>
                            )}
                            {formMode === 'edit' && (
                                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-800/30 border border-yellow-300 dark:border-yellow-700 rounded-md">
                                    <p className="text-xs text-yellow-700 dark:text-yellow-200">Leave password fields blank to keep the current password.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        <div><label htmlFor="password_edit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label><input type="password" name="password" id="password_edit" value={formData.password || ''} onChange={handleInputChange} className={inputStyle} />{errors.password && <p className={errMessageStyle}>{Array.isArray(errors.password) ? errors.password[0] : errors.password}</p>}</div>
                                        <div><label htmlFor="password_confirmation_edit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label><input type="password" name="password_confirmation" id="password_confirmation_edit" value={formData.password_confirmation || ''} onChange={handleInputChange} className={inputStyle} /></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Assign Roles <span className="text-red-500">*</span></legend>
                        <div className="mt-2 space-y-1 p-3 border dark:border-gray-600 rounded-md max-h-32 overflow-y-auto custom-scrollbar">
                            {assignableRoles.length > 0 ? assignableRoles.map(role => (
                                <label key={role.name} className="flex items-center cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    <input type="checkbox" name="roles" value={role.name} checked={formData.roles?.includes(role.name)} onChange={handleRoleChange}
                                        className="h-4 w-4 text-brand-purple-admin focus:ring-brand-purple-admin border-gray-300 dark:border-gray-500 rounded dark:bg-gray-600" />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{role.name}</span>
                                </label>
                            )) : <p className="text-xs text-gray-500 dark:text-gray-400">No roles available for assignment.</p>}
                        </div>
                        {errors.roles && <p className={errMessageStyle}>{Array.isArray(errors.roles) ? errors.roles[0] : errors.roles}</p>}
                        {!errors.roles && formData.roles?.length === 0 && formMode === 'add' && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">At least one role must be assigned.</p>}
                    </fieldset>

                    {availablePermissions.length > 0 && (
                        <fieldset className="mt-4 border-t pt-4 dark:border-gray-700">
                            <legend className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Assign permissions to user</legend>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                Assign specific permissions directly to this user. These supplement permissions granted by roles.
                            </p>
                            <div className="mt-2 space-y-1 p-3 border dark:border-gray-600 rounded-md max-h-40 overflow-y-auto custom-scrollbar">
                                {availablePermissions.map(permission => (
                                    <label key={permission.name} className="flex items-center cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                        <input type="checkbox" name="directPermissions" value={permission.name} checked={formData.directPermissions?.includes(permission.name)} onChange={handleDirectPermissionChange}
                                            className="h-4 w-4 text-brand-purple-admin focus:ring-brand-purple-admin border-gray-300 dark:border-gray-500 rounded dark:bg-gray-600" />
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{permission.name}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.directPermissions && <p className={errMessageStyle}>{Array.isArray(errors.directPermissions) ? errors.directPermissions[0] : errors.directPermissions}</p>}
                        </fieldset>
                    )}

                    {/* === Parolee Profile Fields === */}
                    {formData.user_type === 'parolee' && (
                        <fieldset className="mt-4 border-t pt-4 dark:border-gray-700">
                            <legend className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Parolee Profile</legend>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label htmlFor="parolee_parole_id_number" className="block text-sm font-medium">Parole ID <span className="text-red-500">*</span></label><input type="text" name="parole_id_number" id="parolee_parole_id_number" value={formData.parolee_profile?.parole_id_number || ''} onChange={(e) => handleProfileInputChange('parolee_profile', e)} required className={inputStyle} />{errors['parolee_profile.parole_id_number'] && <p className={errMessageStyle}>{Array.isArray(errors['parolee_profile.parole_id_number']) ? errors['parolee_profile.parole_id_number'][0] : errors['parolee_profile.parole_id_number']}</p>}</div>
                                    <div><label htmlFor="parolee_current_risk_level" className="block text-sm font-medium">Risk Level</label><select name="current_risk_level" id="parolee_current_risk_level" value={formData.parolee_profile?.current_risk_level || ''} onChange={(e) => handleProfileInputChange('parolee_profile', e)} className={inputStyle}><option value="">Select</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>{errors['parolee_profile.current_risk_level'] && <p className={errMessageStyle}>{Array.isArray(errors['parolee_profile.current_risk_level']) ? errors['parolee_profile.current_risk_level'][0] : errors['parolee_profile.current_risk_level']}</p>}</div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div><label htmlFor="parolee_imprisonment_date" className="block text-sm font-medium">Imprisonment Date</label><input type="date" name="imprisonment_date" id="parolee_imprisonment_date" value={formData.parolee_profile?.imprisonment_date || ''} onChange={(e) => handleProfileInputChange('parolee_profile', e)} className={inputStyle} />{errors['parolee_profile.imprisonment_date'] && <p className={errMessageStyle}>{Array.isArray(errors['parolee_profile.imprisonment_date']) ? errors['parolee_profile.imprisonment_date'][0] : errors['parolee_profile.imprisonment_date']}</p>}</div>
                                    <div><label htmlFor="parolee_release_date" className="block text-sm font-medium">Release Date</label><input type="date" name="release_date" id="parolee_release_date" value={formData.parolee_profile?.release_date || ''} onChange={(e) => handleProfileInputChange('parolee_profile', e)} className={inputStyle} />{errors['parolee_profile.release_date'] && <p className={errMessageStyle}>{Array.isArray(errors['parolee_profile.release_date']) ? errors['parolee_profile.release_date'][0] : errors['parolee_profile.release_date']}</p>}</div>
                                    <div><label htmlFor="parolee_expected_end_date" className="block text-sm font-medium">Expected End Date</label><input type="date" name="expected_end_date" id="parolee_expected_end_date" value={formData.parolee_profile?.expected_end_date || ''} onChange={(e) => handleProfileInputChange('parolee_profile', e)} className={inputStyle} />{errors['parolee_profile.expected_end_date'] && <p className={errMessageStyle}>{Array.isArray(errors['parolee_profile.expected_end_date']) ? errors['parolee_profile.expected_end_date'][0] : errors['parolee_profile.expected_end_date']}</p>}</div>
                                </div>
                                <div><label htmlFor="parolee_home_address" className="block text-sm font-medium">Home Address</label><textarea name="home_address" id="parolee_home_address" rows={2} value={formData.parolee_profile?.home_address || ''} onChange={(e) => handleProfileInputChange('parolee_profile', e)} className={inputStyle}></textarea>{errors['parolee_profile.home_address'] && <p className={errMessageStyle}>{Array.isArray(errors['parolee_profile.home_address']) ? errors['parolee_profile.home_address'][0] : errors['parolee_profile.home_address']}</p>}</div>
                                <div><label className="block text-sm font-medium">Emergency Contact</label><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1 p-3 border dark:border-gray-600 rounded-md">
                                    <div><label htmlFor="ec_name" className="block text-xs font-medium">Name</label><input type="text" name="name" id="ec_name" value={formData.parolee_profile?.emergency_contact?.name || ''} onChange={handleEmergencyContactChange} className={inputStyle} />{errors['parolee_profile.emergency_contact.name'] && <p className={errMessageStyle}>{Array.isArray(errors['parolee_profile.emergency_contact.name']) ? errors['parolee_profile.emergency_contact.name'][0] : errors['parolee_profile.emergency_contact.name']}</p>}</div>
                                    <div><label htmlFor="ec_phone" className="block text-xs font-medium">Phone</label><input type="tel" name="phone" id="ec_phone" value={formData.parolee_profile?.emergency_contact?.phone || ''} onChange={handleEmergencyContactChange} className={inputStyle} />{errors['parolee_profile.emergency_contact.phone'] && <p className={errMessageStyle}>{Array.isArray(errors['parolee_profile.emergency_contact.phone']) ? errors['parolee_profile.emergency_contact.phone'][0] : errors['parolee_profile.emergency_contact.phone']}</p>}</div>
                                    <div><label htmlFor="ec_relationship" className="block text-xs font-medium">Relationship</label><input type="text" name="relationship" id="ec_relationship" value={formData.parolee_profile?.emergency_contact?.relationship || ''} onChange={handleEmergencyContactChange} className={inputStyle} />{errors['parolee_profile.emergency_contact.relationship'] && <p className={errMessageStyle}>{Array.isArray(errors['parolee_profile.emergency_contact.relationship']) ? errors['parolee_profile.emergency_contact.relationship'][0] : errors['parolee_profile.emergency_contact.relationship']}</p>}</div>
                                </div></div>
                                <div><label htmlFor="parolee_conditions" className="block text-sm font-medium">Conditions (one per line)</label><textarea name="conditions" id="parolee_conditions" rows={3} value={Array.isArray(formData.parolee_profile?.conditions) ? formData.parolee_profile.conditions.join('\n') : ''} onChange={handleConditionsChange} className={inputStyle}></textarea>{errors['parolee_profile.conditions'] && <p className={errMessageStyle}>{Array.isArray(errors['parolee_profile.conditions']) ? errors['parolee_profile.conditions'][0] : errors['parolee_profile.conditions']}</p>}</div>
                                <div><label htmlFor="parolee_assessment_notes" className="block text-sm font-medium">Assessment Notes</label><textarea name="assessment_notes" id="parolee_assessment_notes" rows={3} value={formData.parolee_profile?.assessment_notes || ''} onChange={(e) => handleProfileInputChange('parolee_profile', e)} className={inputStyle}></textarea>{errors['parolee_profile.assessment_notes'] && <p className={errMessageStyle}>{Array.isArray(errors['parolee_profile.assessment_notes']) ? errors['parolee_profile.assessment_notes'][0] : errors['parolee_profile.assessment_notes']}</p>}</div>
                            </div>
                        </fieldset>
                    )}

                    {/* === Officer Profile Fields === */}
                    {formData.user_type === 'officer' && (
                        <fieldset className="mt-4 border-t pt-4 dark:border-gray-700">
                            <legend className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Officer Profile</legend>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label htmlFor="officer_badge_number" className="block text-sm font-medium">Badge Number <span className="text-red-500">*</span></label><input type="text" name="badge_number" id="officer_badge_number" value={formData.officer_profile?.badge_number || ''} onChange={(e) => handleProfileInputChange('officer_profile', e)} required className={inputStyle} />{errors['officer_profile.badge_number'] && <p className={errMessageStyle}>{Array.isArray(errors['officer_profile.badge_number']) ? errors['officer_profile.badge_number'][0] : errors['officer_profile.badge_number']}</p>}</div>
                                    <div><label htmlFor="officer_rank" className="block text-sm font-medium">Rank <span className="text-red-500">*</span></label><input type="text" name="rank" id="officer_rank" value={formData.officer_profile?.rank || ''} onChange={(e) => handleProfileInputChange('officer_profile', e)} required className={inputStyle} />{errors['officer_profile.rank'] && <p className={errMessageStyle}>{Array.isArray(errors['officer_profile.rank']) ? errors['officer_profile.rank'][0] : errors['officer_profile.rank']}</p>}</div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label htmlFor="officer_department" className="block text-sm font-medium">Department <span className="text-red-500">*</span></label><input type="text" name="department" id="officer_department" value={formData.officer_profile?.department || ''} onChange={(e) => handleProfileInputChange('officer_profile', e)} required className={inputStyle} />{errors['officer_profile.department'] && <p className={errMessageStyle}>{Array.isArray(errors['officer_profile.department']) ? errors['officer_profile.department'][0] : errors['officer_profile.department']}</p>}</div>
                                    <div><label htmlFor="officer_unit" className="block text-sm font-medium">Unit</label><input type="text" name="unit" id="officer_unit" value={formData.officer_profile?.unit || ''} onChange={(e) => handleProfileInputChange('officer_profile', e)} className={inputStyle} />{errors['officer_profile.unit'] && <p className={errMessageStyle}>{Array.isArray(errors['officer_profile.unit']) ? errors['officer_profile.unit'][0] : errors['officer_profile.unit']}</p>}</div>
                                </div>
                                <div><label htmlFor="officer_caseload" className="block text-sm font-medium">Caseload</label><input type="number" name="caseload" id="officer_caseload" value={formData.officer_profile?.caseload?.toString() === undefined ? '' : formData.officer_profile.caseload} onChange={(e) => handleProfileInputChange('officer_profile', e)} className={inputStyle} min="0" />{errors['officer_profile.caseload'] && <p className={errMessageStyle}>{Array.isArray(errors['officer_profile.caseload']) ? errors['officer_profile.caseload'][0] : errors['officer_profile.caseload']}</p>}</div>
                            </div>
                        </fieldset>
                    )}

                    {/* === Rehab Staff Profile Fields === */}
                    {formData.user_type === 'staff' && (
                        <fieldset className="mt-4 border-t pt-4 dark:border-gray-700">
                            <legend className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Staff Profile</legend>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label htmlFor="staff_staff_role" className="block text-sm font-medium">Staff Role <span className="text-red-500">*</span></label><input type="text" name="staff_role" id="staff_staff_role" value={formData.rehab_staff_profile?.staff_role || ''} onChange={(e) => handleProfileInputChange('rehab_staff_profile', e)} required className={inputStyle} />{errors['rehab_staff_profile.staff_role'] && <p className={errMessageStyle}>{Array.isArray(errors['rehab_staff_profile.staff_role']) ? errors['rehab_staff_profile.staff_role'][0] : errors['rehab_staff_profile.staff_role']}</p>}</div>
                                    <div><label htmlFor="staff_department" className="block text-sm font-medium">Department <span className="text-red-500">*</span></label><input type="text" name="department" id="staff_department" value={formData.rehab_staff_profile?.department || ''} onChange={(e) => handleProfileInputChange('rehab_staff_profile', e)} required className={inputStyle} />{errors['rehab_staff_profile.department'] && <p className={errMessageStyle}>{Array.isArray(errors['rehab_staff_profile.department']) ? errors['rehab_staff_profile.department'][0] : errors['rehab_staff_profile.department']}</p>}</div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label htmlFor="staff_specialization" className="block text-sm font-medium">Specialization</label><input type="text" name="specialization" id="staff_specialization" value={formData.rehab_staff_profile?.specialization || ''} onChange={(e) => handleProfileInputChange('rehab_staff_profile', e)} className={inputStyle} />{errors['rehab_staff_profile.specialization'] && <p className={errMessageStyle}>{Array.isArray(errors['rehab_staff_profile.specialization']) ? errors['rehab_staff_profile.specialization'][0] : errors['rehab_staff_profile.specialization']}</p>}</div>
                                    <div><label htmlFor="staff_degree" className="block text-sm font-medium">Degree</label><input type="text" name="degree" id="staff_degree" value={formData.rehab_staff_profile?.degree || ''} onChange={(e) => handleProfileInputChange('rehab_staff_profile', e)} className={inputStyle} />{errors['rehab_staff_profile.degree'] && <p className={errMessageStyle}>{Array.isArray(errors['rehab_staff_profile.degree']) ? errors['rehab_staff_profile.degree'][0] : errors['rehab_staff_profile.degree']}</p>}</div>
                                </div>
                            </div>
                        </fieldset>
                    )}

                    {/* Buttons */}
                    <div className="flex justify-end space-x-3 pt-6 border-t dark:border-gray-700 mt-6">
                        <button type="button" onClick={onClose} className="secondary-button">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="primary-button">
                            <Save size={16} className="mr-2" />
                            {isSubmitting ? 'Saving...' : (formMode === 'edit' ? 'Update User' : 'Create User')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;