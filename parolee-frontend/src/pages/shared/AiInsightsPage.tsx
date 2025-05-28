/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/shared/AiInsightsPage.tsx
import React, { useEffect, useState, useCallback, type FormEvent } from 'react';
import apiClient from '../../services/api';
import { Link } from 'react-router-dom'; // For potential links to parolee details
import { Brain, TrendingUp, AlertTriangle, Users, BarChart3, FileText, Activity, Search, Filter as FilterIcon, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

// --- Interfaces (ensure these match your API response from AiDataController) ---
interface RiskAssessmentData {
    id: string;
    parolee_id: string | number; // Added for linking
    parolee_name: string;
    risk_score: number;
    risk_level: 'Low' | 'Medium' | 'High' | 'Critical' | string; // Allow string for flexibility
    last_assessed: string;
    key_factors: string[];
    recommendation: string;
}
interface RecidivismPredictionData {
    id: string;
    parolee_id: string | number; // Added for linking
    parolee_name: string;
    probability: number;
    timeframe: string;
    confidence: string;
}
interface CrimeTrendData {
    id: string;
    area: string;
    trend: string;
    source: string;
}
interface AiSummaryData {
    total_parolees_assessed: number;
    average_risk_score: number;
    high_risk_predictions: number;
}
interface PaginationMeta { // Standard Laravel pagination meta
    current_page: number; from: number; last_page: number; total: number; per_page: number;
}
interface AiInsightsApiResponse {
    // Risk assessments might be paginated if there are many
    risk_assessments: { data: RiskAssessmentData[]; meta: PaginationMeta; links: any; };
    recidivism_predictions: RecidivismPredictionData[]; // Assuming not paginated for this example
    crime_trends: CrimeTrendData[];                     // Assuming not paginated
    summary: AiSummaryData;
}

const iconMapAi: { [key: string]: React.ElementType } = { Users, BarChart3, AlertTriangle, TrendingUp, FileText, Activity };

const RiskScoreBadge: React.FC<{ score: number, level: string }> = ({ score, level }) => {
    let colorClasses = 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200';
    const lowerLevel = level.toLowerCase();
    if (lowerLevel === 'low') colorClasses = 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
    else if (lowerLevel === 'medium') colorClasses = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
    else if (lowerLevel === 'high' || lowerLevel === 'critical') colorClasses = 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300';

    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colorClasses} capitalize`}>{level} ({score})</span>;
};

const AiInsightsPage: React.FC = () => {
    const { hasRole } = useAuth();
    
    const getPortalPrefix = () => {
        if (hasRole('System Administrator')) return 'admin';
        if (hasRole('Parole Officer')) return 'officer';
        if (hasRole('Case Manager') || hasRole('Support Staff')) return 'staff';
        return '';
    };

    const [insightsData, setInsightsData] = useState<Omit<AiInsightsApiResponse, 'risk_assessments'> | null>(null);
    const [riskAssessments, setRiskAssessments] = useState<RiskAssessmentData[]>([]);
    const [riskAssessmentsPagination, setRiskAssessmentsPagination] = useState<PaginationMeta | null>(null);
    const [riskCurrentPage, setRiskCurrentPage] = useState(1);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState({
        searchParolee: '',
        riskLevel: '',
    });

    const fetchAiInsights = useCallback(async (page = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            if (filters.searchParolee) params.append('search_parolee', filters.searchParolee);
            if (filters.riskLevel) params.append('risk_level', filters.riskLevel);

            const response = await apiClient.get<AiInsightsApiResponse>(`/ai-insights-overview?${params.toString()}`);
            setInsightsData({ // Store non-paginated parts
                summary: response.data.summary,
                recidivism_predictions: response.data.recidivism_predictions,
                crime_trends: response.data.crime_trends,
            });
            setRiskAssessments(response.data.risk_assessments.data);
            setRiskAssessmentsPagination(response.data.risk_assessments.meta);
            setRiskCurrentPage(response.data.risk_assessments.meta.current_page);

        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load AI insights.");
            console.error("AI Insights Fetch Error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAiInsights(riskCurrentPage);
    }, [fetchAiInsights, riskCurrentPage]); // Re-fetch when page changes

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setRiskCurrentPage(1); // Reset to page 1 on filter change
    };
    
    const handleRiskPageChange = (newPage: number) => {
        if (riskAssessmentsPagination && newPage >= 1 && newPage <= riskAssessmentsPagination.last_page) {
            setRiskCurrentPage(newPage);
        }
    };


    if (isLoading && !insightsData) return <div className="p-6 text-center">Loading AI Insights...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
    if (!insightsData) return <div className="p-6 text-center">No AI insights data available.</div>;

    const { summary, recidivism_predictions, crime_trends } = insightsData;

    const summaryCards = [
        {label: "Total Assessed", value: summary.total_parolees_assessed, iconName: "Users"},
        {label: "Avg. Risk Score", value: summary.average_risk_score.toFixed(1), iconName: "BarChart3"},
        {label: "High Risk Predictions", value: summary.high_risk_predictions, iconName: "AlertTriangle"},
    ];

    return (
        <>
            <title>AI Insights - Parole Monitoring</title>
            <div className="space-y-8 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <Brain size={28} className="mr-3 text-brand-purple-admin"/>AI Insights & Reports
                    </h1>
                    {/* TODO: Global filters for the page, e.g., date range for all sections */}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {summaryCards.map(card => {
                        const Icon = iconMapAi[card.iconName] || Activity;
                        return (
                        <div key={card.label} className="bg-white dark:bg-brand-gray-admin-card p-5 rounded-xl shadow-lg">
                            <div className="flex items-center space-x-3">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex-shrink-0">
                                     <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400"/>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                                    <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{card.value}</p>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>

                {/* Risk Assessments Section */}
                <section className="bg-white dark:bg-brand-gray-admin-card p-4 sm:p-6 rounded-xl shadow-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Risk Assessments</h2>
                        <form onSubmit={(e)=>{e.preventDefault(); fetchAiInsights(1);}} className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                            <input type="text" name="searchParolee" placeholder="Search Parolee..." value={filters.searchParolee} onChange={handleFilterChange} className="input-style text-sm py-1.5"/>
                            <select name="riskLevel" value={filters.riskLevel} onChange={handleFilterChange} className="input-style text-sm py-1.5">
                                <option value="">All Risk Levels</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                            <button type="submit" className="primary-button text-sm py-1.5 px-3"><FilterIcon size={16} className="mr-1"/>Filter</button>
                        </form>
                    </div>
                    {isLoading && riskAssessments.length === 0 ? <p className="text-center py-4">Loading assessments...</p> :
                     !isLoading && riskAssessments.length === 0 ? <p className="text-center py-4 text-gray-500 dark:text-gray-400">No risk assessments match your criteria.</p> :
                    (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {riskAssessments.map(assessment => (
                            <div key={assessment.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-700">
                                <div className="flex justify-between items-start mb-1.5">
                                    <Link 
                                        to={`/${getPortalPrefix()}/user-management?parolee_id=${assessment.parolee_id}`} 
                                        className="font-semibold text-gray-800 dark:text-gray-100 hover:underline"
                                    >
                                        {assessment.parolee_name}
                                    </Link>
                                    <RiskScoreBadge score={assessment.risk_score} level={assessment.risk_level} />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Last Assessed: {format(new Date(assessment.last_assessed), 'P')}</p>
                                <div className="mt-2">
                                    <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300">Key Factors:</h4>
                                    <ul className="list-disc list-inside pl-4 text-xs text-gray-500 dark:text-gray-400 max-h-20 overflow-y-auto custom-scrollbar">
                                        {assessment.key_factors.map((factor, i) => <li key={i} className="truncate" title={factor}>{factor}</li>)}
                                    </ul>
                                </div>
                                <div className="mt-2">
                                    <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300">Recommendation:</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={assessment.recommendation}>{assessment.recommendation}</p>
                                </div>
                                {/* <Link to={`/${portalType}/assessments/${assessment.id}`} className="text-xs text-brand-purple-admin hover:underline mt-2 inline-flex items-center">Full Report <ExternalLink size={12} className="ml-1"/></Link> */}
                            </div>
                        ))}
                    </div>)}
                     {/* Pagination for Risk Assessments */}
                    {riskAssessmentsPagination && riskAssessmentsPagination.last_page > 1 && (
                        <div className="mt-4 flex justify-end items-center text-xs">
                            <button onClick={() => handleRiskPageChange(riskCurrentPage - 1)} disabled={riskCurrentPage === 1 || isLoading} className="pagination-button px-2 py-1"><ChevronLeft size={14}/> Prev</button>
                            <span className="px-3 py-1">Page {riskCurrentPage} of {riskAssessmentsPagination.last_page}</span>
                            <button onClick={() => handleRiskPageChange(riskCurrentPage + 1)} disabled={riskCurrentPage === riskAssessmentsPagination.last_page || isLoading} className="pagination-button px-2 py-1">Next <ChevronRight size={14}/></button>
                        </div>
                    )}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <section className="bg-white dark:bg-brand-gray-admin-card p-4 sm:p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Recidivism Predictions</h2>
                        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                            {recidivism_predictions.length > 0 ? recidivism_predictions.map(pred => (
                                <div key={pred.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border-l-4 border-indigo-500">
                                    <Link 
                                        to={`/${getPortalPrefix()}/user-management?parolee_id=${pred.parolee_id}`} 
                                        className="font-medium text-sm text-gray-800 dark:text-gray-100 hover:underline"
                                    >
                                        {pred.parolee_name}
                                    </Link>:
                                    <span className="ml-1 font-bold text-indigo-600 dark:text-indigo-400">{(pred.probability * 100).toFixed(0)}%</span> risk ({pred.timeframe})
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Confidence: {pred.confidence}</p>
                                </div>
                            )) : <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No recidivism predictions.</p>}
                        </div>
                    </section>
                    <section className="bg-white dark:bg-brand-gray-admin-card p-4 sm:p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Crime Trends</h2>
                        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                            {crime_trends.length > 0 ? crime_trends.map(trend => (
                                <div key={trend.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                    <p className="font-medium text-sm text-gray-800 dark:text-gray-100">{trend.area}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-300">{trend.trend} <span className="italic text-gray-400">({trend.source})</span></p>
                                </div>
                            )) : <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No crime trend data.</p>}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
};

export default AiInsightsPage;