<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyWordPressExportKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $configured = config('services.wordpress_export.api_key');

        if (! is_string($configured) || $configured === '') {
            return response()->json(['message' => 'Export not configured'], 503);
        }

        $provided = $this->extractKey($request);

        if ($provided === null || ! hash_equals($configured, $provided)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return $next($request);
    }

    private function extractKey(Request $request): ?string
    {
        $header = $request->header('X-API-Key');
        if (is_string($header) && $header !== '') {
            return $header;
        }

        $authorization = $request->header('Authorization', '');
        if (is_string($authorization) && str_starts_with($authorization, 'Bearer ')) {
            $token = trim(substr($authorization, 7));
            if ($token !== '') {
                return $token;
            }
        }

        return null;
    }
}
