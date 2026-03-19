import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import styled, { css } from 'styled-components';
import TurndownService from 'turndown';
import {
  finalizeReviewHtml,
  sanitizeRichTextHtml,
} from '../../utils/reviewHtml';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

export interface SimpleWYSIWYGProps {
  initialContent?: string;
  placeholder?: string;
  className?: string;
  /** Maks. wysokość przewijanego obszaru edycji (wartość CSS) */
  editorMaxHeight?: string;
  editorMinHeight?: string;
  /** @deprecated — użyj editorMaxHeight */
  height?: string;
  onChange?: (html: string) => void;
  /** Bazowa nazwa pliku przy eksporcie z ref (bez rozszerzenia) */
  exportBasename?: string;
  readOnly?: boolean;
}

export interface SimpleWYSIWYGRef {
  /** Surowe `innerHTML` edytora (bez normalizacji <div>→<p>). */
  getRawHtml: () => string;
  getHtml: () => string;
  getContent: () => string;
  setContent: (html: string) => void;
  getPlainText: () => string;
  getMarkdown: () => string;
  clear: () => void;
  focus: () => void;
  exportHtmlFile: () => void;
  exportMarkdownFile: () => void;
}

type BlockType = 'P' | 'H1' | 'H2' | 'H3';

interface ToolbarState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  blockType: BlockType;
  fontSize: string;
}

const Root = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 100%;
  min-height: calc(var(--swysiwyg-editor-min-h, 200px) + 100px);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
`;

const Toolbar = styled.div<{ $disabled: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;

  ${({ $disabled }) =>
    $disabled &&
    css`
      opacity: 0.65;
      pointer-events: none;
    `}
`;

const ToolbarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding-right: ${({ theme }) => theme.spacing.sm};
  margin-right: ${({ theme }) => theme.spacing.xs};
  border-right: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-right: none;
    padding-right: 0;
    margin-right: 0;
  }
`;

const ToolButton = styled.button<{ $active?: boolean }>`
  min-width: 28px;
  height: 28px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xs};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.surfaceActive : theme.colors.secondary};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSize.sm};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }
`;

const ToolSelect = styled.select`
  height: 28px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xs};
  background: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSize.sm};
  padding: 0 8px;
  min-width: 92px;
`;

const EditorScroll = styled.div`
  flex: 0 1 auto;
  min-height: var(--swysiwyg-editor-min-h, 240px);
  max-height: var(--swysiwyg-editor-max-h, min(62vh, 640px));
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable;
  /* Firefox: kciuk wyraźnie jaśniejszy niż tor (wcześniej border≈secondary — zlewało się z tłem) */
  scrollbar-width: auto;
  scrollbar-color: ${({ theme }) => `${theme.colors.textMuted} ${theme.colors.backgroundLighter}`};
  background: ${({ theme }) => theme.colors.background};
  /* Jedyny padding treści — contenteditable bez własnej ramki */
  padding: ${({ theme }) => theme.spacing.md};

  &::-webkit-scrollbar {
    width: 12px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.backgroundLighter};
    border-radius: 6px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    margin: 4px 0;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.textMuted};
    border-radius: 6px;
    border: 2px solid ${({ theme }) => theme.colors.backgroundLighter};
    min-height: 40px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.textSecondary};
  }

  &::-webkit-scrollbar-thumb:active {
    background: ${({ theme }) => theme.colors.textLight};
  }
`;

const Editable = styled.div<{ $readOnly: boolean }>`
  max-width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;
  font-size: ${({ theme }) => theme.fontSize.md};
  outline: none;
  cursor: ${({ $readOnly }) => ($readOnly ? 'default' : 'text')};

  &[data-placeholder]:empty::before {
    content: attr(data-placeholder);
    color: ${({ theme }) => theme.colors.textSecondary};
    pointer-events: none;
  }

  p,
  div {
    margin: 0 0 8px;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 12px 0 8px;
    line-height: 1.3;
  }

  h1:first-child,
  h2:first-child,
  h3:first-child {
    margin-top: 0;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
  }

  td,
  th {
    border: 1px solid ${({ theme }) => theme.colors.border};
    padding: 6px 8px;
    vertical-align: top;
    min-width: 48px;
  }

  table p,
  table div {
    margin: 0 0 4px;
  }

  table p:last-child,
  table div:last-child {
    margin-bottom: 0;
  }

  ul,
  ol {
    margin: 0 0 8px;
    padding-left: 1.5em;
  }

  > *:last-child {
    margin-bottom: 0;
  }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
`;

const ModalPanel = styled.div`
  width: 360px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text};
