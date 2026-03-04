<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commented_songs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('song_id')->unique();
            $table->unsignedInteger('comment_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commented_songs');
    }
};
