import { useCallback, useEffect, useRef, useState } from 'react';
import SimpleWYSIWYG, {
  type SimpleWYSIWYGRef,
} from '@/components/SimpleWYSIWYG/SimpleWYSIWYG';
import { Button } from '@/components/Button/Button';
import {
  getReviewBySong,
  upsertReview,
  type ReviewDetail,
} from '@/services/songService';
import { SectionContainer, SectionTitle } from './styles';
import styled from 'styled-components';

const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const EditorWrap = styled.div`
  min-height: 220px;
  max-width: 960px;
`;

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface ReviewSectionProps {
  songId: number;
  /** Wywoływane po udanym zapisie (np. odświeżenie podglądu recenzji obok edytora) */
  onReviewSaved?: (detail: ReviewDetail) => void;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({
  songId,
  onReviewSaved,
}) => {
  const editorRef = useRef<SimpleWYSIWYGRef>(null);
  const [initialHtml, setInitialHtml] = useState('');
  const [reviewMeta, setReviewMeta] = useState<Pick<
    ReviewDetail,
    'id' | 'updated_at'
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReviewBySong(songId);
      if (data) {
        setInitialHtml(data.content_html);
        setReviewMeta({ id: data.id, updated_at: data.updated_at });
      } else {
        setInitialHtml('');
        setReviewMeta(null);
      }
    } catch {
      setInitialHtml('');
      setReviewMeta(null);
    } finally {
      setLoading(false);
    }
  }, [songId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    const html = editorRef.current?.getHtml() ?? '';
    if (!html.trim() || saving) return;
    setSaving(true);
    try {
      const saved = await upsertReview(songId, html);
      setReviewMeta({ id: saved.id, updated_at: saved.updated_at });
      setInitialHtml(saved.content_html);
      editorRef.current?.setContent(saved.content_html);
      onReviewSaved?.(saved);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleExportHtml = () => {
    const html = editorRef.current?.getHtml() ?? '';
    downloadBlob(`recenzja-${songId}.html`, html, 'text/html;charset=utf-8');
  };

  const handleExportMd = () => {
    const md = editorRef.current?.getMarkdown() ?? '';
    downloadBlob(`recenzja-${songId}.md`, md, 'text/markdown;charset=utf-8');
  };

  if (loading) {
    return (
      <SectionContainer>
        <SectionTitle>Recenzja</SectionTitle>
        <p style={{ margin: 0, color: '#888' }}>Ładowanie…</p>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer>
      <SectionTitle>
        Recenzja
        {reviewMeta
          ? ` (zapisana)`
          : ' (brak — utwórz poniżej i zapisz)'}
      </SectionTitle>
      <EditorWrap>
        <SimpleWYSIWYG
          key={`${songId}-${reviewMeta?.id ?? 'new'}`}
          ref={editorRef}
          height="280px"
          placeholder="Napisz recenzję…"
          initialContent={initialHtml}
        />
      </EditorWrap>
      <ActionsRow>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
          Zapisz recenzję
        </Button>
        <Button variant="secondary" size="sm" type="button" onClick={handleExportHtml}>
          Pobierz .html
        </Button>
        <Button variant="secondary" size="sm" type="button" onClick={handleExportMd}>
          Pobierz .md
        </Button>
      </ActionsRow>
    </SectionContainer>
  );
};

export default ReviewSection;
