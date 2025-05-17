<?php

namespace App\Services;

use App\Events\AlertCreated; // <-- IMPORT THE EVENT
use App\Models\Alert;
use App\Models\GpsLocation; // For getting location with alert
use App\Models\HealthMetric;
use App\Models\IotDevice;
use App\Models\User; // For Parolee type
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class AlertService
{
    // Define thresholds - These should ideally be more dynamic (e.g., per parolee settings, or AI-driven)
    // For simplicity, they are constants here.
    const HEART_RATE_HIGH_CRITICAL = 150;
    const HEART_RATE_HIGH_WARNING = 130;
    const HEART_RATE_LOW_CRITICAL = 40;
    const HEART_RATE_LOW_WARNING = 50;

    const TEMPERATURE_HIGH_CRITICAL = 39.5;
    const TEMPERATURE_HIGH_WARNING = 38.0;
    const TEMPERATURE_LOW_WARNING = 35.5;
    const TEMPERATURE_LOW_CRITICAL = 34.5;

    const BP_SYSTOLIC_HIGH_CRITICAL = 180;
    const BP_SYSTOLIC_HIGH_WARNING = 160;
    const BP_SYSTOLIC_LOW_WARNING = 90;

    const BP_DIASTOLIC_HIGH_CRITICAL = 110;
    const BP_DIASTOLIC_HIGH_WARNING = 100;
    const BP_DIASTOLIC_LOW_WARNING = 60;

    const STRESS_LEVEL_HIGH = 80; // Assuming a scale of 0-100 for stress_level_indicator
    const STRESS_LEVEL_VERY_HIGH = 90;

    // How long to wait before creating a similar new alert for the same condition
    const DUPLICATE_ALERT_WINDOW_MINUTES = 30;


    public function checkForHealthAlerts(HealthMetric $metric): void
    {
        $device = $metric->iotDevice;
        $parolee = $metric->parolee;

        if (!$device || !$parolee) {
            Log::warning("Cannot check health alerts: device or parolee not found for metric ID {$metric->id}");
            return;
        }

        // --- Heart Rate Alerts ---
        if ($metric->heart_rate !== null) {
            if ($metric->heart_rate > self::HEART_RATE_HIGH_CRITICAL) {
                $this->createHealthAlert($parolee, $device, $metric, 'health_hr_crit_high', 'critical',
                    "Critical: Heart rate significantly high at {$metric->heart_rate} BPM.",
                    ['value' => $metric->heart_rate, 'threshold' => self::HEART_RATE_HIGH_CRITICAL]
                );
            } elseif ($metric->heart_rate > self::HEART_RATE_HIGH_WARNING) {
                $this->createHealthAlert($parolee, $device, $metric, 'health_hr_warn_high', 'high',
                    "Warning: Heart rate elevated at {$metric->heart_rate} BPM.",
                    ['value' => $metric->heart_rate, 'threshold' => self::HEART_RATE_HIGH_WARNING]
                );
            } elseif ($metric->heart_rate < self::HEART_RATE_LOW_CRITICAL) {
                $this->createHealthAlert($parolee, $device, $metric, 'health_hr_crit_low', 'critical',
                    "Critical: Heart rate significantly low at {$metric->heart_rate} BPM.",
                    ['value' => $metric->heart_rate, 'threshold' => self::HEART_RATE_LOW_CRITICAL]
                );
            } elseif ($metric->heart_rate < self::HEART_RATE_LOW_WARNING) {
                $this->createHealthAlert($parolee, $device, $metric, 'health_hr_warn_low', 'high',
                    "Warning: Heart rate low at {$metric->heart_rate} BPM.",
                    ['value' => $metric->heart_rate, 'threshold' => self::HEART_RATE_LOW_WARNING]
                );
            }
        }

        // --- Temperature Alerts ---
        if ($metric->temperature_celsius !== null) {
            if ($metric->temperature_celsius > self::TEMPERATURE_HIGH_CRITICAL) {
                $this->createHealthAlert($parolee, $device, $metric, 'health_temp_crit_high', 'critical',
                    "Critical: Temperature significantly high at {$metric->temperature_celsius}°C.",
                    ['value' => $metric->temperature_celsius, 'threshold' => self::TEMPERATURE_HIGH_CRITICAL]
                );
            } elseif ($metric->temperature_celsius > self::TEMPERATURE_HIGH_WARNING) {
                $this->createHealthAlert($parolee, $device, $metric, 'health_temp_warn_high', 'high',
                    "Warning: Temperature elevated at {$metric->temperature_celsius}°C.",
                    ['value' => $metric->temperature_celsius, 'threshold' => self::TEMPERATURE_HIGH_WARNING]
                );
            } elseif ($metric->temperature_celsius < self::TEMPERATURE_LOW_CRITICAL) {
                 $this->createHealthAlert($parolee, $device, $metric, 'health_temp_crit_low', 'critical',
                    "Critical: Temperature significantly low at {$metric->temperature_celsius}°C.",
                    ['value' => $metric->temperature_celsius, 'threshold' => self::TEMPERATURE_LOW_CRITICAL]
                );
            } elseif ($metric->temperature_celsius < self::TEMPERATURE_LOW_WARNING) {
                 $this->createHealthAlert($parolee, $device, $metric, 'health_temp_warn_low', 'high',
                    "Warning: Temperature low at {$metric->temperature_celsius}°C.",
                    ['value' => $metric->temperature_celsius, 'threshold' => self::TEMPERATURE_LOW_WARNING]
                );
            }
        }

        // --- Blood Pressure Alerts ---
        if ($metric->blood_pressure_systolic !== null && $metric->blood_pressure_diastolic !== null) {
            $bpValue = "{$metric->blood_pressure_systolic}/{$metric->blood_pressure_diastolic} mmHg";
            if ($metric->blood_pressure_systolic > self::BP_SYSTOLIC_HIGH_CRITICAL || $metric->blood_pressure_diastolic > self::BP_DIASTOLIC_HIGH_CRITICAL) {
                $this->createHealthAlert($parolee, $device, $metric, 'health_bp_crit_high', 'critical',
                    "Critical: Blood pressure significantly high: {$bpValue}.",
                    ['systolic' => $metric->blood_pressure_systolic, 'diastolic' => $metric->blood_pressure_diastolic, 'threshold_sys' => self::BP_SYSTOLIC_HIGH_CRITICAL, 'threshold_dia' => self::BP_DIASTOLIC_HIGH_CRITICAL]
                );
            } elseif ($metric->blood_pressure_systolic > self::BP_SYSTOLIC_HIGH_WARNING || $metric->blood_pressure_diastolic > self::BP_DIASTOLIC_HIGH_WARNING) {
                $this->createHealthAlert($parolee, $device, $metric, 'health_bp_warn_high', 'high',
                    "Warning: Blood pressure elevated: {$bpValue}.",
                     ['systolic' => $metric->blood_pressure_systolic, 'diastolic' => $metric->blood_pressure_diastolic, 'threshold_sys' => self::BP_SYSTOLIC_HIGH_WARNING, 'threshold_dia' => self::BP_DIASTOLIC_HIGH_WARNING]
                );
            } elseif ($metric->blood_pressure_systolic < self::BP_SYSTOLIC_LOW_WARNING || $metric->blood_pressure_diastolic < self::BP_DIASTOLIC_LOW_WARNING) {
                $this->createHealthAlert($parolee, $device, $metric, 'health_bp_warn_low', 'high',
                    "Warning: Blood pressure low: {$bpValue}.",
                     ['systolic' => $metric->blood_pressure_systolic, 'diastolic' => $metric->blood_pressure_diastolic, 'threshold_sys' => self::BP_SYSTOLIC_LOW_WARNING, 'threshold_dia' => self::BP_DIASTOLIC_LOW_WARNING]
                );
            }
        }

        // --- Stress Level Alerts ---
        if ($metric->stress_level_indicator !== null) {
            if ($metric->stress_level_indicator > self::STRESS_LEVEL_VERY_HIGH) {
                $this->createHealthAlert($parolee, $device, $metric, 'health_stress_very_high', 'critical',
                    "Critical: Stress level indicator very high at {$metric->stress_level_indicator}.",
                    ['value' => $metric->stress_level_indicator, 'threshold' => self::STRESS_LEVEL_VERY_HIGH]
                );
            } elseif ($metric->stress_level_indicator > self::STRESS_LEVEL_HIGH) {
                $this->createHealthAlert($parolee, $device, $metric, 'health_stress_high', 'high',
                    "Warning: Stress level indicator high at {$metric->stress_level_indicator}.",
                    ['value' => $metric->stress_level_indicator, 'threshold' => self::STRESS_LEVEL_HIGH]
                );
            }
        }

        
    }

    /**
     * Creates a health-related alert.
     */
    protected function createHealthAlert(User $parolee, IotDevice $device, HealthMetric $metric, string $type, string $severity, string $message, array $details = []): void
    {
        $this->createAlert($parolee, $device, $type, $severity, $message, $details, $metric->id, null, $metric->timestamp);
    }

    /**
     * Creates a GPS-related alert (e.g., geofence breach).
     * This method would be called by a GeoFence service.
     */
    public function createGpsAlert(User $parolee, IotDevice $device, GpsLocation $location, string $type, string $severity, string $message, array $details = []): void
    {
        $this->createAlert($parolee, $device, $type, $severity, $message, $details, null, $location->id, $location->timestamp, $location->latitude, $location->longitude);
    }

    /**
     * Generic method to create an alert.
     */
    protected function createAlert(
        User $parolee,
        IotDevice $device,
        string $type,
        string $severity,
        string $message,
        array $details = [],
        ?int $healthMetricId = null,
        ?int $gpsLocationId = null,
        ?Carbon $alertTimestamp = null, // Timestamp of the event causing the alert
        ?float $latitude = null,
        ?float $longitude = null
    ): void {
        // Check if a similar active alert already exists to avoid duplicates
        $existingAlert = Alert::where('parolee_user_id', $parolee->id)
                            ->where('type', $type)
                            ->where('status', 'new')
                            ->where('alerted_at', '>=', Carbon::now()->subMinutes(self::DUPLICATE_ALERT_WINDOW_MINUTES))
                            ->first();

        if ($existingAlert) {
            Log::info("Duplicate Prevention: Similar active alert already exists for parolee {$parolee->id}, type {$type}. Skipping new alert creation.");
            return;
        }

        $alertTimestamp = $alertTimestamp ?? Carbon::now(); // Default to now if not provided

        // Attempt to get location from GPS data if not directly provided and a GpsLocation is linked
        if (($latitude === null || $longitude === null) && $gpsLocationId) {
            $relatedLocation = GpsLocation::find($gpsLocationId);
            if ($relatedLocation) {
                $latitude = $latitude ?? $relatedLocation->latitude;
                $longitude = $longitude ?? $relatedLocation->longitude;
            }
        }
        // Or attempt to get recent location if no GPS data is linked but device exists
        elseif (($latitude === null || $longitude === null) && $device) {
            $recentLocation = GpsLocation::where('iot_device_id', $device->id)
                                        ->orderBy('timestamp', 'desc')
                                        ->first();
            if ($recentLocation) {
                $latitude = $latitude ?? $recentLocation->latitude;
                $longitude = $longitude ?? $recentLocation->longitude;
            }
        }


        $alert = Alert::create([
            'parolee_user_id' => $parolee->id,
            'iot_device_id' => $device->id,
            'health_metric_id' => $healthMetricId,
            'gps_location_id' => $gpsLocationId,
            'type' => $type,
            'severity' => $severity,
            'message' => $message,
            'details' => $details,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'alerted_at' => $alertTimestamp->setTimezone('UTC'),
            'status' => 'new',
        ]);

        Log::info("Alert created for parolee {$parolee->id}: {$type} - {$message}", ['alert_id' => $alert->id]);

        // Dispatch an event that an alert was created
        AlertCreated::dispatch($alert); // <-- DISPATCH THE EVENT
    }
}