/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/staff/AssessmentsPage.tsx
import React, { useEffect, useState, useCallback,type FormEvent } from 'react'; // Added FormEvent
import StaffLayout from '../../layouts/StaffLayout';      // Adjust path as needed
import apiClient from '../../services/api';             // Adjust path as needed
import { ClipboardList, PlusCircle, Search, Filter, Edit, X } from 'lucide-react'; // Added more icons
import { format } from 'date-fns';
// import AddAssessmentModal from './AddAssessmentModal'; // Assuming you'll create this
// For now, we'll integrate a basic form modal structure directly or use a generic one.

// Define a more detailed AssessmentItem based on AssessmentResource from backend
interface ApiAssessment {
    id: string | number;
    parolee_user_id: number;
    parolee_name?: string; // Comes from eager loading parolee relationship
    conducted_by_user_id?: number | null;
    conductor_name?: string; // Comes from eager loading conductor relationship
    type: string;
    status: 'pending' | 'completed' | 'overdue' | 'scheduled' | 'in_progress' | 'cancelled';
    notes?: string | null;
    recommendations?: string[] | null; // Array of strings
    assessment_date?: string | null;   // 'YYYY-MM-DD'
    next_review_date?: string | null;  // 'YYYY-MM-DD'
    details?: Record<string, any> | null; // For any other structured data
    created_at?: string;
    updated_at?: string;
}

interface AssessmentFormData {
    id?: string | number;
    parolee_user_id: string; // Store as string for form input, convert to number on submit
    type: string;
    status: ApiAssessment['status'];
    notes?: string;
    recommendations_text?: string; // For textarea input, will be split into array
    assessment_date?: string;
    next_review_date?: string;
    details?: string; // For JSON input in textarea
}


interface FilterState {
    searchParolee: string; // More specific search
    status: string;
    type: string;
    // Add date filters if needed
    // startDate: string;
    // endDate: string;
}

const defaultFilterState: FilterState = {
    searchParolee: '',
    status: '',
    type: '',
};

// Placeholder for Add/Edit Assessment Modal (can be extracted to its own component)
interface AssessmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmitSuccess: () => void;
    initialData?: ApiAssessment | null;
    availableParolees: {id: number, name: string}[]; // For dropdown
}

