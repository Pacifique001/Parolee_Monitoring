<?php

namespace App\Http\Controllers\Api\V1\Staff;

use App\Http\Controllers\Controller;
use App\Http\Resources\AssessmentResource;
use App\Models\Assessment;
use App\Models\User; // For parolee and staff
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AssessmentController extends Controller
{
    /**
     * Display a listing of assessments.
     * Scoped to parolees relevant to the authenticated staff member.
     * Or lists assessments for a specific parolee if parolee_user_id is provided.
     */
    public function index(Request $request): JsonResponse
    {
        $staffUser = Auth::user();
        $query = Assessment::with(['parolee:id,name', 'conductor:id,name']);

        // TODO: Implement proper scoping based on how staff are linked to parolees.
        // Example: If staff are directly assigned to parolees or cases.
        // For now, a staff member can see all assessments if they have the general permission.
        // Or, if a parolee_user_id is passed, filter by that.

        if ($request->filled('parolee_user_id')) {
            $query->where('parolee_user_id', $request->parolee_user_id);
        } elseif (!$staffUser->hasRole('System Administrator')) { // Non-admins see only assessments they conducted or are related to
            // This is a placeholder for more complex scoping logic
            // $query->where('conducted_by_user_id', $staffUser->id);
            // OR $query->whereIn('parolee_user_id', $staffUser->getAssignedParoleeIds());
        }


        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('type')) {
            $query->where('type', 'like', '%' . $request->type . '%');
        }
        if ($request->filled('start_date')) {
            $query->whereDate('assessment_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('assessment_date', '<=', $request->end_date);
        }

        $assessments = $query->latest('assessment_date')->latest('id')
                             ->paginate($request->input('per_page', 15));

        return AssessmentResource::collection($assessments)->response();
    }

    /**
     * Store a newly created assessment in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $staffUser = Auth::user();
        $validated = $request->validate([
            'parolee_user_id' => ['required', 'integer', 'exists:users,id,user_type,parolee'],
            'type' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', Rule::in(['pending', 'scheduled', 'in_progress', 'completed', 'overdue', 'cancelled'])],
            'notes' => ['nullable', 'string'],
            'recommendations' => ['nullable', 'array'],
            'recommendations.*' => ['string', 'max:500'],
            'assessment_date' => ['nullable', 'date_format:Y-m-d'],
            'next_review_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:assessment_date'],
            'details' => ['nullable', 'array'], // For any other structured data
        ]);

        // TODO: Add authorization check: Can this staff member create an assessment for this parolee?
        // e.g., if ($staffUser->cannot('createAssessmentFor', User::find($validated['parolee_user_id']))) abort(403);

        try {
            DB::beginTransaction();
            $assessment = Assessment::create([
                'parolee_user_id' => $validated['parolee_user_id'],
                'conducted_by_user_id' => $staffUser->id, // Logged-in staff is the conductor
                'type' => $validated['type'],
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
                'recommendations' => $validated['recommendations'] ?? null,
                'assessment_date' => $validated['assessment_date'] ?? null,
                'next_review_date' => $validated['next_review_date'] ?? null,
                'details' => $validated['details'] ?? null,
            ]);
            DB::commit();

            activity()
                ->causedBy($staffUser)
                ->performedOn($assessment)
                ->withProperties(['parolee_id' => $assessment->parolee_user_id, 'type' => $assessment->type])
                ->log('Assessment Created');

            return (new AssessmentResource($assessment->load(['parolee:id,name', 'conductor:id,name'])))
                    ->response()
                    ->setStatusCode(HttpResponse::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Assessment creation failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to create assessment.'], HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified assessment.
     */
    public function show(Assessment $assessment): JsonResponse
    {
        // TODO: Authorization check: Can this staff member view this assessment?
        // e.g., $this->authorize('view', $assessment);
        return (new AssessmentResource($assessment->load(['parolee:id,name', 'conductor:id,name'])))->response();
    }

    /**
     * Update the specified assessment in storage.
     */
    public function update(Request $request, Assessment $assessment): JsonResponse
    {
        $staffUser = Auth::user();
        // TODO: Authorization check: Can this staff member update this assessment?
        // e.g., $this->authorize('update', $assessment);

        $validated = $request->validate([
            // 'parolee_user_id' => ['sometimes', 'required', 'integer', 'exists:users,id,user_type,parolee'], // Usually parolee doesn't change
            'type' => ['sometimes', 'required', 'string', 'max:255'],
            'status' => ['sometimes', 'required', 'string', Rule::in(['pending', 'scheduled', 'in_progress', 'completed', 'overdue', 'cancelled'])],
            'notes' => ['nullable', 'string'],
            'recommendations' => ['nullable', 'array'],
            'recommendations.*' => ['string', 'max:500'],
            'assessment_date' => ['nullable', 'date_format:Y-m-d'],
            'next_review_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:assessment_date'],
            'details' => ['nullable', 'array'],
        ]);

        try {
            DB::beginTransaction();
            // Only update conducted_by if a super admin is changing it, or keep original
            // $validated['conducted_by_user_id'] = $assessment->conducted_by_user_id; // Keep original conductor
            $assessment->update($validated);
            DB::commit();

            activity()
                ->causedBy($staffUser)
                ->performedOn($assessment)
                ->withProperties(['parolee_id' => $assessment->parolee_user_id, 'changes' => $assessment->getChanges()])
                ->log('Assessment Updated');

            return (new AssessmentResource($assessment->fresh()->load(['parolee:id,name', 'conductor:id,name'])))->response();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Assessment update failed: ' . $e->getMessage(), ['assessment_id' => $assessment->id, 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to update assessment.'], HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified assessment from storage.
     */
    public function destroy(Assessment $assessment): JsonResponse
    {
        // TODO: Authorization check: Can this staff member delete this assessment?
        // e.g., $this->authorize('delete', $assessment);

        try {
            DB::beginTransaction();
            $paroleeId = $assessment->parolee_user_id; // For logging
            $assessmentType = $assessment->type;      // For logging
            $assessment->delete();
            DB::commit();

            activity()
                ->causedBy(Auth::user())
                ->withProperties(['parolee_id' => $paroleeId, 'assessment_type' => $assessmentType, 'assessment_id' => $assessment->id]) // subject is now deleted
                ->log('Assessment Deleted');

            return response()->json(null, HttpResponse::HTTP_NO_CONTENT);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Assessment deletion failed: ' . $e->getMessage(), ['assessment_id' => $assessment->id, 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Failed to delete assessment.'], HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

     /**
     * Display a listing of assessments for a specific parolee.
     * This is if you choose to have a nested route like /parolees/{user}/assessments
     */
    public function indexForParolee(Request $request, User $user): JsonResponse // $user is the parolee
    {
        if ($user->user_type !== 'parolee') {
            return response()->json(['message' => 'Assessments can only be listed for parolees.'], HttpResponse::HTTP_BAD_REQUEST);
        }

        // TODO: Authorization: Can the current staff view assessments for THIS parolee?

        $query = $user->assessments()->with('conductor:id,name')->latest('assessment_date'); // Assuming User model has `assessments()` hasMany relationship

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('type')) {
            $query->where('type', 'like', '%' . $request->type . '%');
        }

        $assessments = $query->paginate($request->input('per_page', 10));

        return AssessmentResource::collection($assessments)->response();
    }
}