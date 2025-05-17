<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\IotDeviceResource;
use App\Models\IotDevice;
use App\Models\User; // For assigning device to parolee
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class IotDeviceController extends Controller
{
    /**
     * Display a listing of the IoT devices.
     */
    public function index(Request $request): JsonResponse
    {
        $query = IotDevice::with('parolee:id,name,email'); // Eager load basic parolee info

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('device_eui', 'like', "%{$searchTerm}%")
                  ->orWhere('name', 'like', "%{$searchTerm}%");
            });
        }
        if ($request->filled('parolee_id')) {
            $query->where('parolee_user_id', $request->parolee_id);
        }

        $devices = $query->latest()->paginate($request->input('per_page', 15));
        return IotDeviceResource::collection($devices)->response();
    }

    /**
     * Store a newly created IoT device in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'device_eui' => ['required', 'string', 'max:255', 'unique:iot_devices,device_eui'],
            'name' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:100', Rule::in(['ankle_monitor', 'health_tracker', 'panic_button', 'other'])],
            'parolee_user_id' => ['nullable', 'integer', 'exists:users,id,user_type,parolee'], // Ensure user exists and is a parolee
            'status' => ['sometimes', 'string', Rule::in(['unassigned', 'active', 'inactive', 'maintenance', 'lost'])],
            'battery_level' => ['nullable', 'integer', 'min:0', 'max:100'],
            'firmware_version' => ['nullable', 'string', 'max:50'],
            'meta_data' => ['nullable', 'array']
        ]);

        // If parolee_user_id is provided, status should ideally be 'active'
        if (!empty($validated['parolee_user_id']) && empty($validated['status'])) {
            $validated['status'] = 'active';
        } elseif (empty($validated['parolee_user_id']) && empty($validated['status'])) {
            $validated['status'] = 'unassigned';
        }


        try {
            DB::beginTransaction();
            // Ensure a parolee isn't assigned more than one active primary device of certain types (e.g. ankle_monitor)
            if (!empty($validated['parolee_user_id']) && in_array($validated['type'], ['ankle_monitor', 'health_tracker'])) {
                $existingDevice = IotDevice::where('parolee_user_id', $validated['parolee_user_id'])
                                          ->where('type', $validated['type'])
                                          ->where('status', 'active')
                                          ->first();
                if ($existingDevice) {
                    DB::rollBack();
                    return response()->json(['message' => "Parolee already has an active '{$validated['type']}'. Deactivate or unassign it first."], HttpResponse::HTTP_CONFLICT);
                }
            }

            $device = IotDevice::create($validated);
            DB::commit();
            return (new IotDeviceResource($device->load('parolee:id,name')))->response()->setStatusCode(HttpResponse::HTTP_CREATED);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('IoT Device creation failed: ' . $e->getMessage(), ['exception_trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to create IoT device.'], HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified IoT device.
     */
    public function show(IotDevice $iotDevice): JsonResponse // Route model binding using 'iotDevice'
    {
        return (new IotDeviceResource($iotDevice->load('parolee:id,name')))->response();
    }

    /**
     * Update the specified IoT device in storage.
     */
    public function update(Request $request, IotDevice $iotDevice): JsonResponse
    {
        $validated = $request->validate([
            'device_eui' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('iot_devices', 'device_eui')->ignore($iotDevice->id)],
            'name' => ['nullable', 'string', 'max:255'],
            'type' => ['sometimes', 'required', 'string', 'max:100', Rule::in(['ankle_monitor', 'health_tracker', 'panic_button', 'other'])],
            'parolee_user_id' => ['nullable', 'integer', 'exists:users,id,user_type,parolee'],
            'status' => ['sometimes', 'required', 'string', Rule::in(['unassigned', 'active', 'inactive', 'maintenance', 'lost'])],
            'battery_level' => ['nullable', 'integer', 'min:0', 'max:100'],
            'firmware_version' => ['nullable', 'string', 'max:50'],
            'meta_data' => ['nullable', 'array']
        ]);

        try {
            DB::beginTransaction();

            // Logic to handle status based on parolee_user_id assignment
            if ($request->has('parolee_user_id')) {
                if (empty($validated['parolee_user_id'])) { // Unassigning
                    $validated['status'] = $validated['status'] ?? 'unassigned'; // Keep status or set to unassigned
                } else { // Assigning to a new parolee
                     // Ensure a parolee isn't assigned more than one active primary device
                    if (in_array($iotDevice->type, ['ankle_monitor', 'health_tracker'])) {
                        $existingDevice = IotDevice::where('parolee_user_id', $validated['parolee_user_id'])
                                                  ->where('type', $iotDevice->type)
                                                  ->where('status', 'active')
                                                  ->where('id', '!=', $iotDevice->id) // Exclude current device
                                                  ->first();
                        if ($existingDevice) {
                            DB::rollBack();
                            return response()->json(['message' => "Parolee already has an active '{$iotDevice->type}'. Deactivate or unassign it first."], HttpResponse::HTTP_CONFLICT);
                        }
                    }
                    $validated['status'] = $validated['status'] ?? 'active'; // Default to active if assigning
                }
            }

            $iotDevice->update($validated);
            DB::commit();
            return (new IotDeviceResource($iotDevice->fresh()->load('parolee:id,name')))->response();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('IoT Device update failed: ' . $e->getMessage(), ['iot_device_id' => $iotDevice->id, 'exception_trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to update IoT device.'], HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified IoT device from storage.
     */
    public function destroy(IotDevice $iotDevice): JsonResponse
    {
        // Add checks if device is active or has recent data before deleting
        if ($iotDevice->status === 'active' && $iotDevice->parolee_user_id) {
            return response()->json(['message' => 'Cannot delete an active and assigned device. Please unassign or set to inactive first.'], HttpResponse::HTTP_FORBIDDEN);
        }

        try {
            DB::beginTransaction();
            // Consider what to do with historical data from this device (soft delete device, or orphan data?)
            $iotDevice->delete();
            DB::commit();
            return response()->json(null, HttpResponse::HTTP_NO_CONTENT);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('IoT Device deletion failed: ' . $e->getMessage(), ['iot_device_id' => $iotDevice->id, 'exception_trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to delete IoT device.'], HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}