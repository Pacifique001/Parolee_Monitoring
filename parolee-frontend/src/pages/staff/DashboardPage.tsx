// src/pages/staff/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import StaffLayout from '../../layouts/StaffLayout';
import apiClient from '../../services/api';
import { Users, ClipboardList, AlertTriangle, CheckCircle, MessageSquare as MessageIcon } from 'lucide-react';

interface StaffSummaryCard {
    label: string;
    value: string | number;
    icon: string;
}

interface RecentAssessment {
    id: string | number;
    parolee_name: string;
    assessment_title: string;
    status_text: string;
    last_assessment_date: string;
    next_review_date: string;
    case_number: string;
    risk_level: string;
    parolee_id: string | number;
}

interface RecentNotification {
    id: string;
    message: string;
    time_ago: string;
    type: string;
}

interface StaffDashboardApiResponse {
    welcome_message: string;
    summary_cards: StaffSummaryCard[];
    recent_assessments: RecentAssessment[];
    recent_notifications: RecentNotification[];
}

const iconMap: { [key: string]: React.ElementType } = {
    Users,
    ClipboardList,
    AlertTriangle,
    CheckCircle,
    MessageIcon,
};

const RiskBadge: React.FC<{ riskLevel: string }> = ({ riskLevel }) => {
    let colorClasses = 'bg-gray-100 text-gray-700';
    switch (riskLevel?.toLowerCase()) {
        case 'low':
            colorClasses = 'bg-green-100 text-green-700';
            break;
        case 'medium':
            colorClasses = 'bg-yellow-100 text-yellow-700';
            break;
        case 'high':
        case 'critical':
            colorClasses = 'bg-red-100 text-red-700';
            break;
    }
    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colorClasses} capitalize`}>
            {riskLevel || 'Unknown'}
        </span>
    );
};

const StaffDashboardPage: React.FC = () => {
    const [dashboardData, setDashboardData] = useState<StaffDashboardApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await apiClient.get<StaffDashboardApiResponse>('/staff/dashboard-overview');
                setDashboardData(response.data);
            } catch (err) {
                setError('Failed to load staff dashboard data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading)
        return (
            <StaffLayout>
                <div className="p-6 text-center">Loading Staff Dashboard...</div>
            </StaffLayout>
        );
    if (error)
        return (
            <StaffLayout>
                <div className="p-6 text-center text-red-500">{error}</div>
            </StaffLayout>
        );
    if (!dashboardData)
        return (
            <StaffLayout>
                <div className="p-6 text-center">No data available for staff dashboard.</div>
            </StaffLayout>
        );

    const { welcome_message, summary_cards, recent_assessments, recent_notifications } = dashboardData;

    return (
        <StaffLayout>
            <title>Rehabilitation Staff Dashboard</title>
            {/* Add flex-1 and margin-left for sidebar width, plus consistent padding */}
            <div className="flex-1 p-6 ml-64">
                <div className="space-y-8">
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                        Rehabilitation Staff Dashboard
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{welcome_message}</p>

                    {/* Summary Cards - Adjusted grid spacing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {summary_cards.map((card, index) => {
                            const Icon = iconMap[card.icon] || Users;
                            const colors = {
                                Users: { bg: 'bg-indigo-100 dark:bg-indigo-900/50', text: 'text-indigo-600 dark:text-indigo-400' },
                                ClipboardList: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-600 dark:text-blue-400' },
                                AlertTriangle: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-600 dark:text-red-400' },
                            }[card.icon] || { bg: 'bg-gray-100 dark:bg-gray-700/50', text: 'text-gray-600 dark:text-gray-400' };
                            return (
                                <div
                                    key={index}
                                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4"
                                >
                                    <div className={`p-3 rounded-full ${colors.bg} flex-shrink-0`}>
                                        <Icon className={`w-6 h-6 ${colors.text}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Assessments - Takes up 2 columns on large screens */}
                        <div className="lg:col-span-2">
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                Recent Assessments
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {recent_assessments.map((assessment) => (
                                    <div key={assessment.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                                                {assessment.parolee_name}
                                            </h3>
                                            <RiskBadge riskLevel={assessment.risk_level} />
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            {assessment.assessment_title}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Status: <span className="font-medium">{assessment.status_text}</span>
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Last: {assessment.last_assessment_date}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Next: {assessment.next_review_date}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Case #: {assessment.case_number}
                                        </p>
                                        <a
                                            href={`/staff/parolees/${assessment.parolee_id}/assessments/${assessment.id}`}
                                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block"
                                        >
                                            View details
                                        </a>
                                    </div>
                                ))}
                                {recent_assessments.length === 0 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 md:col-span-3 text-center py-4">
                                        No recent assessments.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Recent Notifications - Takes up 1 column */}
                        <div className="lg:col-span-1">
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
                                Recent Notifications
                            </h2>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                                <div className="p-4 space-y-3 max-h-[32rem] overflow-y-auto custom-scrollbar">
                                    {recent_notifications.map((notification) => {
                                        const NotifIcon =
                                            notification.type === 'assessment_completed'
                                                ? CheckCircle
                                                : notification.type === 'new_message'
                                                ? MessageIcon
                                                : AlertTriangle;
                                        const iconColor =
                                            notification.type === 'assessment_completed'
                                                ? 'text-green-500'
                                                : notification.type === 'new_message'
                                                ? 'text-blue-500'
                                                : 'text-yellow-500';
                                        return (
                                            <div
                                                key={notification.id}
                                                className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md"
                                            >
                                                <NotifIcon size={20} className={`mr-3 flex-shrink-0 ${iconColor}`} />
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-700 dark:text-gray-200">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {notification.time_ago}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {recent_notifications.length === 0 && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                            No recent notifications.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </StaffLayout>
    );
};

export default StaffDashboardPage;