import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { addComment, type CommentData } from '@/services/songService';
import { Button } from '@/components/Button/Button';
import Textarea from '@/components/Form/Textarea';
import {
  SectionContainer,
  SectionTitle,
  CommentList,
  CommentItem,
  CommentHeader,
  CommentAuthor,
  CommentDate,
  CommentContent,
  CommentForm,
  NoContent,
} from './styles';

interface CommentSectionProps {
  songId: number;
  comments: CommentData[];
  onCommentAdded: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const CommentSection: React.FC<CommentSectionProps> = ({
  songId,
  comments,
  onCommentAdded,
}) => {
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addComment(songId, content.trim());
      setContent('');
      onCommentAdded();
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionContainer>
      <SectionTitle>Komentarze ({comments.length})</SectionTitle>

      {isAuthenticated && (
        <CommentForm>
          <Textarea
            placeholder="Napisz komentarz..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            rows={3}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!content.trim()}
          >
            Dodaj komentarz
          </Button>
        </CommentForm>
      )}

      {comments.length === 0 ? (
        <NoContent>Brak komentarzy</NoContent>
      ) : (
        <CommentList>
          {comments.map((comment) => (
            <CommentItem key={comment.id}>
              <CommentHeader>
                <CommentAuthor>{comment.user_name}</CommentAuthor>
                <CommentDate>{formatDate(comment.created_at)}</CommentDate>
              </CommentHeader>
              <CommentContent>{comment.content}</CommentContent>
            </CommentItem>
          ))}
        </CommentList>
      )}
    </SectionContainer>
  );
};

export default CommentSection;
