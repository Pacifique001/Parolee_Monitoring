<?php

namespace App\Services;

use App\Models\GpsLocation;
use App\Models\User; // Represents Parolee
use App\Models\GeoFence;
use App\Models\IotDevice;
use App\Services\AlertService; // To create alerts
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class GeoFenceService
{
    protected AlertService $alertService;

    public function __construct(AlertService $alertService)
    {
        $this->alertService = $alertService;
    }

    /**
     * Check a given GPS location for geofence breaches for the associated parolee.
     */
    public function checkForBreaches(GpsLocation $location): void
    {
        $parolee = $location->parolee()->with('assignedGeofences')->first(); // Eager load active assigned geofences
        $device = $location->iotDevice; // Assuming this relationship is set on GpsLocation model

        if (!$parolee || !$device) {
            Log::warning("GeoFence Check: Parolee or Device not found for GpsLocation ID {$location->id}");
            return;
        }

        // Get active geofences specifically assigned to this parolee
        $assignedActiveGeofences = $parolee->assignedGeofences()->where('is_active', true)->get();

        if ($assignedActiveGeofences->isEmpty()) {
            // Log::info("GeoFence Check: Parolee {$parolee->id} has no active geofences assigned.");
            return;
        }

        foreach ($assignedActiveGeofences as $geofence) {
            $isInside = $this->isPointInsideGeofence($location->latitude, $location->longitude, $geofence);

            if ($geofence->type === 'restricted' && $isInside) {
                // Breach: Parolee entered a restricted area
                $this->alertService->createGpsAlert(
                    $parolee,
                    $device,
                    $location,
                    'geofence_entry_restricted',
                    'high', // Severity
                    "Parolee {$parolee->name} entered restricted zone: {$geofence->name}.",
                    ['geofence_id' => $geofence->id, 'geofence_name' => $geofence->name]
                );
            } elseif ($geofence->type === 'allowed' && !$isInside) {
                // Breach: Parolee exited an allowed area
                $this->alertService->createGpsAlert(
                    $parolee,
                    $device,
                    $location,
                    'geofence_exit_allowed',
                    'high', // Severity
                    "Parolee {$parolee->name} exited allowed zone: {$geofence->name}.",
                    ['geofence_id' => $geofence->id, 'geofence_name' => $geofence->name]
                );
            }
        }
    }

    /**
     * Basic check if a point is inside a geofence.
     * For polygons, this uses a simple ray-casting algorithm.
     * For circles, checks distance from center.
     * IMPORTANT: For production, use a robust spatial library or DB functions.
     */
    protected function isPointInsideGeofence(float $latitude, float $longitude, GeoFence $geofence): bool
    {
        $geometry = $geofence->geometry_data; // This is an array due to model cast

        if (empty($geometry) || !isset($geometry['type'])) {
            Log::warning("Geofence ID {$geofence->id} has invalid geometry data.");
            return false;
        }

        if (strtolower($geometry['type']) === 'polygon' && isset($geometry['coordinates'][0])) {
            $polygon = $geometry['coordinates'][0]; // Assuming first array is the outer boundary
            return $this->isPointInPolygon($latitude, $longitude, $polygon);
        } elseif (strtolower($geometry['type']) === 'circle' && isset($geometry['center']) && isset($geometry['radius_meters'])) {
            $centerLng = $geometry['center'][0];
            $centerLat = $geometry['center'][1];
            $radius = $geometry['radius_meters'];
            $distance = $this->calculateHaversineDistance($latitude, $longitude, $centerLat, $centerLng);
            return $distance <= $radius;
        }

        Log::warning("Geofence ID {$geofence->id} has unsupported geometry type: {$geometry['type']}");
        return false;
    }

    /**
     * Point in Polygon check using the Ray Casting algorithm.
     * Coordinates should be [longitude, latitude] pairs.
     */
    protected function isPointInPolygon(float $latitude, float $longitude, array $polygon): bool
    {
        $numVertices = count($polygon);
        if ($numVertices < 3) {
            return false; // Not a polygon
        }

        $x = $longitude;
        $y = $latitude;
        $inside = false;

        for ($i = 0, $j = $numVertices - 1; $i < $numVertices; $j = $i++) {
            $xi = $polygon[$i][0]; // Lng
            $yi = $polygon[$i][1]; // Lat
            $xj = $polygon[$j][0]; // Lng
            $yj = $polygon[$j][1]; // Lat

            $intersect = (($yi > $y) != ($yj > $y))
                && ($x < ($xj - $xi) * ($y - $yi) / ($yj - $yi) + $xi);
            if ($intersect) {
                $inside = !$inside;
            }
        }
        return $inside;
    }

    /**
     * Calculate distance between two points using Haversine formula (in meters).
     */
    protected function calculateHaversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000; // meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}