/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/shared/IotMonitoringPage.tsx
import React, { useEffect, useState, useCallback, useMemo, type FormEvent } from 'react';
import apiClient from '../../services/api';
import {
    Activity as IotIcon, BatteryCharging, Wifi, AlertCircle, Search, Filter as FilterIcon,
    Thermometer, Heart, Zap, Layers, RotateCcw, ChevronLeft, ChevronRight, Users,
    Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// Register Chart.js components (if not done globally)
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// --- Interfaces (should align with your API response) ---
interface DeviceSummary {
    total_devices: number;
    active_devices: number;
    inactive_devices: number;
    low_battery_devices: number;
}
interface CriticalMetric {
    id: string | number; // Changed to string for consistency with API
    parolee_name: string;
    device_eui: string;
    metric: string;
    timestamp: string;
}
interface ActiveDevice {
    id: number;
    device_eui: string;
    name?: string;
    type: string;
    status: string;
    battery_level?: number | null;
    last_seen_at?: string | null;
    parolee?: { id: number; name: string; email?: string }; // Added email for potential link
}
interface IotChartDataset { label: string; data: number[]; borderColor: string; icon: string; }
interface IotChartsData { labels: string[]; datasets: IotChartDataset[]; }

interface PaginationMeta {
    current_page: number;
    from: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
    path: string;
    per_page: number;
    to: number;
    total: number;
}
interface ActiveDevicesPaginatedResponse {
    data: ActiveDevice[];
    links: { first?: string; last?: string; prev?: string | null; next?: string | null; };
    meta: PaginationMeta;
}
interface IotMonitoringApiResponse {
    device_summary: DeviceSummary;
    recent_critical_metrics: CriticalMetric[];
    active_devices_list: ActiveDevicesPaginatedResponse;
    overview_charts_data: IotChartsData;
}

const iconMapIot: { [key: string]: React.ElementType } = { Users, BatteryCharging, Wifi, Thermometer, Heart, Zap, AlertCircle, Activity };

// --- Reusable IoT Metric Chart ---
const IotMetricChart: React.FC<{ title: string; labels: string[]; dataset: IotChartDataset }> = ({ title, labels, dataset }) => {
    const ChartIconComponent = iconMapIot[dataset.icon] || Zap;
    const chartDataConfig = {
        labels,
        datasets: [{
            label: dataset.label,
            data: dataset.data,
            borderColor: dataset.borderColor,
            backgroundColor: `${dataset.borderColor}30`, // Adjusted opacity
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 3,
            borderWidth: 1.5,
        }]
    };
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : '#fff',
                titleColor: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
                bodyColor: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151',
                borderColor: document.documentElement.classList.contains('dark') ? '#4b5563' : '#e5e7eb',
                borderWidth: 1,
            }
        },
        scales: {
            y: {
                ticks: { color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280', font: { size: 9 } },
                grid: { color: document.documentElement.classList.contains('dark') ? '#4b5563' : '#f3f4f6' }
            },
            x: {
                ticks: { color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280', font: { size: 9 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
                grid: { display: false }
            }
        }
    };

     if (!dataset.data || dataset.data.length === 0) {
        return (
            <div className="bg-white dark:bg-brand-gray-admin-card p-3 rounded-lg shadow h-40 flex flex-col">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <ChartIconComponent className="w-4 h-4 mr-1.5" style={{color: dataset.borderColor}} />{title}
                </div>
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-gray-400 dark:text-gray-500 text-xs">No data available.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-brand-gray-admin-card p-3 rounded-lg shadow h-40 flex flex-col"> {/* Fixed height for consistency */}
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                <ChartIconComponent className="w-4 h-4 mr-1.5" style={{color: dataset.borderColor}} />{title}
            </div>
            <div className="flex-grow"><Line options={chartOptions} data={chartDataConfig} /></div>
        </div>
    );
};

// --- Main IoT Monitoring Page Component ---
const IotMonitoringPage: React.FC = () => {
    const [iotData, setIotData] = useState<IotMonitoringApiResponse | null>(null);
    const [activeDevices, setActiveDevices] = useState<ActiveDevice[]>([]);
    const [devicesPagination, setDevicesPagination] = useState<PaginationMeta | null>(null);
    const [devicesCurrentPage, setDevicesCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingDevices, setIsLoadingDevices] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        type: '',
    });

    const fetchDashboardData = useCallback(async () => {
        // This fetches the overview (summary cards, critical metrics, overview charts)
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiClient.get<IotMonitoringApiResponse>(
                '/iot-monitoring-overview'
            );
            setIotData(response.data);
            setActiveDevices(response.data.active_devices_list.data);
            setDevicesPagination(response.data.active_devices_list.meta);
            setDevicesCurrentPage(response.data.active_devices_list.meta.current_page);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load initial IoT monitoring data.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchActiveDevices = useCallback(async (page = 1) => {
        setIsLoadingDevices(true); // Separate loading state for the device list
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('per_page', '7'); // Adjust per_page for active devices list
            if (filters.search) params.append('search_device_eui', filters.search); // Or a general search param
            if (filters.status) params.append('status', filters.status);
            if (filters.type) params.append('type', filters.type);

            // Assuming your admin iot-devices endpoint can be used for this listing
            const response = await apiClient.get<ActiveDevicesPaginatedResponse>(
                `/admin/iot-devices?${params.toString()}`
            );
            setActiveDevices(response.data.data);
            setDevicesPagination(response.data.meta);
            setDevicesCurrentPage(response.data.meta.current_page);
        } catch (err: any) {
             console.error("Failed to fetch active devices:", err);
             // Potentially set a specific error for this part of the page
        } finally {
            setIsLoadingDevices(false);
        }
    }, [filters]);


    useEffect(() => {
        fetchDashboardData(); // Fetch overview on mount / portalType change
    }, [fetchDashboardData]);

    useEffect(() => {
        // Fetch active devices when filters or page changes, but only if overview data is already loaded (or separate endpoint)
        if (!isLoading) { // Avoid fetching devices while overview is loading
             fetchActiveDevices(devicesCurrentPage);
        }
    }, [filters, devicesCurrentPage, fetchActiveDevices, isLoading]);


    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setDevicesCurrentPage(1); // Reset to page 1 on filter change
    };

    const handleDevicePageChange = (newPage: number) => {
        if (devicesPagination && newPage >= 1 && newPage <= devicesPagination.last_page) {
            setDevicesCurrentPage(newPage);
        }
    };


    if (isLoading && !iotData) return <div className="p-6 text-center">Loading IoT Monitoring Data...</div>; // Initial full page load
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
    if (!iotData) return <div className="p-6 text-center">No IoT data available to display.</div>;

    const { device_summary, recent_critical_metrics, overview_charts_data } = iotData;

    return (
        // Layout (AdminLayout, OfficerLayout etc.) is applied by App.tsx
        <>
            <title>IoT Device Monitoring - Parole Monitoring</title>
            <div className="space-y-6 p-4 sm:p-6"> {/* Page padding */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <IotIcon size={28} className="mr-3 text-brand-purple-admin"/>IoT Device Monitoring
                    </h1>
                    {/* Add refresh button or global filters for the whole page */}
                    <button onClick={() => {fetchDashboardData(); fetchActiveDevices(1);}} disabled={isLoading || isLoadingDevices}
                        className="secondary-button text-sm py-1.5 px-3 flex items-center">
                        <RotateCcw size={16} className={`mr-1.5 ${isLoading || isLoadingDevices ? "animate-spin" : ""}`} /> Refresh Data
                    </button>
                </div>

                {/* Device Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Using more descriptive icons for IoT context */}
                    <div className="iot-summary-card"><Layers className="summary-icon text-blue-500"/><div><p>Total Devices</p><span>{device_summary.total_devices}</span></div></div>
                    <div className="iot-summary-card"><Activity className="summary-icon text-green-500"/><div><p>Active</p><span>{device_summary.active_devices}</span></div></div>
                    <div className="iot-summary-card"><BatteryCharging className="summary-icon text-yellow-500"/><div><p>Low Battery</p><span>{device_summary.low_battery_devices}</span></div></div>
                    <div className="iot-summary-card"><Wifi className="summary-icon text-red-500"/><div><p>Inactive/Offline</p><span>{device_summary.inactive_devices}</span></div></div>
                </div>

                {/* Overview Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {overview_charts_data.datasets.map(ds => (
                        <IotMetricChart key={ds.label} title={ds.label} labels={overview_charts_data.labels} dataset={ds} />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Critical Metrics/Alerts from Devices */}
                    <section className="bg-white dark:bg-brand-gray-admin-card p-4 rounded-lg shadow">
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Recent Critical Device Readings</h2>
                        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                            {recent_critical_metrics.length > 0 ? recent_critical_metrics.map(metric => (
                                <div key={metric.id} className="p-2.5 bg-red-50 dark:bg-red-800/30 rounded-md border-l-4 border-red-500 hover:bg-red-100 dark:hover:bg-red-800/50 transition-colors">
                                    <p className="text-xs font-semibold text-red-700 dark:text-red-300">Parolee: {metric.parolee_name}</p>
                                    <p className="text-xs text-red-600 dark:text-red-400">Device: <span className="font-mono">{metric.device_eui}</span></p>
                                    <p className="text-sm font-medium text-red-700 dark:text-red-200 mt-0.5">{metric.metric}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(metric.timestamp), 'MMM d, HH:mm')}</p>
                                </div>
                            )) : <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">No critical readings recently.</div>}
                        </div>
                    </section>

                    {/* List of Active Devices with Filters */}
                    <section className="bg-white dark:bg-brand-gray-admin-card p-4 rounded-lg shadow flex flex-col">
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Active Devices Management</h2>
                        <form onSubmit={(e) => { e.preventDefault(); fetchActiveDevices(1); }} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 items-end">
                            <div className="relative">
                                <label htmlFor="deviceSearch" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Search EUI/Name</label>
                                <Search className="absolute left-2 top-7 text-gray-400 h-4 w-4"/>
                                <input id="deviceSearch" name="search" value={filters.search} onChange={handleFilterChange} type="search" placeholder="EUI or Name..." className="input-style text-sm pl-8 py-1.5 w-full mt-0.5"/>
                            </div>
                            <div>
                                <label htmlFor="deviceStatusFilter" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Status</label>
                                <select id="deviceStatusFilter" name="status" value={filters.status} onChange={handleFilterChange} className="input-style text-sm py-1.5 w-full mt-0.5">
                                    <option value="">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="unassigned">Unassigned</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>
                            <button type="submit" className="primary-button text-sm py-1.5 px-3 flex items-center justify-center"><FilterIcon size={16} className="mr-1"/> Filter Devices</button>
                        </form>

                        <div className="overflow-x-auto flex-grow max-h-80 custom-scrollbar">
                            <table className="w-full min-w-full text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-700/50 sticky top-0 z-10">
                                    <tr>
                                        <th className="th-cell-sm">EUI / Name</th>
                                        <th className="th-cell-sm">Parolee</th>
                                        <th className="th-cell-sm">Type</th>
                                        <th className="th-cell-sm">Battery</th>
                                        <th className="th-cell-sm">Last Seen</th>
                                        <th className="th-cell-sm">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {isLoadingDevices && activeDevices.length === 0 && <tr><td colSpan={6} className="td-cell-sm text-center py-4">Loading devices...</td></tr>}
                                    {!isLoadingDevices && activeDevices.length === 0 && <tr><td colSpan={6} className="td-cell-sm text-center py-4">No active devices match filters.</td></tr>}
                                    {activeDevices.map(device => (
                                        <tr key={device.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="td-cell-sm"><div className="font-mono text-xs">{device.device_eui}</div>{device.name && <div className="text-xxs text-gray-500">{device.name}</div>}</td>
                                            <td className="td-cell-sm">{device.parolee?.name || <span className="italic text-gray-400">Unassigned</span>}</td>
                                            <td className="td-cell-sm capitalize">{device.type.replace('_', ' ')}</td>
                                            <td className="td-cell-sm font-medium" style={{color: (device.battery_level || 0) < 20 ? 'red' : (device.battery_level || 0) < 50 ? 'orange' : 'green'}}>
                                                {device.battery_level !== null ? `${device.battery_level}%` : 'N/A'}
                                            </td>
                                            <td className="td-cell-sm">{device.last_seen_at ? format(new Date(device.last_seen_at), 'P HH:mm') : 'Never'}</td>
                                            <td className="td-cell-sm"><span className={`status-badge-${device.status} capitalize`}>{device.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination for Active Devices List */}
                        {devicesPagination && devicesPagination.last_page > 1 && (
                            <div className="p-2 border-t dark:border-gray-700 flex justify-between items-center text-xs mt-auto flex-shrink-0">
                                <button onClick={() => handleDevicePageChange(devicesCurrentPage - 1)} disabled={devicesCurrentPage === 1 || isLoadingDevices} className="pagination-button px-2 py-1"> <ChevronLeft size={14}/> Prev</button>
                                <span>Page {devicesCurrentPage} of {devicesPagination.last_page}</span>
                                <button onClick={() => handleDevicePageChange(devicesCurrentPage + 1)} disabled={devicesCurrentPage === devicesPagination.last_page || isLoadingDevices} className="pagination-button px-2 py-1">Next <ChevronRight size={14}/></button>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
};
export default IotMonitoringPage;