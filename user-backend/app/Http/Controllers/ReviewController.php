<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Support\HtmlSanitizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ReviewController extends Controller
{
    public function index(): JsonResponse
    {
        $reviews = Review::query()
            ->with('user:id,name')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Review $review) => $this->toReviewArray($review, withContent: false));

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

        return response()->json($this->toReviewArray($review, withContent: true));
    }

    public function upsert(Request $request, int $songId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'content_html' => 'required|string|max:500000',
            'song_title' => 'nullable|string|max:512',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth('api')->user();
        $clean = HtmlSanitizer::purify($request->content_html);

        $songTitle = $request->input('song_title');
        if (is_string($songTitle)) {
            $songTitle = Str::limit(trim(strip_tags($songTitle)), 512, '');
            if ($songTitle === '') {
                $songTitle = null;
            }
        } else {
            $songTitle = null;
        }

        $attributes = [
            'user_id' => $user->id,
            'content_html' => $clean,
        ];
        if ($songTitle !== null) {
            $attributes['song_title'] = $songTitle;
        }

        $review = Review::updateOrCreate(
            ['song_id' => $songId],
            $attributes
        );

        $review->load('user:id,name');

        return response()->json($this->toReviewArray($review, withContent: true), 200);
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
    private function toReviewArray(Review $review, bool $withContent): array
    {
        $base = [
            'id' => $review->id,
            'song_id' => $review->song_id,
            'song_title' => $review->song_title,
            'created_at' => $review->created_at,
            'updated_at' => $review->updated_at,
            'author' => [
                'name' => $review->user->name,
            ],
        ];

        if ($withContent) {
            $base['content_html'] = $review->content_html;
        }

        return $base;
    }
}
