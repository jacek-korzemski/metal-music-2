<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\SongInteractionController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:api')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::get('/songs/{songId}/comments', [SongInteractionController::class, 'getComments']);
Route::get('/songs/{songId}/ratings', [SongInteractionController::class, 'getRatings']);
Route::get('/most-commented', [SongInteractionController::class, 'mostCommented']);
Route::get('/best-rated', [SongInteractionController::class, 'bestRated']);

Route::middleware('auth:api')->group(function () {
    Route::post('/songs/{songId}/comments', [SongInteractionController::class, 'addComment']);
    Route::post('/songs/{songId}/ratings', [SongInteractionController::class, 'addOrUpdateRating']);
});
