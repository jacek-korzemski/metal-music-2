<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommentedSong extends Model
{
    protected $fillable = [
        'song_id',
        'comment_count',
    ];
}
