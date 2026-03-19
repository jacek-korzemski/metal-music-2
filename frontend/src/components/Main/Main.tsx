import { useCallback, useMemo, useRef, useState } from "react";
import { Spinner } from "@/components/Spinner/Spinner";
import useGetData from "@/hooks/useGetData";
import { API_URL } from "@/config";
import { Video } from "./types";
import {
  StatusMessage,
} from "./styles";
import {
  FullHeightColumn,
  ChannelContentArea,
  PageTitle,
  VideoCount,
  VideoListContainer,
  VideoRowButton,
  VideoRowThumbnail,
  VideoRowInfo,
  VideoRowTitle,
  VideoRowDate,
  ExpandedSongSection,
} from "@/components/Channels/styles";
import Pagination from "@/components/Pagination/Pagination";
import SongDetail from "@/components/Song/SongDetail";

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

const Main = () => {
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isFetching, isError } = useGetData<Video[]>({
    apiUrl: `${API_URL}/getNewVideos`,
  });

  const visibleVideos = useMemo(
    () => data?.filter((v) => !v.hide && !v.deleted) ?? [],
    [data],
  );
  const totalPages = Math.ceil(visibleVideos.length / ITEMS_PER_PAGE);
  const paginatedVideos = useMemo(
    () =>
      visibleVideos.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
      ),
    [visibleVideos, currentPage],
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
        <StatusMessage>Błąd podczas ładowania danych.</StatusMessage>
      </FullHeightColumn>
    );
  }

  return (
    <FullHeightColumn>
      <PageTitle>Najnowsze filmy</PageTitle>
      <VideoCount>{visibleVideos.length} filmów</VideoCount>

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

export default Main;