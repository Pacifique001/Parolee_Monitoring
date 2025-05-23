<?php

namespace App\Http\Controllers\Api\V1\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Assessment; // Import Assessment model
use App\Models\Notification as SystemNotification; // Alias if you have a Notification model for alerts
use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function overviewData(Request $request): JsonResponse
    {
        $staffUser = Auth::user();

        // TODO: Define how parolees are "assigned" or relevant to a staff member.
        // This could be via a pivot table (staff_parolee), or if assessments link them,
        // or if a parolee's case is assigned to a staff member on ParoleeProfile.
        // For now, let's assume we get all parolees as a placeholder.
        // In a real app, this query would be specific to the $staffUser.
        $relevantParoleeQuery = User::where('user_type', 'parolee');
        // Example: $relevantParoleeQuery = $staffUser->assignedParolees();

        $activeParoleesCount = (clone $relevantParoleeQuery)->where('status', 'active')->count();

        $pendingAssessmentsCount = Assessment::whereIn('parolee_user_id', (clone $relevantParoleeQuery)->pluck('id'))
                                            ->where('status', 'pending') // Or 'scheduled' and assessment_date is near
                                            // ->where('conducted_by_user_id', $staffUser->id) // If assigned to this staff
                                            ->count();

        $highRiskCasesCount = (clone $relevantParoleeQuery)
                                ->whereHas('paroleeProfile', function ($query) {
                                    $query->whereIn('current_risk_level', ['high', 'critical']);
                                })
                                ->count();

        $recentAssessments = Assessment::whereIn('parolee_user_id', (clone $relevantParoleeQuery)->pluck('id'))
            ->with(['parolee:id,name', 'parolee.paroleeProfile:user_id,parole_id_number,current_risk_level'])
            ->orderBy('next_review_date', 'asc') // Order by next review due soonest
            ->where(function($q){ // Show pending, scheduled or recently completed
                $q->whereIn('status', ['pending', 'scheduled'])
                  ->orWhere(function($q2){
                      $q2->where('status', 'completed')
                         ->where('assessment_date', '>=', Carbon::now()->subDays(7));
                  });
            })
            ->take(3)
            ->get()
            ->map(function (Assessment $assessment) {
                return [
                    'id' => $assessment->id,
                    'parolee_name' => $assessment->parolee->name ?? 'N/A',
                    'assessment_title' => $assessment->type,
                    'status_text' => ucfirst($assessment->status),
                    'last_assessment_date' => $assessment->assessment_date?->format('M d, Y'),
                    'next_review_date' => $assessment->next_review_date?->format('M d, Y'),
                    'case_number' => $assessment->parolee?->paroleeProfile?->parole_id_number ?? 'N/A',
                    'risk_level' => $assessment->parolee?->paroleeProfile?->current_risk_level ?? 'unknown',
                    'parolee_id' => $assessment->parolee_user_id,
                ];
            });

        // Mock Recent Notifications (replace with actual notification system data)
        // Example: Fetch from a 'notifications' table targeted to this staff user.
        $recentNotifications = [
            ['id' => 'staff_notif_1', 'message' => 'Parolee John Doe completed "Monthly Review"', 'time_ago' => '2 hours ago', 'type' => 'assessment_completed', 'link' => '/staff/assessments/XYZ'],
            ['id' => 'staff_notif_2', 'message' => 'New message from Officer Smith regarding Case P12345', 'time_ago' => '15 minutes ago', 'type' => 'new_message', 'link' => '/staff/messages/ABC'],
            ['id' => 'staff_notif_3', 'message' => 'Risk level increased for Parolee Jane Roe', 'time_ago' => '1 day ago', 'type' => 'risk_change', 'link' => '/staff/parolees/DEF'],
        ];

        return response()->json([
            'welcome_message' => "Welcome back, {$staffUser->name}",
            'summary_cards' => [
                ['label' => 'Active Parolees', 'value' => $activeParoleesCount, 'icon' => 'Users'],
                ['label' => 'Pending Assessments', 'value' => $pendingAssessmentsCount, 'icon' => 'ClipboardList'],
                ['label' => 'High Risk Cases', 'value' => $highRiskCasesCount, 'icon' => 'AlertTriangle'],
            ],
            'recent_assessments' => $recentAssessments,
            'recent_notifications' => $recentNotifications,
        ]);
    }
}