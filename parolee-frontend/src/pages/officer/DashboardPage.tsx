// src/pages/officer/DashboardPage.tsx
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useEffect, useState, useMemo } from 'react';
import OfficerLayout from '../../layouts/OfficerLayout';
import apiClient from '../../services/api';
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { UserCheck, AlertTriangle, Bell, ShieldCheck, HeartPulse, Thermometer, Gauge, BrainCircuit, MapPin, Activity } from 'lucide-react';

// Leaflet Icon Fix
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// --- Interfaces (can be moved to types/api.ts if shared) ---
interface OfficerSummaryCard { label: string; value: string | number; icon: string; }
interface OfficerAlert { id: string | number; parolee_name: string; message: string; type: string; timestamp: string; }
interface OfficerGpsParolee { id: string | number; name: string; lat: number; lng: number; status: string; last_seen: string | null; }
interface OfficerLiveGpsData { map_center: { lat: number; lng: number }; zoom_level: number; parolees: OfficerGpsParolee[]; }
interface OfficerChartDataset { label: string; data: number[]; borderColor: string; icon: string; }
interface OfficerChartsData { labels: string[]; datasets: OfficerChartDataset[]; }
interface OfficerDashboardApiResponse {
    summary_cards: OfficerSummaryCard[];
    recent_alerts: OfficerAlert[];
    live_gps_data: OfficerLiveGpsData;
    charts_data: OfficerChartsData;
}

const iconMap: { [key: string]: React.ElementType } = {
    UserCheck, AlertTriangle, Bell, ShieldCheck, HeartPulse, Thermometer, Gauge, BrainCircuit, MapPin, Activity
};

const OfficerChart: React.FC<{ title: string; labels: string[]; dataset: OfficerChartDataset }> = ({ title, labels, dataset }) => {
    const ChartIconComponent = iconMap[dataset.icon] || Activity;
    const chartDataConfig = { labels, datasets: [{ ...dataset, backgroundColor: `${dataset.borderColor}20`, fill: true, tension: 0.3, pointRadius: 0, borderWidth: 1.5 }] };
    const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { mode: 'index' as const, intersect: false } }, scales: { /* ... simplified scales ... */ x:{ticks:{display:false}, grid:{display:false}}, y:{ticks:{display:false}, grid:{display:false}} } };
    return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                <ChartIconComponent className="w-4 h-4 mr-1.5" style={{ color: dataset.borderColor }} />
                {title}
            </div>
            <div className="h-32 w-full"><Line options={chartOptions} data={chartDataConfig} /></div>
        </div>
    );
};


const OfficerDashboardPage: React.FC = () => {
    const [dashboardData, setDashboardData] = useState<OfficerDashboardApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true); setError(null);
                const response = await apiClient.get<OfficerDashboardApiResponse>('/officer/dashboard-overview');
                setDashboardData(response.data);
            } catch (err) {
                setError('Failed to load officer dashboard data.'); console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <OfficerLayout><div className="p-6 text-center">Loading Officer Dashboard...</div></OfficerLayout>;
    if (error) return <OfficerLayout><div className="p-6 text-center text-red-500">{error}</div></OfficerLayout>;
    if (!dashboardData) return <OfficerLayout><div className="p-6 text-center">No data available.</div></OfficerLayout>;

    const { summary_cards, recent_alerts, live_gps_data, charts_data } = dashboardData;
    const healthMetricsCharts = charts_data.datasets.slice(0, 2);
    const additionalMetricsCharts = charts_data.datasets.slice(2, 4);

    return (
        <OfficerLayout>
            <title>Law Enforcement Dashboard</title>
            <div className="space-y-6"> {/* Removed p-6 from here, OfficerLayout's main has it */}
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Law Enforcement Dashboard</h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {summary_cards.map((card, index) => {
                        const Icon = iconMap[card.icon] || ShieldCheck;
                        return (
                            <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center space-x-3">
                                <div className={`p-2.5 rounded-lg ${ {UserCheck:'bg-green-100 dark:bg-green-900/50', AlertTriangle:'bg-red-100 dark:bg-red-900/50', Bell:'bg-yellow-100 dark:bg-yellow-900/50', ShieldCheck:'bg-blue-100 dark:bg-blue-900/50'}[card.icon] || 'bg-gray-100'}`}>
                                    <Icon className={`w-5 h-5 ${ {UserCheck:'text-green-600', AlertTriangle:'text-red-600', Bell:'text-yellow-600', ShieldCheck:'text-blue-600'}[card.icon] || 'text-gray-600'}`} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                                    <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{card.value}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Live GPS Location</h2>
                            <div className="bg-gray-200 dark:bg-gray-700 rounded-md h-72 overflow-hidden relative">
                                {live_gps_data?.map_center ? (
                                    <MapContainer center={[live_gps_data.map_center.lat, live_gps_data.map_center.lng]} zoom={live_gps_data.zoom_level || 12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                                        {live_gps_data.parolees.map(p => (
                                            <Marker key={p.id} position={[p.lat, p.lng]}><Popup>{p.name}<br/>{p.last_seen ? format(new Date(p.last_seen), 'Pp') : 'N/A'}</Popup></Marker>
                                        ))}
                                    </MapContainer>
                                ) : <div className="flex items-center justify-center h-full"><p className="text-gray-500">Map data loading...</p></div>}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Health Metrics</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {healthMetricsCharts.map(ds => <OfficerChart key={ds.label} title={ds.label} labels={charts_data.labels} dataset={ds} />)}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Recent Alerts</h2>
                            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                                {recent_alerts.length > 0 ? recent_alerts.map(alert => (
                                    <div key={alert.id} className={`p-2.5 rounded-md border-l-4 ${alert.type.includes('geofence') ? 'border-red-500 bg-red-50 dark:bg-red-900/40' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/40'}`}>
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{alert.parolee_name} - {alert.type.replace('_', ' ')}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={alert.message}>{alert.message}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">{alert.timestamp}</p>
                                    </div>
                                )) : <p className="text-xs text-gray-500 text-center py-4">No recent alerts.</p>}
                            </div>
                        </div>
                         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Additional Metrics</h2>
                            <div className="space-y-4">
                                {additionalMetricsCharts.map(ds => <OfficerChart key={ds.label} title={ds.label} labels={charts_data.labels} dataset={ds} />)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </OfficerLayout>
    );
};
export default OfficerDashboardPage;