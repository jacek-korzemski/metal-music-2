<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Services\YouTubeThumbnailResolver;
use Illuminate\Http\JsonResponse;

class ExportReviewController extends Controller
{
    public function __construct(
        private readonly YouTubeThumbnailResolver $youTubeThumbnailResolver
    ) {}

    public function index(): JsonResponse
    {
        $reviews = Review::query()
            ->where('skip_export', false)
            ->orderByDesc('updated_at')
            ->limit(50)
            ->get();

        $payload = $reviews->map(function (Review $review) {
            $featuredImageUrl = $this->youTubeThumbnailResolver->resolve($review->video_id);

            return [
                'id' => $review->id,
                'title' => $review->song_title,
                'content' => $review->content_html,
                'updated_at' => $review->updated_at,
                'video_id' => $review->video_id,
                'featured_image_url' => $featuredImageUrl,
            ];
        });

        return response()->json($payload);
    }
}
