<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Support\HtmlSanitizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    public function index(): JsonResponse
    {
        $reviews = Review::query()
            ->with('user:id,name')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Review $review) => [
                'id' => $review->id,
                'song_id' => $review->song_id,
                'updated_at' => $review->updated_at,
                'created_at' => $review->created_at,
                'author' => [
                    'name' => $review->user->name,
                ],
            ]);

        return response()->json($reviews);
    }

    public function showBySong(int $songId): JsonResponse
    {
        $review = Review::where('song_id', $songId)
            ->with('user:id,name')
            ->first();

        if (! $review) {
            return response()->json(['message' => 'Review not found'], 404);
        }

        return response()->json($this->formatReview($review));
    }

    public function upsert(Request $request, int $songId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'content_html' => 'required|string|max:500000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth('api')->user();
        $clean = HtmlSanitizer::purify($request->content_html);

        $review = Review::updateOrCreate(
            ['song_id' => $songId],
            [
                'user_id' => $user->id,
                'content_html' => $clean,
            ]
        );

        $review->load('user:id,name');

        return response()->json($this->formatReview($review), 200);
    }

    public function destroy(int $id): JsonResponse
    {
        $review = Review::find($id);

        if (! $review) {
            return response()->json(['message' => 'Review not found'], 404);
        }

        $review->delete();

        return response()->json(['message' => 'Review deleted']);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatReview(Review $review): array
    {
        return [
            'id' => $review->id,
            'song_id' => $review->song_id,
            'content_html' => $review->content_html,
            'created_at' => $review->created_at,
            'updated_at' => $review->updated_at,
            'author' => [
                'name' => $review->user->name,
            ],
        ];
    }
}