const AssessmentFormModal: React.FC<AssessmentFormModalProps> = ({
    isOpen, onClose, onSubmitSuccess, initialData, availableParolees
}) => {
    const [formData, setFormData] = useState<AssessmentFormData>(() => {
        if (initialData) {
            return {
                id: initialData.id,
                parolee_user_id: initialData.parolee_user_id.toString(),
                type: initialData.type,
                status: initialData.status,
                notes: initialData.notes || '',
                recommendations_text: Array.isArray(initialData.recommendations) ? initialData.recommendations.join('\n') : '',
                assessment_date: initialData.assessment_date || '',
                next_review_date: initialData.next_review_date || '',
                details: initialData.details ? JSON.stringify(initialData.details, null, 2) : '',
            };
        }
        return {
            parolee_user_id: '', type: '', status: 'pending', notes: '',
            recommendations_text: '', assessment_date: '', next_review_date: '', details: ''
        };
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});


    useEffect(() => { // Reset form when initialData changes or modal opens/closes
        if (initialData) {
             setFormData({
                id: initialData.id,
                parolee_user_id: initialData.parolee_user_id.toString(),
                type: initialData.type,
                status: initialData.status,
                notes: initialData.notes || '',
                recommendations_text: Array.isArray(initialData.recommendations) ? initialData.recommendations.join('\n') : '',
                assessment_date: initialData.assessment_date || '',
                next_review_date: initialData.next_review_date || '',
                details: initialData.details ? JSON.stringify(initialData.details, null, 2) : '',
            });
        } else {
             setFormData({ parolee_user_id: '', type: '', status: 'pending', notes: '', recommendations_text: '', assessment_date: '', next_review_date: '', details: '' });
        }
        setFormError(null);
        setValidationErrors({});
    }, [initialData, isOpen]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null);
        setValidationErrors({});

        const payload = {
            ...formData,
            parolee_user_id: parseInt(formData.parolee_user_id, 10),
            recommendations: formData.recommendations_text?.split('\n').map(r => r.trim()).filter(r => r) || [],
            details: formData.details ? JSON.parse(formData.details) : null, // Be careful with JSON.parse
        };
        delete (payload as any).recommendations_text; // Remove the text version

        try {
            if (formData.id) { // Edit mode
                await apiClient.put(`/staff/assessments/${formData.id}`, payload);
            } else { // Add mode
                await apiClient.post('/staff/assessments', payload);
            }
            onSubmitSuccess();
            onClose();
        } catch (err: unknown) {
            if (err instanceof Error && (err as { response?: { data?: { errors?: Record<string, string[]> } } }).response?.data?.errors) {
                setValidationErrors((err as any).response.data.errors);
            } else if (err instanceof Error && (err as any).response?.data?.message) {
                setFormError((err as any).response.data.message || "Failed to save assessment.");
            } else {
                setFormError("An unknown error occurred.");
            }
            console.error("Assessment form error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-purple-admin focus:border-brand-purple-admin sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl custom-scrollbar">
                <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                        {formData.id ? 'Edit' : 'New'} Assessment
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"><X size={20} /></button>
                </div>
                {formError && <div className="mb-4 p-2 text-sm text-red-700 bg-red-100 rounded">{formError}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="parolee_user_id" className="form-label">Parolee <span className="text-red-500">*</span></label>
                        <select name="parolee_user_id" id="parolee_user_id" value={formData.parolee_user_id} onChange={handleChange} required className={inputStyle} disabled={!!formData.id}>
                            <option value="">Select Parolee</option>
                            {availableParolees.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
                        </select>
                        {validationErrors.parolee_user_id && <p className="err-msg">{validationErrors.parolee_user_id[0]}</p>}
                    </div>
                    <div>
                        <label htmlFor="type" className="form-label">Type <span className="text-red-500">*</span></label>
                        <input type="text" name="type" id="type" value={formData.type} onChange={handleChange} required className={inputStyle} placeholder="e.g., Monthly Review"/>
                        {validationErrors.type && <p className="err-msg">{validationErrors.type[0]}</p>}
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="status" className="form-label">Status <span className="text-red-500">*</span></label>
                            <select name="status" id="status" value={formData.status} onChange={handleChange} required className={inputStyle}>
                                {['pending', 'scheduled', 'in_progress', 'completed', 'overdue', 'cancelled'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                            </select>
                            {validationErrors.status && <p className="err-msg">{validationErrors.status[0]}</p>}
                        </div>
                        <div>
                            <label htmlFor="assessment_date" className="form-label">Assessment Date</label>
                            <input type="date" name="assessment_date" id="assessment_date" value={formData.assessment_date} onChange={handleChange} className={inputStyle}/>
                            {validationErrors.assessment_date && <p className="err-msg">{validationErrors.assessment_date[0]}</p>}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="next_review_date" className="form-label">Next Review Date</label>
                        <input type="date" name="next_review_date" id="next_review_date" value={formData.next_review_date} onChange={handleChange} className={inputStyle}/>
                        {validationErrors.next_review_date && <p className="err-msg">{validationErrors.next_review_date[0]}</p>}
                    </div>
                    <div>
                        <label htmlFor="notes" className="form-label">Notes</label>
                        <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className={inputStyle}></textarea>
                        {validationErrors.notes && <p className="err-msg">{validationErrors.notes[0]}</p>}
                    </div>
                    <div>
                        <label htmlFor="recommendations_text" className="form-label">Recommendations (one per line)</label>
                        <textarea name="recommendations_text" id="recommendations_text" value={formData.recommendations_text} onChange={handleChange} rows={3} className={inputStyle}></textarea>
                        {validationErrors.recommendations && <p className="err-msg">{validationErrors.recommendations[0]}</p>}
                    </div>
                     <div>
                        <label htmlFor="details" className="form-label">Additional Details (JSON format)</label>
                        <textarea name="details" id="details" value={formData.details} onChange={handleChange} rows={3} className={inputStyle} placeholder='e.g., {"score": 75, "method": "interview"}'></textarea>
                        {validationErrors.details && <p className="err-msg">{validationErrors.details[0]}</p>}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose} className="secondary-button">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="primary-button">
                            {isSubmitting ? 'Saving...' : (formData.id ? 'Update' : 'Create') + ' Assessment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const AssessmentsPage: React.FC = () => {
    const [assessments, setAssessments] = useState<ApiAssessment[]>([]); // Use ApiAssessment
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<FilterState>(defaultFilterState);
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationMeta, setPaginationMeta] = useState<any>(null);

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingAssessment, setEditingAssessment] = useState<ApiAssessment | null>(null);
    const [availableParolees, setAvailableParolees] = useState<{id: number, name: string}[]>([]);


    const fetchAssessmentsAndParolees = useCallback(async (page = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const params: Record<string, string | number> = { page };
            if (filters.searchParolee) params.parolee_search = filters.searchParolee; // Adjust param name if needed
            if (filters.status) params.status = filters.status;
            if (filters.type) params.type = filters.type;

            const response = await apiClient.get<{data: ApiAssessment[], meta: any, links: any}>(
                '/staff/assessments', { params }
            );
            setAssessments(response.data.data || []);
            setPaginationMeta(response.data.meta);
            setCurrentPage(response.data.meta?.current_page || 1);

            // Fetch parolees for the dropdown if not already fetched
            if(availableParolees.length === 0) {
                const paroleesResponse = await apiClient.get<{data: {id: number, name: string}[]}>('/admin/users?user_type=parolee&per_page=1000'); // Fetch all parolees
                setAvailableParolees(paroleesResponse.data.data.map(p => ({id: p.id, name: p.name})));
            }

        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch assessments.');
            console.error("Fetch assessments error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [filters, availableParolees.length]); // Add availableParolees.length to dependencies

    useEffect(() => {
        fetchAssessmentsAndParolees(currentPage);
    }, [filters, currentPage, fetchAssessmentsAndParolees]); // fetchAssessmentsAndParolees is now stable


    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setCurrentPage(1); // Reset to page 1 on filter change
    };

    const handlePageChange = (newPage: number) => {
        if (paginationMeta && newPage >= 1 && newPage <= paginationMeta.last_page) {
            setCurrentPage(newPage);
        }
    };

    const openAddModal = () => {
        setEditingAssessment(null);
        setShowFormModal(true);
    };

    const openEditModal = (assessment: ApiAssessment) => {
        setEditingAssessment(assessment);
        setShowFormModal(true);
    };
    
    // Helper to safely format dates
    const formatDateSafe = (dateString?: string | null): string => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            return format(date, 'P'); // e.g., MM/dd/yyyy
        } catch { return 'Invalid Date Format'; }
    };


    return (
        <StaffLayout>
            <title>Manage Assessments - Staff Portal</title>
            {/* Add flex-1 and margin-left for sidebar width, plus consistent padding */}
            <div className="flex-1 p-6 ml-64">
                <div className="space-y-8">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                                <ClipboardList size={28} className="mr-3 text-brand-purple-admin" />
                                Assessments Management
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                View, create, and manage parolee assessments.
                            </p>
                        </div>
                        <button 
                            onClick={openAddModal} 
                            className="px-4 py-2 bg-brand-purple-admin text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center text-sm"
                        >
                            <PlusCircle size={18} className="mr-2" /> New Assessment
                        </button>
                    </div>

                    {/* Filters Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <form 
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
                            onSubmit={(e) => { e.preventDefault(); fetchAssessmentsAndParolees(1); }}
                        >
                            <div className="relative">
                                <label htmlFor="searchParolee" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Search Parolee</label>
                                <Search className="absolute left-3 top-7 text-gray-400 dark:text-gray-500" size={18} />
                                <input type="text" name="searchParolee" id="searchParolee" value={filters.searchParolee} onChange={handleFilterChange}
                                    placeholder="Parolee name/ID..." className="input-style w-full pl-10 mt-1" autoComplete="off"/>
                            </div>
                            <div>
                                <label htmlFor="statusFilter" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Status</label>
                                <select name="status" id="statusFilter" value={filters.status} onChange={handleFilterChange} className="input-style w-full mt-1">
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending</option><option value="scheduled">Scheduled</option>
                                    <option value="in_progress">In Progress</option><option value="completed">Completed</option>
                                    <option value="overdue">Overdue</option><option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="typeFilter" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Type</label>
                                <select name="type" id="typeFilter" value={filters.type} onChange={handleFilterChange} className="input-style w-full mt-1">
                                    <option value="">All Types</option>
                                    <option value="Monthly Review">Monthly Review</option>
                                    <option value="Psychological Evaluation">Psychological Evaluation</option>
                                    <option value="Drug Screening">Drug Screening</option>
                                    <option value="Behavioral Risk Assessment">Behavioral Risk Assessment</option>
                                    <option value="Reintegration Plan Update">Reintegration Plan Update</option>
                                </select>
                            </div>
                            <button type="submit" className="primary-button flex items-center justify-center gap-2 text-sm py-2.5">
                                <Filter size={16} /> Filter
                            </button>
                        </form>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-200 p-4 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Main Content Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="th-cell">Parolee</th>
                                        <th className="th-cell">Type</th>
                                        <th className="th-cell">Status</th>
                                        <th className="th-cell">Assessment Date</th>
                                        <th className="th-cell">Next Review</th>
                                        <th className="th-cell">Conducted By</th>
                                        <th className="th-cell text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {isLoading && assessments.length === 0 && (
                                        <tr><td colSpan={7} className="td-cell text-center py-10">Loading assessments...</td></tr>
                                    )}
                                    {!isLoading && assessments.length === 0 && (
                                        <tr><td colSpan={7} className="td-cell text-center py-10">No assessments found.</td></tr>
                                    )}
                                    {!isLoading && assessments.map((assessment) => (
                                        <tr key={assessment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="td-cell font-medium">{assessment.parolee_name || 'N/A'}</td>
                                            <td className="td-cell">{assessment.type}</td>
                                            <td className="td-cell"><span className={`status-badge-${assessment.status} capitalize`}>{assessment.status.replace('_', ' ')}</span></td>
                                            <td className="td-cell">{formatDateSafe(assessment.assessment_date)}</td>
                                            <td className="td-cell">{formatDateSafe(assessment.next_review_date)}</td>
                                            <td className="td-cell">{assessment.conductor_name || 'N/A'}</td>
                                            <td className="td-cell text-right space-x-2">
                                                <button onClick={() => openEditModal(assessment)} className="icon-button text-blue-600 dark:text-blue-400" title="Edit"><Edit size={16} /></button>
                                                {/* <button className="icon-button text-gray-500" title="View Details"><ViewIcon size={16} /></button> */}
                                                {/* TODO: Add delete assessment functionality */}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {paginationMeta && paginationMeta.last_page > 1 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                            <div className="py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-2 mt-4">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading} className="pagination-button">Previous</button>
                                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === paginationMeta.last_page || isLoading} className="pagination-button">Next</button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div><p className="text-xs text-gray-700 dark:text-gray-300">Showing <span className="font-medium">{paginationMeta.from}</span> to <span className="font-medium">{paginationMeta.to}</span> of <span className="font-medium">{paginationMeta.total}</span> results</p></div>
                                    <div><nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading} className="pagination-button rounded-l-md text-xs px-3 py-1.5">Previous</button>
                                        <span className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400">Page {currentPage} of {paginationMeta.last_page}</span>
                                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === paginationMeta.last_page || isLoading} className="pagination-button rounded-r-md text-xs px-3 py-1.5">Next</button>
                                    </nav></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal */}
                    {showFormModal && (
                        <AssessmentFormModal
                            isOpen={showFormModal}
                            onClose={() => { setShowFormModal(false); setEditingAssessment(null); }}
                            onSubmitSuccess={() => { 
                                fetchAssessmentsAndParolees(currentPage); 
                                setShowFormModal(false); 
                                setEditingAssessment(null);
                            }}
                            initialData={editingAssessment}
                            availableParolees={availableParolees}
                        />
                    )}
                </div>
            </div>
        </StaffLayout>
    );
};

export default AssessmentsPage;