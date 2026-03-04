<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\CommentedSong;
use App\Models\Rating;
use App\Models\RatedSong;
use Illuminate\Http\JsonResponse;

class AdminController extends Controller
{
    public function getAllComments(): JsonResponse
    {
        $comments = Comment::with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($comment) => [
                'id' => $comment->id,
                'song_id' => $comment->song_id,
                'user_name' => $comment->user->name,
                'content' => $comment->content,
                'created_at' => $comment->created_at,
            ]);

        return response()->json($comments);
    }

    public function deleteComment(int $id): JsonResponse
    {
        $comment = Comment::findOrFail($id);
        $songId = $comment->song_id;

        $comment->delete();

        $commentCount = Comment::where('song_id', $songId)->count();
        if ($commentCount === 0) {
            CommentedSong::where('song_id', $songId)->delete();
        } else {
            CommentedSong::updateOrCreate(
                ['song_id' => $songId],
                ['comment_count' => $commentCount]
            );
        }

        return response()->json(['message' => 'Comment deleted']);
    }

    public function getAllRatings(): JsonResponse
    {
        $ratings = Rating::with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($rating) => [
                'id' => $rating->id,
                'song_id' => $rating->song_id,
                'user_name' => $rating->user->name,
                'rating' => $rating->rating,
                'created_at' => $rating->created_at,
            ]);

        return response()->json($ratings);
    }

    public function deleteRating(int $id): JsonResponse
    {
        $rating = Rating::findOrFail($id);
        $songId = $rating->song_id;

        $rating->delete();

        $remaining = Rating::where('song_id', $songId);
        $count = $remaining->count();

        if ($count === 0) {
            RatedSong::where('song_id', $songId)->delete();
        } else {
            $avg = $remaining->avg('rating');
            RatedSong::updateOrCreate(
                ['song_id' => $songId],
                [
                    'average_rating' => round($avg, 2),
                    'rating_count' => $count,
                ]
            );
        }

        return response()->json(['message' => 'Rating deleted']);
    }
}
