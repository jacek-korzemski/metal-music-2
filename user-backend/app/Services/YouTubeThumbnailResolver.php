<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class YouTubeThumbnailResolver
{
    /** @var list<string> */
    private const VARIANTS = ['maxresdefault', 'sddefault', 'hqdefault'];

    public function resolve(?string $videoId): ?string
    {
        $id = $this->normalizeVideoId($videoId);
        if ($id === null) {
            return null;
        }

        foreach (self::VARIANTS as $variant) {
            $url = $this->buildUrl($id, $variant);
            if ($this->urlIsUsable($url)) {
                return $url;
            }
        }

        return null;
    }

    private function normalizeVideoId(?string $videoId): ?string
    {
        if ($videoId === null) {
            return null;
        }
        $trim = trim($videoId);
        if ($trim === '') {
            return null;
        }
        if (strlen($trim) > 32) {
            return null;
        }
        if (! preg_match('/^[a-zA-Z0-9_-]{1,32}$/', $trim)) {
            return null;
        }

        return $trim;
    }

    private function buildUrl(string $videoId, string $variant): string
    {
        return "https://img.youtube.com/vi/{$videoId}/{$variant}.jpg";
    }

    private function urlIsUsable(string $url): bool
    {
        try {
            $response = Http::timeout(2)
                ->connectTimeout(2)
                ->head($url);
        } catch (\Throwable) {
            return false;
        }

        if (! $response->successful()) {
            return false;
        }

        $len = $response->header('Content-Length');
        if ($len !== null && (int) $len <= 0) {
            return false;
        }

        return true;
    }
}