`;

const ModalTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.fontSize.lg};
`;

const ModalRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

const ModalInput = styled.input`
  width: 90px;
  height: 30px;
  border-radius: ${({ theme }) => theme.borderRadius.xs};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const filenameSafe = (value: string): string => {
  const compact = value.trim().replace(/\s+/g, '_').replace(/[^\w.-]/g, '');
  return compact || 'recenzja';
};

const getClosestCell = (node: Node | null): HTMLTableCellElement | null => {
  if (!node) return null;
  if (node instanceof HTMLTableCellElement) return node;
  if (node instanceof HTMLElement) {
    const cell = node.closest('td, th');
    return cell instanceof HTMLTableCellElement ? cell : null;
  }
  if (node.parentElement) {
    const cell = node.parentElement.closest('td, th');
    return cell instanceof HTMLTableCellElement ? cell : null;
  }
  return null;
};

const placeCaretAtCellStart = (cell: HTMLTableCellElement): void => {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(cell);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
};

const SimpleWYSIWYG = forwardRef<SimpleWYSIWYGRef, SimpleWYSIWYGProps>(
  function SimpleWYSIWYG(
    {
      initialContent = '',
      placeholder = 'Napisz treść…',
      className,
      editorMaxHeight,
      editorMinHeight = '240px',
      height,
      onChange,
      exportBasename = 'recenzja',
      readOnly = false,
    },
    ref
  ) {
    const resolvedMax =
      editorMaxHeight ?? height ?? 'min(62vh, 640px)';

    const editorRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<string>(initialContent);

    const [toolbarState, setToolbarState] = useState<ToolbarState>({
      bold: false,
      italic: false,
      underline: false,
      strikeThrough: false,
      blockType: 'P',
      fontSize: '3',
    });
    const [showTableModal, setShowTableModal] = useState(false);
    const [tableRows, setTableRows] = useState(2);
    const [tableCols, setTableCols] = useState(2);

    useLayoutEffect(() => {
      const safe = finalizeReviewHtml(initialContent);
      contentRef.current = safe;
      if (editorRef.current) {
        editorRef.current.innerHTML = safe;
      }
    }, [initialContent]);

    const updateToolbarState = useCallback(() => {
      const selection = window.getSelection();
      const editor = editorRef.current;
      const selectedNode = selection?.anchorNode ?? null;
      const selectionInsideEditor =
        !!selection &&
        !!editor &&
        !!selectedNode &&
        (selectedNode === editor ||
          (selectedNode.nodeType === Node.ELEMENT_NODE &&
            editor.contains(selectedNode as Element)) ||
          (selectedNode.nodeType === Node.TEXT_NODE &&
            selectedNode.parentElement &&
            editor.contains(selectedNode.parentElement)));

      if (!selectionInsideEditor) {
        setToolbarState((prev) => ({
          ...prev,
          blockType: 'P',
          fontSize: '3',
        }));
        return;
      }

      const rawBlock = String(document.queryCommandValue('formatBlock') || '')
        .replace(/[<>]/g, '')
        .toUpperCase();
      const blockType: BlockType =
        rawBlock === 'H1' || rawBlock === 'H2' || rawBlock === 'H3' || rawBlock === 'P'
          ? rawBlock
          : 'P';
      const rawFont = String(document.queryCommandValue('fontSize') || '').trim();
      const fontSize = ['1', '2', '3', '4', '5', '6', '7'].includes(rawFont) ? rawFont : '3';

      setToolbarState({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        blockType,
        fontSize,
      });
    }, []);

    useEffect(() => {
      const listener = () => updateToolbarState();
      document.addEventListener('selectionchange', listener);
      return () => document.removeEventListener('selectionchange', listener);
    }, [updateToolbarState]);

    const pushChange = useCallback(() => {
      if (editorRef.current) {
        contentRef.current = editorRef.current.innerHTML;
        onChange?.(contentRef.current);
      }
    }, [onChange]);

    const execute = useCallback(
      (command: string, value?: string) => {
        if (readOnly) return;
        editorRef.current?.focus();
        document.execCommand('styleWithCSS', false, 'false');
        document.execCommand(command, false, value ?? '');
        pushChange();
        updateToolbarState();
      },
      [readOnly, pushChange, updateToolbarState]
    );

    const handleExportHtmlFile = useCallback(() => {
      const raw = contentRef.current || editorRef.current?.innerHTML || '';
      const clean = finalizeReviewHtml(raw);
      const blob = new Blob(
        [
          '<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>',
          clean,
          '</body></html>',
        ],
        { type: 'text/html;charset=utf-8' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filenameSafe(exportBasename)}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }, [exportBasename]);

    const handleExportMarkdownFile = useCallback(() => {
      const raw = contentRef.current || editorRef.current?.innerHTML || '';
      const md = turndown.turndown(finalizeReviewHtml(raw));
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filenameSafe(exportBasename)}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }, [exportBasename]);

    useImperativeHandle(
      ref,
      () => ({
        getRawHtml: () => editorRef.current?.innerHTML ?? '',
        getHtml: () => finalizeReviewHtml(editorRef.current?.innerHTML ?? ''),
        getContent: () => finalizeReviewHtml(editorRef.current?.innerHTML ?? ''),
        setContent: (html: string) => {
          const safe = finalizeReviewHtml(html);
          contentRef.current = safe;
          if (editorRef.current) {
            editorRef.current.innerHTML = safe;
          }
          onChange?.(safe);
        },
        getPlainText: () => editorRef.current?.innerText ?? '',
        getMarkdown: () =>
          turndown.turndown(finalizeReviewHtml(editorRef.current?.innerHTML ?? '')),
        clear: () => {
          if (editorRef.current) {
            editorRef.current.innerHTML = '';
            contentRef.current = '';
            onChange?.('');
          }
        },
        focus: () => editorRef.current?.focus(),
        exportHtmlFile: handleExportHtmlFile,
        exportMarkdownFile: handleExportMarkdownFile,
      }),
      [onChange, handleExportHtmlFile, handleExportMarkdownFile]
    );

    const handleCopy = useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
      const range = selection.getRangeAt(0);
      if (!editorRef.current) return;

      const commonNode = range.commonAncestorContainer;
      const insideEditor =
        commonNode === editorRef.current ||
        (commonNode.nodeType === Node.ELEMENT_NODE &&
          editorRef.current.contains(commonNode as HTMLElement)) ||
        (commonNode.nodeType === Node.TEXT_NODE &&
          commonNode.parentElement &&
          editorRef.current.contains(commonNode.parentElement));
      if (!insideEditor) return;

      const fragment = range.cloneContents();
      const container = document.createElement('div');
      container.appendChild(fragment);
      const html = sanitizeRichTextHtml(container.innerHTML);
      const plain = selection.toString();

      event.preventDefault();
      event.clipboardData.setData('text/html', html);
      event.clipboardData.setData('text/plain', plain);
    }, []);

    const handlePaste = useCallback(
      (event: React.ClipboardEvent<HTMLDivElement>) => {
        if (readOnly) {
          event.preventDefault();
          return;
        }
        const html = event.clipboardData.getData('text/html');
        const text = event.clipboardData.getData('text/plain');
        event.preventDefault();
        if (html) {
          execute('insertHTML', sanitizeRichTextHtml(html));
        } else if (text) {
          execute('insertText', text);
        }
      },
      [execute, readOnly]
    );

    const insertTable = useCallback(() => {
      if (readOnly) return;
      const rows = Math.max(1, Math.min(20, tableRows));
      const cols = Math.max(1, Math.min(10, tableCols));
      const rowHtml = `<tr>${'<td></td>'.repeat(cols)}</tr>`;
      execute('insertHTML', `<table>${rowHtml.repeat(rows)}</table><p></p>`);
      setShowTableModal(false);
    }, [execute, readOnly, tableCols, tableRows]);

    const rootStyle = {
      ['--swysiwyg-editor-max-h' as string]: resolvedMax,
      ['--swysiwyg-editor-min-h' as string]: editorMinHeight,
    } as CSSProperties;

    return (
      <Root className={className} style={rootStyle}>
        <Toolbar $disabled={readOnly}>
          <ToolbarGroup>
            <ToolButton
              type="button"
              title="Pogrubienie (Ctrl+B)"
              $active={toolbarState.bold}
              onClick={() => execute('bold')}
            >
              B
            </ToolButton>
            <ToolButton
              type="button"
              title="Pochylenie (Ctrl+I)"
              $active={toolbarState.italic}
              onClick={() => execute('italic')}
            >
              I
            </ToolButton>
            <ToolButton
              type="button"
              title="Podkreślenie (Ctrl+U)"
              $active={toolbarState.underline}
              onClick={() => execute('underline')}
            >
              U
            </ToolButton>
            <ToolButton
              type="button"
              title="Przekreślenie"
              $active={toolbarState.strikeThrough}
              onClick={() => execute('strikeThrough')}
            >
              S
            </ToolButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <ToolSelect
              aria-label="Blok"
              value={toolbarState.blockType}
              onChange={(e) => {
                execute('formatBlock', e.target.value as BlockType);
              }}
            >
              <option value="P">Akapit</option>
              <option value="H1">Nagłówek 1</option>
              <option value="H2">Nagłówek 2</option>
              <option value="H3">Nagłówek 3</option>
            </ToolSelect>
            <ToolSelect
              aria-label="Rozmiar"
              value={toolbarState.fontSize}
              onChange={(e) => execute('fontSize', e.target.value)}
            >
              <option value="1">XS</option>
              <option value="2">S</option>
              <option value="3">M</option>
              <option value="4">L</option>
              <option value="5">XL</option>
              <option value="6">XXL</option>
              <option value="7">XXXL</option>
            </ToolSelect>
          </ToolbarGroup>

          <ToolbarGroup>
            <ToolButton type="button" title="Wyrównaj do lewej" onClick={() => execute('justifyLeft')}>
              L
            </ToolButton>
            <ToolButton type="button" title="Wyśrodkuj" onClick={() => execute('justifyCenter')}>
              C
            </ToolButton>
            <ToolButton type="button" title="Wyrównaj do prawej" onClick={() => execute('justifyRight')}>
              R
            </ToolButton>
            <ToolButton type="button" title="Justuj" onClick={() => execute('justifyFull')}>
              J
            </ToolButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <ToolButton type="button" title="Wstaw tabelę" onClick={() => setShowTableModal(true)}>
              Tabela
            </ToolButton>
          </ToolbarGroup>
        </Toolbar>

        <EditorScroll>
          <Editable
            ref={editorRef}
            $readOnly={readOnly}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            data-placeholder={placeholder}
            onInput={() => {
              pushChange();
            }}
            onCopy={handleCopy}
            onPaste={handlePaste}
            onMouseUp={updateToolbarState}
            onKeyUp={updateToolbarState}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                const selection = window.getSelection();
                const currentCell = getClosestCell(selection?.anchorNode ?? null);
                const currentRow = currentCell?.parentElement;
                const table = currentRow?.parentElement;

                if (
                  currentCell &&
                  currentRow instanceof HTMLTableRowElement &&
                  table &&
                  (table instanceof HTMLTableSectionElement || table instanceof HTMLTableElement)
                ) {
                  const cellsInRow = Array.from(currentRow.cells);
                  const columnIndex = cellsInRow.indexOf(currentCell);
                  if (columnIndex >= 0) {
                    const targetRow =
                      e.key === 'ArrowUp'
                        ? (currentRow.previousElementSibling as HTMLTableRowElement | null)
                        : (currentRow.nextElementSibling as HTMLTableRowElement | null);
                    if (targetRow instanceof HTMLTableRowElement) {
                      const targetCell = targetRow.cells.item(
                        Math.min(columnIndex, Math.max(0, targetRow.cells.length - 1))
                      );
                      if (targetCell) {
                        e.preventDefault();
                        placeCaretAtCellStart(targetCell);
                        updateToolbarState();
                        return;
                      }
                    }
                  }
                }
              }

              if (!(e.ctrlKey || e.metaKey)) return;
              const key = e.key.toLowerCase();
              if (key === 'b') {
                e.preventDefault();
                execute('bold');
              } else if (key === 'i') {
                e.preventDefault();
                execute('italic');
              } else if (key === 'u') {
                e.preventDefault();
                execute('underline');
              }
            }}
          />
        </EditorScroll>

        {showTableModal && (
          <ModalBackdrop onClick={() => setShowTableModal(false)}>
            <ModalPanel
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="wysiwyg-table-title"
            >
              <ModalTitle id="wysiwyg-table-title">Wstaw tabelę</ModalTitle>
              <ModalRow>
                Wiersze
                <ModalInput
                  type="number"
                  min={1}
                  max={20}
                  value={tableRows}
                  onChange={(e) => setTableRows(Number(e.target.value) || 1)}
                />
              </ModalRow>
              <ModalRow>
                Kolumny
                <ModalInput
                  type="number"
                  min={1}
                  max={10}
                  value={tableCols}
                  onChange={(e) => setTableCols(Number(e.target.value) || 1)}
                />
              </ModalRow>
              <ModalActions>
                <ToolButton type="button" onClick={() => setShowTableModal(false)}>
                  Anuluj
                </ToolButton>
                <ToolButton type="button" onClick={insertTable}>
                  Wstaw
                </ToolButton>
              </ModalActions>
            </ModalPanel>
          </ModalBackdrop>
        )}
      </Root>
    );
  }
);

export default SimpleWYSIWYG;
