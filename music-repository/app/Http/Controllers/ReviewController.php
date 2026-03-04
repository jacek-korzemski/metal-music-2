<?php

namespace App\Http\Controllers;
use App\Models\Review;

use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function store(Request $request)
    {
        try
        {
            $body = json_decode($request->getContent());
        }
        catch (Exception $e)
        {
            error_log($e->getMessage());
            exit;
        }

        if ($body->secret != env('GLOBAL_USER_SECRET')) 
        {
            error_log("Invalid secret!");
            echo 'Critical error!';
            exit;
        }

        try
        {
            $review = new Review;
 
            $review->userId = $body->userId;
            $review->userName = $body->userName;
            $review->videoId = $body->videoId;
            $review->content = $body->content;

            $review->save();
            return '{"message": "ok"}';
        }
        catch (Exception $e)
        {
            error_log($e->getMessage());
            exit;
        }
    }
}
