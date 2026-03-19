<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMXPath;

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
        self::normalizeReviewParagraphs($dom, $root);

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

    /**
     * Ujednolica akapity jak frontend normalizeReviewHtml: goły tekst → <p>, <div> bez dzieci-bloków → <p>, inaczej unwrap.
     */
    private static function normalizeReviewParagraphs(DOMDocument $dom, DOMElement $root): void
    {
        for ($i = 0; $i < 12; $i++) {
            $before = $dom->saveHTML($root);
            self::wrapLooseTextNodesInSubtree($root);
            self::normalizeDivElementsPass($dom, $root);
            $after = $dom->saveHTML($root);
            if ($before === $after) {
                break;
            }
        }
    }

    private static function wrapLooseTextNodesInSubtree(DOMNode $container): void
    {
        if (! $container->hasChildNodes()) {
            return;
        }

        $children = [];
        foreach ($container->childNodes as $child) {
            $children[] = $child;
        }
        foreach ($children as $child) {
            if ($child instanceof DOMElement) {
                self::wrapLooseTextNodesInSubtree($child);
            }
        }

        $children = [];
        foreach ($container->childNodes as $child) {
            $children[] = $child;
        }
        if (! $container instanceof DOMElement || ! self::shouldWrapLooseTextInElement($container)) {
            return;
        }

        foreach ($children as $child) {
            if ($child->nodeType !== XML_TEXT_NODE) {
                continue;
            }
            $text = (string) $child->textContent;
            if (trim($text) === '') {
                if ($text === '') {
                    $container->removeChild($child);
                }

                continue;
            }
            $doc = $container->ownerDocument;
            if (! $doc instanceof DOMDocument) {
                continue;
            }
            $p = $doc->createElement('p');
            $container->insertBefore($p, $child);
            $p->appendChild($child);
        }
    }

    /** @see frontend normalizeReviewHtml — nie owijać tekstu już w <p> / nagłówkach (unikaj <p><p>). */
    private static function shouldWrapLooseTextInElement(DOMElement $el): bool
    {
        $tag = strtolower($el->tagName);

        return in_array($tag, ['div', 'blockquote', 'td', 'th', 'li', 'ul', 'ol'], true);
    }

    private static function normalizeDivElementsPass(DOMDocument $dom, DOMElement $context): bool
    {
        $xpath = new DOMXPath($dom);
        $divs = [];
        foreach ($xpath->query('descendant::div', $context) as $n) {
            if ($n instanceof DOMElement) {
                $divs[] = $n;
            }
        }
        $divs = array_reverse($divs);
        $changed = false;

        foreach ($divs as $div) {
            if (! $div->parentNode) {
                continue;
            }

            $hasBlockChild = false;
            foreach ($div->childNodes as $ch) {
                if ($ch instanceof DOMElement && self::isBlockLikeElement($ch)) {
                    $hasBlockChild = true;
                    break;
                }
            }

            if (! $hasBlockChild) {
                $p = $dom->createElement('p');
                while ($div->firstChild) {
                    $p->appendChild($div->firstChild);
                }
                foreach (['align', 'style'] as $attr) {
                    if ($div->hasAttribute($attr)) {
                        $p->setAttribute($attr, $div->getAttribute($attr));
                    }
                }
                $div->parentNode->replaceChild($p, $div);
                $changed = true;
            } else {
                $parent = $div->parentNode;
                while ($div->firstChild) {
                    $parent->insertBefore($div->firstChild, $div);
                }
                $parent->removeChild($div);
                $changed = true;
            }
        }

        return $changed;
    }

    private static function isBlockLikeElement(DOMElement $el): bool
    {
        $tag = strtolower($el->tagName);

        return in_array($tag, [
            'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'blockquote', 'hr',
        ], true);
    }
}
