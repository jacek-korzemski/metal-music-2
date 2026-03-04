<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RatedSong extends Model
{
    protected $fillable = [
        'song_id',
        'average_rating',
        'rating_count',
    ];
}
