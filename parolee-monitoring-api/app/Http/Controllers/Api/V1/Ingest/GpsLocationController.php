<?php

namespace App\Http\Controllers\Api\V1\Ingest;

use App\Http\Controllers\Controller;
use App\Models\GpsLocation;
use App\Models\IotDevice;
use App\Services\GeoFenceService; // <-- IMPORT GeoFenceService
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB; // For transaction

class GpsLocationController extends Controller
{
    protected GeoFenceService $geoFenceService;

    public function __construct(GeoFenceService $geoFenceService)
    {
        $this->geoFenceService = $geoFenceService;
        // In a real app, you'd have middleware for device authentication
        // $this->middleware('auth.device');
    }

    /**
     * Store new GPS location reading(s) from an IoT device.
     * Can accept a single location or an array of locations (batch).
     */
    public function store(Request $request): JsonResponse
    {
        // Basic check for a shared secret (SIMPLISTIC - REPLACE WITH ROBUST AUTH)
        if ($request->header('X-Device-Secret') !== env('DEVICE_INGEST_SECRET')) {
            return response()->json(['message' => 'Unauthorized device.'], HttpResponse::HTTP_UNAUTHORIZED);
        }

        $inputData = $request->all();
        // Simple check: if the request body is an array AND its first element is also an array (likely a batch of locations)
        $isBatch = is_array($inputData) && !empty($inputData) && is_array(current($inputData));

        $locationsToValidate = $isBatch ? $inputData : [$inputData];

        // Define base rules for a single location object
        $singleLocationRules = [
            'device_eui' => ['required', 'string', 'exists:iot_devices,device_eui'],
            'timestamp' => ['required', 'date_format:Y-m-d H:i:s|Y-m-d\TH:i:sP|U'], // Accept ISO8601, SQL datetime, or Unix timestamp
            'latitude' => ['required', 'numeric', 'min:-90', 'max:90'],
            'longitude' => ['required', 'numeric', 'min:-180', 'max:180'],
            'accuracy_meters' => ['nullable', 'numeric', 'min:0'],
            'speed_kmh' => ['nullable', 'numeric', 'min:0'],
            'altitude_meters' => ['nullable', 'numeric'],
        ];

        // Adapt rules for batch or single
        $rules = $isBatch ? collect($singleLocationRules)->mapWithKeys(fn ($value, $key) => ["*.$key" => $value])->all()
                         : $singleLocationRules;

        $validator = Validator::make($locationsToValidate, $rules);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], HttpResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validatedEntries = $validator->validated();
        // If it wasn't a batch initially, $validatedEntries is a single location object.
        // We wrap it in an array for consistent processing.
        $locationsToProcess = $isBatch ? $validatedEntries : [$validatedEntries];


        $processedCount = 0;
        $errorMessages = [];

        DB::beginTransaction();
        try {
            foreach ($locationsToProcess as $index => $locationData) {
                $device = IotDevice::where('device_eui', $locationData['device_eui'])->first();

                if (!$device || $device->status !== 'active' || !$device->parolee_user_id) {
                    $errorMessages[$index ?: 0] = "Device {$locationData['device_eui']} not active, not assigned, or not found.";
                    Log::warning('GPS data for inactive/unassigned device.', ['device_eui' => $locationData['device_eui']]);
                    continue; // Skip this entry
                }

                $gpsLocation = GpsLocation::create([
                    'iot_device_id' => $device->id,
                    'parolee_user_id' => $device->parolee_user_id,
                    'timestamp' => Carbon::parse($locationData['timestamp'])->setTimezone('UTC'),
                    'latitude' => $locationData['latitude'],
                    'longitude' => $locationData['longitude'],
                    'accuracy_meters' => $locationData['accuracy_meters'] ?? null,
                    'speed_kmh' => $locationData['speed_kmh'] ?? null,
                    'altitude_meters' => $locationData['altitude_meters'] ?? null,
                ]);

                // Trigger Geo-fence Breach Check
                $this->geoFenceService->checkForBreaches($gpsLocation);
                // Note: If checkForBreaches needs to be queued for performance, dispatch a job here instead.
                // \App\Jobs\CheckGeofenceBreach::dispatch($gpsLocation);

                $processedCount++;
            }
            DB::commit();

            if ($processedCount > 0 && empty($errorMessages)) {
                return response()->json(['message' => "$processedCount GPS location(s) recorded successfully."], HttpResponse::HTTP_CREATED);
            } elseif ($processedCount > 0 && !empty($errorMessages)) {
                return response()->json([
                    'message' => "Partially recorded GPS locations. $processedCount successful.",
                    'errors' => $errorMessages
                ], HttpResponse::HTTP_MULTI_STATUS); // 207 Multi-Status
            } elseif (empty($errorMessages)) { // No data to process (e.g. empty batch array sent)
                 return response()->json(['message' => 'No GPS location data provided to record.'], HttpResponse::HTTP_BAD_REQUEST);
            }
            else { // All entries failed
                return response()->json([
                    'message' => 'Failed to record any GPS locations.',
                    'errors' => $errorMessages
                ], HttpResponse::HTTP_BAD_REQUEST);
            }

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Critical error during GPS data ingestion: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Server error during GPS data ingestion.'], HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}