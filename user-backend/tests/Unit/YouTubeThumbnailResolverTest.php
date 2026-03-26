<?php

namespace Tests\Unit;

use App\Services\YouTubeThumbnailResolver;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class YouTubeThumbnailResolverTest extends TestCase
{
    public function test_resolve_returns_null_for_empty_video_id(): void
    {
        $resolver = new YouTubeThumbnailResolver;

        $this->assertNull($resolver->resolve(null));
        $this->assertNull($resolver->resolve(''));
        $this->assertNull($resolver->resolve('   '));
    }

    public function test_resolve_returns_null_for_invalid_characters(): void
    {
        $resolver = new YouTubeThumbnailResolver;

        $this->assertNull($resolver->resolve('ab<cd'));
    }

    public function test_resolve_picks_first_successful_variant(): void
    {
        Http::fake([
            'https://img.youtube.com/vi/abcDEF12345/maxresdefault.jpg' => Http::response('', 404),
            'https://img.youtube.com/vi/abcDEF12345/sddefault.jpg' => Http::response('', 200, [
                'Content-Length' => '12000',
            ]),
        ]);

        $resolver = new YouTubeThumbnailResolver;
        $url = $resolver->resolve('abcDEF12345');

        $this->assertSame('https://img.youtube.com/vi/abcDEF12345/sddefault.jpg', $url);
    }

    public function test_resolve_returns_maxres_when_available(): void
    {
        Http::fake([
            'https://img.youtube.com/vi/xyz/maxresdefault.jpg' => Http::response('', 200, [
                'Content-Length' => '90000',
            ]),
        ]);

        $resolver = new YouTubeThumbnailResolver;
        $url = $resolver->resolve('xyz');

        $this->assertSame('https://img.youtube.com/vi/xyz/maxresdefault.jpg', $url);
    }
}
