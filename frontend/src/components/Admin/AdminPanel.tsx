import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { MainContent } from '@/components/Sidebar/styles';
import { Spinner } from '@/components/Spinner/Spinner';
import { StatusMessage } from '@/components/Main/styles';
import type { Video } from '@/components/Main/types';
import { API_URL } from '@/config';
import Modal from '@/components/Modal/Modal';
import ConfirmDialog from '@/components/Modal/ConfirmDialog';
import {
  getAllComments,
  deleteComment,
  getAllRatings,
  deleteRating,
  type AdminComment,
  type AdminRating,
} from '@/services/adminService';
import {
  AdminContainer,
  AdminTitle,
  TabContainer,
  Tab,
  ItemList,
  ItemCard,
  ItemCardHeader,
  ItemInfo,
  ItemRow,
  UserName,
  SongId,
  SongTitle,
  DateText,
  RatingBadge,
  CommentPreview,
  CommentFull,
  ItemActions,
  ActionButton,
  EmptyState,
  CountBadge,
  PlayerSection,
} from './styles';

type ActiveTab = 'comments' | 'ratings';

interface SongData {
  video_id: string;
  title: string;
}

const decodeHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.documentElement.textContent ?? html;
};

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

const AdminPanel = () => {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ActiveTab>('comments');
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [ratings, setRatings] = useState<AdminRating[]>([]);
  const [loading, setLoading] = useState(true);

  const [songMap, setSongMap] = useState<Record<number, SongData>>({});
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());

  const [previewComment, setPreviewComment] = useState<AdminComment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: ActiveTab; id: number } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSongData = useCallback(async (songIds: number[]) => {
    const unique = [...new Set(songIds)];
    const results: Record<number, SongData> = {};

    await Promise.allSettled(
      unique.map(async (id) => {
        try {
          const res = await fetch(`${API_URL}/getVideoById/${id}`);
          if (!res.ok) return;
          const data: Video[] = await res.json();
          if (data[0]) {
            results[id] = {
              video_id: data[0].video_id,
              title: data[0].title,
            };
          }
        } catch {
          // skip unavailable songs
        }
      })
    );

    setSongMap(results);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [commentsData, ratingsData] = await Promise.all([
        getAllComments(),
        getAllRatings(),
      ]);
      setComments(commentsData);
      setRatings(ratingsData);

      const allSongIds = [
        ...commentsData.map((c) => c.song_id),
        ...ratingsData.map((r) => r.song_id),
      ];
      await fetchSongData(allSongIds);
    } catch {
      // handled by empty state
    } finally {
      setLoading(false);
    }
  }, [fetchSongData]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
      return;
    }
    if (!authLoading && isAdmin) {
      fetchData();
    }
  }, [authLoading, isAdmin, navigate, fetchData]);

  const togglePlayer = (key: string) => {
    setExpandedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'comments') {
        await deleteComment(deleteTarget.id);
        setComments((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      } else {
        await deleteRating(deleteTarget.id);
        setRatings((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (authLoading || loading) {
    return (
      <MainContent>
        <StatusMessage>
          <Spinner />
        </StatusMessage>
      </MainContent>
    );
  }

  if (!isAdmin) return null;

  return (
    <MainContent>
      <AdminContainer>
        <AdminTitle>Redakcja ocen i komentarzy</AdminTitle>

        <TabContainer>
          <Tab
            $active={activeTab === 'comments'}
            onClick={() => setActiveTab('comments')}
          >
            Komentarze
            <CountBadge>({comments.length})</CountBadge>
          </Tab>
          <Tab
            $active={activeTab === 'ratings'}
            onClick={() => setActiveTab('ratings')}
          >
            Oceny
            <CountBadge>({ratings.length})</CountBadge>
          </Tab>
        </TabContainer>

        {activeTab === 'comments' && (
          <>
            {comments.length === 0 ? (
              <EmptyState>Brak komentarzy</EmptyState>
            ) : (
              <ItemList>
                {comments.map((comment) => {
                  const song = songMap[comment.song_id];
                  const playerKey = `comment-${comment.id}`;
                  const isExpanded = expandedPlayers.has(playerKey);

                  return (
                    <ItemCard key={comment.id}>
                      <ItemCardHeader>
                        <ItemInfo>
                          <ItemRow>
                            <UserName>{comment.user_name}</UserName>
                            <SongId onClick={() => navigate(`/song/${comment.song_id}`)}>
                              #{comment.song_id}
                            </SongId>
                            {song && <SongTitle title={decodeHtml(song.title)}>{decodeHtml(song.title)}</SongTitle>}
                            <DateText>{formatDate(comment.created_at)}</DateText>
                          </ItemRow>
                          <CommentPreview onClick={() => setPreviewComment(comment)}>
                            {comment.content}
                          </CommentPreview>
                        </ItemInfo>
                        <ItemActions>
                          {song && (
                            <ActionButton onClick={() => togglePlayer(playerKey)}>
                              {isExpanded ? 'Ukryj utwór' : 'Utwór'}
                            </ActionButton>
                          )}
                          <ActionButton onClick={() => setPreviewComment(comment)}>
                            Podgląd
                          </ActionButton>
                          <ActionButton
                            $variant="danger"
                            onClick={() =>
                              setDeleteTarget({ type: 'comments', id: comment.id })
                            }
                          >
                            Usuń
                          </ActionButton>
                        </ItemActions>
                      </ItemCardHeader>
                      {isExpanded && song && (
                        <PlayerSection>
                          <iframe
                            src={`https://www.youtube.com/embed/${song.video_id}`}
                            title={song.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </PlayerSection>
                      )}
                    </ItemCard>
                  );
                })}
              </ItemList>
            )}
          </>
        )}

        {activeTab === 'ratings' && (
          <>
            {ratings.length === 0 ? (
              <EmptyState>Brak ocen</EmptyState>
            ) : (
              <ItemList>
                {ratings.map((rating) => {
                  const song = songMap[rating.song_id];
                  const playerKey = `rating-${rating.id}`;
                  const isExpanded = expandedPlayers.has(playerKey);

                  return (
                    <ItemCard key={rating.id}>
                      <ItemCardHeader>
                        <ItemInfo>
                          <ItemRow>
                            <UserName>{rating.user_name}</UserName>
                            <SongId onClick={() => navigate(`/song/${rating.song_id}`)}>
                              #{rating.song_id}
                            </SongId>
                            {song && <SongTitle title={decodeHtml(song.title)}>{decodeHtml(song.title)}</SongTitle>}
                            <RatingBadge>{'★'.repeat(rating.rating)}{'☆'.repeat(5 - rating.rating)}</RatingBadge>
                            <DateText>{formatDate(rating.created_at)}</DateText>
                          </ItemRow>
                        </ItemInfo>
                        <ItemActions>
                          {song && (
                            <ActionButton onClick={() => togglePlayer(playerKey)}>
                              {isExpanded ? 'Ukryj utwór' : 'Utwór'}
                            </ActionButton>
                          )}
                          <ActionButton
                            $variant="danger"
                            onClick={() =>
                              setDeleteTarget({ type: 'ratings', id: rating.id })
                            }
                          >
                            Usuń
                          </ActionButton>
                        </ItemActions>
                      </ItemCardHeader>
                      {isExpanded && song && (
                        <PlayerSection>
                          <iframe
                            src={`https://www.youtube.com/embed/${song.video_id}`}
                            title={song.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </PlayerSection>
                      )}
                    </ItemCard>
                  );
                })}
              </ItemList>
            )}
          </>
        )}
      </AdminContainer>

      <Modal
        isOpen={!!previewComment}
        onClose={() => setPreviewComment(null)}
        title="Podgląd komentarza"
        variant="fit-content"
        maxWidth="600px"
      >
        {previewComment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ItemRow>
              <UserName>{previewComment.user_name}</UserName>
              <SongId onClick={() => { setPreviewComment(null); navigate(`/song/${previewComment.song_id}`); }}>
                #{previewComment.song_id}
              </SongId>
              {songMap[previewComment.song_id] && (
                <SongTitle>{decodeHtml(songMap[previewComment.song_id].title)}</SongTitle>
              )}
              <DateText>{formatDate(previewComment.created_at)}</DateText>
            </ItemRow>
            <CommentFull>{previewComment.content}</CommentFull>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Potwierdź usunięcie"
        message={
          deleteTarget?.type === 'comments'
            ? 'Czy na pewno chcesz usunąć ten komentarz? Tej operacji nie można cofnąć.'
            : 'Czy na pewno chcesz usunąć tę ocenę? Tej operacji nie można cofnąć.'
        }
        confirmText={deleting ? 'Usuwanie...' : 'Usuń'}
        cancelText="Anuluj"
        variant="danger"
      />
    </MainContent>
  );
};

export default AdminPanel;
