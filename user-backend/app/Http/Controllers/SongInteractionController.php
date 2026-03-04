<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\CommentedSong;
use App\Models\Rating;
use App\Models\RatedSong;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SongInteractionController extends Controller
{
    public function getComments(int $songId): JsonResponse
    {
        $comments = Comment::where('song_id', $songId)
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($comment) => [
                'id' => $comment->id,
                'user_name' => $comment->user->name,
                'content' => $comment->content,
                'created_at' => $comment->created_at,
            ]);

        return response()->json($comments);
    }

    public function addComment(Request $request, int $songId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth('api')->user();

        Comment::create([
            'user_id' => $user->id,
            'song_id' => $songId,
            'content' => $request->content,
        ]);

        $commentCount = Comment::where('song_id', $songId)->count();

        CommentedSong::updateOrCreate(
            ['song_id' => $songId],
            ['comment_count' => $commentCount]
        );

        return response()->json(['message' => 'Comment added'], 201);
    }

    public function getRatings(Request $request, int $songId): JsonResponse
    {
        $ratedSong = RatedSong::where('song_id', $songId)->first();

        $response = [
            'average_rating' => $ratedSong?->average_rating ?? 0,
            'rating_count' => $ratedSong?->rating_count ?? 0,
            'user_rating' => null,
        ];

        try {
            $user = auth('api')->user();
            if ($user) {
                $userRating = Rating::where('song_id', $songId)
                    ->where('user_id', $user->id)
                    ->first();
                $response['user_rating'] = $userRating?->rating;
            }
        } catch (\Exception $e) {
            // No valid token - that's fine for public endpoint
        }

        return response()->json($response);
    }

    public function addOrUpdateRating(Request $request, int $songId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'rating' => 'required|integer|min:1|max:5',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth('api')->user();

        Rating::updateOrCreate(
            ['user_id' => $user->id, 'song_id' => $songId],
            ['rating' => $request->rating]
        );

        $avgRating = Rating::where('song_id', $songId)->avg('rating');
        $ratingCount = Rating::where('song_id', $songId)->count();

        RatedSong::updateOrCreate(
            ['song_id' => $songId],
            [
                'average_rating' => round($avgRating, 2),
                'rating_count' => $ratingCount,
            ]
        );

        return response()->json([
            'message' => 'Rating saved',
            'average_rating' => round($avgRating, 2),
            'rating_count' => $ratingCount,
        ]);
    }

    public function mostCommented(): JsonResponse
    {
        $songs = CommentedSong::orderBy('comment_count', 'desc')
            ->take(20)
            ->get(['song_id', 'comment_count']);

        return response()->json($songs);
    }

    public function bestRated(): JsonResponse
    {
        $songs = RatedSong::orderBy('average_rating', 'desc')
            ->orderBy('rating_count', 'desc')
            ->take(20)
            ->get(['song_id', 'average_rating', 'rating_count']);

        return response()->json($songs);
    }
}
