<?php

namespace App\Http\Controllers\Api\V1\Ingest;

use App\Http\Controllers\Controller;
use App\Models\HealthMetric;
use App\Models\IotDevice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Log;
use App\Services\AlertService; // <-- IMPORT THE SERVICE

class HealthMetricController extends Controller
{
    protected AlertService $alertService;

    public function __construct(AlertService $alertService) // <-- INJECT THE SERVICE
    {
        $this->alertService = $alertService;
        // In a real app, you'd have middleware for device authentication
        // $this->middleware('auth.device');
    }

    /**
     * Store a new health metric reading from an IoT device.
     */
    public function store(Request $request): JsonResponse
    {
        // Basic check for a shared secret (SIMPLISTIC - REPLACE WITH ROBUST AUTH)
        if ($request->header('X-Device-Secret') !== env('DEVICE_INGEST_SECRET')) {
            return response()->json(['message' => 'Unauthorized device.'], HttpResponse::HTTP_UNAUTHORIZED);
        }

        $validator = Validator::make($request->all(), [
            'device_eui' => ['required', 'string', 'exists:iot_devices,device_eui'],
            'timestamp' => ['required', 'date_format:Y-m-d H:i:s|Y-m-d\TH:i:sP|U'],
            'heart_rate' => ['nullable', 'integer', 'min:0', 'max:300'],
            'temperature_celsius' => ['nullable', 'numeric', 'min:25', 'max:45'],
            'blood_pressure_systolic' => ['nullable', 'integer', 'min:0', 'max:300'],
            'blood_pressure_diastolic' => ['nullable', 'integer', 'min:0', 'max:200'],
            'stress_level_indicator' => ['nullable', 'numeric', 'min:0'],
            'activity_level' => ['nullable', 'string', \Illuminate\Validation\Rule::in(['sedentary', 'light', 'moderate', 'vigorous'])],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], HttpResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validatedData = $validator->validated();
        $device = IotDevice::where('device_eui', $validatedData['device_eui'])->first();

        if (!$device || $device->status !== 'active' || !$device->parolee_user_id) {
            Log::warning('Health metric received for inactive/unassigned device or device not found.', ['device_eui' => $validatedData['device_eui']]);
            return response()->json(['message' => 'Device not active, not assigned, or not found.'], HttpResponse::HTTP_BAD_REQUEST);
        }

        try {
            // Use firstOrCreate to prevent duplicate metric entries if device sends same data point rapidly
            // (adjust criteria for uniqueness as needed, e.g., device_id + timestamp)
            $metric = HealthMetric::firstOrCreate(
                [
                    'iot_device_id' => $device->id,
                    'parolee_user_id' => $device->parolee_user_id,
                    'timestamp' => Carbon::parse($validatedData['timestamp'])->setTimezone('UTC')->toDateTimeString(), // Ensure string format for DB unique check
                ],
                [ // Data to create if not found, or data to fill if you were using updateOrCreate
                    'heart_rate' => $validatedData['heart_rate'] ?? null,
                    'temperature_celsius' => $validatedData['temperature_celsius'] ?? null,
                    'blood_pressure_systolic' => $validatedData['blood_pressure_systolic'] ?? null,
                    'blood_pressure_diastolic' => $validatedData['blood_pressure_diastolic'] ?? null,
                    'stress_level_indicator' => $validatedData['stress_level_indicator'] ?? null,
                    'activity_level' => $validatedData['activity_level'] ?? null,
                ]
            );

            if ($metric->wasRecentlyCreated) {
                // Only check for alerts if it's a new metric entry
                $this->alertService->checkForHealthAlerts($metric->load('iotDevice', 'parolee')); // Eager load for service
            } else {
                Log::info('Duplicate health metric received, not processed for alerts.', ['metric_id' => $metric->id]);
            }

            return response()->json(['message' => 'Health metric recorded successfully.'], HttpResponse::HTTP_CREATED);

        } catch (\Exception $e) {
            Log::error('Failed to record health metric: ' . $e->getMessage(), ['device_eui' => $validatedData['device_eui'], 'exception_trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to record health metric.'], HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}