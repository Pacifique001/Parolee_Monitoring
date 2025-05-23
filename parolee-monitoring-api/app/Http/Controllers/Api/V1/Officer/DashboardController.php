<?php
namespace App\Http\Controllers\Api\V1\Officer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User; // For Parolees
use App\Models\Alert;
use App\Models\HealthMetric; // For chart data aggregation
use App\Models\GpsLocation;
use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function overviewData(Request $request): JsonResponse
    {
        $officer = Auth::user(); // The authenticated officer

        // TODO: Implement logic to get parolees assigned to this officer
        // This requires a relationship: e.g., Officer hasMany Parolees, or Parolee belongsTo Officer
        // For now, let's assume a placeholder or fetch all for mock purposes.
        // $assignedParoleeIds = $officer->assignedParolees()->pluck('users.id'); // Example
        $assignedParoleeIds = User::where('user_type', 'parolee')->pluck('id')->take(15); // MOCK: taking some parolees

        $activeParoleesCount = User::whereIn('id', $assignedParoleeIds)->where('status', 'active')->count();
        $highRiskCasesCount = User::whereIn('id', $assignedParoleeIds)->where('status', 'high_risk')->count();
        // Alerts today for this officer's parolees
        $alertsTodayCount = Alert::whereIn('parolee_user_id', $assignedParoleeIds)
                                 ->whereDate('alerted_at', Carbon::today())
                                 ->count();
        $complianceRate = 94; // Placeholder - calculate this based on rules

        $recentAlerts = Alert::whereIn('parolee_user_id', $assignedParoleeIds)
                             ->where('status', 'new') // Only new alerts
                             ->orderBy('alerted_at', 'desc')
                             ->take(3) // Limit to a few recent ones
                             ->get()
                             ->map(function ($alert) {
                                 return [
                                     'id' => $alert->id,
                                     'parolee_name' => $alert->parolee?->name ?? 'Unknown Parolee', // Assuming Alert->parolee relationship
                                     'message' => $alert->message,
                                     'type' => $alert->type,
                                     'timestamp' => Carbon::parse($alert->alerted_at)->diffForHumans(), // e.g., "5 minutes ago"
                                 ];
                             });

        // Live GPS for assigned parolees
        $liveGpsParolees = User::whereIn('users.id', $assignedParoleeIds)
            ->join('iot_devices', 'users.id', '=', 'iot_devices.parolee_user_id') // Assuming parolee has one device for GPS
            ->leftJoin('gps_locations', function($join) {
                $join->on('iot_devices.id', '=', 'gps_locations.iot_device_id')
                     ->whereRaw('gps_locations.id = (select max(id) from gps_locations where iot_device_id = iot_devices.id)'); // Get latest location
            })
            ->select('users.id', 'users.name', 'users.status', 'gps_locations.latitude as lat', 'gps_locations.longitude as lng', 'gps_locations.timestamp as last_seen')
            ->get()
            ->filter(fn($p) => $p->lat && $p->lng); // Filter out those without recent location

        $liveGpsData = [
            'map_center' => ['lat' => -1.9441, 'lng' => 30.0619], // Default center
            'zoom_level' => 12,
            'parolees' => $liveGpsParolees->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'lat' => (float)$p->lat,
                'lng' => (float)$p->lng,
                'status' => $p->status,
                'last_seen' => $p->last_seen ? Carbon::parse($p->last_seen)->toIso8601String() : null,
            ]),
        ];
        if ($liveGpsParolees->isNotEmpty()) {
            $liveGpsData['map_center'] = ['lat' => (float)$liveGpsParolees->first()->lat, 'lng' => (float)$liveGpsParolees->first()->lng];
        }


        // Chart Data (e.g., aggregated for officer's parolees, or for a selected one - simpler for overview)
        $chartLabels = [];
        for ($i = 6; $i >= 0; $i--) {
            $chartLabels[] = Carbon::now()->subHours($i * 4)->format('H:00'); // Example labels
        }
        $chartsData = [
            'labels' => $chartLabels,
            'datasets' => [
                ['label' => 'Heart Rate (Avg)', 'data' => array_map(fn() => rand(60,90), $chartLabels), 'borderColor' => '#EF4444', 'icon' => 'HeartPulse'],
                ['label' => 'Temperature (°C Avg)', 'data' => array_map(fn() => rand(360,375)/10, $chartLabels), 'borderColor' => '#F97316', 'icon' => 'Thermometer'],
                ['label' => 'Blood Pressure (Avg Sys)', 'data' => array_map(fn() => rand(110,130), $chartLabels), 'borderColor' => '#3B82F6', 'icon' => 'Gauge'],
                ['label' => 'Stress Level (Avg)', 'data' => array_map(fn() => rand(30,60), $chartLabels), 'borderColor' => '#8B5CF6', 'icon' => 'BrainCircuit'],
            ]
        ];

        return response()->json([
            'summary_cards' => [
                ['label' => 'Active Parolees', 'value' => $activeParoleesCount, 'icon' => 'UserCheck'],
                ['label' => 'High risk cases', 'value' => $highRiskCasesCount, 'icon' => 'AlertTriangle'],
                ['label' => 'Alerts Today', 'value' => $alertsTodayCount, 'icon' => 'Bell'],
                ['label' => 'Compliance Rate', 'value' => "{$complianceRate}%", 'icon' => 'ShieldCheck'],
            ],
            'recent_alerts' => $recentAlerts,
            'live_gps_data' => $liveGpsData,
            'charts_data' => $chartsData,
        ]);
    }
}
