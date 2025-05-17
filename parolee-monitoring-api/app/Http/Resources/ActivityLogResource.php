<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class ActivityLogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $properties = $this->properties ?? collect(); // Ensure properties is a collection

        // Attempt to map fields based on your mockSystemLogs structure
        $type = $this->log_name; // Use log_name as the primary 'type'
        if ($properties->has('event_type')) { // Or if you store a specific event_type in properties
            $type = $properties->get('event_type');
        } elseif ($this->event) { // Spatie's 'event' (created, updated, deleted)
            $type = $this->event;
        }


        $action = $this->description; // The main description is the action

        $details = $properties->get('details');
        if (!$details && $this->description !== $action) { // If description is more detailed than a simple action verb
            // This part is tricky as spatie/laravel-activitylog often puts old/new attributes here.
            // For model events, you might want to customize how 'details' is formed.
            if ($properties->has('attributes') || $properties->has('old')) {
                $changedAttributes = $properties->get('attributes', []);
                $oldAttributes = $properties->get('old', []);
                $diff = array_diff_assoc($changedAttributes, $oldAttributes);
                if (!empty($diff)) {
                    $details = "Changes: " . json_encode($diff);
                } elseif (!empty($changedAttributes) && empty($oldAttributes) && $this->event === 'created') {
                    $details = "Created with data: " . json_encode($changedAttributes);
                }
            }
        }


        return [
            'id' => $this->id, // 'L001' style ID is not standard for DB auto-increment, but we return the DB ID
            'timestamp' => Carbon::parse($this->created_at)->toIso8601String(),
            'type' => $type, // Derived from log_name or event
            'user_identifier' => $this->causer?->name ?? ($this->causer?->email ?? ($properties->get('user_identifier', 'System'))), // Who did it
            'causer_id' => $this->causer_id,
            'causer_type' => $this->causer_type ? class_basename($this->causer_type) : null,
            'action' => $action, // What was done
            'details' => $details ?? $properties->except(['attributes', 'old'])->all(), // Custom details or remaining properties
            'subject_details' => [ // Information about what the action was performed ON
                'type' => $this->subject_type ? class_basename($this->subject_type) : null,
                'id' => $this->subject_id,
                'description' => $this->subject?->name ?? ($this->subject?->device_eui ?? $this->subject?->id ?? null),
            ],
            'ip_address' => $properties->get('ip_address'),
            'success' => $properties->get('success', true), // Default to true if not specified
            'raw_properties' => $this->properties, // Include all properties for debugging/flexibility
        ];
    }
}