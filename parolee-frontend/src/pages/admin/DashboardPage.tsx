// src/pages/admin/DashboardPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
// import { Head } from '@inertiajs/react'; // If using Inertia, otherwise use React Helmet or similar for <title>
import apiClient from '../../services/api'; // Your API client
import AdminLayout from '../../layouts/AdminLayout'; // Your Admin Layout

import {
    Users, AlertTriangle, HeartPulse, MapPinOff, Thermometer, Gauge, BrainCircuit, Activity,
    MessageSquare, Bell, MapPin as MapPinIcon // Renamed to avoid conflict with Map component
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns'; // For formatting dates
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet's default icon issue with bundlers
import L from 'leaflet';
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// --- Interfaces for API Data ---
interface SummaryCardApiData {
    label: string;
    value: number | string;
    icon: string; // Icon name string from backend
}
interface AlertApiData {
    id: string;
    title: string;
    description: string;
    type: string; // e.g., 'geofence', 'health'
    timestamp: string;
    severity: string; // e.g., 'high', 'medium', 'low'
}
interface ChartDatasetApi {
    label: string;
    data: number[];
    borderColor: string;
    icon: string;
}
interface ChartsApiData {
    labels: string[];
    datasets: ChartDatasetApi[];
}
interface GpsParoleeApi {
    id: string;
    name: string;
    lat: number;
    lng: number;
    status: string;
    last_seen: string;
}
interface LiveGpsApiData {
    map_center: { lat: number; lng: number };
    zoom_level: number;
    parolees: GpsParoleeApi[];
}
interface SystemLog {
    message: string;
    timestamp: string;
}
interface DashboardApiResponse {
    summary_cards: SummaryCardApiData[];
    recent_alerts: AlertApiData[];
    charts_data: ChartsApiData;
    live_gps_data: LiveGpsApiData;
    system_logs: SystemLog[];
}

// --- Icon Mapping ---
const iconMap: { [key: string]: React.ElementType } = {
    Users, AlertTriangle, HeartPulse, MapPinOff, Thermometer, Gauge, BrainCircuit, Activity,
    MessageSquare, Bell, MapPin: MapPinIcon // Use aliased MapPinIcon
};

// --- Reusable Chart Component (Adapted from your previous one) ---
interface HealthMetricsChartProps {
    title: string;
    labels: string[];
    dataset: ChartDatasetApi; // Use the API dataset structure
    // Remove min/max/unit from here, get them from dataset or define statically if needed
}

const HealthMetricsChart: React.FC<HealthMetricsChartProps> = ({ title, labels, dataset }) => {
    const ChartIconComponent = iconMap[dataset.icon] || Activity;

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: dataset.label,
                data: dataset.data,
                borderColor: dataset.borderColor,
                backgroundColor: `${dataset.borderColor}20`, // Basic opacity (hex #RRGGBBAA or rgba)
                fill: true,
                tension: 0.3,
                pointRadius: 2,
                pointHoverRadius: 4,
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { mode: 'index' as const, intersect: false },
        },
        scales: {
            y: {
                // beginAtZero: false, // Let Chart.js decide or configure based on data
                ticks: { color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280', font: { size: 10 } },
                grid: { color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB' },
            },
            x: {
                ticks: { color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280', font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 7 },
                grid: { display: false },
            },
        },
        interaction: { intersect: false, mode: 'index' as const },
    };

    return (
        <div className="bg-white dark:bg-brand-gray-admin-card p-4 rounded-xl shadow-lg">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                <ChartIconComponent className="w-5 h-5 mr-2" style={{ color: dataset.borderColor }} />
                {title}
            </div>
            <div className="h-64 md:h-48"> {/* Adjusted height for different layouts */}
                {dataset.data && dataset.data.length > 0 ? (
                    <Line options={options} data={chartData} />
                ) : (
                    <p className="text-gray-400 dark:text-gray-500 text-xs flex items-center justify-center h-full">No data.</p>
                )}
            </div>
        </div>
    );
};


// --- Main Dashboard Page Component ---
const DashboardPage: React.FC = () => {
    const [dashboardData, setDashboardData] = useState<DashboardApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Your mock chat messages and restricted zones (can be kept for now or moved to API)
    const mockChatMessages = [ /* ... your mockChatMessages ... */ ];
    const restrictedZones = [ /* ... your restrictedZones ... */ ];


    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await apiClient.get<DashboardApiResponse>('/admin/dashboard-overview');
                setDashboardData(response.data);
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                setError('Failed to load dashboard. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <AdminLayout><div className="p-6 text-center">Loading dashboard data...</div></AdminLayout>;
    }
    if (error) {
        return <AdminLayout><div className="p-6 text-center text-red-500">{error}</div></AdminLayout>;
    }
    if (!dashboardData) {
        return <AdminLayout><div className="p-6 text-center">No dashboard data available.</div></AdminLayout>;
    }

    const { summary_cards, recent_alerts, charts_data, live_gps_data } = dashboardData;

    // Splitting chart datasets for layout
    const healthMetricsCharts = charts_data.datasets.filter(ds => ds.label.includes('Heart Rate') || ds.label.includes('Temperature'));
    const additionalMetricsCharts = charts_data.datasets.filter(ds => ds.label.includes('Blood Pressure') || ds.label.includes('Stress Level'));


    return (
        <AdminLayout>
            {/* <Head title="Admin Dashboard" /> */}
            <title>Admin Dashboard - Parole Monitoring</title>

            <div className="flex-1 p-6 ml-64"> {/* Add margin-left to account for sidebar width */}
                <div className="space-y-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Dashboard Overview</h1>

                    {/* Top Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {summary_cards.map((card, index) => {
                            const IconComponent = iconMap[card.icon] || Activity;
                            const colors = {
                                Users: { bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-600 dark:text-indigo-400' },
                                AlertTriangle: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-600 dark:text-yellow-400' },
                                HeartPulse: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-600 dark:text-red-400' },
                                MapPinOff: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-600 dark:text-purple-400' },
                            }[card.icon] || { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' };

                            return (
                                <div key={card.label + index} className="bg-white dark:bg-brand-gray-admin-card p-6 rounded-xl shadow-lg flex items-center space-x-4">
                                    <div className={`p-3 rounded-full ${colors.bg} flex-shrink-0`}>
                                        <IconComponent className={`w-6 h-6 ${colors.text}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                                        <p className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{card.value}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Main Dashboard Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Live GPS & Health Metrics */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white dark:bg-brand-gray-admin-card p-6 rounded-xl shadow-lg">
                                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Live GPS Location</h2>
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-80 overflow-hidden">
                                    {live_gps_data && live_gps_data.map_center ? (
                                        <MapContainer
                                            center={[live_gps_data.map_center.lat, live_gps_data.map_center.lng]}
                                            zoom={live_gps_data.zoom_level || 12}
                                            style={{ height: '100%', width: '100%' }}
                                            scrollWheelZoom={false}
                                        >
                                            <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            />
                                            {live_gps_data.parolees.map(p => (
                                                <Marker key={p.id} position={[p.lat, p.lng]}>
                                                    <Popup>
                                                        <b>{p.name}</b> (ID: {p.id})<br />
                                                        Status: {p.status}<br />
                                                        Last seen: {format(new Date(p.last_seen), 'Pp')}
                                                    </Popup>
                                                </Marker>
                                            ))}
                                            {/* You can map restrictedZones here if they come from API or are static */}
                                        </MapContainer>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center h-full">Map Data Unavailable</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-brand-gray-admin-card p-6 rounded-xl shadow-lg">
                                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-1">Health Metrics</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    {healthMetricsCharts.map(dataset => (
                                        <HealthMetricsChart
                                            key={dataset.label}
                                            title={dataset.label}
                                            labels={charts_data.labels}
                                            dataset={dataset}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Alerts & Additional Metrics */}
                        <div className="lg:col-span-1 space-y-8">
                            <div className="bg-white dark:bg-brand-gray-admin-card p-6 rounded-xl shadow-lg">
                                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Recent Alerts</h2>
                                <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar"> {/* Adjusted max-height */}
                                    {recent_alerts && recent_alerts.length > 0 ? recent_alerts.map(alert => {
                                        const AlertTypeIcon = alert.type.includes('geofence') ? MapPinIcon : alert.type.includes('health') ? HeartPulse : AlertTriangle;
                                        const severityClasses = {
                                            high: 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300',
                                            critical: 'bg-red-100 dark:bg-red-800/50 border-red-700 text-red-800 dark:text-red-200',
                                            medium: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-300',
                                            low: 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300',
                                        }[alert.severity] || 'bg-gray-50 dark:bg-gray-700/30 border-gray-500 text-gray-700 dark:text-gray-300';

                                        return (
                                            <div key={alert.id} className={`flex items-start space-x-3 p-3 rounded-lg border-l-4 ${severityClasses}`}>
                                                <div className="flex-shrink-0 pt-0.5"><AlertTypeIcon className="w-5 h-5" /></div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium ">{alert.title}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{alert.description}</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{format(new Date(alert.timestamp), 'Pp')}</p>
                                                </div>
                                            </div>
                                        );
                                    }) : <p className="text-sm text-gray-500 dark:text-gray-400 p-3 text-center">No recent alerts.</p>}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-brand-gray-admin-card p-6 rounded-xl shadow-lg">
                                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-1">Additional Metrics</h2>
                                <div className="space-y-6 mt-4">
                                    {additionalMetricsCharts.map(dataset => (
                                         <HealthMetricsChart
                                            key={dataset.label}
                                            title={dataset.label}
                                            labels={charts_data.labels}
                                            dataset={dataset}
                                        />
                                    ))}
                                </div>
                            </div>
                             {/* Chat Panel - Kept with mock data for now */}
                            {/* <ChatPanel /> */}
                        </div>
                    </div>

                    
                </div>
            </div>
        </AdminLayout>
    );
};

export default DashboardPage;