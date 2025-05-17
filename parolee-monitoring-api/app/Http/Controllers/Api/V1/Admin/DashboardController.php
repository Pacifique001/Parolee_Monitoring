<?php

namespace App\Http\Controllers\Api\V1\Admin; // Correct Namespace

use App\Http\Controllers\Controller;
use App\Models\User; // Assuming you'll query users for counts
// use App\Models\SystemLog; // Example if you were to query actual logs
// use App\Models\Alert; // Example if you had an Alert model
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller // Correct Class Name
{
    /**
     * Provide overview data for the admin dashboard.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function overviewData(Request $request): JsonResponse
    {
        // === Mock Data (Replace with real data fetching logic later) ===

        // --- Counts for Top Cards ---
        // For real data, you would query your database:
        // $activeParoleesCount = User::where('user_type', 'parolee')->where('status', 'active')->count();
        // $highRiskCasesCount = User::where('user_type', 'parolee')->where('status', 'high_risk')->count();
        // $geofenceViolationsCount = SystemLog::where('type', 'geofence_violation')->where('created_at', '>=', Carbon::now()->subDay())->count(); // Example
        // $criticalHealthAlertsCount = Alert::where('severity', 'critical')->where('status', 'open')->count(); // Example

        $activeParoleesCount = 12; // Mock
        $highRiskCasesCount = 2;   // Mock
        $criticalHealthAlertsCount = 1; // Mock
        $geofenceViolationsCount = 1; // Mock

        // --- Recent Alerts ---
        // For real data, query your alerts table or logs
        $recentAlerts = [
            [
                'id' => 'alert_api_geo_001',
                'title' => 'Geofence Alert - P007',
                'description' => 'Entered restricted zone "Downtown Core" at 02:33 AM.',
                'type' => 'geofence', // 'geofence', 'health', 'iot_tamper', 'low_battery'
                'parolee_id' => 'P007', // Optional: Link to parolee
                'timestamp' => Carbon::now()->subHours(2)->subMinutes(15)->toIso8601String(),
                'severity' => 'high', // 'low', 'medium', 'high', 'critical'
            ],
            [
                'id' => 'alert_api_health_002',
                'title' => 'Health Alert - P015',
                'description' => 'Heart rate sustained above 140bpm for 5 mins.',
                'type' => 'health',
                'parolee_id' => 'P015',
                'timestamp' => Carbon::now()->subMinutes(45)->toIso8601String(),
                'severity' => 'medium',
            ],
        ];

        // --- Health Metrics Chart Data (Example for aggregated or a specific parolee) ---
        $healthChartLabels = [];
        for ($i = 8; $i >= 0; $i--) {
            // Simulate labels for the last 9 hours, on the hour
            $healthChartLabels[] = Carbon::now()->subHours($i)->startOfHour()->format('H:00');
        }

        $mockHeartRateData = [75, 76, 75, 74, 78, 88, 90, 89, 85];
        $mockTemperatureData = [36.5, 36.6, 36.4, 36.7, 36.8, 37.1, 37.0, 36.9, 36.7];
        $mockBloodPressureSystolicData = [119, 120, 118, 122, 120, 127, 129, 124, 119]; // Example systolic
        $mockBloodPressureDiastolicData = [79, 80, 78, 82, 80, 85, 86, 83, 79];    // Example diastolic
        $mockStressLevelData = [40.1, 40.0, 40.2, 40.1, 40.3, 40.7, 40.9, 40.8, 40.6];

        // --- Live GPS Location Data (Example Structure for an API) ---
        // In a real scenario, this would come from a database or real-time service.
        $liveGpsLocationData = [
            'map_center' => ['lat' => -1.9441, 'lng' => 30.0619], // Example: Kigali
            'zoom_level' => 12,
            'parolees' => [
                ['id' => 'P001', 'name' => 'John Doe', 'lat' => -1.9400, 'lng' => 30.0580, 'status' => 'active', 'last_seen' => Carbon::now()->subMinutes(5)->toIso8601String()],
                ['id' => 'P007', 'name' => 'Jane Smith (High Risk)', 'lat' => -1.9550, 'lng' => 30.0620, 'status' => 'high_risk', 'last_seen' => Carbon::now()->subMinutes(2)->toIso8601String()],
                // ... more parolees
            ],
        ];

        return response()->json([
            'summary_cards' => [
                ['label' => 'Active Parolees', 'value' => $activeParoleesCount, 'icon' => 'Users'],
                ['label' => 'High Risk Cases', 'value' => $highRiskCasesCount, 'icon' => 'AlertTriangle'],
                ['label' => 'Critical Health Alerts', 'value' => $criticalHealthAlertsCount, 'icon' => 'HeartPulse'],
                ['label' => 'Geofence Violations Today', 'value' => $geofenceViolationsCount, 'icon' => 'MapPinOff'],
            ],
            'recent_alerts' => $recentAlerts,
            'charts_data' => [
                'labels' => $healthChartLabels,
                'datasets' => [
                    ['label' => 'Heart Rate (BPM)', 'data' => $mockHeartRateData, 'borderColor' => '#EF4444', 'icon' => 'HeartPulse'],
                    ['label' => 'Temperature (°C)', 'data' => $mockTemperatureData, 'borderColor' => '#F97316', 'icon' => 'Thermometer'],
                    // For Blood Pressure, you might send two datasets or a combined string
                    ['label' => 'Blood Pressure (Systolic)', 'data' => $mockBloodPressureSystolicData, 'borderColor' => '#3B82F6', 'icon' => 'Gauge'],
                    ['label' => 'Blood Pressure (Diastolic)', 'data' => $mockBloodPressureDiastolicData, 'borderColor' => '#2563EB', 'icon' => 'Gauge'], // Slightly different blue
                    ['label' => 'Stress Level', 'data' => $mockStressLevelData, 'borderColor' => '#8B5CF6', 'icon' => 'BrainCircuit'],
                ]
            ],
            'live_gps_data' => $liveGpsLocationData,
        ]);
    }
}