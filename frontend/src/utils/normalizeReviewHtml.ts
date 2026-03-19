/**
 * Ujednolica treść recenzji do akapitów <p>:
 * - goły tekst w kontenerze → owinięty w <p>
 * - <div> bez bezpośrednich dzieci-bloków → <p>
 * - <div> z dziećmi-blokami (np. <p>, inny <div>) → rozwinięcie (unwrap), potem kolejne przejścia
 *
 * Wywoływane przy zapisie / odczycie HTML, żeby uniknąć mieszanki <div>/<p> z różnych źródeł.
 */
const BLOCK_TAGS = new Set([
  'DIV',
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'UL',
  'OL',
  'LI',
  'TABLE',
  'THEAD',
  'TBODY',
  'TR',
  'TH',
  'TD',
  'BLOCKQUOTE',
  'HR',
]);

function isBlockElement(el: Element): boolean {
  return BLOCK_TAGS.has(el.tagName);
}

function copyParagraphAttrs(from: HTMLElement, to: HTMLElement): void {
  for (const name of ['align', 'style']) {
    if (from.hasAttribute(name)) {
      to.setAttribute(name, from.getAttribute(name)!);
    }
  }
}

/**
 * Tylko tutaj goły tekst powinien trafiać w <p>.
 * NIGDY wewnątrz <p>/<h*>/inline — inaczej powstaje <p><p>…</p></p> i przeglądarka rozbija to na dziesiątki pustych <p>.
 */
const WRAP_LOOSE_TEXT_PARENT_TAGS = new Set([
  'DIV',
  'BLOCKQUOTE',
  'TD',
  'TH',
  'LI',
  'UL',
  'OL',
]);

function shouldWrapLooseTextIn(container: HTMLElement): boolean {
  return WRAP_LOOSE_TEXT_PARENT_TAGS.has(container.tagName);
}

/** Owija bezpośrednie węzły tekstowe w <p> tylko w dozwolonych kontenerach (rekurencja w dół). */
function wrapLooseTextNodes(container: HTMLElement): void {
  for (const node of Array.from(container.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      wrapLooseTextNodes(node as HTMLElement);
    }
  }

  if (!shouldWrapLooseTextIn(container)) {
    return;
  }

  for (const node of Array.from(container.childNodes)) {
    if (node.nodeType !== Node.TEXT_NODE) continue;
    const text = node.textContent ?? '';
    if (!text.trim()) {
      if (text.length === 0) node.parentNode?.removeChild(node);
      continue;
    }
    const p = document.createElement('p');
    container.insertBefore(p, node);
    p.appendChild(node);
  }
}

/** Od najgłębszych <div>: albo → <p>, albo unwrap jeśli w środku są bloki. */
function normalizeDivs(root: HTMLElement): void {
  const divs = Array.from(root.querySelectorAll('div')).reverse();
  for (const div of divs) {
    const el = div as HTMLElement;
    const blockChildren = Array.from(el.children).filter(isBlockElement);

    if (blockChildren.length === 0) {
      const p = document.createElement('p');
      while (el.firstChild) {
        p.appendChild(el.firstChild);
      }
      copyParagraphAttrs(el, p);
      el.replaceWith(p);
    } else {
      const parent = el.parentElement;
      if (!parent) continue;
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      el.remove();
    }
  }
}

const MAX_PASSES = 12;

export function normalizeReviewHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return '';

  const root = document.createElement('div');
  root.innerHTML = trimmed;

  for (let i = 0; i < MAX_PASSES; i++) {
    const before = root.innerHTML;
    wrapLooseTextNodes(root);
    normalizeDivs(root);
    if (root.innerHTML === before) break;
  }

  return root.innerHTML;
}
