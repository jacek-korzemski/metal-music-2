import { useCallback, useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { Spinner } from '@/components/Spinner/Spinner';
import { API_URL } from '@/config';
import { useAuth } from '@/context/AuthContext';
import {
  listReviews,
  getReviewBySong,
  deleteReview,
  type ReviewListItem,
  type ReviewDetail,
} from '@/services/songService';
import SongDetail from '@/components/Song/SongDetail';
import {
  SongDetailToolbar,
  CloseDetailButton,
} from '@/components/Song/styles';
import { StatusMessage } from '@/components/Main/styles';
import {
  FullHeightColumn,
  ChannelContentArea,
  PageTitle,
  VideoListContainer,
} from '@/components/Channels/styles';
import {
  ItemCard,
  ItemCardHeader,
  ItemInfo,
  ItemRow,
  ItemLabel,
  ItemValue,
  DateText,
  UserName,
  ItemActions,
  ActionButton,
  EmptyState,
} from '@/components/Admin/styles';
import {
  ReviewsExpandedRoot,
  ReviewsRightPane,
  ReviewArticleColumn,
  ReviewArticleTitle,
  ReviewArticleMeta,
  ReviewArticleBody,
  ReviewPlaceholder,
  SongDetailColumn,
} from './styles';
import type { Video } from '@/components/Main/types';

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

const ReviewsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [titles, setTitles] = useState<Record<number, string>>({});
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [reviewDetail, setReviewDetail] = useState<ReviewDetail | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError(false);
    try {
      const data = await listReviews();
      setReviews(data);
    } catch {
      setListError(true);
      setReviews([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (!reviews.length) {
      setTitles({});
      return;
    }
    let cancelled = false;
    (async () => {
      const next: Record<number, string> = {};
      await Promise.all(
        reviews.map(async (r) => {
          try {
            const res = await fetch(`${API_URL}/getVideoById/${r.song_id}`);
            if (!res.ok) throw new Error('fail');
            const data = (await res.json()) as Video[];
            const title = data?.[0]?.title ?? `Utwór #${r.song_id}`;
            next[r.song_id] = decodeHtml(title);
          } catch {
            next[r.song_id] = `Utwór #${r.song_id}`;
          }
        })
      );
      if (!cancelled) setTitles(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [reviews]);

  useEffect(() => {
    if (selectedSongId === null) {
      setReviewDetail(null);
      return;
    }
    let cancelled = false;
    setReviewLoading(true);
    (async () => {
      try {
        const detail = await getReviewBySong(selectedSongId);
        if (!cancelled) setReviewDetail(detail);
      } catch {
        if (!cancelled) setReviewDetail(null);
      } finally {
        if (!cancelled) setReviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSongId]);

  const selectedReview = useMemo(
    () => reviews.find((r) => r.song_id === selectedSongId) ?? null,
    [reviews, selectedSongId]
  );

  const handleReviewSaved = useCallback((detail: ReviewDetail) => {
    setReviewDetail(detail);
    setReviews((prev) => {
      const idx = prev.findIndex((r) => r.song_id === detail.song_id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          id: detail.id,
          updated_at: detail.updated_at,
          created_at: detail.created_at,
        };
        return next;
      }
      return [
        ...prev,
        {
          id: detail.id,
          song_id: detail.song_id,
          updated_at: detail.updated_at,
          created_at: detail.created_at,
          author: detail.author,
        },
      ];
    });
  }, []);

  const handleDelete = async (e: React.MouseEvent, reviewId: number, songId: number) => {
    e.stopPropagation();
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      if (selectedSongId === songId) {
        setSelectedSongId(null);
        setReviewDetail(null);
      }
    } catch {
      // ignore
    }
  };

  if (listLoading) {
    return (
      <FullHeightColumn>
        <StatusMessage>
          <Spinner />
        </StatusMessage>
      </FullHeightColumn>
    );
  }

  if (listError) {
    return (
      <FullHeightColumn>
        <StatusMessage>Nie udało się załadować recenzji.</StatusMessage>
      </FullHeightColumn>
    );
  }

  if (selectedSongId !== null) {
    return (
      <FullHeightColumn>
        <ReviewsExpandedRoot>
          <SongDetailToolbar>
            <CloseDetailButton
              type="button"
              onClick={() => setSelectedSongId(null)}
            >
              ✕ Zamknij
            </CloseDetailButton>
          </SongDetailToolbar>
          <ReviewsRightPane>
            <ReviewArticleColumn>
              {reviewLoading ? (
                <Spinner />
              ) : reviewDetail ? (
                <>
                  <ReviewArticleTitle>
                    {titles[selectedSongId] ??
                      `Recenzja — utwór #${selectedSongId}`}
                  </ReviewArticleTitle>
                  <ReviewArticleMeta>
                    {selectedReview && (
                      <>
                        {selectedReview.author.name} ·{' '}
                        {formatDate(reviewDetail.updated_at)}
                      </>
                    )}
                  </ReviewArticleMeta>
                  <ReviewArticleBody
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(reviewDetail.content_html),
                    }}
                  />
                </>
              ) : (
                <ReviewPlaceholder>
                  Nie znaleziono treści recenzji.
                </ReviewPlaceholder>
              )}
            </ReviewArticleColumn>

            <SongDetailColumn>
              <SongDetail
                songId={selectedSongId}
                embedded
                onReviewSaved={handleReviewSaved}
              />
            </SongDetailColumn>
          </ReviewsRightPane>
        </ReviewsExpandedRoot>
      </FullHeightColumn>
    );
  }

  return (
    <FullHeightColumn>
      <PageTitle>Recenzje</PageTitle>

      <ChannelContentArea>
        <VideoListContainer>
          {reviews.length === 0 ? (
            <EmptyState>Brak opublikowanych recenzji.</EmptyState>
          ) : (
            reviews.map((r) => (
              <ItemCard
                key={r.id}
                onClick={() => setSelectedSongId(r.song_id)}
                style={{ cursor: 'pointer' }}
              >
                <ItemCardHeader>
                  <ItemInfo>
                    <ItemRow>
                      <ItemLabel>Autor</ItemLabel>
                      <UserName>{r.author.name}</UserName>
                    </ItemRow>
                    <ItemRow>
                      <ItemLabel>Utwór</ItemLabel>
                      <ItemValue>
                        {titles[r.song_id] ?? `Utwór #${r.song_id}`}
                      </ItemValue>
                    </ItemRow>
                    <ItemRow>
                      <ItemLabel>Aktualizacja</ItemLabel>
                      <DateText>{formatDate(r.updated_at)}</DateText>
                    </ItemRow>
                  </ItemInfo>
                  {isAdmin && (
                    <ItemActions>
                      <ActionButton
                        type="button"
                        $variant="danger"
                        onClick={(e) => handleDelete(e, r.id, r.song_id)}
                      >
                        Usuń
                      </ActionButton>
                    </ItemActions>
                  )}
                </ItemCardHeader>
              </ItemCard>
            ))
          )}
        </VideoListContainer>
      </ChannelContentArea>
    </FullHeightColumn>
  );
};

export default ReviewsPage;
