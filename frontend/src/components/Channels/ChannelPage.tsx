import { useCallback, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { FullHeightColumn } from "./styles";
import { Spinner } from "@/components/Spinner/Spinner";
import { API_URL } from "@/config";
import ChevronLeftIcon from "@/components/Icon/ChevronLeftIcon";
import SongDetail from "@/components/Song/SongDetail";
import { ChannelVideo } from "./types";
import {
  ChannelPageHeader,
  BackButton,
  PageTitle,
  VideoCount,
  VideoListContainer,
  VideoRowButton,
  VideoRowThumbnail,
  VideoRowInfo,
  VideoRowTitle,
  VideoRowDate,
  ChannelContentArea,
  ExpandedSongSection,
} from "./styles";
import Pagination from "@/components/Pagination/Pagination";
import { StatusMessage } from "@/components/Main/styles";
import { useGetDataCached } from "@/hooks/useGetDataCached";

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

const ITEMS_PER_PAGE = 50;

const ChannelPage = () => {
  const { id } = useParams<{ id: string }>();
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isFetching, isError } = useGetDataCached<ChannelVideo[]>({
    apiUrl: `${API_URL}/getChannelById/${id}`,
    enabled: !!id,
  });

  const videos = useMemo(
    () => data?.filter((v) => !v.hide && !v.deleted) ?? [],
    [data],
  );

  const totalPages = Math.ceil(videos.length / ITEMS_PER_PAGE);
  const paginatedVideos = useMemo(
    () =>
      videos.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
      ),
    [videos, currentPage],
  );

  const changePage = useCallback(
    (page: number) => {
      setCurrentPage(page);
      listRef.current?.scrollTo({ top: 0, behavior: "instant" });
    },
    [],
  );

  const handleVideoClick = (videoId: number) => {
    setSelectedSongId((prev) => (prev === videoId ? null : videoId));
  };

  if (isFetching) {
    return (
      <FullHeightColumn>
        <StatusMessage>
          <Spinner />
        </StatusMessage>
      </FullHeightColumn>
    );
  }

  if (isError) {
    return (
      <FullHeightColumn>
        <StatusMessage>Błąd podczas ładowania danych kanału.</StatusMessage>
      </FullHeightColumn>
    );
  }

  const channelTitle = videos.length > 0 ? videos[0].channel_title : "Kanał";

  return (
    <FullHeightColumn>
      <ChannelPageHeader>
        <BackButton to="/channels">
          <ChevronLeftIcon />
        </BackButton>
        <PageTitle style={{ padding: 0 }}>{decodeHtml(channelTitle)}</PageTitle>
      </ChannelPageHeader>
      <VideoCount>{videos.length} filmów</VideoCount>

      <ChannelContentArea>
        <VideoListContainer ref={listRef}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={changePage}
          />

          {paginatedVideos.map((video) => (
            <VideoRowButton
              key={video.id}
              $selected={video.id === selectedSongId}
              onClick={() => handleVideoClick(video.id)}
            >
              <VideoRowThumbnail
                src={video.medium_thumbnail}
                alt={video.title}
                loading="lazy"
              />
              <VideoRowInfo>
                <VideoRowTitle>{decodeHtml(video.title)}</VideoRowTitle>
                <VideoRowDate>{formatDate(video.published_at)}</VideoRowDate>
              </VideoRowInfo>
            </VideoRowButton>
          ))}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={changePage}
          />
        </VideoListContainer>

        {selectedSongId !== null && (
          <ExpandedSongSection key={selectedSongId}>
            <SongDetail
              songId={selectedSongId}
              onClose={() => setSelectedSongId(null)}
            />
          </ExpandedSongSection>
        )}
      </ChannelContentArea>
    </FullHeightColumn>
  );
};

export default ChannelPage;
