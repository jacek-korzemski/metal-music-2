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

        $categorySlug = (string) config('services.wordpress_export.category_slug', 'recenzje');

        $payload = $reviews->map(function (Review $review) use ($categorySlug) {
            $featuredImageUrl = $this->youTubeThumbnailResolver->resolve($review->video_id);

            return [
                'id' => $review->id,
                'title' => $review->song_title,
                'content' => $review->content_html,
                'updated_at' => $review->updated_at,
                'video_id' => $review->video_id,
                'featured_image_url' => $featuredImageUrl,
                'category_slug' => $categorySlug,
            ];
        });

        return response()->json($payload);
    }
}
