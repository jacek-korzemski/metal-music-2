import { useCallback, useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { Spinner } from '@/components/Spinner/Spinner';
import { useAuth } from '@/context/AuthContext';
import {
  listReviews,
  getReviewBySong,
  deleteReview,
  updateReviewSkipExport,
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

const reviewSongLabel = (songId: number, songTitle: string | null | undefined) =>
  songTitle != null && songTitle.trim() !== ''
    ? decodeHtml(songTitle)
    : `Utwór #${songId}`;

const ReviewsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [reviewDetail, setReviewDetail] = useState<ReviewDetail | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError(false);
    try {
      const data = await listReviews();
      setReviews(
        data.map((r) => ({ ...r, skip_export: r.skip_export ?? false }))
      );
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
          song_title: detail.song_title ?? next[idx].song_title,
          video_id: detail.video_id ?? next[idx].video_id,
          skip_export: detail.skip_export ?? next[idx].skip_export,
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
          song_title: detail.song_title,
          video_id: detail.video_id,
          skip_export: detail.skip_export ?? false,
          updated_at: detail.updated_at,
          created_at: detail.created_at,
          author: detail.author,
        },
      ];
    });
  }, []);

  const handleSkipExportChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    review: ReviewListItem
  ) => {
    e.stopPropagation();
    const next = e.target.checked;
    const prev = review.skip_export ?? false;
    setReviews((list) =>
      list.map((x) => (x.id === review.id ? { ...x, skip_export: next } : x))
    );
    try {
      await updateReviewSkipExport(review.id, next);
    } catch {
      setReviews((list) =>
        list.map((x) => (x.id === review.id ? { ...x, skip_export: prev } : x))
      );
    }
  };

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
    const expandedTitle =
      selectedReview != null
        ? reviewSongLabel(selectedSongId, selectedReview.song_title)
        : reviewDetail != null
          ? reviewSongLabel(selectedSongId, reviewDetail.song_title)
          : `Recenzja — utwór #${selectedSongId}`;

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
                  <ReviewArticleTitle>{expandedTitle}</ReviewArticleTitle>
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
                        {reviewSongLabel(r.song_id, r.song_title)}
                      </ItemValue>
                    </ItemRow>
                    <ItemRow>
                      <ItemLabel>Aktualizacja</ItemLabel>
                      <DateText>{formatDate(r.updated_at)}</DateText>
                    </ItemRow>
                  </ItemInfo>
                  {isAdmin && (
                    <ItemActions>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          cursor: 'pointer',
                          marginRight: '0.5rem',
                          fontSize: '0.875rem',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={r.skip_export ?? false}
                          onChange={(e) => void handleSkipExportChange(e, r)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Pomiń export do WordPress"
                        />
                        Pomiń export
                      </label>
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
