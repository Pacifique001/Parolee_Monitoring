/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/shared/GpsTrackingPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import apiClient from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L, { type LatLngExpression } from 'leaflet'; // Import LatLngExpression
import 'leaflet/dist/leaflet.css';
import { MapPin, Users, Search, Filter as FilterIcon, RotateCcw, Navigation, Layers } from 'lucide-react';
import { format } from 'date-fns';

// Leaflet Icon Fix (should be in a more global place or a Map utility)
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Types for data from API
interface GpsParolee {
    id: number;
    name: string;
    parole_id_number?: string;
    risk_level?: string;
    status: string;
    latitude: number;
    longitude: number;
    last_seen_at?: string;
    accuracy_meters?: number;
}
interface GpsApiResponse {
    data: GpsParolee[];
    map_center: { lat: number; lng: number };
    zoom_level: number;
}

// Props for the page component (portalType will be passed from App.tsx)
// Custom hook or component to re-center map when data changes
const ChangeView: React.FC<{ center: LatLngExpression; zoom: number }> = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

const GpsTrackingPage: React.FC = () => {
    const [paroleeLocations, setParoleeLocations] = useState<GpsParolee[]>([]);
    const [mapCenter, setMapCenter] = useState<LatLngExpression>([0, 0]); // Default
    const [mapZoom, setMapZoom] = useState<number>(2); // Default
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRiskLevel, setSelectedRiskLevel] = useState('');
    // TODO: Add state for selected parolee to highlight on map or show more details

    const fetchGpsData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search_parolee', searchTerm);
            if (selectedRiskLevel) params.append('risk_level', selectedRiskLevel);

            const response = await apiClient.get<GpsApiResponse>(`/gps/live-parolee-locations?${params.toString()}`);
            setParoleeLocations(response.data.data);
            setMapCenter([response.data.map_center.lat, response.data.map_center.lng]);
            setMapZoom(response.data.zoom_level);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load GPS data.");
            console.error("GPS Data Fetch Error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, selectedRiskLevel]); // Remove portalType from dependencies

    useEffect(() => {
        fetchGpsData();
        // Optional: Set up an interval to periodically refresh live locations
        // const intervalId = setInterval(fetchGpsData, 30000); // Refresh every 30 seconds
        // return () => clearInterval(intervalId);
    }, [fetchGpsData]);

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchGpsData();
    };

    // Memoize markers to prevent unnecessary re-renders of the map if locations haven't changed
    const markers = useMemo(() => {
        return paroleeLocations.map(p => (
            <Marker key={p.id} position={[p.latitude, p.longitude]}>
                <Popup>
                    <b>{p.name}</b> ({p.parole_id_number || 'N/A'})<br />
                    Status: <span className="capitalize">{p.status}</span><br />
                    Risk: <span className="capitalize">{p.risk_level || 'N/A'}</span><br />
                    Last Seen: {p.last_seen_at ? format(new Date(p.last_seen_at), 'Pp') : 'N/A'}<br />
                    Accuracy: {p.accuracy_meters ? `${p.accuracy_meters.toFixed(1)}m` : 'N/A'}
                </Popup>
            </Marker>
        ));
    }, [paroleeLocations]);


    return (
        // The wrapping Layout (AdminLayout, OfficerLayout, StaffLayout) is applied in App.tsx
        <>
            <title>GPS Tracking - Parole Monitoring</title>
             <div className="flex-1 p-6 ml-64">
           <div className="h-[calc(100vh-4rem)] flex flex-col"> {/* Full height minus header */}
                {/* Top Bar with Title and Filters */}
                <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-center">
                        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center mb-2 sm:mb-0">
                            <MapPin size={24} className="mr-2 text-brand-purple-admin" /> Live GPS Tracking
                        </h1>
                        <form onSubmit={handleFilterSubmit} className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                                <input type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search Parolee..." className="input-style text-sm pl-9 py-1.5 w-full" />
                            </div>
                            <select value={selectedRiskLevel} onChange={(e) => setSelectedRiskLevel(e.target.value)} className="input-style text-sm py-1.5 w-full sm:w-auto">
                                <option value="">All Risks</option>
                                <option value="low">Low Risk</option>
                                <option value="medium">Medium Risk</option>
                                <option value="high">High Risk</option>
                                <option value="critical">Critical Risk</option>
                            </select>
                            <button type="submit" className="primary-button text-sm py-1.5 px-3 w-full sm:w-auto flex items-center justify-center">
                                <FilterIcon size={16} className="mr-1.5" /> Filter
                            </button>
                            <button type="button" onClick={() => fetchGpsData()} disabled={isLoading} className="secondary-button text-sm py-1.5 px-3 w-full sm:w-auto flex items-center justify-center" title="Refresh Data">
                                <RotateCcw size={16} className={isLoading ? "animate-spin" : ""} />
                            </button>
                        </form>
                    </div>
                </div>

                {error && <div className="m-4 p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900/50 rounded-md" role="alert">{error}</div>}

                {/* Map Area */}
                <div className="flex-grow relative"> {/* Ensure map container can grow */}
                    {isLoading && paroleeLocations.length === 0 ? (
                         <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 dark:bg-gray-800/50 z-10">
                            <div className="animate-pulse flex items-center "><Navigation size={20} className="text-gray-500 mr-2"/> Searching for signals...</div>
                        </div>
                    ) : null}
                    <MapContainer
                        key={JSON.stringify(mapCenter)} // Force re-render if center changes significantly
                        center={mapCenter}
                        zoom={mapZoom}
                        style={{ height: '100%', width: '100%', zIndex: 0 }} // zIndex to be below overlays
                        scrollWheelZoom={true}
                    >
                         <ChangeView center={mapCenter} zoom={mapZoom} /> {/* Component to handle map view changes */}
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        {markers}
                        {/* TODO: Add GeoFence overlays if this page needs to show them */}
                        {/* Example:
                        <Circle center={[lat, lng]} radius={meters} pathOptions={{ color: 'red' }} />
                        */}
                    </MapContainer>
                </div>
            </div>
            </div>
        </>
    );
};

export default GpsTrackingPage;