<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MonthlyReportService;
use Illuminate\Http\Request;

class AdminReportController extends Controller
{
    public function __construct(
        private MonthlyReportService $monthlyReportService
    ) {
    }

    /**
     * Genera el reporte mensual administrativo.
     */
    public function monthly(Request $request)
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'between:1,12'],
        ]);

        $report = $this->monthlyReportService->generate(
            $validated['year'],
            $validated['month']
        );

        return response()->json([
            'data' => $report,
        ]);
    }
}