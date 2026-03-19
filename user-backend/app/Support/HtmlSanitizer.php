<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

/**
 * Server-side HTML cleanup for rich text (WYSIWYG).
 * Uses DOM — regex na całym HTML potrafił obcinać treść przy wielu akapitach.
 */
final class HtmlSanitizer
{
    /** @var array<string, true> */
    private const ALLOWED_TAGS = [
        'p' => true, 'br' => true, 'strong' => true, 'b' => true, 'em' => true, 'i' => true,
        'u' => true, 's' => true, 'strike' => true, 'ul' => true, 'ol' => true, 'li' => true,
        'h1' => true, 'h2' => true, 'h3' => true, 'h4' => true, 'h5' => true, 'h6' => true,
        'a' => true, 'blockquote' => true,
        'table' => true, 'thead' => true, 'tbody' => true, 'tr' => true, 'th' => true, 'td' => true,
        'span' => true, 'div' => true, 'font' => true, 'hr' => true,
    ];

    public static function purify(string $dirty): string
    {
        $html = str_replace("\0", '', $dirty);

        $html = preg_replace('#<script\b[^>]*>.*?</script>#is', '', $html) ?? '';
        $html = preg_replace('#<style\b[^>]*>.*?</style>#is', '', $html) ?? '';
        $html = preg_replace('#<(iframe|object|embed|form|input|button|meta|link|base)\b[^>]*>.*?</\1>#is', '', $html) ?? '';
        $html = preg_replace('#<(iframe|object|embed|form|input|button|meta|link|base)\b[^>]*/?>#is', '', $html) ?? '';

        $trimmed = trim($html);
        if ($trimmed === '') {
            return '';
        }

        $allowedList = implode('', array_map(
            fn (string $t) => "<{$t}>",
            array_keys(self::ALLOWED_TAGS)
        ));

        $internal = libxml_use_internal_errors(true);
        $dom = new DOMDocument();
        $wrapped = '<?xml encoding="UTF-8"><div id="__sanitizer_root__">'
            . $trimmed
            . '</div>';

        $loaded = @$dom->loadHTML($wrapped, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();
        libxml_use_internal_errors($internal);

        $root = $dom->getElementById('__sanitizer_root__');
        if (! $loaded || ! $root) {
            return trim(strip_tags($html, $allowedList));
        }

        self::sanitizeTree($root);

        $out = '';
        foreach ($root->childNodes as $child) {
            $out .= $dom->saveHTML($child);
        }

        return trim($out);
    }

    private static function sanitizeTree(DOMNode $node): void
    {
        if (! $node->hasChildNodes()) {
            return;
        }

        $children = [];
        foreach ($node->childNodes as $child) {
            $children[] = $child;
        }

        foreach ($children as $child) {
            if ($child instanceof DOMElement) {
                $tag = strtolower($child->tagName);

                if (! isset(self::ALLOWED_TAGS[$tag])) {
                    self::sanitizeTree($child);
                    while ($child->firstChild) {
                        $node->insertBefore($child->firstChild, $child);
                    }
                    $node->removeChild($child);

                    continue;
                }

                self::stripDangerousAttributes($child);
                self::sanitizeTree($child);
            }
        }
    }

    private static function stripDangerousAttributes(DOMElement $el): void
    {
        $remove = [];
        foreach ($el->attributes ?? [] as $attr) {
            $name = strtolower($attr->nodeName);
            if (str_starts_with($name, 'on')) {
                $remove[] = $attr->nodeName;

                continue;
            }
            if ($name === 'href' && preg_match('#^\s*(javascript:|data:|vbscript:)#i', (string) $attr->nodeValue)) {
                $remove[] = $attr->nodeName;
            }
        }
        foreach ($remove as $name) {
            $el->removeAttribute($name);
        }
    }
}
