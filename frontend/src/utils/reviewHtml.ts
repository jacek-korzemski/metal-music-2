import DOMPurify from 'dompurify';
import type { Config } from 'dompurify';
import { normalizeReviewHtml } from './normalizeReviewHtml';

/** Zgodne z user-backend HtmlSanitizer + formatowanie z execCommand */
export const REVIEW_HTML_PURIFY: Config = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'a',
    'blockquote',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'span',
    'div',
    'font',
    'hr',
  ],
  ALLOWED_ATTR: [
    'href',
    'target',
    'rel',
    'colspan',
    'rowspan',
    'align',
    'style',
    'color',
    'face',
    'size',
  ],
  ALLOW_DATA_ATTR: false,
};

export function sanitizeRichTextHtml(html: string): string {
  return String(DOMPurify.sanitize(html, REVIEW_HTML_PURIFY));
}

/** Treść do API / zapisu: <p> zamiast <div>, goły tekst w <p>, potem DOMPurify. */
export function finalizeReviewHtml(html: string): string {
  return sanitizeRichTextHtml(normalizeReviewHtml(html));
}
