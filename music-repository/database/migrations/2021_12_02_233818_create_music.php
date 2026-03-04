<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMusic extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('music', function (Blueprint $table) {
            $table->id();
            $table->string('channel_id');
            $table->string('video_id');
            $table->string('title');
            $table->string('url');
            $table->dateTime('published_at');
            $table->text('default_thumbnail');
            $table->text('medium_thumbnail');
            $table->text('high_thumbnail');
            $table->string('channel_title');
            $table->tinyInteger('hide');
            $table->tinyInteger('deleted');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('music');
    }
}
