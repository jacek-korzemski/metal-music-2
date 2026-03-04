<?php

use App\Models\Music;
use App\Models\Channels;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return '<code>Server is running</code>';
});

Route::get("/getNewVideos", function() {
    return Music::where('hide', null)->orderBy('published_at', 'desc')->take(100)->get();
});

Route::get("/getVideoById/{id}", function($id) {
    return Music::where('id', $id)->get();
});

Route::get("/getAllChannels", function() {
    return Channels::all();
});

Route::get('/getChannelById/{id}', function($id) {
    $channel_id = Channels::where('id', $id)->get()[0]['channel_id'];
    return Music::where([
        'channel_id' => $channel_id,
        'hide' => null
        ])->orderBy('published_at', 'desc')->get();
});

Route::get('/search/{s}', function($s) {
    return Music::where('title', 'like', '%'.$s.'%')->get();
});

Route::get('/getRandomFromChannel/{id}', function($id) {
    return Music::where('channel_id', $id)->inRandomOrder()->limit(10)->get();
});
