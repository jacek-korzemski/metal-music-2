<?php

namespace App\Support;

/**
 * Server-side HTML cleanup for rich text (WYSIWYG).
 * Prefer pairing with client-side DOMPurify; this blocks obvious XSS vectors.
 */
final class HtmlSanitizer
{
    private const ALLOWED_TAGS = '<p><br><strong><b><em><i><u><ul><ol><li><h1><h2><h3><h4><h5><h6><a><blockquote><table><thead><tbody><tr><th><td><span><div><font><hr>';

    public static function purify(string $dirty): string
    {
        $html = str_replace("\0", '', $dirty);

        // Remove executable / style blocks entirely
        $html = preg_replace('#<script\b[^>]*>.*?</script>#is', '', $html) ?? '';
        $html = preg_replace('#<style\b[^>]*>.*?</style>#is', '', $html) ?? '';
        $html = preg_replace('#<(iframe|object|embed|form|input|button|meta|link|base)\b[^>]*>.*?</\1>#is', '', $html) ?? '';
        $html = preg_replace('#<(iframe|object|embed|form|input|button|meta|link|base)\b[^>]*/?>#is', '', $html) ?? '';

        $html = strip_tags($html, self::ALLOWED_TAGS);

        // Strip event handlers and javascript: URLs from remaining tags
        $html = preg_replace_callback(
            '/<([a-z][a-z0-9]*)\b([^>]*)>/is',
            static function (array $m): string {
                $tag = strtolower($m[1]);
                $attrs = $m[2];

                if ($tag === 'a') {
                    if (preg_match('/\bhref\s*=\s*("|\')(.*?)\1/is', $attrs, $hrefMatch)) {
                        $href = trim($hrefMatch[2]);
                        if (preg_match('#^\s*(javascript:|data:|vbscript:)#i', $href)) {
                            return "<{$tag}>";
                        }
                    }
                }

                $attrs = preg_replace('/\s+on\w+\s*=\s*("|\').*?\1/is', '', $attrs) ?? '';
                $attrs = preg_replace('/\s+on\w+\s*=\s*[^\s>]*/is', '', $attrs) ?? '';

                return '<'.$tag.trim(' '.$attrs).'>';
            },
            $html
        ) ?? $html;

        return trim($html);
    }
}
