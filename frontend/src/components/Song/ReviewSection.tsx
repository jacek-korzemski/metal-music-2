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
import { finalizeReviewHtml } from '@/utils/reviewHtml';
import { SectionContainer, SectionTitle } from './styles';
import styled from 'styled-components';

const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const EditorWrap = styled.div`
  width: 100%;
  max-width: 960px;
`;

interface ReviewSectionProps {
  songId: number;
  /** Zapis do user-backend (lista /reviews bez skoku tytułu). */
  songTitle?: string | null;
  /** YouTube video id — wysyłane przy zapisie (eksport WordPress / miniatury). */
  videoId?: string;
  /** Wywoływane po udanym zapisie (np. odświeżenie podglądu recenzji obok edytora) */
  onReviewSaved?: (detail: ReviewDetail) => void;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({
  songId,
  songTitle,
  videoId,
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
    const raw = editorRef.current?.getRawHtml() ?? '';
    const html = finalizeReviewHtml(raw);
    if (!html.trim() || saving) return;
    setSaving(true);
    try {
      // Edytor = dokładnie payload API (żeby pierwszy zapis nie zostawiał <div> w bazie przy rozjechanym ref/DOM).
      editorRef.current?.setContent(html);
      const saved = await upsertReview(
        songId,
        html,
        songTitle,
        videoId
      );
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
    editorRef.current?.exportHtmlFile();
  };

  const handleExportMd = () => {
    editorRef.current?.exportMarkdownFile();
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
          editorMaxHeight="min(62vh, 640px)"
          editorMinHeight="240px"
          exportBasename={`recenzja-${songId}`}
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
