<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    protected $fillable = [
        'user_id',
        'song_id',
        'song_title',
        'video_id',
        'content_html',
        'skip_export',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'skip_export' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
