<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\JsonResponse;

class ExportReviewController extends Controller
{
    public function index(): JsonResponse
    {
        $reviews = Review::query()
            ->where('skip_export', false)
            ->orderByDesc('updated_at')
            ->limit(50)
            ->get()
            ->map(fn (Review $review) => [
                'id' => $review->id,
                'title' => $review->song_title,
                'content' => $review->content_html,
                'updated_at' => $review->updated_at,
            ]);

        return response()->json($reviews);
    }
}
