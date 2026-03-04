import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainContent } from "@/components/Sidebar/styles";
import { Spinner } from "@/components/Spinner/Spinner";
import useGetData from "@/hooks/useGetData";
import { Video } from "@/components/Main/types";
import { StatusMessage } from "@/components/Main/styles";
import {
  getComments,
  getRatings,
  type CommentData,
  type RatingData,
} from "@/services/songService";
import RatingSection from "./RatingSection";
import CommentSection from "./CommentSection";
import {
  SongContainer,
  BackLink,
  SongTitle,
  SongMeta,
  PlayerWrapper,
} from "./styles";

const decodeHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.documentElement.textContent ?? html;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const SongPage = () => {
  const { id } = useParams<{ id: string }>();
  const songId = Number(id);
  const navigate = useNavigate();

  const { data, isFetching, isError } = useGetData<Video[]>({
    apiUrl: `http://localhost:8080/getVideoById/${id}`,
  });

  const video = data?.[0] ?? null;

  const [comments, setComments] = useState<CommentData[]>([]);
  const [ratingData, setRatingData] = useState<RatingData>({
    average_rating: 0,
    rating_count: 0,
    user_rating: null,
  });

  const fetchComments = useCallback(async () => {
    try {
      const data = await getComments(songId);
      setComments(data);
    } catch {
      // ignore
    }
  }, [songId]);

  const fetchRatings = useCallback(async () => {
    try {
      const data = await getRatings(songId);
      setRatingData(data);
    } catch {
      // ignore
    }
  }, [songId]);

  useEffect(() => {
    if (songId) {
      fetchComments();
      fetchRatings();
    }
  }, [songId, fetchComments, fetchRatings]);

  if (isFetching) {
    return (
      <MainContent>
        <StatusMessage>
          <Spinner />
        </StatusMessage>
      </MainContent>
    );
  }

  if (isError || !video) {
    return (
      <MainContent>
        <SongContainer>
          <BackLink onClick={() => navigate(-1)}>← Wróć</BackLink>
          <StatusMessage>Nie znaleziono utworu.</StatusMessage>
        </SongContainer>
      </MainContent>
    );
  }

  return (
    <MainContent>
      <SongContainer>
        <BackLink onClick={() => navigate(-1)}>← Wróć</BackLink>
        <SongTitle>{decodeHtml(video.title)}</SongTitle>
        <SongMeta>
          <span>{decodeHtml(video.channel_title)}</span>
          <span>•</span>
          <span>{formatDate(video.published_at)}</span>
        </SongMeta>
        <PlayerWrapper>
          <iframe
            src={`https://www.youtube.com/embed/${video.video_id}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </PlayerWrapper>
        <RatingSection
          songId={songId}
          ratingData={ratingData}
          onRatingUpdated={fetchRatings}
        />
        <CommentSection
          songId={songId}
          comments={comments}
          onCommentAdded={fetchComments}
        />
      </SongContainer>
    </MainContent>
  );
};

export default SongPage;
